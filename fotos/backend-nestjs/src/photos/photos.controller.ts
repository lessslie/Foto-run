import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
  Param,
  Request,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import type { RequestWithUser } from '../auth/interfaces';
import { PhotosService } from './photo.service';
import { UploadPhotoDto } from './dto/upload-photo.dto';

/**
 * Controller para gestión de fotos
 * 
 * Todos los endpoints requieren autenticación (JwtAuthGuard).
 * Algunos endpoints requieren roles específicos (@Roles decorator).
 * 
 * ⚠️ IMPORTANTE: El orden de guards es crucial:
 * 1. JwtAuthGuard (valida token y crea request.user)
 * 2. RolesGuard (lee request.user.role)
 */
@ApiTags('Fotos')
@ApiBearerAuth()
@Controller('photos')
@UseGuards(JwtAuthGuard, RolesGuard) // Aplicar guards a TODO el controller
export class PhotosController {
  private readonly logger = new Logger(PhotosController.name);

  constructor(private readonly photosService: PhotosService) {}

  /**
   * Subir foto a un evento deportivo
   * 
   * SOLO FOTÓGRAFOS Y ADMINS pueden subir fotos.
   * Los participantes recibirán un error 403 Forbidden.
   */
  @Post('upload')
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN) // 🔒 PROTEGIDO POR ROL
  @ApiOperation({
    summary: 'Subir foto (solo fotógrafos y admins)',
    description:
      'Sube una foto a un evento deportivo. La foto será procesada automáticamente con Roboflow y OCR para detectar dorsales. SOLO usuarios con rol PHOTOGRAPHER o ADMIN pueden acceder a este endpoint.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Foto y datos del evento',
    schema: {
      type: 'object',
      required: ['photo', 'raceId'],
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (jpg, jpeg, png, webp)',
        },
        raceId: {
          type: 'string',
          format: 'uuid',
          description: 'ID del evento deportivo',
          example: 'd9487a64-660b-4f2b-980e-bbf8329bfda3',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Foto subida exitosamente y en proceso de análisis',
  })
  @ApiBadRequestResponse({
    description: 'Archivo inválido o datos incompletos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
  })
  @ApiForbiddenResponse({
    description:
      'No tienes permisos. Este endpoint requiere rol PHOTOGRAPHER o ADMIN.',
  })
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname);
          cb(null, `photo-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(
            new BadRequestException(
              'Solo se permiten imágenes (jpg, jpeg, png, webp)',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
      },
    }),
  )
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadPhotoDto: UploadPhotoDto,
    @Request() req: RequestWithUser, // Tipado completo con rol
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ninguna imagen');
    }

    const userId = req.user.userId;
    const userRole = req.user.role;

    this.logger.log(
      `User ${userId} (${userRole}) uploading photo for race ${uploadPhotoDto.raceId}`,
    );

    return this.photosService.uploadPhoto(
      file,
      uploadPhotoDto.raceId,
      userId,
    );
  }

  /**
   * Buscar fotos por número de dorsal
   * 
   * TODOS los usuarios autenticados pueden buscar fotos.
   */
  @Get('search')
  @ApiOperation({
    summary: 'Buscar fotos por número de dorsal',
    description:
      'Busca fotos que contengan un número de dorsal específico. Todos los usuarios autenticados pueden usar este endpoint.',
  })
  @ApiQuery({
    name: 'bibNumber',
    description: 'Número de dorsal a buscar',
    example: '3633',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de fotos encontradas con ese dorsal',
  })
  @ApiBadRequestResponse({
    description: 'Número de dorsal no proporcionado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
  })
  async searchByBibNumber(
    @Query('bibNumber') bibNumber: string,
    @Request() req: RequestWithUser,
  ) {
    if (!bibNumber) {
      throw new BadRequestException('Debe proporcionar un número de dorsal');
    }

    this.logger.log(
      `User ${req.user.userId} searching for bib number: ${bibNumber}`,
    );

    return this.photosService.searchByBibNumber(bibNumber);
  }

    /**
   * Listar mis fotos subidas
   * 
   * SOLO FOTÓGRAFOS Y ADMINS pueden ver sus fotos subidas.
   */
  @Get('my-uploads')
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN) // 🔒 PROTEGIDO POR ROL
  @ApiOperation({
    summary: 'Listar mis fotos subidas (solo fotógrafos y admins)',
    description:
      'Obtiene la lista de fotos subidas por el fotógrafo actual. SOLO usuarios con rol PHOTOGRAPHER o ADMIN pueden acceder.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de fotos subidas por el usuario',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos. Requiere rol PHOTOGRAPHER o ADMIN.',
  })
  async getMyUploads(@Request() req: RequestWithUser) {
    const userId = req.user.userId;

    this.logger.log(`User ${userId} requesting their uploaded photos`);

    return this.photosService.getPhotosByPhotographer(userId);
  }

  /**
   * Obtener foto por ID
   * 
   * TODOS los usuarios autenticados pueden ver fotos.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener foto por ID',
    description:
      'Obtiene los detalles de una foto específica incluyendo sus detecciones de dorsales.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la foto',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalles de la foto',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
  })
  async getPhotoById(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    this.logger.log(`User ${req.user.userId} requesting photo: ${id}`);
    return this.photosService.getPhotoById(id);
  }


}
