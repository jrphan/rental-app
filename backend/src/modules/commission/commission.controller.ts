import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { CommissionService } from './commission.service';
import type { Request } from 'express';
import { AuthenticatedRequest } from '@/types/response.type';
import {
  CommissionSettingsResponse,
  OwnerCommissionResponse,
  OwnerCommissionListResponse,
  CommissionPaymentResponse,
  AdminCommissionPaymentListResponse,
  RevenueResponse,
  PendingCommissionAlertsResponse,
} from '@/types/commission.type';
import { UpdateCommissionSettingsDto } from '@/common/dto/Commission/update-commission-settings.dto';
import { UploadInvoiceDto } from '@/common/dto/Commission/upload-invoice.dto';
import { ReviewPaymentDto } from '@/common/dto/Commission/review-payment.dto';
import { ROUTES } from '@/config/routes';

@Controller()
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  // ==================== ADMIN ROUTES ====================

  @Get(ROUTES.ADMIN.COMMISSION_SETTINGS)
  @UseGuards(AuthGuard)
  async getCommissionSettings(): Promise<CommissionSettingsResponse> {
    return this.commissionService.getCommissionSettings();
  }

  @Put(ROUTES.ADMIN.COMMISSION_SETTINGS)
  @UseGuards(AuthGuard)
  async updateCommissionSettings(
    @Req() req: Request,
    @Body() body: UpdateCommissionSettingsDto,
  ): Promise<CommissionSettingsResponse> {
    const adminId = (req as AuthenticatedRequest).user?.sub;
    if (!adminId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.commissionService.updateCommissionSettings(adminId, body);
  }

  @Get(ROUTES.ADMIN.COMMISSION_PAYMENTS)
  @UseGuards(AuthGuard)
  async getPendingPayments(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<AdminCommissionPaymentListResponse> {
    const adminId = (req as AuthenticatedRequest).user?.sub;
    if (!adminId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.commissionService.getPendingPayments(
      adminId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Put(ROUTES.ADMIN.COMMISSION_PAYMENT_REVIEW)
  @UseGuards(AuthGuard)
  async reviewPayment(
    @Req() req: Request,
    @Param('id') paymentId: string,
    @Body() body: ReviewPaymentDto,
  ): Promise<CommissionPaymentResponse> {
    const adminId = (req as AuthenticatedRequest).user?.sub;
    if (!adminId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.commissionService.reviewPayment(adminId, paymentId, body);
  }

  @Get(ROUTES.ADMIN.COMMISSION_ALERTS)
  @UseGuards(AuthGuard)
  async getCommissionAlerts(
    @Req() req: Request,
  ): Promise<PendingCommissionAlertsResponse> {
    const adminId = (req as AuthenticatedRequest).user?.sub;
    if (!adminId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.commissionService.getPendingCommissionAlerts(adminId);
  }

  // ==================== OWNER ROUTES ====================

  @Get(ROUTES.USER.MY_COMMISSIONS)
  @UseGuards(AuthGuard)
  async getMyCommissions(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<OwnerCommissionListResponse> {
    const ownerId = (req as AuthenticatedRequest).user?.sub;
    if (!ownerId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.commissionService.getOwnerCommissions(
      ownerId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(ROUTES.USER.CURRENT_WEEK_COMMISSION)
  @UseGuards(AuthGuard)
  async getCurrentWeekCommission(
    @Req() req: Request,
  ): Promise<OwnerCommissionResponse | null> {
    const ownerId = (req as AuthenticatedRequest).user?.sub;
    if (!ownerId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.commissionService.getCurrentWeekCommission(ownerId);
  }

  @Post(ROUTES.USER.COMMISSION_PAYMENT)
  @UseGuards(AuthGuard)
  async createPaymentRequest(
    @Req() req: Request,
    @Param('commissionId') commissionId: string,
    @Body() body: UploadInvoiceDto,
  ): Promise<CommissionPaymentResponse> {
    const ownerId = (req as AuthenticatedRequest).user?.sub;
    if (!ownerId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.commissionService.createPaymentRequest(
      ownerId,
      commissionId,
      body,
    );
  }

  @Get(ROUTES.USER.REVENUE)
  @UseGuards(AuthGuard)
  async getRevenue(
    @Req() req: Request,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<RevenueResponse> {
    const ownerId = (req as AuthenticatedRequest).user?.sub;
    if (!ownerId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.commissionService.getOwnerRevenue(
      ownerId,
      start,
      end,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }
}
