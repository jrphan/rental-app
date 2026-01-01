import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CommissionController } from './commission.controller';
import { CommissionService } from './commission.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthGuard } from '@/common/guards/auth.guard';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [CommissionController],
  providers: [CommissionService, AuthGuard],
  exports: [CommissionService],
})
export class CommissionModule {}
