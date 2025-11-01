import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

/**
 * Controller para autenticación de usuarios
 *
 * Endpoints:
 * - POST /auth/register - Registrar nuevo usuario
 * - POST /auth/login - Iniciar sesión
 */
@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registra un nuevo usuario en el sistema
   *
   * Por defecto, el usuario se crea con rol PARTICIPANT.
   * Para crear usuarios con otros roles, especificar el campo "role".
   */
  @Post('register')
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description:
      'Crea un nuevo usuario en el sistema. Por defecto se asigna el rol PARTICIPANT (atleta). Para crear fotógrafos o admins, especificar el campo role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    type: User,
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos (validación fallida)',
  })
  @ApiConflictResponse({
    description: 'El email ya está registrado en el sistema',
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ user: User; token: string }> {
    return this.authService.register(registerDto);
  }

  /**
   * Inicia sesión de un usuario existente
   *
   * Valida las credenciales y retorna un token JWT válido por 7 días.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica un usuario con email y contraseña. Retorna el usuario y un token JWT válido por 7 días.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: User,
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas o usuario inactivo',
  })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ user: User; token: string }> {
    return this.authService.login(loginDto);
  }
}
