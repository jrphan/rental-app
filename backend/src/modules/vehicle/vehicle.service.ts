import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateVehicleDto } from '@/common/dto/Vehicle/create-vehicle.dto';
import { ChangeVehicleStatusDto } from '@/common/dto/Vehicle/change-vehicle-status.dto';
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
import {
  VehicleStatus,
  UserRole,
  KycStatus,
  Prisma,
  RentalStatus,
} from '@prisma/client';
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

  async updateVehicle(
    userId: string,
    vehicleId: string,
    updateVehicleDto: CreateVehicleDto,
  ): Promise<CreateVehicleResponse> {
    // Find vehicle and verify ownership
    const vehicle = await this.prismaService.vehicle.findFirst({
      where: {
        id: vehicleId,
        ownerId: userId,
        deletedAt: null,
      },
    });

    if (!vehicle) {
      throw new NotFoundException(
        'Xe không tồn tại hoặc bạn không có quyền truy cập',
      );
    }

    // Only allow update if vehicle is REJECTED, DRAFT, or APPROVED
    if (
      vehicle.status !== VehicleStatus.REJECTED &&
      vehicle.status !== VehicleStatus.DRAFT &&
      vehicle.status !== VehicleStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Chỉ có thể cập nhật xe khi trạng thái là BỊ TỪ CHỐI, NHÁP, hoặc ĐÃ DUYỆT',
      );
    }

    const { images, ...vehicleData } = updateVehicleDto;

    // Delete old images
    await this.prismaService.vehicleImage.deleteMany({
      where: { vehicleId },
    });

    // Update vehicle
    const updated = await this.prismaService.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...vehicleData,
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
        action: AuditAction.UPDATE,
        targetId: updated.id,
        targetType: AuditTargetType.VEHICLE,
        metadata: {
          action: 'update_vehicle',
          brand: updated.brand,
          model: updated.model,
          licensePlate: updated.licensePlate,
          previousStatus: vehicle.status,
        },
      })
      .catch(error => {
        this.logger.error('Failed to log vehicle update audit', error);
      });

    return {
      message: 'Cập nhật thông tin xe thành công',
      vehicle: updated,
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
        this.logger.error(
          'Failed to send vehicle approval notification',
          error,
        );
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
        this.logger.error(
          'Failed to send vehicle rejection notification',
          error,
        );
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

  /**
   * Lấy thông tin chi tiết xe (public - không cần auth)
   * Chỉ trả về xe đã được APPROVED
   */
  async getVehicleDetailPublic(id: string): Promise<VehicleResponse> {
    const vehicle = await this.prismaService.vehicle.findFirst({
      where: {
        id,
        status: VehicleStatus.APPROVED, // Chỉ trả về xe đã được duyệt
        deletedAt: null,
      },
      select: selectVehicle,
    });

    if (!vehicle) {
      throw new NotFoundException('Xe không tồn tại hoặc chưa được duyệt');
    }

    return vehicle;
  }

  /**
   * Lấy danh sách reviews của xe (public)
   */
  async getVehicleReviews(vehicleId: string) {
    // Kiểm tra xe có tồn tại và đã được duyệt
    const vehicle = await this.prismaService.vehicle.findFirst({
      where: {
        id: vehicleId,
        status: VehicleStatus.APPROVED,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Xe không tồn tại hoặc chưa được duyệt');
    }

    // Lấy reviews của xe (chỉ reviews cho xe, không phải reviews cho owner)
    const reviews = await this.prismaService.review.findMany({
      where: {
        vehicleId,
        type: 'RENTER_TO_VEHICLE',
        isHidden: false,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Tính toán average rating và total
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    return {
      reviews,
      averageRating,
      totalReviews,
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

  async updateVehicleStatus(
    userId: string,
    vehicleId: string,
    changeStatusDto: ChangeVehicleStatusDto,
  ): Promise<{ message: string; vehicle: VehicleResponse }> {
    // Find vehicle and verify ownership
    const vehicle = await this.prismaService.vehicle.findFirst({
      where: {
        id: vehicleId,
        ownerId: userId,
        deletedAt: null,
      },
    });

    if (!vehicle) {
      throw new NotFoundException(
        'Xe không tồn tại hoặc bạn không có quyền truy cập',
      );
    }

    const newStatus = changeStatusDto.status;

    // If status is the same, return early
    if (vehicle.status === newStatus) {
      const vehicleResponse = await this.prismaService.vehicle.findUnique({
        where: { id: vehicleId },
        select: selectVehicle,
      });
      return {
        message: 'Trạng thái xe không thay đổi',
        vehicle: vehicleResponse!,
      };
    }

    // Validate status transitions based on current status
    const allowedTransitions: Record<VehicleStatus, VehicleStatus[]> = {
      [VehicleStatus.DRAFT]: [VehicleStatus.PENDING],
      [VehicleStatus.PENDING]: [], // Cannot change from PENDING (waiting for admin)
      [VehicleStatus.APPROVED]: [
        VehicleStatus.HIDDEN,
        VehicleStatus.MAINTENANCE,
      ],
      [VehicleStatus.REJECTED]: [VehicleStatus.PENDING], // Can resubmit
      [VehicleStatus.HIDDEN]: [VehicleStatus.APPROVED],
      [VehicleStatus.MAINTENANCE]: [VehicleStatus.APPROVED],
    };

    const allowedStatuses = allowedTransitions[vehicle.status];
    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Không thể chuyển từ trạng thái ${vehicle.status} sang ${newStatus}. ` +
          `Chỉ có thể chuyển sang: ${allowedStatuses.join(', ') || 'không có'}`,
      );
    }

    // Check for active rentals if changing to HIDDEN or MAINTENANCE
    if (
      newStatus === VehicleStatus.HIDDEN ||
      newStatus === VehicleStatus.MAINTENANCE
    ) {
      const activeRentals = await this.prismaService.rental.count({
        where: {
          vehicleId: vehicleId,
          status: {
            in: [
              RentalStatus.PENDING_PAYMENT,
              RentalStatus.AWAIT_APPROVAL,
              RentalStatus.CONFIRMED,
              RentalStatus.ON_TRIP,
            ],
          },
          deletedAt: null,
        },
      });

      if (activeRentals > 0) {
        throw new BadRequestException(
          `Không thể thay đổi trạng thái xe vì xe đang có ${activeRentals} đơn thuê đang hoạt động`,
        );
      }
    }

    // Update vehicle status
    const updated = await this.prismaService.vehicle.update({
      where: { id: vehicleId },
      data: {
        status: newStatus,
      },
      select: selectVehicle,
    });

    // Log audit
    await this.auditLogService
      .log({
        actorId: userId,
        action: AuditAction.UPDATE,
        targetId: vehicle.id,
        targetType: AuditTargetType.VEHICLE,
        metadata: {
          action: 'update_vehicle_status',
          oldStatus: vehicle.status,
          newStatus: newStatus,
          brand: vehicle.brand,
          model: vehicle.model,
          licensePlate: vehicle.licensePlate,
        },
      })
      .catch(error => {
        this.logger.error('Failed to log vehicle status update audit', error);
      });

    // Generate appropriate message
    const statusMessages: Record<VehicleStatus, string> = {
      [VehicleStatus.DRAFT]: 'Xe đã được lưu ở trạng thái nháp',
      [VehicleStatus.PENDING]: 'Xe đã được gửi để duyệt',
      [VehicleStatus.APPROVED]: 'Xe đã được hiển thị',
      [VehicleStatus.REJECTED]: 'Xe đã bị từ chối',
      [VehicleStatus.HIDDEN]: 'Xe đã được ẩn',
      [VehicleStatus.MAINTENANCE]: 'Xe đã được đánh dấu là đang bảo trì',
    };

    return {
      message: statusMessages[newStatus] || 'Trạng thái xe đã được cập nhật',
      vehicle: updated,
    };
  }
}
