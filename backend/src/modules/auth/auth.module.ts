import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { UserModule } from '@/modules/user/user.module';
import { SmsModule } from '@/modules/sms/sms.module';
import { RateLimitModule } from '@/modules/rate-limit/rate-limit.module';
import { AuthGuard } from '@/common/guards/auth.guard';

@Module({
  imports: [PrismaModule, SmsModule, JwtModule, UserModule, RateLimitModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
