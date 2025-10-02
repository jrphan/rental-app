import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

export interface PrismaServiceConfig {
  databaseUrl: string;
  logLevel?: ('query' | 'info' | 'warn' | 'error')[];
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: any;
  private config: PrismaServiceConfig;

  constructor(config: PrismaServiceConfig) {
    this.config = config;
  }

  async onModuleInit() {
    try {
      // Dynamic import to avoid bundling issues
      const { PrismaClient } = await import('@prisma/client');
      
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: this.config.databaseUrl,
          },
        },
        log: this.config.logLevel || ['query', 'info', 'warn', 'error'],
      });
      
      await this.prisma.$connect();
    } catch (error) {
      console.error('Prisma client not generated. Run: npx prisma generate');
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }

  // Generic method to access any Prisma model
  get client() {
    return this.prisma;
  }

  // Transaction support
  async $transaction<T>(fn: (prisma: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  // Raw query support
  async $queryRaw<T = any>(query: string, ...params: any[]): Promise<T> {
    return this.prisma.$queryRaw(query, ...params);
  }
}
