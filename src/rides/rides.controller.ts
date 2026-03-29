import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { AddPointDto } from './dto/add-point.dto';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  createRide(@Body() dto: CreateRideDto) {
    return this.ridesService.createRide(dto);
  }

  @Post(':id/points')
  addPoint(@Param('id') id: string, @Body() dto: AddPointDto) {
    return this.ridesService.addPoint(id, dto);
  }

  @Get(':id')
  getRide(@Param('id') id: string) {
    return this.ridesService.getRide(id);
  }
}
