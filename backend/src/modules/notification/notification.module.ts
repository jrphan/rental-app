import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { PushNotificationService } from './push-notification.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthGuard } from '@/common/guards/auth.guard';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationGateway,
    PushNotificationService,
    AuthGuard,
  ],
  exports: [NotificationService, NotificationGateway, PushNotificationService],
})
export class NotificationModule {}
