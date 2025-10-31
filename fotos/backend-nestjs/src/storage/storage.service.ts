import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient;
  private readonly bucketName = 'race-images';

 constructor(private configService: ConfigService) {
    // ✅ Validar que las variables existan
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Faltan configurar SUPABASE_URL o SUPABASE_ANON_KEY en .env');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadDetectionImage(
    imageBuffer: Buffer,
    plateNumber: number,
    mimetype: string,
  ): Promise<string> {
    try {
      const fileName = `detections/${Date.now()}-${plateNumber}.jpg`;
      
      this.logger.log(`Subiendo imagen a Supabase Storage: ${fileName}`);

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, imageBuffer, {
          contentType: mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error('Error subiendo imagen:', error.message);
        throw new Error(`Error al subir imagen: ${error.message}`);
      }

      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      this.logger.log(`Imagen subida exitosamente: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error('Error en uploadDetectionImage:', error.message);
      throw error;
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const fileName = imageUrl.split('/').pop();
      
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([`detections/${fileName}`]);

      if (error) {
        this.logger.error('Error eliminando imagen:', error.message);
        throw error;
      }

      this.logger.log(`Imagen eliminada: ${fileName}`);
    } catch (error) {
      this.logger.error('Error en deleteImage:', error.message);
      throw error;
    }
  }
}