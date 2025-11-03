import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { S3Service } from '@/services/s3.service';

@Module({
  controllers: [FileController],
  providers: [FileService, S3Service],
  exports: [FileService, S3Service],
})
export class FileModule {}
