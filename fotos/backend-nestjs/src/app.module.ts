import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RacesModule } from './races/races.module';
import { PhotosModule } from './photos/photos.module';
import { RoboflowModule } from './roboflow/roboflow.module';
import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    // Global Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database Connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),

    // Serve Static Files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    RacesModule,
    PhotosModule,
    RoboflowModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
