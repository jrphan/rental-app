import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { S3Service, type FileInfo } from '@/services/s3.service';
import { type UserFileResponse, selectUserFile } from '@/types/file.type';

@Injectable()
export class FileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async uploadUserFile(
    userId: string,
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UserFileResponse> {
    const keyPrefix = folder ? `users/${userId}/${folder}` : `users/${userId}`;
    const key = `${keyPrefix}/${Date.now()}-${file.originalname}`;

    const info: FileInfo = await this.s3Service.uploadFile({
      key,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    const created = await this.prisma.userFile.create({
      data: {
        userId,
        key: info.key,
        url: info.url,
        size: info.size ?? null,
        contentType: info.contentType ?? null,
        folder: folder ?? null,
      },
      select: selectUserFile,
    });

    return created;
  }

  async uploadMultipleUserFiles(
    userId: string,
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<UserFileResponse[]> {
    const uploads = files.map(file =>
      this.uploadUserFile(userId, file, folder),
    );
    return Promise.all(uploads);
  }

  async listMyFiles(
    userId: string,
    folder?: string,
  ): Promise<UserFileResponse[]> {
    const files = await this.prisma.userFile.findMany({
      where: {
        userId,
        ...(folder ? { folder } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: selectUserFile,
    });

    return files as UserFileResponse[];
  }

  async deleteMyFile(userId: string, id: string): Promise<void> {
    const file = await this.prisma.userFile.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        key: true,
      },
    });

    if (!file || file.userId !== userId) {
      throw new NotFoundException('File không tồn tại');
    }

    await this.s3Service.deleteFile(file.key);

    await this.prisma.userFile.delete({
      where: { id },
    });
  }
}
