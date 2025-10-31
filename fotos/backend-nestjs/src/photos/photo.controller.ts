import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PhotosService } from './photo.service';  // ← CAMBIO: sin 's'
import { Photo } from './photo.entity';

@Controller('photos')
@UseGuards(JwtAuthGuard)
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `photo-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body('raceId') raceId: string,
    @CurrentUser() user: User,
  ): Promise<Photo> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!raceId) {
      throw new BadRequestException('raceId is required');
    }

    const photo = await this.photosService.create({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      raceId,
      uploadedBy: user.id,
    });

    this.photosService
      .processPhoto(photo.id, file.path)
      .catch((error) =>
        console.error('Error processing photo:', error),
      );

    return photo;
  }

  @Get('search')
  async searchByBibNumber(
    @Query('bibNumber') bibNumber: string,
  ): Promise<Photo[]> {
    if (!bibNumber) {
      throw new BadRequestException('bibNumber query parameter is required');
    }

    return await this.photosService.findByBibNumber(bibNumber);
  }

  @Get('race/:raceId')
  async getPhotosByRace(@Param('raceId') raceId: string): Promise<Photo[]> {
    return await this.photosService.findByRace(raceId);
  }

  @Get(':id')
  async getPhoto(@Param('id') id: string): Promise<Photo> {
    return await this.photosService.findOne(id);
  }

  @Get()
  async getAllPhotos(): Promise<Photo[]> {
    return await this.photosService.findAll();
  }

  @Delete(':id')
  async deletePhoto(@Param('id') id: string): Promise<{ message: string }> {
    await this.photosService.remove(id);
    return { message: 'Photo deleted successfully' };
  }
}
