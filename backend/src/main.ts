import { config } from 'dotenv';
import { resolve } from 'path';
// Load environment variables before anything else
// When running from dist/, __dirname is dist/src, so we need to go up 2 levels to reach backend root
config({ path: resolve(__dirname, '../../.env') });
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@/modules/app/app.module';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { ENV } from '@/config/env';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    //setup global prefix
    app.setGlobalPrefix(ENV.globalPrefix);

    //setup cors
    app.enableCors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    //setup validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    //setup global response interceptor
    app.useGlobalInterceptors(new ResponseInterceptor());

    //setup global exception filter for consistent error structure
    app.useGlobalFilters(new HttpExceptionFilter());

    //setup swagger
    const config = new DocumentBuilder()
      .setTitle('Rental App API')
      .setDescription('API documentation for Rental App')
      .setVersion('1.0')
      .addTag('users', 'User management endpoints')
      .addTag('auth', 'Authentication endpoints')
      .addTag('app', 'Application endpoints')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${ENV.globalPrefix}/docs`, app, document);

    await app.listen(ENV.port);
    logger.log(
      `Server is running on port http://localhost:${ENV.port}/${ENV.globalPrefix}`,
    );
    logger.log(
      `Swagger documentation available at http://localhost:${ENV.port}/${ENV.globalPrefix}/docs`,
    );
  } catch (error) {
    logger.error(
      'Failed to start application:',
      error instanceof Error ? error.message : 'Unknown error',
      error instanceof Error ? error.stack : undefined,
    );
    logger.log(
      'Application will continue to run but some features may not work properly',
    );
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
