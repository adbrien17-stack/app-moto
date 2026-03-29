import { IsString, IsNotEmpty } from 'class-validator';

export class CreateRideDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
