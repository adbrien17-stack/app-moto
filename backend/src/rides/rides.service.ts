import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateRidePointDto {
  latitude: number;
  longitude: number;
  timestamp: number; // Unix ms
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface CreateRideDto {
  startTime: string;
  endTime: string;
  points: CreateRidePointDto[];
}

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async save(dto: CreateRideDto): Promise<{ success: boolean; pointsCount: number; rideId: string }> {
    const ride = await this.prisma.ride.create({
      data: {
        startedAt: new Date(dto.startTime),
        endedAt: new Date(dto.endTime),
        pointsCount: dto.points.length,
        points: {
          create: dto.points.map((p, i) => ({
            latitude: p.latitude,
            longitude: p.longitude,
            timestamp: new Date(p.timestamp),
            accuracy: p.accuracy ?? null,
            speed: p.speed ?? null,
            heading: p.heading ?? null,
            sequence: i,
          })),
        },
      },
    });

    this.logger.log(
      `Ride enregistrée — id: ${ride.id} | début: ${dto.startTime} | fin: ${dto.endTime} | points: ${dto.points.length}`,
    );

    return { success: true, pointsCount: dto.points.length, rideId: ride.id };
  }
}
