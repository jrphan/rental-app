import { ROUTES } from '@/config/routes';
import {
  Body,
  Controller,
  Get,
  Put,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserService } from './user.service';
import {
  GetUserInfoResponse,
  UpdateProfileResponse,
  SubmitKycResponse,
  AdminKycListResponse,
  AdminKycDetailResponse,
  AdminKycActionResponse,
} from '@/types/user.type';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AuthenticatedRequest } from '@/types/response.type';
import { UpdateProfileDto } from '@/common/dto/User/update-profile.dto';
import { SubmitKycDto } from '@/common/dto/User/submit-kyc.dto';
import { RejectKycDto } from '@/common/dto/User/review-kyc.dto';
import { KycStatus } from '@prisma/client';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(ROUTES.USER.GET_USER_INFO)
  @UseGuards(AuthGuard)
  getUserInfo(@Req() req: Request): Promise<GetUserInfoResponse> {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.userService.getUserInfo(userId);
  }

  @Put(ROUTES.USER.UPDATE_PROFILE)
  @UseGuards(AuthGuard)
  updateProfile(
    @Req() req: Request,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UpdateProfileResponse> {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.userService.updateProfile(userId, updateProfileDto);
  }

  @Post(ROUTES.USER.SUBMIT_KYC)
  @UseGuards(AuthGuard)
  submitKyc(
    @Req() req: Request,
    @Body() submitKycDto: SubmitKycDto,
  ): Promise<SubmitKycResponse> {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.userService.submitKyc(userId, submitKycDto);
  }

  @Get(ROUTES.ADMIN.LIST_KYC)
  @UseGuards(AuthGuard)
  listKyc(
    @Req() req: Request,
    @Query('status') status?: KycStatus,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ): Promise<AdminKycListResponse> {
    const reviewerId = (req as AuthenticatedRequest).user?.sub;
    if (!reviewerId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    return this.userService.listKyc(reviewerId, status, pageNum, limitNum);
  }

  @Get(ROUTES.ADMIN.GET_KYC_DETAIL)
  @UseGuards(AuthGuard)
  getKycDetail(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<AdminKycDetailResponse> {
    const reviewerId = (req as AuthenticatedRequest).user?.sub;
    if (!reviewerId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.userService.getKycDetail(reviewerId, id);
  }

  @Post(ROUTES.ADMIN.APPROVE_KYC)
  @UseGuards(AuthGuard)
  approveKyc(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<AdminKycActionResponse> {
    const reviewerId = (req as AuthenticatedRequest).user?.sub;
    if (!reviewerId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.userService.approveKyc(id, reviewerId);
  }

  @Post(ROUTES.ADMIN.REJECT_KYC)
  @UseGuards(AuthGuard)
  rejectKyc(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: RejectKycDto,
  ): Promise<AdminKycActionResponse> {
    const reviewerId = (req as AuthenticatedRequest).user?.sub;
    if (!reviewerId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.userService.rejectKyc(id, reviewerId, body.reason);
  }
}
