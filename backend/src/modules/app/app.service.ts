import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private healthCheckCache: {
    result: any;
    timestamp: number;
  } | null = null;
  private readonly CACHE_TTL = 5000; // Cache health check for 5 seconds

  constructor(private readonly prismaService: PrismaService) {}

  async getHealth() {
    const now = Date.now();

    // Return cached result if still valid
    if (
      this.healthCheckCache &&
      now - this.healthCheckCache.timestamp < this.CACHE_TTL
    ) {
      return {
        ...this.healthCheckCache.result,
        cached: true,
      };
    }

    // Check connection status without querying database if already disconnected
    const dbStatus = this.prismaService.getConnectionStatus();
    
    // Only query database if we think we're connected (avoid unnecessary queries)
    let isDbHealthy = false;
    if (dbStatus) {
      try {
        isDbHealthy = await this.prismaService.checkConnection();
      } catch (error) {
        isDbHealthy = false;
      }
    }

    const result = {
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

    // Cache the result
    this.healthCheckCache = {
      result,
      timestamp: now,
    };

    return result;
  }
}
