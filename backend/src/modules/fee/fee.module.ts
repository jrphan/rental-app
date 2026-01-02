import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FeeController } from './fee.controller';
import { FeeService } from './fee.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthGuard } from '@/common/guards/auth.guard';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [FeeController],
  providers: [FeeService, AuthGuard],
  exports: [FeeService],
})
export class FeeModule {}

