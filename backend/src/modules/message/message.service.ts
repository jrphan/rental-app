import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { MessageType, Prisma, NotificationType } from '@prisma/client';
import { createPaginatedResponse } from '@/common/utils/response.util';
import { NotificationService } from '@/modules/notification/notification.service';

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
  ) {}

  async sendMessage(
    senderId: string,
    data: {
      receiverId: string;
      rentalId?: string;
      content: string;
      type?: MessageType;
    },
  ) {
    // Prevent sending message to yourself
    if (senderId === data.receiverId) {
      throw new BadRequestException('Không thể gửi tin nhắn cho chính mình');
    }

    // Verify receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: data.receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Không tìm thấy người nhận');
    }

    // If rentalId is provided, verify it exists and user has access
    if (data.rentalId) {
      const rental = await this.prisma.rental.findFirst({
        where: {
          id: data.rentalId,
          OR: [{ renterId: senderId }, { ownerId: senderId }],
        },
      });

      if (!rental) {
        throw new NotFoundException(
          'Không tìm thấy đơn thuê hoặc bạn không có quyền truy cập',
        );
      }
    }

    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId: data.receiverId,
        rentalId: data.rentalId,
        content: data.content,
        type: data.type || MessageType.TEXT,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Create notification for receiver
    const senderName =
      message.sender.profile?.firstName || message.sender.email || 'Người dùng';
    await this.notificationService.create(data.receiverId, {
      type: NotificationType.MESSAGE_RECEIVED,
      title: 'Tin nhắn mới',
      message: `Bạn có tin nhắn mới từ ${senderName}`,
      data: {
        messageId: message.id,
        senderId: senderId,
        rentalId: data.rentalId,
      },
    });

    return message;
  }

  async getConversations(userId: string, page = 1, limit = 20) {
    // Get all unique conversations (people user has messaged or received messages from)
    const sentMessages = await this.prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    });

    const receivedMessages = await this.prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    });

    const conversationUserIds = new Set<string>();
    sentMessages.forEach(m => conversationUserIds.add(m.receiverId));
    receivedMessages.forEach(m => conversationUserIds.add(m.senderId));

    // Get last message for each conversation
    const conversations = await Promise.all(
      Array.from(conversationUserIds).map(async otherUserId => {
        const lastMessage = await this.prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
            receiver: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        });

        const unreadCount = await this.prisma.message.count({
          where: {
            senderId: otherUserId,
            receiverId: userId,
            isRead: false,
          },
        });

        const otherUser =
          lastMessage && otherUserId === lastMessage.senderId
            ? lastMessage.sender
            : lastMessage?.receiver || null;

        return {
          userId: otherUserId,
          user: otherUser,
          lastMessage,
          unreadCount,
        };
      }),
    );

    // Sort by last message time
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || new Date(0);
      const bTime = b.lastMessage?.createdAt || new Date(0);
      return bTime.getTime() - aTime.getTime();
    });

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedConversations = conversations.slice(skip, skip + limit);

    return createPaginatedResponse(
      paginatedConversations,
      { page, limit, total: conversations.length },
      'Lấy danh sách cuộc trò chuyện thành công',
      '/api/messages/conversations',
    );
  }

  async getMessages(userId: string, otherUserId: string, page = 1, limit = 50) {
    const where: Prisma.MessageWhereInput = {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    };

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          receiver: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    // Mark messages as read
    await this.prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return createPaginatedResponse(
      items.reverse(), // Reverse to show oldest first
      { page, limit, total },
      'Lấy danh sách tin nhắn thành công',
      '/api/messages',
    );
  }

  async markAsRead(userId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        receiverId: userId,
      },
    });

    if (!message) {
      throw new NotFoundException('Không tìm thấy tin nhắn');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.message.count({
      where: { receiverId: userId, isRead: false },
    });
  }
}
