/**
 * API Gateway - Entry point cho Rental App Microservices
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as cors from 'cors'; 
import * as helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security middleware
  app.use(helmet.default());
  
  // CORS configuration
  app.use(cors.default({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19000',
      'http://172.31.146.67:8081',
      'exp://localhost:8081',
      'exp://172.31.146.67:8081',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  }));
  
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  
  const port = process.env.PORT || 3000;
  await app.listen(port); // Bind to all interfaces
  
  Logger.log(`🚀 API Gateway is running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📱 Mobile App can connect to: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`🔗 Proxying to microservices:`);
  Logger.log(`   - Auth Service: http://localhost:3333/api`);
  Logger.log(`   - Vehicle Service: http://localhost:3334/api`);
  Logger.log(`   - Booking Service: http://localhost:3335/api`);
}

bootstrap();
