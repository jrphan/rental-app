import {
  Injectable,
  OnModuleInit,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Ensure DATABASE_URL has proper connection pool parameters for Supabase
 * This helps prevent connection pool exhaustion
 */
function ensureConnectionPoolParams(url: string): string {
  if (!url) return url;

  try {
    const urlObj = new URL(url);

    // Add connection pool parameters if not present
    const params = new URLSearchParams(urlObj.search);

    // For Supabase pooler (port 6543), ensure pgbouncer=true
    // This is required for Supabase connection pooler to work correctly
    if (urlObj.port === '6543' && !params.has('pgbouncer')) {
      params.set('pgbouncer', 'true');
    }

    // Set connect timeout to prevent hanging connections
    // For free tier, use shorter timeout to fail fast
    if (!params.has('connect_timeout')) {
      params.set('connect_timeout', '10');
    }

    // For Supabase free tier, we want to use connection pooling efficiently
    // The pooler handles connection limits, so we just need to ensure proper config
    // Note: Prisma manages its own connection pool internally

    urlObj.search = params.toString();
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private lastConnectionCheck: number = 0;
  private readonly CONNECTION_CHECK_CACHE_TTL = 3000; // Cache connection check for 3 seconds

  constructor() {
    const databaseUrl = ensureConnectionPoolParams(
      process.env.DATABASE_URL || '',
    );

    super({
      log:
        process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }

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
    const now = Date.now();

    // If we recently checked and failed, don't check again immediately
    // This prevents hammering the database when it's down
    if (
      !this.isConnected &&
      now - this.lastConnectionCheck < this.CONNECTION_CHECK_CACHE_TTL
    ) {
      return false;
    }

    this.lastConnectionCheck = now;

    try {
      // Use a timeout to prevent hanging
      const queryPromise = this.$queryRaw`SELECT 1`;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection check timeout')), 5000);
      });

      await Promise.race([queryPromise, timeoutPromise]);
      this.updateConnectionStatus(true);
      return true;
    } catch (error: unknown) {
      this.logError('Database connection check failed', error);
      this.updateConnectionStatus(false);
      return false;
    }
  }

  private async safeConnect(): Promise<void> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.updateConnectionStatus(true);
        this.logger.log('Database connected successfully');
        return;
      } catch (error: unknown) {
        this.updateConnectionStatus(false);

        if (attempt === maxRetries) {
          this.logError('Failed to connect to database after retries', error);
          this.logger.warn(
            'Application will continue to run but database operations will fail',
          );
          return;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt - 1);
        this.logger.warn(
          `Database connection attempt ${attempt} failed, retrying in ${delay}ms...`,
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
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
