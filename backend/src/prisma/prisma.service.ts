import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.isConnected = false;
      this.logger.error(
        'Failed to connect to database:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      this.logger.warn(
        'Application will continue to run but database operations will fail',
      );
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
      this.logger.log('Database disconnected');
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      this.isConnected = true;
      return true;
    } catch (error) {
      this.isConnected = false;
      this.logger.error(
        'Database connection check failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return false;
    }
  }
}
