import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class CreateRaceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date: Date;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  distance?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
