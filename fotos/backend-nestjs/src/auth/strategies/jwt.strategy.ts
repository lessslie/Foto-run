import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtPayload, AuthenticatedUser } from '../interfaces';

/**
 * Estrategia JWT para validar tokens de autenticación
 *
 * Esta clase extiende la estrategia JWT de Passport y es responsable de:
 * 1. Extraer el token del header Authorization
 * 2. Verificar la firma del token con el secreto
 * 3. Validar que el usuario existe y está activo
 * 4. Inyectar los datos del usuario en request.user (incluyendo el rol)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });

    this.logger.log('JwtStrategy initialized successfully');
  }

  /**
   * Valida el payload del token JWT y devuelve el usuario autenticado
   *
   * Este método se ejecuta automáticamente cuando JwtAuthGuard valida un token.
   * El objeto retornado se inyecta en request.user y está disponible en todos los controllers.
   *
   * IMPORTANTE: Este método DEBE retornar un objeto con el rol incluido para que
   * RolesGuard pueda validar los permisos.
   *
   * @param payload - Payload decodificado del JWT token
   * @returns Datos del usuario autenticado para inyectar en request.user
   * @throws UnauthorizedException si el usuario no existe, está inactivo, o el rol cambió
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    this.logger.debug(`Validating JWT token for user: ${payload.sub}`);

    // Validar que el usuario existe y está activo
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      this.logger.warn(
        `JWT validation failed - User not found or inactive: ${payload.sub}`,
      );
      throw new UnauthorizedException(
        'Usuario no autorizado o inactivo. Por favor, inicia sesión nuevamente.',
      );
    }

    // Verificar que el rol en el token coincide con el rol actual del usuario
    // Esto previene que usuarios con tokens viejos mantengan permisos después de un cambio de rol
    if (user.role !== payload.role) {
      this.logger.warn(
        `JWT validation failed - Role mismatch for user ${user.id}: token has ${payload.role}, database has ${user.role}`,
      );
      throw new UnauthorizedException(
        'Tu rol ha cambiado. Por favor, inicia sesión nuevamente para actualizar tus permisos.',
      );
    }

    this.logger.debug(
      `JWT validated successfully for user: ${user.id} with role: ${user.role}`,
    );

    // Este objeto se inyecta en request.user
    // Está disponible en todos los controllers y guards
    const authenticatedUser: AuthenticatedUser = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role, // CRÍTICO: Incluir rol para que RolesGuard pueda validarlo
    };

    return authenticatedUser;
  }
}
