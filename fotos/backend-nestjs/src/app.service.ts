import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getConfig() {
    return {
      version: '2.0',
      features: {
        detection: 'Roboflow API',
        ocr: 'Advanced OCR with Intelligent Matching',
        storage: 'Supabase Storage',
        database: 'PostgreSQL (Supabase)',
      },
      endpoints: {
        health: '/',
        config: '/config',
        runners: '/runners',
        detection: '/detection/detect-plate',
        statistics: '/detection/statistics',
      },
    };
  }
}