import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface RoboflowDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
}

export interface RoboflowResponse {
  predictions: RoboflowDetection[];
  image: {
    width: number;
    height: number;
  };
}

@Injectable()
export class RoboflowService {
  private readonly logger = new Logger(RoboflowService.name);
  private readonly apiKey: string;
  private readonly modelId: string;
  private readonly apiUrl: string;

 constructor(private configService: ConfigService) {
    // ✅ Validar que las variables existan
    const apiKey = this.configService.get<string>('ROBOFLOW_API_KEY');
    const modelId = this.configService.get<string>('ROBOFLOW_MODEL_ID');
    
    if (!apiKey || !modelId) {
      throw new Error('Faltan configurar ROBOFLOW_API_KEY o ROBOFLOW_MODEL_ID en .env');
    }
    
    this.apiKey = apiKey;
    this.modelId = modelId;
    this.apiUrl = `https://detect.roboflow.com/${this.modelId}`;
  }

  async detectPlates(imageBuffer: Buffer): Promise<RoboflowResponse> {
    try {
      this.logger.log('Enviando imagen a Roboflow API...');

      const base64Image = imageBuffer.toString('base64');

      const response = await axios.post(
        this.apiUrl,
        base64Image,
        {
          params: {
            api_key: this.apiKey,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.logger.log(`Roboflow detectó ${response.data.predictions.length} dorsales`);
      return response.data;
    } catch (error) {
      this.logger.error('Error al llamar a Roboflow API:', error.message);
      throw new Error(`Roboflow API error: ${error.message}`);
    }
  }
}