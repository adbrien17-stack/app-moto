import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MapService {
  constructor(private readonly prisma: PrismaService) {}

  getSegments() {
    return this.prisma.roadSegment.findMany({
      include: { score: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  getSegmentById(id: string) {
    return this.prisma.roadSegment.findUnique({
      where: { id },
      include: {
        score: true,
        rideMatches: {
          orderBy: { entryTime: 'desc' },
          take: 10,
        },
      },
    });
  }
}
