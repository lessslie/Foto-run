import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth() {
    return {
      status: 'healthy',
      service: 'Foto-Run Backend NestJS',
      version: '2.0',
      method: 'Roboflow API + Advanced OCR',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('config')
  getConfig() {
    return this.appService.getConfig();
  }
}