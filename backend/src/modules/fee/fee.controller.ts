import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { FeeService } from './fee.service';
import type { Request } from 'express';
import { AuthenticatedRequest } from '@/types/response.type';
import {
  FeeSettingsResponse,
  InsuranceStatsResponse,
} from '@/types/fee.type';
import { UpdateFeeSettingsDto } from '@/common/dto/Fee/update-fee-settings.dto';
import { ROUTES } from '@/config/routes';

@Controller()
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  // ==================== ADMIN ROUTES ====================

  @Get(ROUTES.ADMIN.FEE_SETTINGS)
  @UseGuards(AuthGuard)
  async getFeeSettings(): Promise<FeeSettingsResponse> {
    return this.feeService.getFeeSettings();
  }

  @Put(ROUTES.ADMIN.FEE_SETTINGS)
  @UseGuards(AuthGuard)
  async updateFeeSettings(
    @Req() req: Request,
    @Body() body: UpdateFeeSettingsDto,
  ): Promise<FeeSettingsResponse> {
    const adminId = (req as AuthenticatedRequest).user?.sub;
    if (!adminId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.feeService.updateFeeSettings(adminId, body);
  }

  @Get(ROUTES.ADMIN.INSURANCE_STATS)
  @UseGuards(AuthGuard)
  async getInsuranceStats(
    @Req() req: Request,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<InsuranceStatsResponse> {
    const adminId = (req as AuthenticatedRequest).user?.sub;
    if (!adminId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.feeService.getInsuranceStats(
      adminId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // ==================== PUBLIC ROUTES ====================

  @Get(ROUTES.FEE_SETTINGS)
  async getFeeSettingsPublic(): Promise<FeeSettingsResponse> {
    return this.feeService.getFeeSettings();
  }
}

