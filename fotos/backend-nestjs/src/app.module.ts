import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RunnersModule } from './runners/runners.module';
import { DetectionModule } from './detection/detection.module';
import { Runner } from './runners/entities/runner.entity';
import { Detection } from './detection/entities/detection.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        // ✅ Validar que exista la URL
        if (!databaseUrl) {
          throw new Error('DATABASE_URL no está configurada en .env');
        }

        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [Runner, Detection],
          synchronize: configService.get<string>('NODE_ENV') === 'development',
          // ✅ SSL configurado correctamente para Supabase
          ssl: databaseUrl.includes('supabase.com') 
            ? { rejectUnauthorized: false }
            : false,
          logging: ['error', 'warn'],
          // ✅ Configuración adicional para conexiones
          extra: {
            max: 10, // Máximo de conexiones
            connectionTimeoutMillis: 5000,
          },
        };
      },
    }),
    RunnersModule,
    DetectionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}