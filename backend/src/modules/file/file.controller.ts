import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Param,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FileService } from './file.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ApiResponseDto } from '@/common/dto/Response/response.dto';
import { GetUser } from '@/modules/auth/decorators/get-user.decorator';
import type { User } from '@/generated/prisma';

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload một file lên S3 (lưu theo user)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File cần upload',
        },
        folder: {
          type: 'string',
          description: 'Folder trong S3 (optional), ví dụ: images, documents',
          example: 'images',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Upload file thành công',
    type: ApiResponseDto,
  })
  @ApiResponse({ status: 400, description: 'File không hợp lệ' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File không được để trống');
    }
    if (!user || !user.id) {
      throw new BadRequestException('User không hợp lệ');
    }

    const result = await this.fileService.uploadFile(file, user.id, folder);
    return {
      success: true,
      message: 'Upload file thành công',
      data: result,
    };
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({
    summary: 'Upload nhiều files lên S3 (tối đa 10 files, lưu theo user)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Danh sách files cần upload',
        },
        folder: {
          type: 'string',
          description: 'Folder trong S3 (optional), ví dụ: images, documents',
          example: 'images',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Upload files thành công',
    type: ApiResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Files không hợp lệ' })
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser() user: User,
    @Query('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files không được để trống');
    }
    if (!user || !user.id) {
      throw new BadRequestException('User không hợp lệ');
    }

    const results = await this.fileService.uploadFiles(files, user.id, folder);
    return {
      success: true,
      message: `Upload ${results.length} file(s) thành công`,
      data: results,
    };
  }

  @Get('gallery')
  @ApiOperation({ summary: 'Lấy danh sách files của user (gallery)' })
  @ApiQuery({
    name: 'folder',
    required: false,
    description: 'Folder cụ thể (optional), ví dụ: images, documents',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách files thành công',
    type: ApiResponseDto,
  })
  async getGallery(@GetUser() user: User, @Query('folder') folder?: string) {
    const files = await this.fileService.getUserGallery(user.id, folder);
    return {
      success: true,
      message: 'Lấy danh sách files thành công',
      data: files,
    };
  }

  @Get(':key')
  @ApiOperation({ summary: 'Lấy thông tin file từ S3' })
  @ApiParam({
    name: 'key',
    description: 'Key của file trong S3',
    example: 'images/abc123.jpg',
  })
  @ApiQuery({
    name: 'signed',
    required: false,
    description: 'Lấy signed URL (cho private files)',
    type: Boolean,
  })
  @ApiQuery({
    name: 'expiresIn',
    required: false,
    description: 'Thời gian hết hạn của signed URL (giây), mặc định 3600',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin file thành công',
    type: ApiResponseDto,
  })
  @ApiResponse({ status: 404, description: 'File không tồn tại' })
  async getFileInfo(
    @Param('key') key: string,
    @Query('signed') signed?: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const info = await this.fileService.getFileInfo(key);

    // Nếu yêu cầu signed URL
    if (signed === 'true' || signed === '1') {
      const expires = expiresIn ? parseInt(expiresIn, 10) : 3600;
      const signedUrl = await this.fileService.getSignedUrl(key, expires);
      return {
        success: true,
        message: 'Lấy thông tin file thành công',
        data: {
          ...info,
          signedUrl,
        },
      };
    }

    return {
      success: true,
      message: 'Lấy thông tin file thành công',
      data: info,
    };
  }

  @Get(':key/download')
  @ApiOperation({ summary: 'Download file từ S3' })
  @ApiParam({
    name: 'key',
    description: 'Key của file trong S3',
    example: 'images/abc123.jpg',
  })
  @ApiResponse({
    status: 200,
    description: 'Download file thành công',
  })
  @ApiResponse({ status: 404, description: 'File không tồn tại' })
  async downloadFile(@Param('key') key: string, @Res() res: Response) {
    const stream = await this.fileService.downloadFile(key);
    const info = await this.fileService.getFileInfo(key);

    res.setHeader(
      'Content-Type',
      info.contentType || 'application/octet-stream',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${key.split('/').pop()}"`,
    );

    stream.pipe(res);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Xóa file khỏi S3' })
  @ApiParam({
    name: 'key',
    description: 'Key của file trong S3',
    example: 'images/abc123.jpg',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa file thành công',
    type: ApiResponseDto,
  })
  @ApiResponse({ status: 404, description: 'File không tồn tại' })
  async deleteFile(@Param('key') key: string) {
    await this.fileService.deleteFile(key);
    return {
      success: true,
      message: 'Xóa file thành công',
      data: null,
    };
  }
}
