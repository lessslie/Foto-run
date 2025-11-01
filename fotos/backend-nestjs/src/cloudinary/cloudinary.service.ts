import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    // Configurar Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });

    this.logger.log('Cloudinary configured successfully');
  }

  /**
   * Sube una imagen a Cloudinary
   */
  async uploadImage(
    filePath: string,
    folder: string = 'jerpro-photos',
  ): Promise<CloudinaryUploadResult> {
    try {
      this.logger.log(`Uploading image to Cloudinary: ${filePath}`);

      const result: UploadApiResponse = await cloudinary.uploader.upload(
        filePath,
        {
          folder,
          resource_type: 'image',
          quality: 'auto:good',
          fetch_format: 'auto',
        },
      );

      this.logger.log(`Image uploaded successfully: ${result.secure_url}`);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error) {
      const uploadError = error as UploadApiErrorResponse;
      this.logger.error(
        `Error uploading to Cloudinary: ${uploadError.message}`,
      );
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }
  }

  /**
   * Elimina una imagen de Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      this.logger.log(`Deleting image from Cloudinary: ${publicId}`);
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Image deleted successfully: ${publicId}`);
    } catch (error) {
      const deleteError = error as Error;
      this.logger.error(
        `Error deleting from Cloudinary: ${deleteError.message}`,
      );
      throw new Error(`Failed to delete image: ${deleteError.message}`);
    }
  }

  /**
   * Genera una URL de transformación (resize, watermark, etc)
   */
  getTransformedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
    } = {},
  ): string {
    return cloudinary.url(publicId, {
      transformation: [
        {
          width: options.width,
          height: options.height,
          crop: options.crop || 'fill',
          quality: options.quality || 'auto:good',
        },
      ],
    });
  }
}
