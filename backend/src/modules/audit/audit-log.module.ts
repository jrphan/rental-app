import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { LoggerModule } from '@/modules/logger/logger.module';
import { AuditLogService } from './audit-log.service';

@Global()
@Module({
  imports: [PrismaModule, LoggerModule],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
