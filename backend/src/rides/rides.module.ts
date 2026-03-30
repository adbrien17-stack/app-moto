import { Module } from '@nestjs/common';
import { RideProcessingService } from './ride-processing.service';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';

@Module({
  controllers: [RidesController],
  providers: [RidesService, RideProcessingService],
})
export class RidesModule {}
