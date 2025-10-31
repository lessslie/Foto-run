import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class UpdateRaceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: Date;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  distance?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
