import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { S3Service } from '@/services/s3.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

@Injectable()
export class FileService {
  constructor(private readonly s3Service: S3Service) {}

  /**
   * Upload file với auto-generate key
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    folder?: string,
    customFileName?: string,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('File không được để trống');
    }

    // Tạo key cho file với userId prefix
    const originalName: string = String(file.originalname || 'file');
    const fileExtension = path.extname(originalName);
    const uuid = uuidv4();
    const fileName = customFileName || `${uuid}${fileExtension}`;
    // Lưu theo cấu trúc: users/{userId}/{folder}/{fileName}
    const userFolder = `users/${userId}`;
    const key = folder
      ? `${userFolder}/${folder}/${fileName}`
      : `${userFolder}/${fileName}`;

    // Upload lên S3
    const result = await this.s3Service.uploadFile({
      key,
      buffer: file.buffer,
      contentType: file.mimetype,
      metadata: {
        originalName: originalName,
        uploadedAt: new Date().toISOString(),
      },
    });

    return {
      key: result.key,
      url: result.url,
      size: result.size || file.buffer.length,
      contentType: result.contentType || file.mimetype,
    };
  }

  /**
   * Upload nhiều files
   */
  async uploadFiles(
    files: Express.Multer.File[],
    userId: string,
    folder?: string,
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files không được để trống');
    }

    const uploadPromises = files.map(file =>
      this.uploadFile(file, userId, folder),
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Lấy danh sách files của user (gallery)
   */
  async getUserGallery(
    userId: string,
    folder?: string,
  ): Promise<UploadResult[]> {
    const prefix = folder ? `users/${userId}/${folder}/` : `users/${userId}/`;
    const files = await this.s3Service.listFiles(prefix);

    // Lấy thông tin chi tiết cho từng file (contentType)
    const filesWithDetails = await Promise.all(
      files.map(async file => {
        const info = await this.s3Service.getFileInfo(file.key);
        return {
          key: file.key,
          url: file.url,
          size: file.size || 0,
          contentType: info?.contentType || 'application/octet-stream',
        };
      }),
    );

    return filesWithDetails;
  }

  /**
   * Xóa file
   */
  async deleteFile(key: string): Promise<void> {
    const exists = await this.s3Service.fileExists(key);
    if (!exists) {
      throw new NotFoundException(`File không tồn tại: ${key}`);
    }

    await this.s3Service.deleteFile(key);
  }

  /**
   * Lấy thông tin file
   */
  async getFileInfo(key: string) {
    const info = await this.s3Service.getFileInfo(key);
    if (!info) {
      throw new NotFoundException(`File không tồn tại: ${key}`);
    }
    return info;
  }

  /**
   * Tạo signed URL để truy cập file
   */
  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    const exists = await this.s3Service.fileExists(key);
    if (!exists) {
      throw new NotFoundException(`File không tồn tại: ${key}`);
    }

    return this.s3Service.getSignedUrl(key, expiresIn);
  }

  /**
   * Download file
   */
  async downloadFile(key: string) {
    const exists = await this.s3Service.fileExists(key);
    if (!exists) {
      throw new NotFoundException(`File không tồn tại: ${key}`);
    }

    return this.s3Service.downloadFile(key);
  }
}
