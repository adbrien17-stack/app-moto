import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { MapService } from './map.service';

@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('segments')
  getSegments() {
    return this.mapService.getSegments();
  }

  @Get('segments/:id')
  async getSegment(@Param('id') id: string) {
    const segment = await this.mapService.getSegmentById(id);
    if (!segment) throw new NotFoundException('Segment introuvable');
    return segment;
  }
}
