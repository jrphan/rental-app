import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHealth() {
    const dbStatus = this.prismaService.getConnectionStatus();
    const isDbHealthy = await this.prismaService.checkConnection();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbStatus,
        healthy: isDbHealthy,
        message:
          dbStatus && isDbHealthy
            ? 'Database is connected and healthy'
            : 'Database is not available',
      },
    };
  }
}
