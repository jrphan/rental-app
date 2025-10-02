import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '@rental-app/shared-prisma';

@Module({
  imports: [PrismaModule.forRoot({
    databaseUrl: process.env.DATABASE_URL || 'postgresql://auth_user:auth_password_123@localhost:5432/rental_auth?schema=public',
    logLevel: ['query', 'info', 'warn', 'error'],
    isGlobal: true,
  })],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
