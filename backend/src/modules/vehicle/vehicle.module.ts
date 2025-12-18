import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/prisma/prisma.module';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AuditLogModule } from '@/modules/audit/audit-log.module';

@Module({
  imports: [AuditLogModule, PrismaModule, JwtModule],
  controllers: [VehicleController],
  providers: [VehicleService, AuthGuard],
  exports: [VehicleService],
})
export class VehicleModule {}
