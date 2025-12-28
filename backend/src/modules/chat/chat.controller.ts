import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto } from '@/common/dto/Chat/send-message.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ROUTES } from '@/config/routes';
import type { AuthenticatedRequest } from '@/types/response.type';

@Controller()
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(ROUTES.CHAT.GET_MY_CHATS)
  getMyChats(@Req() req: Request) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new Error('User not found');
    }
    return this.chatService.getMyChats(userId);
  }

  @Get(ROUTES.CHAT.GET_CHAT_DETAIL)
  getChatDetail(@Param('id') chatId: string, @Req() req: Request) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new Error('User not found');
    }
    return this.chatService.getChatById(chatId, userId);
  }

  @Get(ROUTES.CHAT.GET_MESSAGES)
  getMessages(
    @Param('id') chatId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Req() req: Request,
  ) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new Error('User not found');
    }
    return this.chatService.getChatMessages(chatId, userId, page, limit);
  }

  @Post(ROUTES.CHAT.SEND_MESSAGE)
  sendMessage(
    @Param('id') chatId: string,
    @Body() dto: SendMessageDto,
    @Req() req: Request,
  ) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new Error('User not found');
    }
    return this.chatService.sendMessage(chatId, userId, dto);
  }

  @Post(ROUTES.CHAT.MARK_READ)
  markRead(@Param('id') chatId: string, @Req() req: Request) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new Error('User not found');
    }
    return this.chatService.markMessagesAsRead(chatId, userId);
  }

  @Get(ROUTES.CHAT.GET_UNREAD_COUNT)
  getUnreadCount(@Req() req: Request) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new Error('User not found');
    }
    return this.chatService.getUnreadMessageCount(userId);
  }
}
