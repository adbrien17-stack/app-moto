import { Body, Controller, Post } from '@nestjs/common';
import type { CreateRideDto } from './rides.service';
import { RidesService } from './rides.service';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  create(@Body() dto: CreateRideDto) {
    return this.ridesService.save(dto);
  }
}
