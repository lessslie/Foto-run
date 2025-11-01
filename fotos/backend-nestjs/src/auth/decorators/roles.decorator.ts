import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

/**
 * Key para almacenar metadata de roles en los endpoints
 */
export const ROLES_KEY = 'roles';

/**
 * Decorador para especificar qué roles pueden acceder a un endpoint
 *
 * Se usa junto con RolesGuard para validar autorización.
 *
 * @param roles - Lista de roles permitidos para acceder al endpoint
 *
 * @example
 * // Solo fotógrafos y admins pueden acceder
 * @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
 * @Post('upload')
 * async uploadPhoto() { ... }
 *
 * @example
 * // Solo admins pueden acceder
 * @Roles(UserRole.ADMIN)
 * @Delete(':id')
 * async deletePhoto() { ... }
 *
 * @example
 * // Sin decorador @Roles() = Todos los usuarios autenticados pueden acceder
 * @Get('search')
 * async searchPhotos() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
