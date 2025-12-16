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
} from '@nestjs/common';
import type { Request } from 'express';
import { UserService } from './user.service';
import {
  GetUserInfoResponse,
  UpdateProfileResponse,
  SubmitKycResponse,
} from '@/types/user.type';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AuthenticatedRequest } from '@/types/response.type';
import { UpdateProfileDto } from '@/common/dto/User/update-profile.dto';
import { SubmitKycDto } from '@/common/dto/User/submit-kyc.dto';

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
}
