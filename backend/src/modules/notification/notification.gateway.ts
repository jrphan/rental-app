import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ENV } from '@/config/env';

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
    origin: '*', // In production, specify allowed origins
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth or query
      const authToken = client.handshake.auth?.token as string | undefined;
      const queryToken = client.handshake.query?.token as string | undefined;
      const token = authToken || queryToken;

      if (!token || typeof token !== 'string') {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token with secret
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: ENV.jwtSecret,
      });
      const userId = payload.sub;

      if (!userId || typeof userId !== 'string') {
        this.logger.warn(`Client ${client.id} has invalid token payload`);
        client.disconnect();
        return;
      }

      // Store user connection
      client.userId = userId;
      this.connectedUsers.set(userId, client.id);

      // Join user's personal room
      await client.join(`user:${userId}`);

      this.logger.log(`User ${userId} connected with socket ${client.id}`);
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
      this.logger.log(`User ${client.userId} disconnected`);
    }
  }

  /**
   * Send notification to specific user
   */
  sendNotificationToUser(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit('notification', notification);
    this.logger.log(`Sent notification to user ${userId}`);
  }

  /**
   * Send unread count update to user
   */
  sendUnreadCountUpdate(userId: string, count: number) {
    this.server.to(`user:${userId}`).emit('unread_count', { count });
    this.logger.log(`Sent unread count ${count} to user ${userId}`);
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get all connected user IDs
   */
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}
