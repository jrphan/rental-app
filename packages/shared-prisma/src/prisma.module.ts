import { DynamicModule, Global, Module } from '@nestjs/common';
import { PrismaService, PrismaServiceConfig } from './prisma.service';

export interface PrismaModuleOptions {
  databaseUrl: string;
  logLevel?: ('query' | 'info' | 'warn' | 'error')[];
  clientPath?: string; // Path to specific Prisma client
  isGlobal?: boolean;
}

@Global()
@Module({})
export class PrismaModule {
  static forRoot(options: PrismaModuleOptions): DynamicModule {
    const config: PrismaServiceConfig = {
      databaseUrl: options.databaseUrl,
      logLevel: options.logLevel,
      clientPath: options.clientPath,
    };

    return {
      module: PrismaModule,
      providers: [
        {
          provide: PrismaService,
          useFactory: () => new PrismaService(config),
        },
      ],
      exports: [PrismaService],
      global: options.isGlobal !== false, // Default to global
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<PrismaModuleOptions> | PrismaModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: PrismaModule,
      providers: [
        {
          provide: PrismaService,
          useFactory: async (...args: any[]) => {
            const config = await options.useFactory(...args);
            return new PrismaService({
              databaseUrl: config.databaseUrl,
              logLevel: config.logLevel,
              clientPath: config.clientPath,
            });
          },
          inject: options.inject || [],
        },
      ],
      exports: [PrismaService],
      global: true,
    };
  }
}
