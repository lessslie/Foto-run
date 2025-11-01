import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestWithUser } from '../interfaces';

/**
 * Guard que verifica si el usuario autenticado tiene el rol necesario
 * para acceder al endpoint
 *
 * Se usa junto con JwtAuthGuard y el decorador @Roles().
 * El orden es importante: JwtAuthGuard DEBE ejecutarse primero.
 *
 * @example
 * @Controller('photos')
 * @UseGuards(JwtAuthGuard, RolesGuard)  // ← Orden importante!
 * export class PhotosController {
 *   @Post('upload')
 *   @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
 *   async upload() { ... }
 * }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  /**
   * Valida si el usuario tiene permiso para acceder al endpoint
   *
   * @param context - Contexto de ejecución de NestJS
   * @returns true si el usuario tiene el rol requerido, false en caso contrario
   * @throws ForbiddenException si el usuario no tiene el rol necesario
   */
  canActivate(context: ExecutionContext): boolean {
    // Obtener los roles requeridos del decorador @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay roles especificados, permitir acceso
    // Esto significa que el endpoint está protegido por autenticación pero no por roles
    if (!requiredRoles || requiredRoles.length === 0) {
      this.logger.debug('No roles required - access granted');
      return true;
    }

    // Obtener el request y el usuario autenticado
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Verificar que el usuario exista (debería existir si JwtAuthGuard pasó)
    if (!user) {
      this.logger.error('User not found in request - JwtAuthGuard should run first');
      throw new ForbiddenException(
        'No se encontró información del usuario. Asegúrate de estar autenticado.',
      );
    }

    // Verificar si el usuario tiene alguno de los roles requeridos
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn(
        `Access denied - User ${user.userId} with role ${user.role} tried to access endpoint requiring ${requiredRoles.join(', ')}`,
      );

      throw new ForbiddenException(
        `Esta acción requiere uno de los siguientes roles: ${requiredRoles.join(', ')}. Tu rol actual es: ${user.role}`,
      );
    }

    this.logger.debug(
      `Access granted - User ${user.userId} with role ${user.role}`,
    );
    return true;
  }
}
