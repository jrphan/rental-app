import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import {
  FeeSettingsResponse,
  InsuranceStatsResponse,
} from '@/types/fee.type';
import { UpdateFeeSettingsDto } from '@/common/dto/Fee/update-fee-settings.dto';
import { UserRole, RentalStatus } from '@prisma/client';

@Injectable()
export class FeeService {
  private readonly logger = new Logger(FeeService.name);

  constructor(private readonly prismaService: PrismaService) {}

  private async assertAdmin(userId: string): Promise<void> {
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

  /**
   * Lấy fee settings hiện tại (active)
   */
  async getFeeSettings(): Promise<FeeSettingsResponse> {
    const settings = await this.prismaService.feeSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      // Nếu chưa có settings, tạo default
      const defaultSettings = await this.prismaService.feeSettings.create({
        data: {
          deliveryFeePerKm: new Decimal('10000'),
          insuranceRate50cc: new Decimal('20000'),
          insuranceRateTayGa: new Decimal('30000'),
          insuranceRateTayCon: new Decimal('50000'),
          insuranceRateMoto: new Decimal('50000'),
          insuranceRateDefault: new Decimal('30000'),
          isActive: true,
        },
      });

      return {
        id: defaultSettings.id,
        deliveryFeePerKm: defaultSettings.deliveryFeePerKm.toString(),
        insuranceRate50cc: defaultSettings.insuranceRate50cc.toString(),
        insuranceRateTayGa: defaultSettings.insuranceRateTayGa.toString(),
        insuranceRateTayCon: defaultSettings.insuranceRateTayCon.toString(),
        insuranceRateMoto: defaultSettings.insuranceRateMoto.toString(),
        insuranceRateDefault: defaultSettings.insuranceRateDefault.toString(),
        isActive: defaultSettings.isActive,
        createdAt: defaultSettings.createdAt.toISOString(),
        updatedAt: defaultSettings.updatedAt.toISOString(),
      };
    }

    return {
      id: settings.id,
      deliveryFeePerKm: settings.deliveryFeePerKm.toString(),
      insuranceRate50cc: settings.insuranceRate50cc.toString(),
      insuranceRateTayGa: settings.insuranceRateTayGa.toString(),
      insuranceRateTayCon: settings.insuranceRateTayCon.toString(),
      insuranceRateMoto: settings.insuranceRateMoto.toString(),
      insuranceRateDefault: settings.insuranceRateDefault.toString(),
      isActive: settings.isActive,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  /**
   * Admin: Cập nhật fee settings
   */
  async updateFeeSettings(
    adminId: string,
    dto: UpdateFeeSettingsDto,
  ): Promise<FeeSettingsResponse> {
    await this.assertAdmin(adminId);

    this.logger.log(`Updating fee settings by admin ${adminId}`, dto);

    // Deactivate all existing settings
    await this.prismaService.feeSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new active settings
    const newSettings = await this.prismaService.feeSettings.create({
      data: {
        deliveryFeePerKm: new Decimal(dto.deliveryFeePerKm),
        insuranceRate50cc: new Decimal(dto.insuranceRate50cc),
        insuranceRateTayGa: new Decimal(dto.insuranceRateTayGa),
        insuranceRateTayCon: new Decimal(dto.insuranceRateTayCon),
        insuranceRateMoto: new Decimal(dto.insuranceRateMoto),
        insuranceRateDefault: new Decimal(
          dto.insuranceRateDefault || 30000,
        ),
        isActive: true,
        createdBy: adminId,
      },
    });

    this.logger.log(`Fee settings updated successfully: ${newSettings.id}`);

    return {
      id: newSettings.id,
      deliveryFeePerKm: newSettings.deliveryFeePerKm.toString(),
      insuranceRate50cc: newSettings.insuranceRate50cc.toString(),
      insuranceRateTayGa: newSettings.insuranceRateTayGa.toString(),
      insuranceRateTayCon: newSettings.insuranceRateTayCon.toString(),
      insuranceRateMoto: newSettings.insuranceRateMoto.toString(),
      insuranceRateDefault: newSettings.insuranceRateDefault.toString(),
      isActive: newSettings.isActive,
      createdAt: newSettings.createdAt.toISOString(),
      updatedAt: newSettings.updatedAt.toISOString(),
    };
  }

  /**
   * Thống kê phí bảo hiểm theo tháng
   */
  async getInsuranceStats(
    adminId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<InsuranceStatsResponse> {
    await this.assertAdmin(adminId);

    // Tính theo tháng hiện tại nếu không có startDate/endDate
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1); // Đầu tháng
    const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // Cuối tháng

    // Lấy tất cả rentals đã completed trong tháng có insuranceFee > 0
    // Sử dụng endDate để xác định tháng (vì endDate là khi rental hoàn thành)
    const rentals = await this.prismaService.rental.findMany({
      where: {
        status: RentalStatus.COMPLETED,
        insuranceFee: {
          gt: 0,
        },
        endDate: {
          gte: start,
          lte: end,
        },
        deletedAt: null,
      },
      include: {
        vehicle: {
          select: {
            type: true,
          },
        },
      },
    });

    // Tính tổng
    const totalInsuranceFee = rentals.reduce(
      (sum, rental) => sum.plus(rental.insuranceFee),
      new Decimal(0),
    );

    // Nhóm theo loại xe
    const byTypeMap = new Map<string, { count: number; totalFee: Decimal }>();

    rentals.forEach((rental) => {
      const type = rental.vehicle.type || 'Khác';
      const existing = byTypeMap.get(type) || {
        count: 0,
        totalFee: new Decimal(0),
      };
      byTypeMap.set(type, {
        count: existing.count + 1,
        totalFee: existing.totalFee.plus(rental.insuranceFee),
      });
    });

    const byVehicleType = Array.from(byTypeMap.entries()).map(
      ([type, data]) => ({
        type,
        count: data.count,
        totalFee: data.totalFee.toString(),
      }),
    );

    return {
      totalInsuranceFee: totalInsuranceFee.toString(),
      totalRentals: rentals.length,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      byVehicleType,
    };
  }
}

