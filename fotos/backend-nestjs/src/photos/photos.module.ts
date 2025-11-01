import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photo.service';
import { Photo } from './photo.entity';
import { Detection } from '../detection/entities/detection.entity';
import { RoboflowModule } from '../roboflow/roboflow.module';
import { OcrModule } from 'src/ocr/ocr.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Photo, Detection]),
    MulterModule.register({
      dest: './uploads',
    }),
    RoboflowModule,
    OcrModule,
    CloudinaryModule,
  ],
  controllers: [PhotosController],
  providers: [PhotosService],
  exports: [PhotosService],
})
export class PhotosModule {}
