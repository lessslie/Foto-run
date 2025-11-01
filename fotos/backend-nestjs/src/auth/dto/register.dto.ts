import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum';

/**
 * DTO para registro de usuarios
 *
 * Por defecto, todos los usuarios se registran como PARTICIPANT.
 * Solo un ADMIN puede crear usuarios con rol PHOTOGRAPHER o ADMIN.
 */
export class RegisterDto {
  @ApiProperty({
    description: 'Email del usuario (debe ser único)',
    example: 'usuario@ejemplo.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
    example: 'password123',
    minLength: 6,
  })
  @IsString({ message: 'La contraseña debe ser un string' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiPropertyOptional({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un string' })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  @IsOptional()
  @IsString({ message: 'El apellido debe ser un string' })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario (por defecto: participant)',
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.PARTICIPANT,
    default: UserRole.PARTICIPANT,
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: 'El rol debe ser uno de: admin, photographer, participant',
  })
  role?: UserRole;
}
