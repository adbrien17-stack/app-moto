import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SEGMENT_LENGTH_METERS = 200;
const MIN_POINT_DISTANCE_METERS = 3;
const MAX_ACCURACY_METERS = 50;
// ~111m in degrees latitude — used for rough proximity matching
const NEARBY_THRESHOLD_DEG = 0.001;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type CleanPoint = {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed: number | null;
};

type RawPoint = {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy: number | null;
  speed: number | null;
};

@Injectable()
export class RideProcessingService {
  private readonly logger = new Logger(RideProcessingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processRide(rideId: string): Promise<void> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { points: { orderBy: { sequence: 'asc' } } },
    });

    if (!ride) {
      this.logger.warn(`Ride ${rideId} introuvable pour traitement`);
      return;
    }

    // 1. Nettoyer les points GPS
    const clean = this.cleanPoints(ride.points);
    if (clean.length < 2) {
      this.logger.log(`Ride ${rideId}: points insuffisants après nettoyage (${clean.length})`);
      return;
    }

    // 2. Calculer les métriques
    const distance = this.calculateDistance(clean);
    const duration = Math.round(
      (ride.endedAt.getTime() - ride.startedAt.getTime()) / 1000,
    );

    await this.prisma.ride.update({
      where: { id: rideId },
      data: { distanceMeters: distance, durationSeconds: duration, pointsCount: clean.length },
    });

    // 3. Créer les segments et mettre à jour les scores
    await this.createSegmentMatches(rideId, clean);

    this.logger.log(
      `Ride ${rideId} traitée — ${clean.length} pts, ${Math.round(distance)}m, ${duration}s`,
    );
  }

  // Filtre les points inprécis et trop proches
  private cleanPoints(points: RawPoint[]): CleanPoint[] {
    const result: CleanPoint[] = [];

    for (const p of points) {
      if (p.accuracy !== null && p.accuracy > MAX_ACCURACY_METERS) continue;

      if (result.length > 0) {
        const prev = result[result.length - 1];
        const dist = haversine(prev.latitude, prev.longitude, p.latitude, p.longitude);
        if (dist < MIN_POINT_DISTANCE_METERS) continue;
      }

      result.push({
        latitude: p.latitude,
        longitude: p.longitude,
        timestamp: p.timestamp,
        speed: p.speed,
      });
    }

    return result;
  }

  private calculateDistance(points: CleanPoint[]): number {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += haversine(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude,
      );
    }
    return total;
  }

  // Découpe la ride en chunks de ~200m et crée les RideSegmentMatch
  private async createSegmentMatches(rideId: string, points: CleanPoint[]): Promise<void> {
    const chunks = this.chunkByDistance(points);

    for (const chunk of chunks) {
      const first = chunk[0];
      const last = chunk[chunk.length - 1];
      const length = this.calculateDistance(chunk);

      const speeds = chunk.map((p) => p.speed ?? 0).filter((s) => s > 0);
      const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : null;

      const segment = await this.findOrCreateSegment(first, last, length);

      await this.prisma.rideSegmentMatch.create({
        data: {
          rideId,
          segmentId: segment.id,
          entryTime: first.timestamp,
          exitTime: last.timestamp,
          matchedDistanceMeters: length,
          avgSpeed,
          confidence: 0.5, // V1 : confiance fixe, à affiner plus tard
        },
      });

      await this.updateSegmentScore(segment.id);
    }
  }

  // Découpe un tableau de points en sous-tableaux de ~SEGMENT_LENGTH_METERS
  private chunkByDistance(points: CleanPoint[]): CleanPoint[][] {
    const chunks: CleanPoint[][] = [];
    let current: CleanPoint[] = [points[0]];
    let accumulated = 0;

    for (let i = 1; i < points.length; i++) {
      const d = haversine(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude,
      );
      accumulated += d;
      current.push(points[i]);

      if (accumulated >= SEGMENT_LENGTH_METERS) {
        chunks.push(current);
        current = [points[i]]; // le dernier point devient le premier du chunk suivant
        accumulated = 0;
      }
    }

    if (current.length >= 2) chunks.push(current);
    return chunks;
  }

  // Cherche un segment existant proche, ou en crée un nouveau
  private async findOrCreateSegment(
    first: CleanPoint,
    last: CleanPoint,
    length: number,
  ) {
    const existing = await this.prisma.roadSegment.findFirst({
      where: {
        startLat: { gte: first.latitude - NEARBY_THRESHOLD_DEG, lte: first.latitude + NEARBY_THRESHOLD_DEG },
        startLng: { gte: first.longitude - NEARBY_THRESHOLD_DEG, lte: first.longitude + NEARBY_THRESHOLD_DEG },
        endLat:   { gte: last.latitude - NEARBY_THRESHOLD_DEG,  lte: last.latitude + NEARBY_THRESHOLD_DEG  },
        endLng:   { gte: last.longitude - NEARBY_THRESHOLD_DEG, lte: last.longitude + NEARBY_THRESHOLD_DEG },
      },
    });

    if (existing) return existing;

    return this.prisma.roadSegment.create({
      data: {
        startLat: first.latitude,
        startLng: first.longitude,
        endLat: last.latitude,
        endLng: last.longitude,
        lengthMeters: length,
        score: { create: {} }, // initialise les scores à 0
      },
    });
  }

  // Met à jour le score de popularité du segment
  private async updateSegmentScore(segmentId: string): Promise<void> {
    const ridesCount = await this.prisma.rideSegmentMatch.count({
      where: { segmentId },
    });

    const lastMatch = await this.prisma.rideSegmentMatch.findFirst({
      where: { segmentId },
      orderBy: { exitTime: 'desc' },
      select: { exitTime: true },
    });

    // Score de popularité normalisé : 1.0 atteint après 10 passages
    const popularityScore = Math.min(1.0, ridesCount / 10);

    await this.prisma.segmentScore.upsert({
      where: { segmentId },
      create: { segmentId, ridesCount, popularityScore, lastRideAt: lastMatch?.exitTime ?? new Date() },
      update: { ridesCount, popularityScore, lastRideAt: lastMatch?.exitTime ?? new Date() },
    });
  }
}
