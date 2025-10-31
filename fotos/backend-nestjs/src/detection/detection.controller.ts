import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DetectionService } from './detection.service';
import { DetectionResponseDto } from './dto/detection-response.dto';

@Controller('detection')
export class DetectionController {
  constructor(private readonly detectionService: DetectionService) {}

  @Post('detect-plate')
  @UseInterceptors(FileInterceptor('image'))
  async detectPlate(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DetectionResponseDto[]> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ninguna imagen');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no válido. Use JPG o PNG');
    }

    return this.detectionService.detectPlates(file.buffer, file.mimetype);
  }

  @Get()
  async findAll() {
    return this.detectionService.findAll();
  }

  @Get('runner/:runnerId')
  async findByRunner(@Param('runnerId') runnerId: string) {
    return this.detectionService.findByRunner(+runnerId);
  }

  @Get('statistics')
  async getStatistics() {
    return this.detectionService.getStatistics();
  }
}