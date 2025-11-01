import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { UserRole } from '../../auth/enums/user-role.enum';
import { Photo } from '../../photos/photo.entity';

/**
 * Entity para usuarios del sistema FotoRun
 *
 * Tipos de usuario:
 * - ADMIN: Administrador del sistema con acceso completo
 * - PHOTOGRAPHER: Fotógrafo que sube fotos a eventos deportivos
 * - PARTICIPANT: Atleta que busca y compra sus fotos (corredores, ciclistas, motociclistas, etc.)
 */
@Entity('users')
export class User {
  @ApiProperty({
    description: 'ID único del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Email del usuario (único en el sistema)',
    example: 'usuario@ejemplo.com',
    uniqueItems: true,
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @ApiHideProperty()
  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
    required: false,
    nullable: true,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string | null;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
    required: false,
    nullable: true,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  @ApiProperty({
    description: 'Rol del usuario en el sistema',
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.PARTICIPANT,
    default: UserRole.PARTICIPANT,
  })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PARTICIPANT,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Indica si el usuario está activo en el sistema',
    example: true,
    default: true,
  })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2025-10-31T12:00:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del usuario',
    example: '2025-10-31T12:00:00.000Z',
  })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Fotos subidas por el usuario (solo para fotógrafos)',
    type: () => Photo,
    isArray: true,
  })
  @OneToMany(() => Photo, (photo) => photo.uploadedBy)
  uploadedPhotos: Photo[];

  // ============================================
  // MÉTODOS HELPER PARA VALIDACIÓN DE ROLES
  // ============================================

  /**
   * Verifica si el usuario puede subir fotos
   * @returns true si el usuario es fotógrafo o admin
   */
  canUploadPhotos(): boolean {
    return this.role === UserRole.PHOTOGRAPHER || this.role === UserRole.ADMIN;
  }

  /**
   * Verifica si el usuario es administrador
   * @returns true si el usuario tiene rol de admin
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Verifica si el usuario es un participante (atleta)
   * @returns true si el usuario tiene rol de participant
   */
  isParticipant(): boolean {
    return this.role === UserRole.PARTICIPANT;
  }

  /**
   * Verifica si el usuario es fotógrafo
   * @returns true si el usuario tiene rol de photographer
   */
  isPhotographer(): boolean {
    return this.role === UserRole.PHOTOGRAPHER;
  }

  /**
   * Obtiene el nombre completo del usuario
   * @returns nombre completo o email si no tiene nombre
   */
  getFullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.email;
  }
}
