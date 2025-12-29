import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SendMessageDto } from '@/common/dto/Chat/send-message.dto';
import { NotificationService } from '@/modules/notification/notification.service';
import { PushNotificationService } from '@/modules/notification/push-notification.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService?: NotificationService,
    @Inject(forwardRef(() => PushNotificationService))
    private readonly pushNotificationService?: PushNotificationService,
  ) {}

  /**
   * Tạo chat mới khi có rental mới
   */
  async createChatForRental(
    rentalId: string,
    renterId: string,
    ownerId: string,
  ) {
    try {
      // Kiểm tra xem đã có chat chưa
      const existingChat = await this.prismaService.chat.findUnique({
        where: { rentalId },
      });

      if (existingChat) {
        return existingChat;
      }

      // Tạo chat mới
      const chat = await this.prismaService.chat.create({
        data: {
          rentalId,
          renterId,
          ownerId,
        },
        include: {
          renter: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
            },
          },
          owner: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
            },
          },
          rental: {
            select: {
              id: true,
              vehicle: {
                select: {
                  id: true,
                  brand: true,
                  model: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

      this.logger.log(`Created chat ${chat.id} for rental ${rentalId}`);
      return chat;
    } catch (error) {
      this.logger.error(`Failed to create chat for rental ${rentalId}`, error);
      throw error;
    }
  }

  /**
   * Lấy danh sách chats của user
   */
  async getMyChats(userId: string) {
    const chats = await this.prismaService.chat.findMany({
      where: {
        OR: [{ renterId: userId }, { ownerId: userId }],
      },
      include: {
        renter: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
        rental: {
          select: {
            id: true,
            status: true,
            vehicle: {
              select: {
                id: true,
                brand: true,
                model: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: userId }, // Chỉ đếm tin nhắn chưa đọc từ người khác
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return chats.map(chat => {
      const lastMessage = chat.messages[0];
      return {
        id: chat.id,
        rentalId: chat.rentalId,
        otherUser: chat.renterId === userId ? chat.owner : chat.renter,
        vehicle: {
          id: chat.rental.vehicle.id,
          brand: chat.rental.vehicle.brand,
          model: chat.rental.vehicle.model,
          images: chat.rental.vehicle.images.map(img => ({
            id: img.id,
            url: img.url,
            isPrimary: img.isPrimary,
          })),
        },
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              chatId: chat.id,
              senderId: lastMessage.senderId,
              content: lastMessage.content,
              isRead: false, // Will be updated by frontend if needed
              readAt: null,
              createdAt: lastMessage.createdAt.toISOString(),
              updatedAt: lastMessage.createdAt.toISOString(),
              sender:
                chat.renterId === lastMessage.senderId
                  ? chat.renter
                  : chat.owner,
            }
          : null,
        unreadCount: chat._count.messages,
        updatedAt: chat.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Kiểm tra user có quyền truy cập chat không
   */
  async verifyChatAccess(chatId: string, userId: string): Promise<boolean> {
    const chat = await this.prismaService.chat.findUnique({
      where: { id: chatId },
      select: { renterId: true, ownerId: true },
    });

    if (!chat) {
      return false;
    }

    return chat.renterId === userId || chat.ownerId === userId;
  }

  /**
   * Lấy chi tiết chat và messages
   */
  async getChatById(chatId: string, userId: string) {
    const chat = await this.prismaService.chat.findUnique({
      where: { id: chatId },
      include: {
        renter: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
        rental: {
          select: {
            id: true,
            status: true,
            vehicle: {
              select: {
                id: true,
                brand: true,
                model: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: {
                    id: true,
                    url: true,
                    isPrimary: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: userId },
              },
            },
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    // Kiểm tra quyền truy cập
    if (chat.renterId !== userId && chat.ownerId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập cuộc hội thoại này',
      );
    }

    // Transform to match ChatDetail interface
    return {
      id: chat.id,
      rentalId: chat.rentalId,
      renterId: chat.renterId,
      ownerId: chat.ownerId,
      renter: chat.renter,
      owner: chat.owner,
      otherUser: chat.renterId === userId ? chat.owner : chat.renter,
      vehicle: {
        id: chat.rental.vehicle.id,
        brand: chat.rental.vehicle.brand,
        model: chat.rental.vehicle.model,
        images: chat.rental.vehicle.images.map(img => ({
          id: img.id,
          url: img.url,
          isPrimary: img.isPrimary,
        })),
      },
      rental: {
        id: chat.rental.id,
        status: chat.rental.status,
        vehicle: {
          id: chat.rental.vehicle.id,
          brand: chat.rental.vehicle.brand,
          model: chat.rental.vehicle.model,
          images: chat.rental.vehicle.images.map(img => ({
            id: img.id,
            url: img.url,
            isPrimary: img.isPrimary,
          })),
        },
      },
      lastMessage: chat.messages[0]
        ? {
            id: chat.messages[0].id,
            chatId: chat.id,
            senderId: chat.messages[0].senderId,
            content: chat.messages[0].content,
            isRead: false,
            readAt: null,
            createdAt: chat.messages[0].createdAt.toISOString(),
            updatedAt: chat.messages[0].createdAt.toISOString(),
            sender:
              chat.renterId === chat.messages[0].senderId
                ? chat.renter
                : chat.owner,
          }
        : null,
      unreadCount: chat._count.messages,
      updatedAt: chat.updatedAt.toISOString(),
    };
  }

  /**
   * Lấy messages của chat
   */
  async getChatMessages(
    chatId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    // Verify access
    await this.getChatById(chatId, userId);

    const skip = (page - 1) * limit;

    const messages = await this.prismaService.message.findMany({
      where: { chatId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });

    // Transform messages to match frontend interface
    return messages.reverse().map(msg => ({
      id: msg.id,
      chatId: msg.chatId,
      senderId: msg.senderId,
      content: msg.content,
      isRead: msg.isRead,
      readAt: msg.readAt?.toISOString() || null,
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
      sender: {
        id: msg.sender.id,
        fullName: msg.sender.fullName,
        avatar: msg.sender.avatar,
      },
    }));
  }

  /**
   * Gửi tin nhắn
   */
  async sendMessage(chatId: string, senderId: string, dto: SendMessageDto) {
    // Kiểm tra quyền truy cập và lấy chat info (chỉ lấy IDs để tránh query phức tạp)
    const chat = await this.prismaService.chat.findUnique({
      where: { id: chatId },
      select: {
        renterId: true,
        ownerId: true,
        rentalId: true,
      },
    });

    if (!chat) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    // Kiểm tra quyền truy cập
    if (chat.renterId !== senderId && chat.ownerId !== senderId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập cuộc hội thoại này',
      );
    }

    // Tạo message và lấy sender info trong 1 query
    const message = await this.prismaService.message.create({
      data: {
        chatId,
        senderId,
        content: dto.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    // Transform message to match frontend interface
    const transformedMessage = {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      content: message.content,
      isRead: message.isRead,
      readAt: message.readAt?.toISOString() || null,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      sender: {
        id: message.sender.id,
        fullName: message.sender.fullName,
        avatar: message.sender.avatar,
      },
    };

    // Cập nhật updatedAt của chat (không cần await, có thể chạy async)
    this.prismaService.chat
      .update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      })
      .catch(error => {
        this.logger.error('Failed to update chat updatedAt', error);
      });

    // Gửi push notification cho người nhận (async, không block)
    const receiverId =
      chat.renterId === senderId ? chat.ownerId : chat.renterId;

    if (this.pushNotificationService) {
      this.pushNotificationService
        .sendPushNotification(
          receiverId,
          message.sender.fullName || 'Người dùng',
          dto.content.length > 100
            ? dto.content.substring(0, 100) + '...'
            : dto.content,
          {
            type: 'CHAT_MESSAGE',
            chatId,
            messageId: message.id,
            rentalId: chat.rentalId,
          },
        )
        .catch((error: any) => {
          this.logger.error(
            'Failed to send push notification for message',
            error,
          );
        });
    }

    // Return message với thông tin chat IDs để gateway sử dụng
    return {
      ...transformedMessage,
      _metadata: {
        renterId: chat.renterId,
        ownerId: chat.ownerId,
      },
    };
  }

  /**
   * Đánh dấu tin nhắn là đã đọc
   */
  async markMessagesAsRead(chatId: string, userId: string) {
    await this.prismaService.message.updateMany({
      where: {
        chatId,
        senderId: { not: userId }, // Chỉ đánh dấu tin nhắn từ người khác
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Lấy số tin nhắn chưa đọc của user
   */
  async getUnreadMessageCount(userId: string) {
    const chats = await this.prismaService.chat.findMany({
      where: {
        OR: [{ renterId: userId }, { ownerId: userId }],
      },
      include: {
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: userId },
              },
            },
          },
        },
      },
    });

    const count = chats.reduce(
      (total, chat) => total + chat._count.messages,
      0,
    );
    return { count };
  }
}
