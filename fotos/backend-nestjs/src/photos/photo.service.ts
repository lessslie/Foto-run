import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './photo.entity';
import { Detection } from '../detection/entities/detection.entity';
import { RoboflowService } from '../roboflow/roboflow.service';
import { OcrService } from '../ocr/ocr.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { unlink } from 'fs/promises';

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);

  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Detection)
    private readonly detectionRepository: Repository<Detection>,
    private readonly roboflowService: RoboflowService,
    private readonly ocrService: OcrService,
    private readonly cloudinaryService: CloudinaryService,
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

  /**
   * Procesa una foto: sube a Cloudinary, detecta dorsales con Roboflow y lee números con OCR
   */
  async processPhoto(photoId: string, filePath: string): Promise<void> {
    try {
      this.logger.log(`Processing photo: ${photoId}`);

      const photo = await this.photoRepository.findOne({
        where: { id: photoId },
      });

      if (!photo) {
        throw new NotFoundException(`Photo with ID ${photoId} not found`);
      }

      // PASO 0: Subir a Cloudinary primero
      this.logger.log(`Uploading photo to Cloudinary: ${filePath}`);
      const cloudinaryResult = await this.cloudinaryService.uploadImage(
        filePath,
        'jerpro-photos',
      );

      // Actualizar URL de la foto con la URL de Cloudinary
      photo.url = cloudinaryResult.url;
      await this.photoRepository.save(photo);

      this.logger.log(`Photo uploaded to Cloudinary: ${cloudinaryResult.url}`);

      // PASO 1: Roboflow detecta UBICACIÓN de dorsales (usa archivo local)
      const result = await this.roboflowService.detectBibsFromFile(filePath);
      this.logger.log(
        `Roboflow raw response: ${result.predictions.length} predictions`,
      );

      const validDetections = this.roboflowService.filterByConfidence(
        result.predictions,
        0.3,
      );

      this.logger.log(
        `Found ${validDetections.length} valid detections for photo ${photoId}`,
      );

      // PASO 2: OCR lee el NÚMERO en cada ubicación detectada
      for (const pred of validDetections) {
        // Usar OCR para extraer el número del dorsal
        const ocrResult = await this.ocrService.extractBibNumber(
          filePath,
          pred.x,
          pred.y,
          pred.width,
          pred.height,
        );

        // Si OCR no pudo leer el número, skip esta detección
        if (!ocrResult || !ocrResult.text) {
          this.logger.warn(
            `OCR failed for detection at (${pred.x}, ${pred.y}) - skipping`,
          );
          continue;
        }

        // Guardar detección con el número real
        const detection = this.detectionRepository.create({
          photoId: photo.id,
          bibNumber: ocrResult.text,
          confidence: (pred.confidence + ocrResult.confidence) / 2,
          x: pred.x,
          y: pred.y,
          width: pred.width,
          height: pred.height,
          metadata: {
            class_id: pred.class_id,
            detection_id: pred.detection_id,
            roboflow_confidence: pred.confidence,
            ocr_confidence: ocrResult.confidence,
            cloudinary_public_id: cloudinaryResult.publicId,
          },
        });

        await this.detectionRepository.save(detection);

        this.logger.log(
          `Saved detection: bibNumber=${ocrResult.text}, confidence=${detection.confidence.toFixed(2)}`,
        );
      }

      photo.isProcessed = true;
      photo.processedAt = new Date();
      await this.photoRepository.save(photo);

      // PASO 3: Eliminar archivo local después de procesar
      try {
        await unlink(filePath);
        this.logger.log(`Local file deleted: ${filePath}`);
      } catch (unlinkError) {
        this.logger.warn(`Could not delete local file: ${filePath}`);
      }

      this.logger.log(`Photo ${photoId} processed successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing photo ${photoId}: ${errorMessage}`);
      
      // Intentar limpiar archivo local en caso de error
      try {
        await unlink(filePath);
      } catch {
        // Ignorar error de limpieza
      }
      
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
    // Primero obtener la foto para eliminar de Cloudinary
    const photo = await this.photoRepository.findOne({
      where: { id },
      relations: ['detections'],
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${id} not found`);
    }

    // Eliminar de Cloudinary si tiene publicId en metadata
    if (photo.detections && photo.detections.length > 0) {
      const publicId = photo.detections[0]?.metadata?.cloudinary_public_id as
        | string
        | undefined;
      if (publicId) {
        try {
          await this.cloudinaryService.deleteImage(publicId);
          this.logger.log(`Deleted from Cloudinary: ${publicId}`);
        } catch (error) {
          this.logger.warn(`Could not delete from Cloudinary: ${publicId}`);
        }
      }
    }

    // Eliminar de la base de datos
    const result = await this.photoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Photo with ID ${id} not found`);
    }
  }
}
