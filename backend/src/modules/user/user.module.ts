import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/prisma/prisma.module';
import { UserService } from '@/modules/user/user.service';
import { UserController } from '@/modules/user/user.controller';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AuditLogModule } from '@/modules/audit/audit-log.module';
import { NotificationModule } from '@/modules/notification/notification.module';

@Module({
  imports: [AuditLogModule, PrismaModule, JwtModule, NotificationModule],
  controllers: [UserController],
  providers: [UserService, AuthGuard],
  exports: [UserService],
})
export class UserModule {}
