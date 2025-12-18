import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateVehicleDto } from '@/common/dto/Vehicle/create-vehicle.dto';
import {
  CreateVehicleResponse,
  selectVehicle,
  AdminVehicleListResponse,
  AdminVehicleDetailResponse,
  AdminVehicleActionResponse,
  selectAdminVehicle,
  UserVehicleListResponse,
  VehicleResponse,
} from '@/types/vehicle.type';
import { VehicleStatus, UserRole, KycStatus, Prisma } from '@prisma/client';
import { AuditLogService } from '@/modules/audit/audit-log.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { AuditAction, AuditTargetType } from '@prisma/client';

@Injectable()
export class VehicleService {
  private readonly logger = new Logger(VehicleService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationService: NotificationService,
  ) {}

  private async assertAdminOrSupport(userId: string): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPPORT) {
      throw new ForbiddenException('Bạn không có quyền truy cập');
    }
  }

  async createVehicle(
    userId: string,
    createVehicleDto: CreateVehicleDto,
  ): Promise<CreateVehicleResponse> {
    // Validate user eligibility
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { kyc: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new BadRequestException('Tài khoản của bạn chưa được kích hoạt');
    }

    if (!user.isPhoneVerified) {
      throw new BadRequestException(
        'Bạn cần xác thực số điện thoại trước khi đăng ký làm chủ xe',
      );
    }

    if (!user.kyc || user.kyc.status !== KycStatus.APPROVED) {
      throw new BadRequestException(
        'Bạn cần hoàn thành KYC và được duyệt trước khi đăng ký làm chủ xe',
      );
    }

    // Check if user already has a vehicle (they can have multiple, but we're checking if this is first)
    // But we allow multiple vehicles, so we don't block this

    // Create vehicle with PENDING status (not DRAFT) since user is eligible
    const { images, ...vehicleData } = createVehicleDto;

    const vehicle = await this.prismaService.vehicle.create({
      data: {
        ...vehicleData,
        ownerId: userId,
        status: VehicleStatus.PENDING, // Set to PENDING for admin review
        depositAmount: vehicleData.depositAmount || 0,
        requiredLicense: vehicleData.requiredLicense || 'A1',
        instantBook: vehicleData.instantBook || false,
        images: {
          create: images.map((img, index) => ({
            url: img.url,
            isPrimary: img.isPrimary ?? index === 0,
            order: img.order ?? index,
          })),
        },
      },
      select: selectVehicle,
    });

    await this.auditLogService
      .log({
        actorId: userId,
        action: AuditAction.CREATE,
        targetId: vehicle.id,
        targetType: AuditTargetType.VEHICLE,
        metadata: {
          action: 'create_vehicle',
          brand: vehicle.brand,
          model: vehicle.model,
          licensePlate: vehicle.licensePlate,
        },
      })
      .catch(error => {
        this.logger.error('Failed to log vehicle creation audit', error);
      });

    return {
      message: 'Đăng ký xe thành công. Xe của bạn đang chờ được duyệt',
      vehicle,
    };
  }

  async listVehicles(
    reviewerId: string,
    status?: VehicleStatus,
    page = 1,
    limit = 20,
  ): Promise<AdminVehicleListResponse> {
    await this.assertAdminOrSupport(reviewerId);

    const where: Prisma.VehicleWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.vehicle.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: selectAdminVehicle,
      }),
      this.prismaService.vehicle.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async getVehicleDetail(
    reviewerId: string,
    id: string,
  ): Promise<AdminVehicleDetailResponse> {
    await this.assertAdminOrSupport(reviewerId);

    const vehicle = await this.prismaService.vehicle.findUnique({
      where: { id },
      select: selectAdminVehicle,
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async approveVehicle(
    id: string,
    reviewerId: string,
  ): Promise<AdminVehicleActionResponse> {
    await this.assertAdminOrSupport(reviewerId);

    const vehicle = await this.prismaService.vehicle.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Update vehicle status to APPROVED
    const updated = await this.prismaService.vehicle.update({
      where: { id },
      data: {
        status: VehicleStatus.APPROVED,
      },
    });

    // If this is the first approved vehicle, update user's isVendor status
    const approvedCount = await this.prismaService.vehicle.count({
      where: {
        ownerId: vehicle.ownerId,
        status: VehicleStatus.APPROVED,
        deletedAt: null,
      },
    });

    // If this is the first approved vehicle (count = 1), set isVendor = true
    if (approvedCount === 1) {
      await this.prismaService.user.update({
        where: { id: vehicle.ownerId },
        data: { isVendor: true },
      });
    }

    await this.auditLogService
      .log({
        actorId: reviewerId,
        action: AuditAction.APPROVE,
        targetId: vehicle.id,
        targetType: AuditTargetType.VEHICLE,
        metadata: {
          oldValue: JSON.stringify(vehicle),
          newValue: JSON.stringify(updated),
          action: 'approve_vehicle',
        },
      })
      .catch(error => {
        this.logger.error('Failed to log vehicle approval audit', error);
      });

    // Send notification to vehicle owner
    await this.notificationService
      .notifyVehicleApproved(vehicle.ownerId, vehicle.id, {
        brand: vehicle.brand,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
      })
      .catch(error => {
        this.logger.error('Failed to send vehicle approval notification', error);
      });

    return { message: 'Xe đã được phê duyệt' };
  }

  async rejectVehicle(
    id: string,
    reviewerId: string,
    reason: string,
  ): Promise<AdminVehicleActionResponse> {
    await this.assertAdminOrSupport(reviewerId);

    const vehicle = await this.prismaService.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const updated = await this.prismaService.vehicle.update({
      where: { id },
      data: {
        status: VehicleStatus.REJECTED,
      },
    });

    await this.auditLogService
      .log({
        actorId: reviewerId,
        action: AuditAction.REJECT,
        targetId: vehicle.id,
        targetType: AuditTargetType.VEHICLE,
        metadata: {
          oldValue: JSON.stringify(vehicle),
          newValue: JSON.stringify(updated),
          action: 'reject_vehicle',
          reason,
        },
      })
      .catch(error => {
        this.logger.error('Failed to log vehicle rejection audit', error);
      });

    // Send notification to vehicle owner
    await this.notificationService
      .notifyVehicleRejected(vehicle.ownerId, vehicle.id, reason, {
        brand: vehicle.brand,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
      })
      .catch(error => {
        this.logger.error('Failed to send vehicle rejection notification', error);
      });

    return { message: 'Xe đã bị từ chối' };
  }

  async getMyVehicles(
    userId: string,
    status?: VehicleStatus,
  ): Promise<UserVehicleListResponse> {
    const where: Prisma.VehicleWhereInput = {
      ownerId: userId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.vehicle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: selectVehicle,
      }),
      this.prismaService.vehicle.count({ where }),
    ]);

    return {
      items,
      total,
    };
  }

  async getMyVehicleDetail(
    userId: string,
    vehicleId: string,
  ): Promise<VehicleResponse> {
    const vehicle = await this.prismaService.vehicle.findFirst({
      where: {
        id: vehicleId,
        ownerId: userId,
        deletedAt: null,
      },
      select: selectVehicle,
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }
}
