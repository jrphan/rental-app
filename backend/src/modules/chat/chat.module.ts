import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthGuard } from '@/common/guards/auth.guard';
import { NotificationModule } from '@/modules/notification/notification.module';

@Module({
  imports: [PrismaModule, JwtModule, forwardRef(() => NotificationModule)],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, AuthGuard],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
