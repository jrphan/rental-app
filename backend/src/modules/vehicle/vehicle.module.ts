import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/prisma/prisma.module';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AuditLogModule } from '@/modules/audit/audit-log.module';
import { NotificationModule } from '@/modules/notification/notification.module';

@Module({
  imports: [AuditLogModule, PrismaModule, JwtModule, NotificationModule],
  controllers: [VehicleController],
  providers: [VehicleService, AuthGuard],
  exports: [VehicleService],
})
export class VehicleModule {}
