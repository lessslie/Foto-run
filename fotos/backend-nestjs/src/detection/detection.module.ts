import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetectionController } from './detection.controller';
import { DetectionService } from './detection.service';
import { Detection } from './entities/detection.entity';
import { RoboflowService } from '../roboflow/roboflow.service';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { OcrService } from '../ocr/ocr.service';
import { StorageService } from '../storage/storage.service';
import { RunnersModule } from '../runners/runners.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Detection]),
    RunnersModule,
  ],
  controllers: [DetectionController],
  providers: [
    DetectionService,
    RoboflowService,
    ImageProcessingService,
    OcrService,
    StorageService,
  ],
})
export class DetectionModule {}