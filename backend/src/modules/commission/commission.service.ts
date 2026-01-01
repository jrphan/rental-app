import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import {
  CommissionSettingsResponse,
  OwnerCommissionResponse,
  OwnerCommissionListResponse,
  CommissionPaymentResponse,
  AdminCommissionPaymentListResponse,
} from '@/types/commission.type';
import {
  CommissionPaymentStatus,
  RentalStatus,
  UserRole,
  OwnerCommission,
} from '@prisma/client';
import { UpdateCommissionSettingsDto } from '@/common/dto/Commission/update-commission-settings.dto';
import { UploadInvoiceDto } from '@/common/dto/Commission/upload-invoice.dto';
import { ReviewPaymentDto } from '@/common/dto/Commission/review-payment.dto';

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(private readonly prismaService: PrismaService) {}

  private async assertAdmin(userId: string): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền truy cập');
    }
  }

  /**
   * Tính ngày đầu tuần (Thứ 2) và cuối tuần (Chủ nhật)
   */
  private getWeekRange(date: Date): { weekStart: Date; weekEnd: Date } {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday

    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
  }

  /**
   * Lấy commission settings hiện tại (active)
   */
  async getCommissionSettings(): Promise<CommissionSettingsResponse> {
    const settings = await this.prismaService.commissionSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      // Nếu chưa có settings, tạo default 15%
      const defaultSettings =
        await this.prismaService.commissionSettings.create({
          data: {
            commissionRate: new Decimal('0.15'),
            isActive: true,
          },
        });

      return {
        id: defaultSettings.id,
        commissionRate: defaultSettings.commissionRate.toString(),
        isActive: defaultSettings.isActive,
        createdAt: defaultSettings.createdAt.toISOString(),
        updatedAt: defaultSettings.updatedAt.toISOString(),
      };
    }

    return {
      id: settings.id,
      commissionRate: settings.commissionRate.toString(),
      isActive: settings.isActive,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  /**
   * Admin: Cập nhật commission settings
   */
  async updateCommissionSettings(
    adminId: string,
    dto: UpdateCommissionSettingsDto,
  ): Promise<CommissionSettingsResponse> {
    await this.assertAdmin(adminId);

    // Deactivate all existing settings
    await this.prismaService.commissionSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new active settings
    const newSettings = await this.prismaService.commissionSettings.create({
      data: {
        commissionRate: new Decimal(dto.commissionRate),
        isActive: true,
        createdBy: adminId,
      },
    });

    return {
      id: newSettings.id,
      commissionRate: newSettings.commissionRate.toString(),
      isActive: newSettings.isActive,
      createdAt: newSettings.createdAt.toISOString(),
      updatedAt: newSettings.updatedAt.toISOString(),
    };
  }

  /**
   * Tính toán và tạo commission record cho tuần của owner
   * Được gọi khi rental completed hoặc vào cuối tuần
   */
  async calculateWeeklyCommission(
    ownerId: string,
    weekStartDate: Date,
  ): Promise<OwnerCommission> {
    const { weekStart, weekEnd } = this.getWeekRange(weekStartDate);

    // Lấy completed rentals trong tuần
    // Query rentals COMPLETED mà có endDate trong tuần (vì endDate là khi rental kết thúc)
    const completedRentals = await this.prismaService.rental.findMany({
      where: {
        ownerId,
        status: RentalStatus.COMPLETED,
        endDate: {
          gte: weekStart,
          lte: weekEnd,
        },
        deletedAt: null,
      },
    });

    // Tính tổng ownerEarning
    const totalEarning = completedRentals.reduce(
      (sum, rental) => sum.plus(rental.ownerEarning),
      new Decimal(0),
    );

    // Lấy commission rate hiện tại
    const settings = await this.getCommissionSettings();
    const commissionRate = new Decimal(settings.commissionRate);
    const commissionAmount = totalEarning.mul(commissionRate);

    // Tạo hoặc update commission record
    const commission = await this.prismaService.ownerCommission.upsert({
      where: {
        ownerId_weekStartDate: {
          ownerId,
          weekStartDate: weekStart,
        },
      },
      update: {
        totalEarning,
        commissionRate,
        commissionAmount,
        rentalCount: completedRentals.length,
      },
      create: {
        ownerId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        totalEarning,
        commissionRate,
        commissionAmount,
        rentalCount: completedRentals.length,
        paymentStatus: CommissionPaymentStatus.PENDING,
      },
    });

    return commission;
  }

  /**
   * Owner: Lấy danh sách commission của mình
   */
  async getOwnerCommissions(
    ownerId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<OwnerCommissionListResponse> {
    const [items, total] = await Promise.all([
      this.prismaService.ownerCommission.findMany({
        where: { ownerId },
        include: {
          payment: true,
        },
        orderBy: { weekStartDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prismaService.ownerCommission.count({ where: { ownerId } }),
    ]);

    return {
      items: items.map(item => ({
        id: item.id,
        weekStartDate: item.weekStartDate.toISOString(),
        weekEndDate: item.weekEndDate.toISOString(),
        totalEarning: item.totalEarning.toString(),
        commissionRate: item.commissionRate.toString(),
        commissionAmount: item.commissionAmount.toString(),
        rentalCount: item.rentalCount,
        paymentStatus: item.paymentStatus,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        payment: item.payment
          ? {
              id: item.payment.id,
              commissionId: item.payment.commissionId,
              ownerId: item.payment.ownerId,
              amount: item.payment.amount.toString(),
              invoiceUrl: item.payment.invoiceUrl,
              status: item.payment.status,
              adminNotes: item.payment.adminNotes,
              paidAt: item.payment.paidAt?.toISOString() || null,
              reviewedBy: item.payment.reviewedBy,
              reviewedAt: item.payment.reviewedAt?.toISOString() || null,
              createdAt: item.payment.createdAt.toISOString(),
              updatedAt: item.payment.updatedAt.toISOString(),
            }
          : undefined,
      })),
      total,
    };
  }

  /**
   * Owner: Lấy commission của tuần hiện tại
   */
  async getCurrentWeekCommission(
    ownerId: string,
  ): Promise<OwnerCommissionResponse | null> {
    const now = new Date();
    const { weekStart } = this.getWeekRange(now);

    // Tính toán commission cho tuần hiện tại
    await this.calculateWeeklyCommission(ownerId, weekStart);

    const commission = await this.prismaService.ownerCommission.findUnique({
      where: {
        ownerId_weekStartDate: {
          ownerId,
          weekStartDate: weekStart,
        },
      },
      include: {
        payment: true,
      },
    });

    if (!commission) {
      return null;
    }

    return {
      id: commission.id,
      weekStartDate: commission.weekStartDate.toISOString(),
      weekEndDate: commission.weekEndDate.toISOString(),
      totalEarning: commission.totalEarning.toString(),
      commissionRate: commission.commissionRate.toString(),
      commissionAmount: commission.commissionAmount.toString(),
      rentalCount: commission.rentalCount,
      paymentStatus: commission.paymentStatus,
      createdAt: commission.createdAt.toISOString(),
      updatedAt: commission.updatedAt.toISOString(),
      payment: commission.payment
        ? {
            id: commission.payment.id,
            commissionId: commission.payment.commissionId,
            ownerId: commission.payment.ownerId,
            amount: commission.payment.amount.toString(),
            invoiceUrl: commission.payment.invoiceUrl,
            status: commission.payment.status,
            adminNotes: commission.payment.adminNotes,
            paidAt: commission.payment.paidAt?.toISOString() || null,
            reviewedBy: commission.payment.reviewedBy,
            reviewedAt: commission.payment.reviewedAt?.toISOString() || null,
            createdAt: commission.payment.createdAt.toISOString(),
            updatedAt: commission.payment.updatedAt.toISOString(),
          }
        : undefined,
    };
  }

  /**
   * Owner: Tạo payment request và upload invoice
   */
  async createPaymentRequest(
    ownerId: string,
    commissionId: string,
    dto: UploadInvoiceDto,
  ): Promise<CommissionPaymentResponse> {
    // Kiểm tra commission thuộc về owner
    const commission = await this.prismaService.ownerCommission.findUnique({
      where: { id: commissionId },
    });

    if (!commission) {
      throw new NotFoundException('Commission không tồn tại');
    }

    if (commission.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập commission này',
      );
    }

    if (commission.commissionAmount.lte(0)) {
      throw new BadRequestException('Số tiền commission phải lớn hơn 0');
    }

    // Kiểm tra file tồn tại
    const file = await this.prismaService.userFile.findUnique({
      where: { id: dto.invoiceFileId },
    });

    if (!file || file.userId !== ownerId) {
      throw new NotFoundException('File không tồn tại');
    }

    // Tạo hoặc update payment
    const payment = await this.prismaService.commissionPayment.upsert({
      where: { commissionId },
      update: {
        invoiceFileId: dto.invoiceFileId,
        invoiceUrl: file.url,
        status: CommissionPaymentStatus.PAID,
        paidAt: new Date(),
      },
      create: {
        commissionId,
        ownerId,
        amount: commission.commissionAmount,
        invoiceFileId: dto.invoiceFileId,
        invoiceUrl: file.url,
        status: CommissionPaymentStatus.PAID,
        paidAt: new Date(),
      },
    });

    // Update commission status
    await this.prismaService.ownerCommission.update({
      where: { id: commissionId },
      data: { paymentStatus: CommissionPaymentStatus.PAID },
    });

    return {
      id: payment.id,
      commissionId: payment.commissionId,
      ownerId: payment.ownerId,
      amount: payment.amount.toString(),
      invoiceUrl: payment.invoiceUrl,
      status: payment.status,
      adminNotes: payment.adminNotes,
      paidAt: payment.paidAt?.toISOString() || null,
      reviewedBy: payment.reviewedBy,
      reviewedAt: payment.reviewedAt?.toISOString() || null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }

  /**
   * Admin: Lấy danh sách payments cần review
   */
  async getPendingPayments(
    adminId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<AdminCommissionPaymentListResponse> {
    await this.assertAdmin(adminId);

    const [items, total] = await Promise.all([
      this.prismaService.commissionPayment.findMany({
        where: {
          status: CommissionPaymentStatus.PAID, // Chỉ lấy những payment đã upload invoice
        },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
          commission: {
            select: {
              weekStartDate: true,
              weekEndDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prismaService.commissionPayment.count({
        where: { status: CommissionPaymentStatus.PAID },
      }),
    ]);

    return {
      items: items.map(item => ({
        id: item.id,
        commissionId: item.commissionId,
        ownerId: item.ownerId,
        amount: item.amount.toString(),
        invoiceUrl: item.invoiceUrl,
        status: item.status,
        adminNotes: item.adminNotes,
        paidAt: item.paidAt?.toISOString() || null,
        reviewedBy: item.reviewedBy,
        reviewedAt: item.reviewedAt?.toISOString() || null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        owner: {
          id: item.owner.id,
          fullName: item.owner.fullName,
          phone: item.owner.phone,
        },
        commission: {
          weekStartDate: item.commission.weekStartDate.toISOString(),
          weekEndDate: item.commission.weekEndDate.toISOString(),
        },
      })),
      total,
    };
  }

  /**
   * Admin: Review payment (approve hoặc reject)
   */
  async reviewPayment(
    adminId: string,
    paymentId: string,
    dto: ReviewPaymentDto,
  ): Promise<CommissionPaymentResponse> {
    await this.assertAdmin(adminId);

    const payment = await this.prismaService.commissionPayment.findUnique({
      where: { id: paymentId },
      include: { commission: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment không tồn tại');
    }

    if (payment.status !== CommissionPaymentStatus.PAID) {
      throw new BadRequestException('Payment không ở trạng thái PAID');
    }

    if (
      dto.status !== CommissionPaymentStatus.APPROVED &&
      dto.status !== CommissionPaymentStatus.REJECTED
    ) {
      throw new BadRequestException('Status phải là APPROVED hoặc REJECTED');
    }

    // Update payment
    const updatedPayment = await this.prismaService.commissionPayment.update({
      where: { id: paymentId },
      data: {
        status: dto.status,
        adminNotes: dto.adminNotes || null,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // Update commission status
    await this.prismaService.ownerCommission.update({
      where: { id: payment.commissionId },
      data: { paymentStatus: dto.status },
    });

    return {
      id: updatedPayment.id,
      commissionId: updatedPayment.commissionId,
      ownerId: updatedPayment.ownerId,
      amount: updatedPayment.amount.toString(),
      invoiceUrl: updatedPayment.invoiceUrl,
      status: updatedPayment.status,
      adminNotes: updatedPayment.adminNotes,
      paidAt: updatedPayment.paidAt?.toISOString() || null,
      reviewedBy: updatedPayment.reviewedBy,
      reviewedAt: updatedPayment.reviewedAt?.toISOString() || null,
      createdAt: updatedPayment.createdAt.toISOString(),
      updatedAt: updatedPayment.updatedAt.toISOString(),
    };
  }
}
