import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Get,
  Query,
  Delete,
  Param,
  Req,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ROUTES } from '@/config/routes';
import { AuthGuard } from '@/common/guards/auth.guard';
import { FileService } from './file.service';
import type { Request } from 'express';
import { AuthenticatedRequest } from '@/types/response.type';
import { UserFileResponse } from '@/types/file.type';

@Controller()
export class FileController {
  constructor(private readonly fileService: FileService) {}

  private getUserId(req: Request): string {
    return (req as AuthenticatedRequest).user?.sub as string;
  }

  @Post(ROUTES.FILES.UPLOAD)
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ): Promise<UserFileResponse> {
    const userId = this.getUserId(req);
    return this.fileService.uploadUserFile(userId, file, folder);
  }

  @Post(ROUTES.FILES.UPLOAD_MULTIPLE)
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(
    @Req() req: Request,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ): Promise<UserFileResponse[]> {
    const userId = this.getUserId(req);
    return this.fileService.uploadMultipleUserFiles(userId, files, folder);
  }

  @Get(ROUTES.FILES.LIST_MY_FILES)
  @UseGuards(AuthGuard)
  async listMyFiles(
    @Req() req: Request,
    @Query('folder') folder?: string,
  ): Promise<UserFileResponse[]> {
    const userId = this.getUserId(req);
    return this.fileService.listMyFiles(userId, folder);
  }

  @Delete(ROUTES.FILES.DELETE_FILE)
  @UseGuards(AuthGuard)
  async deleteMyFile(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<void> {
    const userId = this.getUserId(req);
    return this.fileService.deleteMyFile(userId, id);
  }
}
