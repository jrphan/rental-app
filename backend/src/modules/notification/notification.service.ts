import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';
import { createPaginatedResponse } from '@/common/utils/response.util';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    data: {
      type: NotificationType;
      title: string;
      message: string;
      data?: any;
    },
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ? (data.data as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async getMyNotifications(
    userId: string,
    page = 1,
    limit = 20,
    isRead?: boolean,
  ) {
    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (typeof isRead === 'boolean') {
      where.isRead = isRead;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return createPaginatedResponse(
      items,
      { page, limit, total },
      'Lấy danh sách thông báo thành công',
      '/api/notifications',
    );
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async delete(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }
}
