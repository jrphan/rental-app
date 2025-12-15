import { ROUTES } from '@/config/routes';
import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserService } from './user.service';
import { GetUserInfoResponse } from '@/types/user.type';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AuthenticatedRequest } from '@/types/response.type';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(ROUTES.USER.GET_USER_BY_ID)
  @UseGuards(AuthGuard)
  getUserById(@Req() req: Request): Promise<GetUserInfoResponse> {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.userService.getUserInfo(userId);
  }
}
