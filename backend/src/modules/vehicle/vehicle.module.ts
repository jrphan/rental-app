import { Module } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationModule } from '@/modules/notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [VehicleController],
  providers: [VehicleService, PrismaService],
})
export class VehicleModule {}
