import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Detection } from './entities/detection.entity';
import { RoboflowService } from '../roboflow/roboflow.service';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { OcrService } from '../ocr/ocr.service';
import { StorageService } from '../storage/storage.service';
import { RunnersService } from '../runners/runners.service';
import { DetectionResponseDto } from './dto/detection-response.dto';

export interface DetectionStatistics {
  total_detections: number;
  by_runner: {
    plate_number: number;
    runner_name: string;
    count: string; // Es string porque viene de COUNT(*)
  }[];
}

@Injectable()
export class DetectionService {
  private readonly logger = new Logger(DetectionService.name);

  constructor(
    @InjectRepository(Detection)
    private detectionRepository: Repository<Detection>,
    private roboflowService: RoboflowService,
    private imageProcessingService: ImageProcessingService,
    private ocrService: OcrService,
    private storageService: StorageService,
    private runnersService: RunnersService,
  ) {}

  async detectPlates(
    imageBuffer: Buffer,
    mimetype: string,
  ): Promise<DetectionResponseDto[]> {
    this.logger.log('Iniciando detección de dorsales...');

    const roboflowResponse = await this.roboflowService.detectPlates(imageBuffer);
    const predictions = roboflowResponse.predictions;

    if (predictions.length === 0) {
      this.logger.warn('No se detectaron dorsales en la imagen');
      return [];
    }

    this.logger.log(`${predictions.length} dorsales detectados por Roboflow`);

    const detections: DetectionResponseDto[] = [];
    const imageDimensions = await this.imageProcessingService.getImageDimensions(imageBuffer);

    for (const prediction of predictions) {
      try {
        const region = await this.imageProcessingService.extractRegion(
          imageBuffer,
          prediction.x - prediction.width / 2,
          prediction.y - prediction.height / 2,
          prediction.width,
          prediction.height,
        );

        const analysis = await this.imageProcessingService.analyzeRegion(region.buffer);

        const ocrResult = this.ocrService.analyzeWithIntelligentMatching(
          prediction.confidence,
          analysis,
        );

        if (ocrResult) {
          const runner = await this.runnersService.findByPlateNumber(ocrResult.plate_number);

          const area = prediction.width * prediction.height;
          const proportion = (area / (imageDimensions.width * imageDimensions.height)) * 100;

          const detectionDto: DetectionResponseDto = {
            plate_number: ocrResult.plate_number,
            runner_name: runner?.name,
            confidence: prediction.confidence,
            bbox: {
              x: prediction.x,
              y: prediction.y,
              width: prediction.width,
              height: prediction.height,
            },
            area,
            proportion: parseFloat(proportion.toFixed(2)),
            ocr_analysis: {
              ...analysis,
              method: ocrResult.method,
              score: ocrResult.score,
            },
          };

          detections.push(detectionDto);
        }
      } catch (error) {
        this.logger.error(`Error procesando detección: ${error.message}`);
      }
    }

    this.logger.log(`Procesadas ${detections.length} detecciones exitosamente`);
    return detections;
  }

  async findAll(): Promise<Detection[]> {
    return this.detectionRepository.find({
      relations: ['runner'],
      order: { detected_at: 'DESC' },
    });
  }

  async findByRunner(runnerId: number): Promise<Detection[]> {
    return this.detectionRepository.find({
      where: { runner: { id: runnerId } },
      order: { detected_at: 'DESC' },
    });
  }

  async getStatistics(): Promise<DetectionStatistics> {
    const total = await this.detectionRepository.count();
    const byRunner = await this.detectionRepository
      .createQueryBuilder('detection')
      .select('runner.plate_number', 'plate_number')
      .addSelect('runner.name', 'runner_name')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('detection.runner', 'runner')
      .groupBy('runner.plate_number')
      .addGroupBy('runner.name')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      total_detections: total,
      by_runner: byRunner,
    };
  }
}