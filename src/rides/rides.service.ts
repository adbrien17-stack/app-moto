import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { AddPointDto } from './dto/add-point.dto';

@Injectable()
export class RidesService {
  constructor(private readonly prisma: PrismaService) {}

  async createRide(dto: CreateRideDto) {
    return this.prisma.ride.create({
      data: { userId: dto.userId },
    });
  }

  async addPoint(rideId: string, dto: AddPointDto) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });

    if (!ride) {
      throw new NotFoundException(`Ride ${rideId} not found`);
    }

    return this.prisma.ridePoint.create({
      data: {
        rideId,
        lat: dto.lat,
        lng: dto.lng,
      },
    });
  }

  async getRide(rideId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { points: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride ${rideId} not found`);
    }

    return ride;
  }
}
