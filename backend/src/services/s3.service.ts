import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ENV } from '@/config/env';
import { Readable } from 'stream';

export interface UploadFileOptions {
  key: string;
  buffer: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface FileInfo {
  key: string;
  url: string;
  size?: number;
  contentType?: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    if (
      !ENV.aws.accessKeyId ||
      !ENV.aws.secretAccessKey ||
      !ENV.aws.s3BucketName
    ) {
      this.logger.warn(
        'AWS S3 credentials chưa được cấu hình. Các chức năng upload file sẽ không hoạt động.',
      );
    }

    this.bucketName = ENV.aws.s3BucketName || '';

    this.s3Client = new S3Client({
      region: ENV.aws.region,
      credentials:
        ENV.aws.accessKeyId && ENV.aws.secretAccessKey
          ? {
              accessKeyId: ENV.aws.accessKeyId,
              secretAccessKey: ENV.aws.secretAccessKey,
            }
          : undefined,
    });
  }

  /**
   * Upload file lên S3
   */
  async uploadFile(options: UploadFileOptions): Promise<FileInfo> {
    const { key, buffer, contentType, metadata } = options;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
        Metadata: metadata,
      });

      await this.s3Client.send(command);

      const url = this.getFileUrl(key);

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        key,
        url,
        size: buffer.length,
        contentType: contentType || 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error(`Error uploading file ${key}:`, error);
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Không thể upload file: ${message}`);
    }
  }

  /**
   * Xóa file khỏi S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file ${key}:`, error);
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Không thể xóa file: ${message}`);
    }
  }

  /**
   * Lấy thông tin file
   */
  async getFileInfo(key: string): Promise<FileInfo | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        key,
        url: this.getFileUrl(key),
        size: response.ContentLength,
        contentType: response.ContentType,
      };
    } catch (error) {
      this.logger.error(`Error getting file info ${key}:`, error);
      return null;
    }
  }

  /**
   * Tải file từ S3 (trả về stream)
   */
  async downloadFile(key: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error('File không tồn tại hoặc không thể truy cập');
      }

      return response.Body as Readable;
    } catch (error) {
      this.logger.error(`Error downloading file ${key}:`, error);
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Không thể tải file: ${message}`);
    }
  }

  /**
   * Tạo signed URL để truy cập file (cho private files)
   * @param key - File key
   * @param expiresIn - Thời gian hết hạn (giây), mặc định 1 giờ
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Error generating signed URL for ${key}:`, error);
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Không thể tạo signed URL: ${message}`);
    }
  }

  /**
   * Tạo public URL cho file
   */
  private getFileUrl(key: string): string {
    if (ENV.aws.s3BaseUrl) {
      // Nếu có custom base URL (CloudFront, custom domain)
      return `${ENV.aws.s3BaseUrl}/${key}`;
    }

    // Sử dụng S3 public URL
    return `https://${this.bucketName}.s3.${ENV.aws.region}.amazonaws.com/${key}`;
  }

  /**
   * Kiểm tra xem file có tồn tại không
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const info = await this.getFileInfo(key);
      return info !== null;
    } catch {
      return false;
    }
  }

  /**
   * Lấy danh sách files trong folder prefix
   */
  async listFiles(prefix: string, maxKeys: number = 100): Promise<FileInfo[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.s3Client.send(command);

      if (!response.Contents || response.Contents.length === 0) {
        return [];
      }

      return response.Contents.map(item => ({
        key: item.Key || '',
        url: this.getFileUrl(item.Key || ''),
        size: item.Size,
        contentType: undefined,
      }));
    } catch (error) {
      this.logger.error(`Error listing files with prefix ${prefix}:`, error);
      return [];
    }
  }
}
