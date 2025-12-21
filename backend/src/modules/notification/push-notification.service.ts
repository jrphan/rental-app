import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly expo: Expo;

  constructor(private readonly prismaService: PrismaService) {
    this.expo = new Expo();
  }

  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
    deviceId?: string,
  ) {
    try {
      await this.prismaService.deviceToken.upsert({
        where: { token },
        update: {
          userId,
          platform,
          deviceId,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          userId,
          token,
          platform,
          deviceId,
          isActive: true,
        },
      });
      this.logger.log(`Device token registered for user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to register device token', error);
      throw error;
    }
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    try {
      // Get all active device tokens for user
      const deviceTokens = await this.prismaService.deviceToken.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      if (deviceTokens.length === 0) {
        this.logger.log(`No device tokens found for user ${userId}`);
        return;
      }

      // Prepare messages
      const messages: ExpoPushMessage[] = deviceTokens.map(dt => ({
        to: dt.token,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
      }));

      // Send in chunks (Expo allows max 100 messages per batch)
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          this.logger.error('Error sending push notification chunk', error);
        }
      }

      // Check for errors in tickets
      tickets.forEach((ticket, index) => {
        if (ticket.status === 'error') {
          this.logger.error(
            `Push notification error for token ${deviceTokens[index].token}:`,
            ticket.message,
          );

          // If token is invalid, deactivate it
          if (ticket.details?.error === 'DeviceNotRegistered') {
            this.prismaService.deviceToken
              .update({
                where: { token: deviceTokens[index].token },
                data: { isActive: false },
              })
              .catch(err =>
                this.logger.error('Failed to deactivate invalid token', err),
              );
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to send push notification', error);
      // Don't throw error, just log it to avoid breaking the main flow
    }
  }
}
