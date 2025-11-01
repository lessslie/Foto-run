import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from './enums/user-role.enum';
import { JwtPayload } from './interfaces';

/**
 * Servicio de autenticación con soporte para roles
 *
 * Maneja el registro, login y validación de usuarios.
 * Genera tokens JWT con información del rol para autorización.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registra un nuevo usuario en el sistema
   *
   * Por defecto, el rol asignado es PARTICIPANT a menos que se especifique otro.
   *
   * @param registerDto - Datos del usuario a registrar
   * @returns Usuario creado y token JWT
   * @throws ConflictException si el email ya está registrado
   */
  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: User; token: string }> {
    const { email, password, firstName, lastName, role } = registerDto;

    this.logger.log(`Attempting to register new user: ${email}`);

    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      this.logger.warn(`Registration failed - Email already exists: ${email}`);
      throw new ConflictException('El email ya está registrado');
    }

    // Hashear password con bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario con el rol especificado o PARTICIPANT por defecto
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      role: role || UserRole.PARTICIPANT,
    });

   await this.userRepository.save(user);

    this.logger.log(
      `User registered successfully: ${email} with role: ${user.role}`,
    );

    // Generar JWT con el rol incluido
    const token = this.generateToken(user);

    // No devolver password en la respuesta
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword as User, token };
  }

  /**
   * Inicia sesión de un usuario existente
   *
   * @param loginDto - Credenciales del usuario (email y password)
   * @returns Usuario autenticado y token JWT
   * @throws UnauthorizedException si las credenciales son inválidas o el usuario está inactivo
   */
  async login(loginDto: LoginDto): Promise<{ user: User; token: string }> {
    const { email, password } = loginDto;

    this.logger.log(`Login attempt for user: ${email}`);

    // Buscar usuario por email
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      this.logger.warn(`Login failed - User not found: ${email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Login failed - Invalid password for user: ${email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      this.logger.warn(
        `Login failed - User is inactive: ${email}`,
      );
      throw new UnauthorizedException(
        'Usuario desactivado. Contacta al administrador.',
      );
    }

    this.logger.log(
      `User logged in successfully: ${email} with role: ${user.role}`,
    );

    // Generar JWT con el rol incluido
    const token = this.generateToken(user);

    // No devolver password en la respuesta
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword as User, token };
  }

  /**
   * Genera un token JWT con información del usuario
   * 
   * El token incluye:
   * - sub: ID del usuario
   * - email: Email del usuario
   * - role: Rol del usuario (para autorización)
   *
   * @param user - Usuario para el cual generar el token
   * @returns Token JWT firmado
   */
  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    this.logger.debug(`JWT token generated for user: ${user.id}`);

    return token;
  }

  /**
   * Valida que un usuario existe y está activo
   *
   * Utilizado por JwtStrategy para validar tokens.
   *
   * @param userId - ID del usuario a validar
   * @returns Usuario si existe y está activo, null en caso contrario
   */
  async validateUser(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      this.logger.warn(`User validation failed for ID: ${userId}`);
      return null;
    }

    return user;
  }
}
