import { Injectable, Logger } from '@nestjs/common';

export interface RidePoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface CreateRideDto {
  startTime: string;
  endTime: string;
  points: RidePoint[];
}

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);
  private readonly rides: CreateRideDto[] = [];

  save(ride: CreateRideDto): { success: boolean; pointsCount: number } {
    this.rides.push(ride);
    this.logger.log(
      `Ride enregistrée — début: ${ride.startTime} | fin: ${ride.endTime} | points: ${ride.points.length}`,
    );
    return { success: true, pointsCount: ride.points.length };
  }
}
