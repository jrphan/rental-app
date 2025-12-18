import { resolve } from 'path';
import { config as loadEnvConfig } from 'dotenv';

/**
 * Load environment variables before importing the rest of the application.
 * When running from dist/, __dirname is dist/src, so we need to go up 2 levels to reach backend root.
 */
loadEnvConfig({ path: resolve(__dirname, '../../.env') });
import { ENV } from '@/config/env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/modules/app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Setup WebSocket adapter
    app.useWebSocketAdapter(new IoAdapter(app));

    // Setup global prefix
    app.setGlobalPrefix(ENV.globalPrefix);

    // Setup CORS
    app.enableCors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Setup global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Setup global response interceptor
    app.useGlobalInterceptors(new ResponseInterceptor());

    // Setup global exception filter for consistent error structure
    app.useGlobalFilters(new HttpExceptionFilter());

    // Setup Swagger documentation
    // const swaggerConfig = new DocumentBuilder()
    //   .setTitle('Rental App API')
    //   .setDescription('API documentation for Rental App')
    //   .setVersion('1.0')
    //   .addTag('auth', 'Authentication endpoints')
    //   .addTag('app', 'Application endpoints')
    //   .addBearerAuth(
    //     {
    //       type: 'http',
    //       scheme: 'bearer',
    //       bearerFormat: 'JWT',
    //       name: 'JWT',
    //       description: 'Enter JWT token',
    //       in: 'header',
    //     },
    //     'JWT-auth',
    //   )
    //   .build();

    // const document = SwaggerModule.createDocument(app, swaggerConfig);
    // SwaggerModule.setup(`${ENV.globalPrefix}/docs`, app, document);

    await app.listen(ENV.port);
    logger.log(
      `Server is running on port http://localhost:${ENV.port}/${ENV.globalPrefix}`,
    );
    // logger.log(
    //   `Swagger documentation available at http://localhost:${ENV.port}/${ENV.globalPrefix}/docs`,
    // );
  } catch (error: unknown) {
    logger.error(
      'Failed to start application:',
      error instanceof Error ? error.message : 'Unknown error',
      error instanceof Error ? error.stack : undefined,
    );
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
