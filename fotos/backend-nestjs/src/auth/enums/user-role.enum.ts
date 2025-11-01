/**
 * Roles disponibles en el sistema FotoRun
 *
 * Estos roles definen los permisos de autorización en la aplicación.
 * TypeORM creará automáticamente un tipo ENUM en PostgreSQL.
 */
export enum UserRole {
  /**
   * Administrador: Acceso completo al sistema
   */
  ADMIN = 'admin',

  /**
   * Fotógrafo: Puede subir fotos a los eventos deportivos
   */
  PHOTOGRAPHER = 'photographer',

  /**
   * Participante: Puede buscar sus fotos y comprarlas
   * (corredores, ciclistas, motociclistas, etc.)
   */
  PARTICIPANT = 'participant',
}

/**
 * Lista de todos los roles para validaciones
 */
export const ALL_ROLES = [
  UserRole.ADMIN,
  UserRole.PHOTOGRAPHER,
  UserRole.PARTICIPANT,
] as const;

/**
 * Type guard para verificar si un string es un UserRole válido
 */
export function isValidUserRole(role: string): role is UserRole {
  return ALL_ROLES.includes(role as UserRole);
}
