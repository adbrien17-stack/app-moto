import { Body, Controller, Post } from '@nestjs/common';
import { CreateRideDto, RidesService } from './rides.service';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  create(@Body() dto: CreateRideDto) {
    return this.ridesService.save(dto);
  }
}
