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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [Runner, Detection],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        ssl: {
          rejectUnauthorized: false,
        },
        logging: true,
      }),
    }),
    RunnersModule,
    DetectionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}