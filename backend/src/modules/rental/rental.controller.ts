import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import type { Request } from 'express';
import { ROUTES } from '@/config/routes';
import { RentalService } from './rental.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AuthenticatedRequest } from '@/types/response.type';
import { CreateRentalDto } from '@/common/dto/Rental/create-rental.dto';
import { UpdateRentalStatusDto } from '@/common/dto/Rental/update-rental-status.dto';
import {
  UploadEvidenceDto,
  UploadMultipleEvidenceDto,
} from '@/common/dto/Rental/upload-evidence.dto';
import { CreateDisputeDto } from '@/common/dto/Rental/create-dispute.dto';
import {
  CreateRentalResponse,
  RentalListResponse,
  RentalDetailResponse,
  UpdateRentalStatusResponse,
  AdminRentalListResponse,
  AdminRentalDetailResponse,
} from '@/types/rental.type';
import { RentalStatus } from '@prisma/client';

@Controller()
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Post(ROUTES.RENTAL.CREATE)
  @UseGuards(AuthGuard)
  createRental(
    @Req() req: Request,
    @Body() createRentalDto: CreateRentalDto,
  ): Promise<CreateRentalResponse> {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.rentalService.createRental(userId, createRentalDto);
  }

  @Get(ROUTES.RENTAL.GET_MY_RENTALS)
  @UseGuards(AuthGuard)
  getMyRentals(
    @Req() req: Request,
    @Query('role') role?: 'renter' | 'owner' | 'all',
    @Query('status') status?: RentalStatus,
  ): Promise<RentalListResponse> {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.rentalService.getMyRentals(userId, role || 'all', status);
  }

  @Get(ROUTES.RENTAL.GET_RENTAL_DETAIL)
  @UseGuards(AuthGuard)
  getRentalDetail(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<RentalDetailResponse> {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.rentalService.getRentalDetail(userId, id);
  }

  @Patch(ROUTES.RENTAL.UPDATE_RENTAL_STATUS)
  @UseGuards(AuthGuard)
  updateRentalStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateRentalStatusDto,
  ): Promise<UpdateRentalStatusResponse> {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.rentalService.updateRentalStatus(userId, id, updateStatusDto);
  }

  @Post(ROUTES.RENTAL.UPLOAD_EVIDENCE)
  @UseGuards(AuthGuard)
  uploadEvidence(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() uploadEvidenceDto: UploadEvidenceDto | UploadMultipleEvidenceDto,
  ) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Check if it's multiple evidences
    if ('evidences' in uploadEvidenceDto) {
      return this.rentalService.uploadMultipleEvidences(
        id,
        userId,
        uploadEvidenceDto,
      );
    }

    return this.rentalService.uploadEvidence(id, userId, uploadEvidenceDto);
  }

  @Post(ROUTES.RENTAL.CREATE_DISPUTE)
  @UseGuards(AuthGuard)
  createDispute(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() createDisputeDto: CreateDisputeDto,
  ) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.rentalService.createDispute(id, userId, createDisputeDto);
  }

  // Admin endpoints
  @Get(ROUTES.ADMIN.LIST_RENTALS)
  @UseGuards(AuthGuard)
  listRentals(
    @Req() req: Request,
    @Query('status') status?: RentalStatus,
    @Query('hasDispute') hasDispute?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ): Promise<AdminRentalListResponse> {
    const adminId = (req as AuthenticatedRequest).user?.sub;
    if (!adminId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const hasDisputeBool =
      hasDispute !== undefined ? hasDispute === 'true' : undefined;

    return this.rentalService.listRentals(
      adminId,
      status,
      hasDisputeBool,
      pageNum,
      limitNum,
    );
  }

  @Get(ROUTES.ADMIN.GET_RENTAL_DETAIL)
  @UseGuards(AuthGuard)
  getRentalDetailAdmin(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<AdminRentalDetailResponse> {
    const adminId = (req as AuthenticatedRequest).user?.sub;
    if (!adminId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.rentalService.getRentalDetailAdmin(adminId, id);
  }
}
