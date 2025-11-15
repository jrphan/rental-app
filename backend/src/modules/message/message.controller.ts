import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiSecurity,
  ApiBody,
} from '@nestjs/swagger';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { GetUser } from '@/modules/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiSecurity('JWT-auth')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @ApiOperation({ summary: 'Gửi tin nhắn' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        receiverId: { type: 'string' },
        rentalId: { type: 'string' },
        content: { type: 'string' },
        type: { type: 'string', enum: ['TEXT', 'IMAGE', 'LOCATION', 'SYSTEM'] },
      },
      required: ['receiverId', 'content'],
    },
  })
  async sendMessage(
    @GetUser() user: Omit<User, 'password'>,
    @Body()
    body: {
      receiverId: string;
      rentalId?: string;
      content: string;
      type?: string;
    },
  ) {
    return this.messageService.sendMessage(user.id, {
      receiverId: body.receiverId,
      rentalId: body.rentalId,
      content: body.content,
      type: body.type as 'TEXT' | 'IMAGE' | 'LOCATION' | 'SYSTEM' | undefined,
    });
  }

  // Specific routes must be before parameter routes to avoid conflicts
  @Get('conversations')
  @ApiOperation({ summary: 'Lấy danh sách cuộc trò chuyện' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getConversations(
    @GetUser() user: Omit<User, 'password'>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messageService.getConversations(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Lấy số lượng tin nhắn chưa đọc' })
  async getUnreadCount(@GetUser() user: Omit<User, 'password'>) {
    const count = await this.messageService.getUnreadCount(user.id);
    return { count };
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Lấy tin nhắn với một người dùng cụ thể' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMessages(
    @GetUser() user: Omit<User, 'password'>,
    @Param('userId') otherUserId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messageService.getMessages(
      user.id,
      otherUserId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu tin nhắn là đã đọc' })
  async markAsRead(
    @GetUser() user: Omit<User, 'password'>,
    @Param('id') id: string,
  ) {
    return this.messageService.markAsRead(user.id, id);
  }
}
