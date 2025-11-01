import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para subir una foto a un evento
 */
export class UploadPhotoDto {
  @ApiProperty({
    description: 'ID del evento deportivo',
    example: 'd9487a64-660b-4f2b-980e-bbf8329bfda3',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'raceId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'raceId es requerido' })
  raceId: string;
}
