import { Injectable } from '@nestjs/common';
import { AuditAction, AuditTargetType, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { LoggerService, LOG_CATEGORY } from '@/modules/logger/logger.service';

interface AuditLogParams {
  actorId?: string | null;
  action: AuditAction;
  targetId?: string | null;
  targetType: AuditTargetType;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly loggerService: LoggerService,
  ) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.prismaService.auditLog.create({
        data: {
          actorId: params.actorId ?? null,
          action: params.action,
          targetId: params.targetId ?? null,
          targetType: params.targetType,
          metadata: params.metadata as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      void this.loggerService.warn(
        'Failed to write audit log',
        { error, metadata: params.metadata },
        { category: LOG_CATEGORY.AUTH },
      );
    }
  }
}
