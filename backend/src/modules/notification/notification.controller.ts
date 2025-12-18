import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  Body,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { NotificationService } from './notification.service';
import { PushNotificationService } from './push-notification.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AuthenticatedRequest } from '@/types/response.type';
import { ROUTES } from '@/config/routes';
import { RegisterDeviceTokenDto } from '@/common/dto/Notification/register-device-token.dto';

@Controller()
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Get(ROUTES.USER.GET_NOTIFICATIONS)
  @UseGuards(AuthGuard)
  async getNotifications(
    @Req() req: Request,
    @Query('isRead') isRead?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const isReadParam =
      isRead === 'true' ? true : isRead === 'false' ? false : undefined;

    return this.notificationService.getUserNotifications(userId, {
      isRead: isReadParam,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get(ROUTES.USER.GET_UNREAD_NOTIFICATION_COUNT)
  @UseGuards(AuthGuard)
  async getUnreadCount(@Req() req: Request) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  @Post(ROUTES.USER.MARK_NOTIFICATION_AS_READ)
  @UseGuards(AuthGuard)
  async markAsRead(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.notificationService.markAsRead(id, userId);
  }

  @Post(ROUTES.USER.MARK_ALL_NOTIFICATIONS_AS_READ)
  @UseGuards(AuthGuard)
  async markAllAsRead(@Req() req: Request) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.notificationService.markAllAsRead(userId);
  }

  @Post(ROUTES.USER.REGISTER_DEVICE_TOKEN)
  @UseGuards(AuthGuard)
  async registerDeviceToken(
    @Req() req: Request,
    @Body() body: RegisterDeviceTokenDto,
  ) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    await this.pushNotificationService.registerDeviceToken(
      userId,
      body.token,
      body.platform,
      body.deviceId,
    );

    return { message: 'Device token registered successfully' };
  }
}
