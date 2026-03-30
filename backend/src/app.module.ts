import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MapModule } from './map/map.module';
import { PrismaModule } from './prisma/prisma.module';
import { RidesModule } from './rides/rides.module';

@Module({
  imports: [PrismaModule, RidesModule, MapModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
