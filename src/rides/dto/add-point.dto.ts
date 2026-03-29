import { IsNumber } from 'class-validator';

export class AddPointDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}
