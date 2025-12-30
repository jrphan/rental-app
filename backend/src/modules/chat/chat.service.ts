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
   * Nếu đã có chat giữa owner-renter này, dùng lại chat đó
   */
  async createChatForRental(
    rentalId: string,
    renterId: string,
    ownerId: string,
  ) {
    try {
      // Kiểm tra xem đã có chat giữa owner-renter này chưa (không quan tâm rentalId)
      const existingChat = await this.prismaService.chat.findFirst({
        where: {
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
        orderBy: {
          updatedAt: 'desc', // Lấy chat mới nhất
        },
      });

      if (existingChat) {
        // Đã có chat giữa owner-renter này, dùng lại chat đó
        // Không cập nhật rentalId vì có unique constraint
        // Chat sẽ được group lại trong getMyChats
        this.logger.log(
          `Reusing existing chat ${existingChat.id} for rental ${rentalId} (owner-renter pair)`,
        );
        return existingChat;
      }

      // Tạo chat mới nếu chưa có
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
   * Group các chat giữa cùng owner-renter pair thành 1 chat
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

    // Group chats theo owner-renter pair
    // Key: "ownerId-renterId" (sắp xếp để đảm bảo thứ tự không quan trọng)
    const chatGroups = new Map<
      string,
      {
        chats: typeof chats;
        totalUnread: number;
        latestMessage: (typeof chats)[0]['messages'][0] | null;
        latestChat: (typeof chats)[0];
      }
    >();

    for (const chat of chats) {
      // Tạo key từ ownerId và renterId (sắp xếp để đảm bảo thứ tự không quan trọng)
      const key = [chat.ownerId, chat.renterId].sort().join('-');

      const group = chatGroups.get(key);

      if (!group) {
        // Chưa có group cho pair này, tạo mới
        chatGroups.set(key, {
          chats: [chat],
          totalUnread: chat._count.messages,
          latestMessage: chat.messages[0] || null,
          latestChat: chat,
        });
      } else {
        // Đã có group, thêm chat vào và cập nhật thông tin
        group.chats.push(chat);
        group.totalUnread += chat._count.messages;

        // So sánh để tìm tin nhắn mới nhất
        const currentLastMessage = chat.messages[0];
        const existingLastMessage = group.latestMessage;

        if (currentLastMessage) {
          if (
            !existingLastMessage ||
            currentLastMessage.createdAt > existingLastMessage.createdAt
          ) {
            group.latestMessage = currentLastMessage;
            group.latestChat = chat;
          }
        }

        // Cập nhật latestChat nếu chat này mới hơn
        if (chat.updatedAt > group.latestChat.updatedAt) {
          group.latestChat = chat;
        }
      }
    }

    // Chuyển groups thành array và transform
    return Array.from(chatGroups.values()).map(group => {
      const chat = group.latestChat;
      const lastMessage = group.latestMessage;

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
        unreadCount: group.totalUnread,
        updatedAt: chat.updatedAt.toISOString(),
      };
    });
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
    // Kiểm tra quyền truy cập
    const chat = await this.getChatById(chatId, senderId);

    // Tạo message
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

    // Cập nhật updatedAt của chat
    await this.prismaService.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Get chat again to get IDs
    const chatWithIds = await this.prismaService.chat.findUnique({
      where: { id: chatId },
      select: { renterId: true, ownerId: true },
    });

    if (!chatWithIds) {
      throw new NotFoundException('Chat not found');
    }

    // Gửi push notification cho người nhận
    const receiverId =
      chatWithIds.renterId === senderId
        ? chatWithIds.ownerId
        : chatWithIds.renterId;
    const sender = await this.prismaService.user.findUnique({
      where: { id: senderId },
      select: { fullName: true },
    });

    if (this.pushNotificationService) {
      try {
        await this.pushNotificationService.sendPushNotification(
          receiverId,
          sender?.fullName || 'Người dùng',
          dto.content.length > 100
            ? dto.content.substring(0, 100) + '...'
            : dto.content,
          {
            type: 'CHAT_MESSAGE',
            chatId,
            messageId: message.id,
            rentalId: chat.rentalId,
          },
        );
      } catch (error) {
        this.logger.error(
          'Failed to send push notification for message',
          error,
        );
      }
    }

    return transformedMessage;
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
