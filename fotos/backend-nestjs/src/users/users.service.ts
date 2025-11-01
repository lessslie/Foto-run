import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../auth/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

/**
 * Servicio para gestión de usuarios
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Crea un nuevo usuario
   *
   * @param email - Email del usuario
   * @param password - Contraseña sin hashear
   * @param firstName - Nombre (opcional)
   * @param lastName - Apellido (opcional)
   * @param role - Rol del usuario (por defecto PARTICIPANT)
   * @returns Usuario creado
   * @throws ConflictException si el email ya existe
   */
  async create(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    role: UserRole = UserRole.PARTICIPANT,
  ): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      this.logger.warn(`Attempt to create user with existing email: ${email}`);
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      role,
    });

    const savedUser = await this.userRepository.save(user);

    this.logger.log(`User created: ${email} with role: ${role}`);

    return savedUser;
  }

  /**
   * Busca un usuario por email
   *
   * @param email - Email del usuario
   * @returns Usuario encontrado o null
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  /**
   * Busca un usuario por ID
   *
   * @param id - ID del usuario
   * @returns Usuario encontrado o null
   */
  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  /**
   * Valida una contraseña contra su hash
   *
   * @param password - Contraseña sin hashear
   * @param hashedPassword - Hash de la contraseña
   * @returns true si la contraseña es válida
   */
  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Obtiene todos los usuarios (sin passwords)
   *
   * @returns Lista de usuarios
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  /**
   * Elimina un usuario por ID
   *
   * @param id - ID del usuario a eliminar
   * @throws NotFoundException si el usuario no existe
   */
  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      this.logger.warn(`Attempt to delete non-existent user: ${id}`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.log(`User deleted: ${id}`);
  }

  /**
   * Actualiza el rol de un usuario
   *
   * @param id - ID del usuario
   * @param role - Nuevo rol
   * @returns Usuario actualizado
   * @throws NotFoundException si el usuario no existe
   */
  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.role = role;
    const updatedUser = await this.userRepository.save(user);

    this.logger.log(`User ${id} role updated to: ${role}`);

    return updatedUser;
  }

  /**
   * Activa o desactiva un usuario
   * 
   * @param id - ID del usuario
   * @param isActive - Estado activo
   * @returns Usuario actualizado
   * @throws NotFoundException si el usuario no existe
   */
  async setActiveStatus(id: string, isActive: boolean): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.isActive = isActive;
    const updatedUser = await this.userRepository.save(user);

    this.logger.log(`User ${id} active status set to: ${isActive}`);

    return updatedUser;
  }
}
