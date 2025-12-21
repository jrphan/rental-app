import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/prisma/prisma.module';
import { RentalService } from './rental.service';
import { RentalController } from './rental.controller';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AuditLogModule } from '@/modules/audit/audit-log.module';
import { NotificationModule } from '@/modules/notification/notification.module';

@Module({
  imports: [AuditLogModule, PrismaModule, JwtModule, NotificationModule],
  controllers: [RentalController],
  providers: [RentalService, AuthGuard],
  exports: [RentalService],
})
export class RentalModule {}

