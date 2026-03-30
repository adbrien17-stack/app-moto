import { Body, Controller, Logger, Post } from '@nestjs/common';
import { RideProcessingService } from './ride-processing.service';
import type { CreateRideDto } from './rides.service';
import { RidesService } from './rides.service';

@Controller('rides')
export class RidesController {
  private readonly logger = new Logger(RidesController.name);

  constructor(
    private readonly ridesService: RidesService,
    private readonly rideProcessingService: RideProcessingService,
  ) {}

  @Post()
  async create(@Body() dto: CreateRideDto) {
    const result = await this.ridesService.save(dto);
    // Traitement asynchrone — ne bloque pas la réponse HTTP
    this.rideProcessingService.processRide(result.rideId).catch((err: Error) =>
      this.logger.error(`Traitement échoué pour ride ${result.rideId}: ${err.message}`),
    );
    return result;
  }
}
