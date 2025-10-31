import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './photo.entity';
import { Detection } from '../detection/entities/detection.entity';
import { RoboflowService } from '../roboflow/roboflow.service';


@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);

  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Detection)
    private readonly detectionRepository: Repository<Detection>,
    private readonly roboflowService: RoboflowService,
  ) {}

  async create(data: {
    url: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    raceId: string;
    uploadedBy: string;
  }): Promise<Photo> {
    const photo = this.photoRepository.create(data);
    return await this.photoRepository.save(photo);
  }

  async processPhoto(photoId: string, filePath: string): Promise<void> {
    try {
      this.logger.log(`Processing photo: ${photoId}`);

      const photo = await this.photoRepository.findOne({
        where: { id: photoId },
      });

      if (!photo) {
        throw new NotFoundException(`Photo with ID ${photoId} not found`);
      }

      const result = await this.roboflowService.detectBibsFromFile(filePath);

      const validDetections = this.roboflowService.filterByConfidence(
        result.predictions,
        0.5,
      );

      this.logger.log(
        `Found ${validDetections.length} valid detections for photo ${photoId}`,
      );

      for (const pred of validDetections) {
        const detection = this.detectionRepository.create({
          photoId: photo.id,
          bibNumber: pred.class,
          confidence: pred.confidence,
          x: pred.x,
          y: pred.y,
          width: pred.width,
          height: pred.height,
          metadata: {
            class_id: pred.class_id,
            detection_id: pred.detection_id,
          },
        });

        await this.detectionRepository.save(detection);
      }

      photo.isProcessed = true;
      photo.processedAt = new Date();
      await this.photoRepository.save(photo);

      this.logger.log(`Photo ${photoId} processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing photo ${photoId}: ${error.message}`);
      throw error;
    }
  }

  async findByBibNumber(bibNumber: string): Promise<Photo[]> {
    return await this.photoRepository
      .createQueryBuilder('photo')
      .innerJoin('photo.detections', 'detection')
      .where('detection.bibNumber = :bibNumber', { bibNumber })
      .andWhere('photo.isProcessed = :isProcessed', { isProcessed: true })
      .leftJoinAndSelect('photo.race', 'race')
      .leftJoinAndSelect('photo.detections', 'allDetections')
      .orderBy('photo.createdAt', 'DESC')
      .getMany();
  }

  async findByRace(raceId: string): Promise<Photo[]> {
    return await this.photoRepository.find({
      where: { raceId },
      relations: ['detections', 'race'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Photo> {
    const photo = await this.photoRepository.findOne({
      where: { id },
      relations: ['detections', 'race', 'uploader'],
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${id} not found`);
    }

    return photo;
  }

  async findAll(): Promise<Photo[]> {
    return await this.photoRepository.find({
      relations: ['detections', 'race'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const result = await this.photoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Photo with ID ${id} not found`);
    }
  }
}
