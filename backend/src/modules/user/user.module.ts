import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { NotificationModule } from '@/modules/notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
