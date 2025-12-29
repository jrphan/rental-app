import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ENV } from '@/config/env';
import { ChatService } from './chat.service';
import { SendMessageDto } from '@/common/dto/Chat/send-message.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface JwtPayload {
  sub: string;
  phone?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedUsers = new Map<string, string>(); // userId -> socketId
  private readonly userChats = new Map<string, Set<string>>(); // userId -> Set<chatId>

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      const authToken = client.handshake.auth?.token as string | undefined;
      const queryToken = client.handshake.query?.token as string | undefined;
      const token = authToken || queryToken;

      if (!token || typeof token !== 'string') {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: ENV.jwtSecret,
      });
      const userId = payload.sub;

      if (!userId || typeof userId !== 'string') {
        this.logger.warn(`Client ${client.id} has invalid token payload`);
        client.disconnect();
        return;
      }

      client.userId = userId;
      this.connectedUsers.set(userId, client.id);

      // Join user's personal room
      await client.join(`user:${userId}`);

      this.logger.log(
        `User ${userId} connected to chat gateway with socket ${client.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Connection error for client ${client.id}:`,
        error instanceof Error ? error.message : String(error),
      );
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.userChats.delete(client.userId);
      this.logger.log(`User ${client.userId} disconnected from chat gateway`);
    }
  }

  /**
   * Join chat room
   */
  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      // Verify user has access to this chat (chỉ check quyền, không cần full data)
      const hasAccess = await this.chatService.verifyChatAccess(
        data.chatId,
        client.userId,
      );

      if (!hasAccess) {
        return { error: 'Unauthorized' };
      }

      // Join chat room
      await client.join(`chat:${data.chatId}`);

      // Track user's chats
      if (!this.userChats.has(client.userId)) {
        this.userChats.set(client.userId, new Set());
      }
      this.userChats.get(client.userId)!.add(data.chatId);

      this.logger.log(`User ${client.userId} joined chat ${data.chatId}`);
      return { success: true, chatId: data.chatId };
    } catch (error) {
      this.logger.error(`Failed to join chat ${data.chatId}`, error);
      return { error: 'Failed to join chat' };
    }
  }

  /**
   * Leave chat room
   */
  @SubscribeMessage('leave_chat')
  async handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    await client.leave(`chat:${data.chatId}`);
    this.userChats.get(client.userId)?.delete(data.chatId);

    this.logger.log(`User ${client.userId} left chat ${data.chatId}`);
    return { success: true, chatId: data.chatId };
  }

  /**
   * Send message via WebSocket
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; content: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      const dto: SendMessageDto = { content: data.content };
      const result = await this.chatService.sendMessage(
        data.chatId,
        client.userId,
        dto,
      );

      // Extract message và metadata (renterId, ownerId)
      const { _metadata, ...message } = result as typeof result & {
        _metadata?: { renterId: string; ownerId: string };
      };

      // Emit to all users in the chat room
      this.server.to(`chat:${data.chatId}`).emit('new_message', message);

      // Also notify the other user if they're not in the chat room
      // Sử dụng metadata từ sendMessage thay vì query lại
      if (_metadata) {
        const otherUserId =
          _metadata.renterId === client.userId
            ? _metadata.ownerId
            : _metadata.renterId;

        // Send to user's personal room for notification
        this.server.to(`user:${otherUserId}`).emit('chat_message', {
          chatId: data.chatId,
          message,
        });
      }

      return { success: true, message };
    } catch (error) {
      this.logger.error(`Failed to send message`, error);
      return { error: 'Failed to send message' };
    }
  }

  /**
   * Mark messages as read
   */
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      await this.chatService.markMessagesAsRead(data.chatId, client.userId);

      // Notify other user that messages were read
      this.server.to(`chat:${data.chatId}`).emit('messages_read', {
        chatId: data.chatId,
        userId: client.userId,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to mark messages as read`, error);
      return { error: 'Failed to mark messages as read' };
    }
  }

  /**
   * Send message to chat room (used by service)
   */
  sendMessageToChat(chatId: string, message: unknown) {
    this.server.to(`chat:${chatId}`).emit('new_message', message);
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
