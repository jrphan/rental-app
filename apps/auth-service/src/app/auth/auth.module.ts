import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService], // Export AuthService để có thể sử dụng ở module khác nếu cần
})
export class AuthModule {}
