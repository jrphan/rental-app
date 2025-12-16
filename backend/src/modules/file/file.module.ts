import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { JwtModule } from '@nestjs/jwt';
import { memoryStorage } from 'multer';

import { FileController } from './file.controller';
import { FileService } from './file.service';
import { S3Service } from '@/services/s3.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule,
    // Use in-memory storage so uploaded files are available as buffers for S3
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [FileController],
  providers: [FileService, S3Service, AuthGuard],
  exports: [FileService],
})
export class FileModule {}
