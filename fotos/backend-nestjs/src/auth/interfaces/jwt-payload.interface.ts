import { UserRole } from '../enums/user-role.enum';

/**
 * Interface para el payload del JWT token
 *
 * Define la estructura de los datos que se incluyen en el token JWT.
 * Estos datos estarán disponibles en request.user después de la validación.
 */
export interface JwtPayload {
  /**
   * ID del usuario (subject del token)
   */
  sub: string;

  /**
   * Email del usuario
   */
  email: string;

  /**
   * Rol del usuario para autorización
   */
  role: UserRole;

  /**
   * Timestamp de cuándo se emitió el token (issued at)
   */
  iat?: number;

  /**
   * Timestamp de cuándo expira el token (expiration)
   */
  exp?: number;
}

/**
 * Interface para los datos del usuario extraídos del JWT
 * Estos datos se inyectan en request.user después de la autenticación
 */
export interface AuthenticatedUser {
  /**
   * ID del usuario
   */
  userId: string;

  /**
   * Email del usuario
   */
  email: string;

  /**
   * Rol del usuario
   */
  role: UserRole;
}
