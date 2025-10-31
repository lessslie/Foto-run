import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { PhotosController } from './photo.controller';  // ← sin 's'
import { PhotosService } from './photo.service';        // ← sin 's'
import { Photo } from './photo.entity';
import { Detection } from '../detection/entities/detection.entity';
import { RoboflowModule } from '../roboflow/roboflow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Photo, Detection]),
    MulterModule.register({
      dest: './uploads',
    }),
    RoboflowModule,
  ],
  controllers: [PhotosController],
  providers: [PhotosService],
  exports: [PhotosService],
})
export class PhotosModule {}
