import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to database...');
    await this.safeConnect();
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    await this.$disconnect();
    this.isConnected = false;
    this.logger.log('Database disconnected');
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      this.updateConnectionStatus(true);
      return true;
    } catch (error: unknown) {
      this.logError('Database connection check failed', error);
      this.updateConnectionStatus(false);
      return false;
    }
  }

  private async safeConnect(): Promise<void> {
    try {
      await this.$connect();
      this.updateConnectionStatus(true);
      this.logger.log('Database connected successfully');
    } catch (error: unknown) {
      this.updateConnectionStatus(false);
      this.logError('Failed to connect to database', error);
      this.logger.warn(
        'Application will continue to run but database operations will fail',
      );
    }
  }

  private updateConnectionStatus(isConnected: boolean): void {
    this.isConnected = isConnected;
  }

  private logError(message: string, error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    const stack = error instanceof Error ? error.stack : undefined;

    this.logger.error(`${message}: ${errorMessage}`, stack);
  }
}
