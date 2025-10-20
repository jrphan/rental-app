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
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',      // Web frontend
    'http://localhost:8081',       // Expo dev server
    'http://localhost:19000',     // Expo web
    'http://172.31.146.67:8081',  // WSL IP for mobile
    'exp://localhost:8081',       // Expo protocol
    'exp://172.31.146.67:8081',  // Expo protocol WSL
    'http://localhost:3001',      // Admin dashboard (if any)
    'http://localhost:4200',      // Angular dev (if any)
  ];

  app.use(cors.default({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Log blocked origins for debugging
      Logger.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With', 
      'Content-Type', 
      'Accept', 
      'Authorization',
      'X-API-Key',
      'X-Request-ID'
    ],
    credentials: true,
    optionsSuccessStatus: 200, // For legacy browser support
  }));
  
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  
  const port = process.env.PORT || 3000;
  await app.listen(port); // Bind to all interfaces
  
  Logger.log(`🚀 API Gateway is running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📱 Mobile App can connect to: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`🔗 Proxying to microservices:`);
  Logger.log(`   - Auth Service: ${process.env.AUTH_SERVICE_URL || 'http://localhost:3333'}/api`);
  Logger.log(`   - Vehicle Service: ${process.env.VEHICLE_SERVICE_URL || 'http://localhost:3334'}/api`);
  Logger.log(`   - Booking Service: ${process.env.BOOKING_SERVICE_URL || 'http://localhost:3335'}/api`);
  Logger.log(`   - Payment Service: ${process.env.PAYMENT_SERVICE_URL || 'http://localhost:3336'}/api`);
  Logger.log(`   - Notification Service: ${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3337'}/api`);
  Logger.log(`   - Location Service: ${process.env.LOCATION_SERVICE_URL || 'http://localhost:3338'}/api`);
  Logger.log(`   - Review Service: ${process.env.REVIEW_SERVICE_URL || 'http://localhost:3339'}/api`);
  Logger.log(`   - File Upload Service: ${process.env.FILE_UPLOAD_SERVICE_URL || 'http://localhost:3342'}/api`);
}

bootstrap();
