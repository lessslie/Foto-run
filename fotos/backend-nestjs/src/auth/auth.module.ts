import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * Módulo de autenticación y autorización
 *
 * Proporciona:
 * - Registro y login de usuarios
 * - Generación de tokens JWT con roles
 * - Validación de tokens (JwtStrategy)
 * - Guards de autenticación (JwtAuthGuard)
 * - Guards de autorización por roles (RolesGuard)
 * - Decoradores para proteger endpoints (@Roles)
 *
 * Los guards y decoradores son exportados para uso en otros módulos.
 */
@Module({
  imports: [
    // TypeORM para la entity User
    TypeOrmModule.forFeature([User]),

    // Passport con estrategia JWT
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Configuración JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '7d', // Token válido por 7 días
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard, // Guard para validación de roles
  ],

  exports: [
  AuthService,
  JwtAuthGuard,
  RolesGuard,
],
})
export class AuthModule {}
