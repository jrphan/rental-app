import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';
import { NotificationGateway } from './notification.gateway';
import { PushNotificationService } from './push-notification.service';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(forwardRef(() => NotificationGateway))
    private readonly notificationGateway?: NotificationGateway,
    private readonly pushNotificationService?: PushNotificationService,
  ) {}

  /**
   * Tạo notification mới
   */
  async createNotification(dto: CreateNotificationDto) {
    try {
      const notification = await this.prismaService.notification.create({
        data: {
          userId: dto.userId,
          title: dto.title,
          message: dto.message,
          type: dto.type,
          data: dto.data || undefined,
        },
      });

      // Send real-time notification via WebSocket if user is connected
      let isUserConnectedViaWS = false;
      if (this.notificationGateway) {
        try {
          isUserConnectedViaWS = this.notificationGateway.isUserConnected(
            dto.userId,
          );
          if (isUserConnectedViaWS) {
            this.notificationGateway.sendNotificationToUser(
              dto.userId,
              notification,
            );

            // Also send unread count update
            const unreadCount = await this.getUnreadCount(dto.userId);
            this.notificationGateway.sendUnreadCountUpdate(
              dto.userId,
              unreadCount,
            );
          }
        } catch (error) {
          this.logger.error('Failed to send WebSocket notification', error);
        }
      }

      // Send push notification if user is not connected via WebSocket
      // (app is closed or in background)
      if (this.pushNotificationService && !isUserConnectedViaWS) {
        try {
          const pushData: Record<string, any> = {
            notificationId: notification.id,
            type: notification.type,
          };
          if (notification.data && typeof notification.data === 'object') {
            Object.assign(pushData, notification.data);
          }
          await this.pushNotificationService.sendPushNotification(
            dto.userId,
            notification.title,
            notification.message,
            pushData,
          );
        } catch (error) {
          this.logger.error('Failed to send push notification', error);
        }
      }

      return notification;
    } catch (error) {
      this.logger.error('Failed to create notification', error);
      // Don't throw error, just log it to avoid breaking the main flow
      return null;
    }
  }

  /**
   * Tạo notification cho KYC approved
   */
  async notifyKycApproved(userId: string) {
    return this.createNotification({
      userId,
      title: 'KYC đã được duyệt',
      message: 'Hồ sơ xác thực danh tính của bạn đã được duyệt thành công.',
      type: NotificationType.KYC_UPDATE,
      data: { action: 'approved' },
    });
  }

  /**
   * Tạo notification cho KYC rejected
   */
  async notifyKycRejected(userId: string, reason?: string) {
    return this.createNotification({
      userId,
      title: 'KYC bị từ chối',
      message: reason
        ? `Hồ sơ xác thực danh tính của bạn bị từ chối. Lý do: ${reason}`
        : 'Hồ sơ xác thực danh tính của bạn bị từ chối. Vui lòng kiểm tra lại thông tin.',
      type: NotificationType.KYC_UPDATE,
      data: { action: 'rejected', reason },
    });
  }

  /**
   * Tạo notification cho Vehicle approved
   */
  async notifyVehicleApproved(
    userId: string,
    vehicleId: string,
    vehicleInfo?: { brand: string; model: string; licensePlate: string },
  ) {
    return this.createNotification({
      userId,
      title: 'Xe đã được duyệt',
      message: vehicleInfo
        ? `Xe ${vehicleInfo.brand} ${vehicleInfo.model} (${vehicleInfo.licensePlate}) đã được duyệt và có thể cho thuê.`
        : 'Xe của bạn đã được duyệt và có thể cho thuê.',
      type: NotificationType.SYSTEM,
      data: { action: 'vehicle_approved', vehicleId },
    });
  }

  /**
   * Tạo notification cho Vehicle rejected
   */
  async notifyVehicleRejected(
    userId: string,
    vehicleId: string,
    reason?: string,
    vehicleInfo?: { brand: string; model: string; licensePlate: string },
  ) {
    return this.createNotification({
      userId,
      title: 'Xe bị từ chối',
      message: vehicleInfo
        ? `Xe ${vehicleInfo.brand} ${vehicleInfo.model} (${vehicleInfo.licensePlate}) bị từ chối.${reason ? ` Lý do: ${reason}` : ''}`
        : `Xe của bạn bị từ chối.${reason ? ` Lý do: ${reason}` : ''}`,
      type: NotificationType.SYSTEM,
      data: { action: 'vehicle_rejected', vehicleId, reason },
    });
  }

  /**
   * Lấy danh sách notifications của user
   */
  async getUserNotifications(
    userId: string,
    options?: {
      isRead?: boolean;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (options?.isRead !== undefined) {
      where.isRead = options.isRead;
    }

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prismaService.notification.count({ where }),
    ]);

    return {
      items,
      total,
    };
  }

  /**
   * Đánh dấu notification là đã đọc
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prismaService.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return null;
    }

    if (notification.isRead) {
      return notification;
    }

    const updated = await this.prismaService.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Send unread count update via WebSocket
    if (this.notificationGateway) {
      try {
        const unreadCount = await this.getUnreadCount(userId);
        this.notificationGateway.sendUnreadCountUpdate(userId, unreadCount);
      } catch (error) {
        this.logger.error('Failed to send unread count update', error);
      }
    }

    return updated;
  }

  /**
   * Đánh dấu tất cả notifications là đã đọc
   */
  async markAllAsRead(userId: string) {
    const result = await this.prismaService.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Send unread count update via WebSocket
    if (this.notificationGateway) {
      try {
        this.notificationGateway.sendUnreadCountUpdate(userId, 0);
      } catch (error) {
        this.logger.error('Failed to send unread count update', error);
      }
    }

    return result;
  }

  /**
   * Đếm số notifications chưa đọc
   */
  async getUnreadCount(userId: string) {
    return this.prismaService.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
}
