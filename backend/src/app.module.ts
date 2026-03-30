import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RidesModule } from './rides/rides.module';

@Module({
  imports: [RidesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
