import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from '@rental-app/shared-prisma';
import { ENV_CONFIG } from '../config';

@Module({
  imports: [
    PrismaModule.forRoot({
      databaseUrl: ENV_CONFIG.databaseUrl,
      logLevel: ['query', 'info', 'warn', 'error'],
      clientPath: '../../../node_modules/.prisma/auth-client',
      isGlobal: true,
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
