import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/prisma/prisma.module';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AuditLogModule } from '@/modules/audit/audit-log.module';
import { NotificationModule } from '@/modules/notification/notification.module';

@Module({
  imports: [
    AuditLogModule,
    PrismaModule,
    JwtModule,
    NotificationModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService, AuthGuard],
  exports: [ReviewService],
})
export class ReviewModule {}

