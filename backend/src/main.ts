import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@/modules/app/app.module';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';

const PORT = process.env.PORT ?? 3000;
const GLOBAL_PREFIX = 'api';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    //setup global prefix
    app.setGlobalPrefix(GLOBAL_PREFIX);

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
    SwaggerModule.setup(`${GLOBAL_PREFIX}/docs`, app, document);

    await app.listen(PORT);
    console.log(
      `Server is running on port http://localhost:${PORT}/${GLOBAL_PREFIX}`,
    );
    console.log(
      `Swagger documentation available at http://localhost:${PORT}/${GLOBAL_PREFIX}/docs`,
    );
  } catch (error) {
    console.error(
      'Failed to start application:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    console.log(
      'Application will continue to run but some features may not work properly',
    );
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
