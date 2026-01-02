import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Đảm bảo PrismaService là singleton toàn cục
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
