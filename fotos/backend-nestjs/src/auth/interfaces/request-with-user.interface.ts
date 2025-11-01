import { Request } from 'express';
import { AuthenticatedUser } from './jwt-payload.interface';

/**
 * Interface que extiende el Request de Express con el usuario autenticado
 *
 * Después de pasar por JwtAuthGuard, el objeto request tendrá la propiedad
 * user con los datos del usuario autenticado.
 *
 * @example
 * async myController(@Request() req: RequestWithUser) {
 *   const userId = req.user.userId;
 *   const role = req.user.role;
 * }
 */
export interface RequestWithUser extends Request {
  /**
   * Usuario autenticado extraído del JWT token
   */
  user: AuthenticatedUser;
}
