import { CreateUserDto } from '@/common/dto/User/create-user-dto';
import { UpdateProfileDto } from '@/common/dto/User/update-profile.dto';
import { SubmitKycDto } from '@/common/dto/User/submit-kyc.dto';
import { PrismaService } from '@/prisma/prisma.service';
import {
  GetUserInfoResponse,
  selectGetUserInfo,
  UpdateProfileResponse,
  SubmitKycResponse,
  AdminUserListResponse,
  selectAdminUser,
  AdminKycListResponse,
  AdminKycDetailResponse,
  AdminKycActionResponse,
  selectAdminKyc,
} from '@/types/user.type';
import { AdminStatsResponse } from '@/types/admin.type';
import { VehicleResponse, selectVehicle } from '@/types/vehicle.type';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  AuditAction,
  AuditTargetType,
  KycStatus,
  Prisma,
  RentalStatus,
  User,
  UserRole,
  VehicleStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditLogService } from '@/modules/audit/audit-log.service';
import { NotificationService } from '@/modules/notification/notification.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

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

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...rest } = createUserDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prismaService.user.create({
      data: {
        ...rest,
        password: hashedPassword,
      },
    });

    return user;
  }

  async getUserInfo(userId: string): Promise<GetUserInfoResponse> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: selectGetUserInfo,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UpdateProfileResponse> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        fullName: updateProfileDto.fullName ?? undefined,
        email: updateProfileDto.email ?? undefined,
        avatar: updateProfileDto.avatar ?? undefined,
      },
      select: selectGetUserInfo,
    });

    this.auditLogService
      .log({
        actorId: userId,
        action: AuditAction.UPDATE,
        targetId: userId,
        targetType: AuditTargetType.USER,
        metadata: {
          oldValue: JSON.stringify(user),
          newValue: JSON.stringify(updatedUser),
          action: 'update_profile',
        },
      })
      .catch(error => {
        this.logger.error('Failed to log audit', error);
      });

    return updatedUser;
  }

  async submitKyc(
    userId: string,
    dto: SubmitKycDto,
  ): Promise<SubmitKycResponse> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, kyc: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.kyc) {
      const payload: Prisma.KycUpdateInput = {
        citizenId: dto.citizenId ?? undefined,
        fullNameInId: dto.fullNameInId ?? undefined,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        addressInId: dto.addressInId ?? undefined,
        driverLicense: dto.driverLicense ?? undefined,
        licenseType: dto.licenseType ?? undefined,
        idCardFront: dto.idCardFront ?? undefined,
        idCardBack: dto.idCardBack ?? undefined,
        licenseFront: dto.licenseFront ?? undefined,
        licenseBack: dto.licenseBack ?? undefined,
        selfieImg: dto.selfieImg ?? undefined,
        status: KycStatus.PENDING,
        rejectionReason: null,
      };

      await this.prismaService.kyc.update({
        where: { userId },
        data: payload,
      });

      this.auditLogService
        .log({
          actorId: userId,
          action: AuditAction.UPDATE,
          targetId: userId,
          targetType: AuditTargetType.USER,
          metadata: {
            oldValue: JSON.stringify(user.kyc),
            newValue: JSON.stringify({
              ...user.kyc,
              ...payload,
            }),
            action: 'update_kyc',
          },
        })
        .catch(error => {
          console.error('Failed to log audit:', error);
        });
    } else {
      const payload = {
        userId,
        citizenId: dto.citizenId ?? undefined,
        fullNameInId: dto.fullNameInId ?? undefined,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        addressInId: dto.addressInId ?? undefined,
        driverLicense: dto.driverLicense ?? undefined,
        licenseType: dto.licenseType ?? undefined,
        idCardFront: dto.idCardFront ?? undefined,
        idCardBack: dto.idCardBack ?? undefined,
        licenseFront: dto.licenseFront ?? undefined,
        licenseBack: dto.licenseBack ?? undefined,
        selfieImg: dto.selfieImg ?? undefined,
      };

      await this.prismaService.kyc.create({
        data: payload,
      });

      this.auditLogService
        .log({
          actorId: userId,
          action: AuditAction.CREATE,
          targetId: userId,
          targetType: AuditTargetType.USER,
          metadata: {
            newValue: JSON.stringify({
              ...payload,
            }),
            action: 'submit_kyc',
          },
        })
        .catch(error => {
          console.error('Failed to log audit:', error);
        });
    }

    return { message: 'KYC đã được gửi, vui lòng chờ duyệt' };
  }

  // Admin
  async listUsers(
    reviewerId: string,
    filters: {
      role?: UserRole;
      isActive?: boolean;
      isPhoneVerified?: boolean;
      kycStatus?: KycStatus;
      search?: string;
    },
    page = 1,
    limit = 20,
  ): Promise<AdminUserListResponse> {
    await this.assertAdminOrSupport(reviewerId);

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      role: filters.role,
      isActive: filters.isActive,
      isPhoneVerified: filters.isPhoneVerified,
    };

    if (filters.kycStatus) {
      where.kyc = {
        status: filters.kycStatus,
      };
    }

    if (filters.search) {
      const keyword = filters.search.trim();
      if (keyword) {
        where.OR = [
          { phone: { contains: keyword, mode: 'insensitive' } },
          { email: { contains: keyword, mode: 'insensitive' } },
          { fullName: { contains: keyword, mode: 'insensitive' } },
        ];
      }
    }

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: selectAdminUser,
      }),
      this.prismaService.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async listKyc(
    reviewerId: string,
    status?: KycStatus,
    page = 1,
    limit = 20,
  ): Promise<AdminKycListResponse> {
    await this.assertAdminOrSupport(reviewerId);

    const where: Prisma.KycWhereInput = {};

    if (status) {
      where.status = status;
    }

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.kyc.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: selectAdminKyc,
      }),
      this.prismaService.kyc.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async getKycDetail(
    reviewerId: string,
    id: string,
  ): Promise<AdminKycDetailResponse> {
    await this.assertAdminOrSupport(reviewerId);

    const kyc = await this.prismaService.kyc.findUnique({
      where: { id },
      select: selectAdminKyc,
    });

    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    return kyc;
  }

  async approveKyc(
    id: string,
    reviewerId: string,
  ): Promise<AdminKycActionResponse> {
    await this.assertAdminOrSupport(reviewerId);
    const kyc = await this.prismaService.kyc.findUnique({
      where: { id },
    });

    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    const updated = await this.prismaService.kyc.update({
      where: { id },
      data: {
        status: KycStatus.APPROVED,
        rejectionReason: null,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    await this.auditLogService
      .log({
        actorId: reviewerId,
        action: AuditAction.UPDATE,
        targetId: kyc.userId,
        targetType: AuditTargetType.USER,
        metadata: {
          oldValue: JSON.stringify(kyc),
          newValue: JSON.stringify(updated),
          action: 'approve_kyc',
        },
      })
      .catch(error => {
        this.logger.error('Failed to log KYC approval audit', error);
      });

    // Send notification to user
    await this.notificationService
      .notifyKycApproved(kyc.userId)
      .catch(error => {
        this.logger.error('Failed to send KYC approval notification', error);
      });

    return { message: 'KYC đã được phê duyệt' };
  }

  async rejectKyc(
    id: string,
    reviewerId: string,
    reason: string,
  ): Promise<AdminKycActionResponse> {
    await this.assertAdminOrSupport(reviewerId);
    const kyc = await this.prismaService.kyc.findUnique({
      where: { id },
    });

    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    const updated = await this.prismaService.kyc.update({
      where: { id },
      data: {
        status: KycStatus.REJECTED,
        rejectionReason: reason,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    await this.auditLogService
      .log({
        actorId: reviewerId,
        action: AuditAction.UPDATE,
        targetId: kyc.userId,
        targetType: AuditTargetType.USER,
        metadata: {
          oldValue: JSON.stringify(kyc),
          newValue: JSON.stringify(updated),
          action: 'reject_kyc',
        },
      })
      .catch(error => {
        this.logger.error('Failed to log KYC rejection audit', error);
      });

    // Send notification to user
    await this.notificationService
      .notifyKycRejected(kyc.userId, reason)
      .catch(error => {
        this.logger.error('Failed to send KYC rejection notification', error);
      });

    return { message: 'KYC đã bị từ chối' };
  }

  /**
   * Thêm xe vào danh sách yêu thích
   */
  async addFavorite(
    userId: string,
    vehicleId: string,
  ): Promise<{ message: string }> {
    try {
      // Kiểm tra xe có tồn tại và đã được duyệt
      const vehicle = await this.prismaService.vehicle.findFirst({
        where: {
          id: vehicleId,
          status: VehicleStatus.APPROVED,
          deletedAt: null,
        },
      });

      if (!vehicle) {
        throw new NotFoundException('Xe không tồn tại hoặc chưa được duyệt');
      }

      // Kiểm tra đã favorite chưa
      const existing = await this.prismaService.vehicleFavorite.findUnique({
        where: {
          userId_vehicleId: {
            userId,
            vehicleId,
          },
        },
      });

      if (existing) {
        throw new ForbiddenException('Xe đã có trong danh sách yêu thích');
      }

      // Thêm vào favorite
      await this.prismaService.vehicleFavorite.create({
        data: {
          userId,
          vehicleId,
        },
      });

      return { message: 'Đã thêm vào danh sách yêu thích' };
    } catch (error) {
      this.logger.error(
        `Error adding favorite: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Xóa xe khỏi danh sách yêu thích
   */
  async removeFavorite(
    userId: string,
    vehicleId: string,
  ): Promise<{ message: string }> {
    try {
      const result = await this.prismaService.vehicleFavorite.deleteMany({
        where: {
          userId,
          vehicleId,
        },
      });

      if (result.count === 0) {
        throw new NotFoundException('Xe không có trong danh sách yêu thích');
      }

      return { message: 'Đã xóa khỏi danh sách yêu thích' };
    } catch (error) {
      this.logger.error(
        `Error removing favorite: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Kiểm tra xe có trong danh sách yêu thích không
   */
  async checkFavorite(
    userId: string,
    vehicleId: string,
  ): Promise<{ isFavorite: boolean }> {
    try {
      const favorite = await this.prismaService.vehicleFavorite.findUnique({
        where: {
          userId_vehicleId: {
            userId,
            vehicleId,
          },
        },
      });

      return { isFavorite: !!favorite };
    } catch (error) {
      this.logger.error(
        `Error checking favorite: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Lấy danh sách xe yêu thích
   */
  async getFavorites(userId: string): Promise<{
    items: VehicleResponse[];
    total: number;
  }> {
    try {
      const favorites = await this.prismaService.vehicleFavorite.findMany({
        where: {
          userId,
          vehicle: {
            status: VehicleStatus.APPROVED,
            deletedAt: null,
          },
        },
        select: {
          vehicle: {
            select: selectVehicle,
          },
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        items: favorites.map(fav => fav.vehicle),
        total: favorites.length,
      };
    } catch (error) {
      this.logger.error(
        `Error getting favorites: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // ==================== ADMIN STATS ====================

  async getAdminStats(adminId: string): Promise<AdminStatsResponse> {
    await this.assertAdminOrSupport(adminId);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Overview stats
    const [
      totalRentals,
      totalUsers,
      totalVehicles,
      completedRentals,
      activeRentals,
      pendingRentals,
      cancelledRentals,
      disputedRentals,
      totalRevenueResult,
    ] = await Promise.all([
      this.prismaService.rental.count({ where: { deletedAt: null } }),
      this.prismaService.user.count(),
      this.prismaService.vehicle.count({ where: { deletedAt: null } }),
      this.prismaService.rental.count({
        where: { status: RentalStatus.COMPLETED, deletedAt: null },
      }),
      this.prismaService.rental.count({
        where: { status: RentalStatus.ON_TRIP, deletedAt: null },
      }),
      this.prismaService.rental.count({
        where: {
          status: { in: [RentalStatus.PENDING_PAYMENT, RentalStatus.AWAIT_APPROVAL] },
          deletedAt: null,
        },
      }),
      this.prismaService.rental.count({
        where: { status: RentalStatus.CANCELLED, deletedAt: null },
      }),
      this.prismaService.rental.count({
        where: { status: RentalStatus.DISPUTED, deletedAt: null },
      }),
      this.prismaService.rental.aggregate({
        where: {
          status: RentalStatus.COMPLETED,
          deletedAt: null,
        },
        _sum: {
          platformFee: true,
        },
      }),
    ]);

    const totalRevenue = totalRevenueResult._sum.platformFee || 0;

    // Revenue by period
    const [todayRevenue, thisWeekRevenue, thisMonthRevenue, lastMonthRevenue] =
      await Promise.all([
        this.prismaService.rental.aggregate({
          where: {
            status: RentalStatus.COMPLETED,
            deletedAt: null,
            updatedAt: { gte: todayStart },
          },
          _sum: { platformFee: true },
        }),
        this.prismaService.rental.aggregate({
          where: {
            status: RentalStatus.COMPLETED,
            deletedAt: null,
            updatedAt: { gte: thisWeekStart },
          },
          _sum: { platformFee: true },
        }),
        this.prismaService.rental.aggregate({
          where: {
            status: RentalStatus.COMPLETED,
            deletedAt: null,
            updatedAt: { gte: thisMonthStart },
          },
          _sum: { platformFee: true },
        }),
        this.prismaService.rental.aggregate({
          where: {
            status: RentalStatus.COMPLETED,
            deletedAt: null,
            updatedAt: { gte: lastMonthStart, lte: lastMonthEnd },
          },
          _sum: { platformFee: true },
        }),
      ]);

    // Rentals by status
    const rentalsByStatusRaw = await this.prismaService.rental.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
    });

    const rentalsByStatus = rentalsByStatusRaw.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));

    // Revenue chart data (last 30 days)
    const chartData: Array<{ date: string; revenue: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayData = await this.prismaService.rental.aggregate({
        where: {
          status: RentalStatus.COMPLETED,
          deletedAt: null,
          updatedAt: { gte: date, lt: nextDate },
        },
        _sum: { platformFee: true },
        _count: { id: true },
      });

      chartData.push({
        date: date.toISOString().split('T')[0],
        revenue: (dayData._sum.platformFee || 0).toString(),
        count: dayData._count.id,
      });
    }

    // Recent rentals (last 10)
    const recentRentalsData = await this.prismaService.rental.findMany({
      where: { deletedAt: null },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        renter: {
          select: {
            fullName: true,
          },
        },
        vehicle: {
          select: {
            brand: true,
            model: true,
          },
        },
      },
    });

    const recentRentals = recentRentalsData.map((rental) => ({
      id: rental.id,
      renterName: rental.renter.fullName,
      vehicleName: `${rental.vehicle.brand} ${rental.vehicle.model}`,
      totalPrice: rental.totalPrice.toString(),
      status: rental.status,
      createdAt: rental.createdAt.toISOString(),
    }));

    // Top vehicles by rental count
    const topVehiclesData = await this.prismaService.rental.groupBy({
      by: ['vehicleId'],
      where: {
        deletedAt: null,
        status: RentalStatus.COMPLETED,
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const vehicleIds = topVehiclesData.map((v) => v.vehicleId);
    const vehicles = await this.prismaService.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: {
        id: true,
        brand: true,
        model: true,
        licensePlate: true,
      },
    });

    const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

    // Calculate revenue for each top vehicle
    const topVehiclesWithRevenue = await Promise.all(
      topVehiclesData.map(async (item) => {
        const vehicle = vehicleMap.get(item.vehicleId);
        if (!vehicle) return null;

        const revenueData = await this.prismaService.rental.aggregate({
          where: {
            vehicleId: item.vehicleId,
            status: RentalStatus.COMPLETED,
            deletedAt: null,
          },
          _sum: { platformFee: true },
        });

        return {
          vehicleId: item.vehicleId,
          brand: vehicle.brand,
          model: vehicle.model,
          licensePlate: vehicle.licensePlate,
          rentalCount: item._count.id,
          totalRevenue: (revenueData._sum.platformFee || 0).toString(),
        };
      }),
    );

    const topVehicles = topVehiclesWithRevenue.filter(
      (v): v is NonNullable<typeof v> => v !== null,
    );

    return {
      overview: {
        totalRevenue: totalRevenue.toString(),
        totalRentals,
        totalUsers,
        totalVehicles,
        activeRentals,
        pendingRentals,
        completedRentals,
        cancelledRentals,
        disputedRentals,
      },
      revenue: {
        today: (todayRevenue._sum.platformFee || 0).toString(),
        thisWeek: (thisWeekRevenue._sum.platformFee || 0).toString(),
        thisMonth: (thisMonthRevenue._sum.platformFee || 0).toString(),
        lastMonth: (lastMonthRevenue._sum.platformFee || 0).toString(),
      },
      rentalsByStatus,
      revenueChart: chartData,
      recentRentals,
      topVehicles,
    };
  }
}
