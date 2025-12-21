import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import type { Request } from 'express';
import { ROUTES } from '@/config/routes';
import { VehicleService } from './vehicle.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AuthenticatedRequest } from '@/types/response.type';
import { CreateVehicleDto } from '@/common/dto/Vehicle/create-vehicle.dto';
import { RejectVehicleDto } from '@/common/dto/Vehicle/review-vehicle.dto';
import { ChangeVehicleStatusDto } from '@/common/dto/Vehicle/change-vehicle-status.dto';
import {
  CreateVehicleResponse,
  VehicleResponse,
  AdminVehicleListResponse,
  AdminVehicleDetailResponse,
  AdminVehicleActionResponse,
  UserVehicleListResponse,
} from '@/types/vehicle.type';
import { VehicleStatus } from '@prisma/client';

@Controller()
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post(ROUTES.VEHICLE.CREATE)
  @UseGuards(AuthGuard)
  createVehicle(
    @Req() req: Request,
    @Body() createVehicleDto: CreateVehicleDto,
  ): Promise<CreateVehicleResponse> {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.vehicleService.createVehicle(userId, createVehicleDto);
  }

  @Get(ROUTES.VEHICLE.LIST_MY_VEHICLES)
  @UseGuards(AuthGuard)
  getMyVehicles(
    @Req() req: Request,
    @Query('status') status?: VehicleStatus,
  ): Promise<UserVehicleListResponse> {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.vehicleService.getMyVehicles(userId, status);
  }

  @Get(ROUTES.VEHICLE.GET_MY_VEHICLE_DETAIL)
  @UseGuards(AuthGuard)
  getMyVehicleDetail(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<VehicleResponse> {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.vehicleService.getMyVehicleDetail(userId, id);
  }

  @Put(ROUTES.VEHICLE.UPDATE_VEHICLE)
  @UseGuards(AuthGuard)
  updateVehicle(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateVehicleDto: CreateVehicleDto,
  ): Promise<CreateVehicleResponse> {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.vehicleService.updateVehicle(userId, id, updateVehicleDto);
  }

  @Patch(ROUTES.VEHICLE.UPDATE_VEHICLE_STATUS)
  @UseGuards(AuthGuard)
  updateVehicleStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeVehicleStatusDto,
  ): Promise<{ message: string; vehicle: VehicleResponse }> {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.vehicleService.updateVehicleStatus(userId, id, changeStatusDto);
  }

  // Public routes - must be defined BEFORE /vehicle/:id to avoid route conflicts
  @Get(ROUTES.VEHICLE.SEARCH)
  searchVehicles(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
    @Query('city') city?: string,
    @Query('district') district?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.vehicleService.searchVehicles({
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      radius: radius ? Number(radius) : undefined,
      city,
      district,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(ROUTES.VEHICLE.LIST_POPULAR)
  getPopularVehicles(
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.vehicleService.getPopularVehicles(
      limit ? Number(limit) : 10,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(ROUTES.VEHICLE.LIST_BY_CITY)
  getVehiclesByCity(
    @Query('city') city: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.vehicleService.getVehiclesByCity(
      city,
      limit ? Number(limit) : 20,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(ROUTES.VEHICLE.LIST_BY_OWNER)
  getVehiclesByOwner(
    @Param('ownerId') ownerId: string,
  ): Promise<UserVehicleListResponse> {
    return this.vehicleService.getVehiclesByOwner(ownerId);
  }

  @Get(ROUTES.VEHICLE.GET_VEHICLE_DETAIL)
  getVehicleDetailPublic(@Param('id') id: string): Promise<VehicleResponse> {
    return this.vehicleService.getVehicleDetailPublic(id);
  }

  @Get(ROUTES.VEHICLE.GET_VEHICLE_REVIEWS)
  getVehicleReviews(@Param('id') id: string) {
    return this.vehicleService.getVehicleReviews(id);
  }

  // Admin
  @Get(ROUTES.ADMIN.LIST_VEHICLES)
  @UseGuards(AuthGuard)
  listVehicles(
    @Req() req: Request,
    @Query('status') status?: VehicleStatus,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ): Promise<AdminVehicleListResponse> {
    const reviewerId = (req as AuthenticatedRequest).user?.sub;
    if (!reviewerId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    return this.vehicleService.listVehicles(
      reviewerId,
      status,
      pageNum,
      limitNum,
    );
  }

  @Get(ROUTES.ADMIN.GET_VEHICLE_DETAIL)
  @UseGuards(AuthGuard)
  getVehicleDetail(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<AdminVehicleDetailResponse> {
    const reviewerId = (req as AuthenticatedRequest).user?.sub;
    if (!reviewerId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.vehicleService.getVehicleDetail(reviewerId, id);
  }

  @Post(ROUTES.ADMIN.APPROVE_VEHICLE)
  @UseGuards(AuthGuard)
  approveVehicle(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<AdminVehicleActionResponse> {
    const reviewerId = (req as AuthenticatedRequest).user?.sub;
    if (!reviewerId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.vehicleService.approveVehicle(id, reviewerId);
  }

  @Post(ROUTES.ADMIN.REJECT_VEHICLE)
  @UseGuards(AuthGuard)
  rejectVehicle(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: RejectVehicleDto,
  ): Promise<AdminVehicleActionResponse> {
    const reviewerId = (req as AuthenticatedRequest).user?.sub;
    if (!reviewerId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.vehicleService.rejectVehicle(id, reviewerId, body.reason);
  }
}
