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
  RevenueResponse,
  PendingCommissionAlertsResponse,
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
   * Lấy tuần trước (thứ 2 tuần trước đến chủ nhật tuần trước)
   */
  private getLastWeekRange(): { weekStart: Date; weekEnd: Date } {
    const now = new Date();
    const { weekStart: currentWeekStart } = this.getWeekRange(now);

    // Tuần trước = tuần hiện tại - 7 ngày
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(currentWeekStart.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);

    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
    lastWeekEnd.setHours(23, 59, 59, 999);

    return { weekStart: lastWeekStart, weekEnd: lastWeekEnd };
  }

  /**
   * Kiểm tra xem có đang trong thời gian yêu cầu thanh toán không (thứ 2-4 hằng tuần)
   */
  private isPaymentRequestPeriod(): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Thứ 2 = 1, Thứ 3 = 2, Thứ 4 = 3
    return dayOfWeek >= 1 && dayOfWeek <= 3;
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
      select: {
        pricePerDay: true,
        durationMinutes: true,
        deliveryFee: true,
        platformFeeRatio: true,
      },
    });

    // Tính lại ownerEarning và platformFee từ dữ liệu rental
    // Vì dữ liệu cũ trong database có thể đã trừ platformFee rồi
    // Nên cần tính lại: ownerEarning = baseRental + deliveryFee (không trừ platformFee)
    let totalEarning = new Decimal(0);
    let totalPlatformFee = new Decimal(0);

    for (const rental of completedRentals) {
      // Tính baseRental từ pricePerDay và durationDays
      const durationDays = Math.ceil(rental.durationMinutes / (60 * 24));
      const baseRental = rental.pricePerDay.mul(durationDays);

      // Tính platformFee = baseRental × platformFeeRatio
      const platformFee = baseRental.mul(
        rental.platformFeeRatio || new Decimal('0.15'),
      );

      // Tính ownerEarning mới = baseRental + deliveryFee (KHÔNG trừ platformFee)
      // Đảm bảo KHÔNG trừ platformFee trong totalEarning
      const deliveryFee = rental.deliveryFee || new Decimal(0);
      const ownerEarning = baseRental.plus(deliveryFee);

      totalEarning = totalEarning.plus(ownerEarning);
      totalPlatformFee = totalPlatformFee.plus(platformFee);
    }

    // Commission = platformFee (thu ở phần chiết khấu thay vì trừ trực tiếp trong ownerEarning)
    const commissionAmount = totalPlatformFee;

    // Lấy commission rate để hiển thị
    const settings = await this.getCommissionSettings();
    const commissionRate = new Decimal(settings.commissionRate);

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

    // Recalculate commission cho mỗi item để đảm bảo dữ liệu mới nhất
    const recalculatedItems = await Promise.all(
      items.map(async item => {
        // Recalculate commission cho tuần này
        const recalculated = await this.calculateWeeklyCommission(
          ownerId,
          item.weekStartDate,
        );
        // Giữ payment từ item cũ
        return {
          ...recalculated,
          payment: item.payment,
        };
      }),
    );

    return {
      items: recalculatedItems.map(item => ({
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
   * Owner: Lấy commission của tuần trước (thứ 2 tuần trước đến chủ nhật tuần trước)
   */
  async getCurrentWeekCommission(
    ownerId: string,
  ): Promise<OwnerCommissionResponse | null> {
    // Lấy tuần trước (thứ 2 tuần trước đến chủ nhật tuần trước)
    const { weekStart } = this.getLastWeekRange();

    // Tính toán commission cho tuần trước
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

  /**
   * Owner: Lấy doanh thu theo khoảng thời gian
   */
  async getOwnerRevenue(
    ownerId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
    offset: number = 0,
  ): Promise<RevenueResponse> {
    const where: any = {
      ownerId,
      status: RentalStatus.COMPLETED,
      deletedAt: null,
    };

    // Filter theo khoảng thời gian (dựa trên endDate của rental)
    if (startDate || endDate) {
      where.endDate = {};
      if (startDate) {
        where.endDate.gte = startDate;
      }
      if (endDate) {
        // Set endDate về cuối ngày
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.endDate.lte = endOfDay;
      }
    }

    const [rentals, total, revenueStats] = await Promise.all([
      this.prismaService.rental.findMany({
        where,
        select: {
          id: true,
          vehicleId: true,
          startDate: true,
          endDate: true,
          ownerEarning: true,
          totalPrice: true,
          platformFee: true,
          platformFeeRatio: true,
          deliveryFee: true,
          insuranceFee: true,
          discountAmount: true,
          status: true,
          createdAt: true,
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
            },
          },
        },
        orderBy: { endDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prismaService.rental.count({ where }),
      this.prismaService.rental.aggregate({
        where,
        _sum: {
          ownerEarning: true,
          totalPrice: true,
        },
      }),
    ]);

    const totalRevenue = revenueStats._sum.totalPrice || new Decimal(0);
    const totalEarning = revenueStats._sum.ownerEarning || new Decimal(0);

    // Tính lại ownerEarning theo đúng công thức trong PRICING_BUSINESS_LOGIC.md
    // ownerEarning = baseRental - platformFee + deliveryFee
    // Trong đó: baseRental có thể tính từ totalPrice
    // totalPrice = baseRental + deliveryFee + insuranceFee - discountAmount
    // => baseRental = totalPrice - deliveryFee - insuranceFee + discountAmount
    // => ownerEarning = (totalPrice - deliveryFee - insuranceFee + discountAmount) - platformFee + deliveryFee
    // => ownerEarning = totalPrice - insuranceFee + discountAmount - platformFee

    const validatedItems = rentals.map(rental => {
      const platformFee = rental.platformFee || new Decimal(0);
      const insuranceFee = rental.insuranceFee || new Decimal(0);
      const discountAmount = rental.discountAmount || new Decimal(0);

      // Tính lại ownerEarning theo công thức chuẩn
      // ownerEarning = totalPrice - insuranceFee + discountAmount - platformFee
      let ownerEarning = rental.totalPrice
        .minus(insuranceFee)
        .plus(discountAmount)
        .minus(platformFee);

      // Validate: ownerEarning không được âm và không được lớn hơn totalPrice
      if (ownerEarning.lt(0)) {
        ownerEarning = new Decimal(0);
      }
      if (ownerEarning.gt(rental.totalPrice)) {
        // Nếu vẫn sai, có thể do dữ liệu không đầy đủ
        // Dùng giá trị từ database nếu hợp lý, nếu không thì tính lại
        if (rental.ownerEarning.lte(rental.totalPrice)) {
          ownerEarning = rental.ownerEarning;
        } else {
          // Fallback: ước tính ownerEarning = totalPrice - platformFee (giả sử không có insurance và discount)
          ownerEarning = rental.totalPrice.minus(platformFee);
          if (ownerEarning.lt(0)) {
            ownerEarning = rental.totalPrice.mul(new Decimal('0.85')); // 85% nếu platformFee = 15%
          }
        }
      }

      return {
        id: rental.id,
        vehicleId: rental.vehicleId,
        vehicleBrand: rental.vehicle.brand,
        vehicleModel: rental.vehicle.model,
        startDate: rental.startDate.toISOString(),
        endDate: rental.endDate.toISOString(),
        ownerEarning: ownerEarning.toString(),
        totalPrice: rental.totalPrice.toString(),
        platformFee: platformFee.toString(),
        deliveryFee: rental.deliveryFee.toString(),
        insuranceFee: insuranceFee.toString(),
        discountAmount: discountAmount.toString(),
        status: rental.status,
        createdAt: rental.createdAt.toISOString(),
      };
    });

    // Tính lại totalEarning từ validated items
    const validatedTotalEarning = validatedItems.reduce(
      (sum, item) => sum.plus(new Decimal(item.ownerEarning)),
      new Decimal(0),
    );

    return {
      items: validatedItems,
      total,
      totalRevenue: totalRevenue.toString(),
      totalEarning: validatedTotalEarning.toString(),
    };
  }

  /**
   * Admin: Lấy danh sách commission chưa thanh toán cần cảnh báo
   * Commission cần cảnh báo khi:
   * - paymentStatus = PENDING
   * - commissionAmount > 0
   * - Thuộc tuần trước (thứ 2 tuần trước đến chủ nhật tuần trước)
   */
  async getPendingCommissionAlerts(
    adminId: string,
  ): Promise<PendingCommissionAlertsResponse> {
    await this.assertAdmin(adminId);

    const now = new Date();
    const { weekStart: lastWeekStart } = this.getLastWeekRange();

    // Lấy tất cả commission của tuần trước chưa thanh toán
    const pendingCommissions =
      await this.prismaService.ownerCommission.findMany({
        where: {
          weekStartDate: lastWeekStart,
          paymentStatus: CommissionPaymentStatus.PENDING,
          commissionAmount: {
            gt: 0,
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
        },
        orderBy: { commissionAmount: 'desc' },
      });

    // Tính toán thời gian quá hạn
    // Thời gian yêu cầu thanh toán: thứ 2-4 của tuần hiện tại
    const { weekStart: currentWeekStart } = this.getWeekRange(now);
    const paymentDeadline = new Date(currentWeekStart); // Thứ 2 tuần hiện tại
    paymentDeadline.setDate(currentWeekStart.getDate() + 2); // Thứ 4 (thứ 2 + 2 ngày)
    paymentDeadline.setHours(23, 59, 59, 999);

    const items = pendingCommissions.map(commission => {
      const isOverdue = now > paymentDeadline;
      const daysOverdue = isOverdue
        ? Math.floor(
            (now.getTime() - paymentDeadline.getTime()) / (1000 * 60 * 60 * 24),
          )
        : undefined;

      return {
        id: commission.id,
        ownerId: commission.ownerId,
        ownerName: commission.owner.fullName,
        ownerPhone: commission.owner.phone,
        weekStartDate: commission.weekStartDate.toISOString(),
        weekEndDate: commission.weekEndDate.toISOString(),
        commissionAmount: commission.commissionAmount.toString(),
        totalEarning: commission.totalEarning.toString(),
        rentalCount: commission.rentalCount,
        paymentStatus: commission.paymentStatus,
        isOverdue,
        daysOverdue,
      };
    });

    const overdueCount = items.filter(item => item.isOverdue).length;

    return {
      items,
      total: items.length,
      overdueCount,
    };
  }
}
