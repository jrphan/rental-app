import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRentalDto } from '@/common/dto/Rental/create-rental.dto';
import { UpdateRentalStatusDto } from '@/common/dto/Rental/update-rental-status.dto';
import { UpdateRentalDisputeDto } from '@/common/dto/Rental/update-rental-dispute.dto';
import {
  UploadEvidenceDto,
  UploadMultipleEvidenceDto,
} from '@/common/dto/Rental/upload-evidence.dto';
import { CreateDisputeDto } from '@/common/dto/Rental/create-dispute.dto';
import {
  CreateRentalResponse,
  RentalListResponse,
  RentalDetailResponse,
  UpdateRentalStatusResponse,
  selectRental,
  AdminRentalListResponse,
  AdminRentalDetailResponse,
  selectAdminRental,
} from '@/types/rental.type';
import {
  RentalStatus,
  VehicleStatus,
  Prisma,
  AuditAction,
  AuditTargetType,
  UserRole,
} from '@prisma/client';
import { AuditLogService } from '@/modules/audit/audit-log.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { ChatService } from '@/modules/chat/chat.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class RentalService {
  private readonly logger = new Logger(RentalService.name);

  // Platform fee ratio (15%)
  private readonly PLATFORM_FEE_RATIO = new Decimal('0.15');

  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationService: NotificationService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * Normalize date to start of day (00:00:00) for date-only comparison
   */
  private normalizeDateToStartOfDay(date: Date): Date {
    const normalized = new Date(date);
    // normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  /**
   * Normalize date to end of day (23:59:59) for date-only comparison
   */
  private normalizeDateToEndOfDay(date: Date): Date {
    const normalized = new Date(date);
    // normalized.setHours(23, 59, 59, 999);
    return normalized;
  }

  /**
   * Kiểm tra xe có khả dụng trong khoảng thời gian không
   */
  private async checkVehicleAvailability(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeRentalId?: string,
  ): Promise<boolean> {
    // Normalize dates to start/end of day for date-only comparison
    const normalizedStart = this.normalizeDateToStartOfDay(startDate);
    const normalizedEnd = this.normalizeDateToEndOfDay(endDate);

    // Check vehicle status
    const vehicle = await this.prismaService.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        unavailabilities: true,
        rentals: {
          where: {
            status: {
              in: [
                RentalStatus.CONFIRMED,
                RentalStatus.ON_TRIP,
                RentalStatus.AWAIT_APPROVAL,
                RentalStatus.PENDING_PAYMENT,
              ],
            },
            ...(excludeRentalId ? { id: { not: excludeRentalId } } : {}),
          },
        },
      },
    });

    if (!vehicle || vehicle.status !== VehicleStatus.APPROVED) {
      return false;
    }

    // Check unavailabilities (date-only comparison)
    const hasUnavailability = vehicle.unavailabilities.some(unavailability => {
      const unavailStart = this.normalizeDateToStartOfDay(
        unavailability.startDate,
      );
      const unavailEnd = this.normalizeDateToEndOfDay(unavailability.endDate);
      return unavailStart <= normalizedEnd && unavailEnd >= normalizedStart;
    });

    if (hasUnavailability) {
      return false;
    }

    // Check existing rentals (date-only comparison)
    const hasConflict = vehicle.rentals.some(rental => {
      const rentalStart = this.normalizeDateToStartOfDay(rental.startDate);
      const rentalEnd = this.normalizeDateToEndOfDay(rental.endDate);
      return rentalStart <= normalizedEnd && rentalEnd >= normalizedStart;
    });

    return !hasConflict;
  }

  /**
   * Tính giá thuê xe
   */
  private calculateRentalPrice(
    pricePerDay: Decimal,
    startDate: Date,
    endDate: Date,
    deliveryFee: number = 0,
    discountAmount: number = 0,
    insuranceFee: number = 0,
    depositAmount?: Decimal,
    insuranceCommissionRatio?: Decimal,
  ): {
    durationMinutes: number;
    durationDays: number;
    baseRental: Decimal;
    totalPrice: Decimal;
    depositPrice: Decimal;
    platformFee: Decimal;
    ownerEarning: Decimal;
    platformEarning: Decimal;
    insuranceCommissionRatio: Decimal;
    insuranceCommissionAmount: Decimal;
    insurancePayableToPartner: Decimal;
  } {
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const durationDays = Math.ceil(durationMinutes / (60 * 24));

    // 1. Giá thuê gốc
    const baseRental = pricePerDay.mul(durationDays);

    // 2. Tổng tiền người thuê trả
    const totalPrice = baseRental
      .plus(new Decimal(deliveryFee))
      .plus(new Decimal(insuranceFee))
      .minus(new Decimal(discountAmount));

    // 3. Tiền cọc (không ảnh hưởng doanh thu)
    const depositPrice = depositAmount || new Decimal(0);

    // 4. Phí nền tảng (CHỈ tính trên tiền thuê xe)
    const platformFee = baseRental.mul(this.PLATFORM_FEE_RATIO);

    // 5. Thu nhập chủ xe
    const ownerEarning = baseRental
      .minus(platformFee)
      .plus(new Decimal(deliveryFee));

    // 6. Tính hoa hồng bảo hiểm
    const insuranceFeeDecimal = new Decimal(insuranceFee);
    const commissionRatio = insuranceCommissionRatio || new Decimal('0.20'); // Default 20%
    const insuranceCommissionAmount = insuranceFeeDecimal.mul(commissionRatio);
    const insurancePayableToPartner = insuranceFeeDecimal.minus(
      insuranceCommissionAmount,
    );

    // 7. Doanh thu platform thực (theo PRICING_BUSINESS_LOGIC.md)
    // platformEarning = platformFee - discountAmount + insuranceCommissionAmount
    const platformEarning = platformFee
      .minus(new Decimal(discountAmount))
      .plus(insuranceCommissionAmount);

    return {
      durationMinutes,
      durationDays,
      baseRental,
      totalPrice,
      depositPrice,
      platformFee,
      ownerEarning,
      platformEarning,
      insuranceCommissionRatio: commissionRatio,
      insuranceCommissionAmount,
      insurancePayableToPartner,
    };
  }

  /**
   * Tạo đơn thuê xe mới
   */
  async createRental(
    renterId: string,
    createRentalDto: CreateRentalDto,
  ): Promise<CreateRentalResponse> {
    const {
      vehicleId,
      startDate,
      endDate,
      deliveryFee = 0,
      discountAmount = 0,
      insuranceFee = 0,
      deliveryAddress = null,
    } = createRentalDto;

    // Parse dates and normalize to start/end of day (date-only, no time)
    const start = this.normalizeDateToStartOfDay(new Date(startDate));
    const end = this.normalizeDateToEndOfDay(new Date(endDate));

    // Validate dates - endDate must be >= startDate (allow same day rentals)
    // After normalization: start is 00:00:00 of startDate, end is 23:59:59 of endDate
    // So if same day: start (00:00:00) < end (23:59:59) = valid
    // If endDate is after startDate: start < end = valid
    // If endDate is before startDate: start >= end = invalid
    if (start >= end) {
      throw new BadRequestException(
        'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
      );
    }

    const today = this.normalizeDateToStartOfDay(new Date());
    if (start < today) {
      throw new BadRequestException('Ngày bắt đầu không được trong quá khứ');
    }

    // Get vehicle with owner info
    const vehicle = await this.prismaService.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        owner: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Không tìm thấy xe');
    }

    if (vehicle.status !== VehicleStatus.APPROVED) {
      throw new BadRequestException('Xe này không khả dụng để thuê');
    }

    if (vehicle.ownerId === renterId) {
      throw new BadRequestException('Bạn không thể thuê xe của chính mình');
    }

    if (!vehicle.owner.isActive) {
      throw new BadRequestException('Chủ xe không còn hoạt động');
    }

    // Check availability
    const isAvailable = await this.checkVehicleAvailability(
      vehicleId,
      start,
      end,
    );

    if (!isAvailable) {
      throw new BadRequestException(
        'Xe không khả dụng trong khoảng thời gian này',
      );
    }

    // Get insurance commission ratio from fee settings
    const feeSettings = await this.prismaService.feeSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { insuranceCommissionRatio: true },
    });

    const insuranceCommissionRatio =
      feeSettings?.insuranceCommissionRatio || new Decimal('0.20'); // Default 20%

    // Calculate prices
    const priceCalculation = this.calculateRentalPrice(
      vehicle.pricePerDay,
      start,
      end,
      deliveryFee,
      discountAmount,
      insuranceFee ?? 0,
      vehicle.depositAmount,
      insuranceCommissionRatio,
    );

    // Determine initial status
    // If instantBook is true, status should be PENDING_PAYMENT, otherwise AWAIT_APPROVAL
    // But since payment is not implemented yet, we'll use AWAIT_APPROVAL for now
    const initialStatus = vehicle.instantBook
      ? RentalStatus.PENDING_PAYMENT
      : RentalStatus.AWAIT_APPROVAL;

    // Create rental
    const rental = await this.prismaService.rental.create({
      data: {
        renterId,
        ownerId: vehicle.ownerId,
        vehicleId,
        startDate: start,
        endDate: end,
        durationMinutes: priceCalculation.durationMinutes,
        pricePerDay: vehicle.pricePerDay,
        deliveryFee: new Decimal(deliveryFee),
        insuranceFee: new Decimal(insuranceFee ?? 0),
        discountAmount: new Decimal(discountAmount),
        // Insurance commission tracking (snapshot tại thời điểm tạo đơn)
        insuranceCommissionRatio: priceCalculation.insuranceCommissionRatio,
        insuranceCommissionAmount: priceCalculation.insuranceCommissionAmount,
        insurancePayableToPartner: priceCalculation.insurancePayableToPartner,
        // persist deliveryAddress JSON (use undefined when absent and cast to Prisma.InputJsonValue)
        deliveryAddress: deliveryAddress
          ? (deliveryAddress as Prisma.InputJsonValue)
          : undefined,
        totalPrice: priceCalculation.totalPrice,
        depositPrice: priceCalculation.depositPrice,
        platformFeeRatio: this.PLATFORM_FEE_RATIO,
        platformFee: priceCalculation.platformFee,
        ownerEarning: priceCalculation.ownerEarning,
        platformEarning: priceCalculation.platformEarning,
        status: initialStatus,
      },
      select: selectRental,
    });

    // Log audit
    await this.auditLogService
      .log({
        actorId: renterId,
        action: AuditAction.CREATE,
        targetId: rental.id,
        targetType: AuditTargetType.RENTAL,
        metadata: {
          action: 'create_rental',
          vehicleId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          totalPrice: priceCalculation.totalPrice.toString(),
        },
      })
      .catch(error => {
        this.logger.error('Failed to log rental creation audit', error);
      });

    // Send notification to owner
    await this.notificationService
      .createNotification({
        userId: vehicle.ownerId,
        title: 'Có yêu cầu thuê xe mới',
        message: `Xe ${vehicle.brand} ${vehicle.model} của bạn có yêu cầu thuê mới`,
        type: 'RENTAL_UPDATE',
        data: {
          rentalId: rental.id,
          vehicleId,
        },
      })
      .catch(error => {
        this.logger.error('Failed to send notification to owner', error);
      });

    // Tạo chat cho rental
    await this.chatService
      .createChatForRental(rental.id, renterId, vehicle.ownerId)
      .catch(error => {
        this.logger.error('Failed to create chat for rental', error);
      });

    // Tạo VehicleUnavailability để đánh dấu thời gian không khả dụng
    // Chỉ tạo khi rental ở trạng thái AWAIT_APPROVAL hoặc PENDING_PAYMENT
    if (
      initialStatus === RentalStatus.AWAIT_APPROVAL ||
      initialStatus === RentalStatus.PENDING_PAYMENT
    ) {
      await this.prismaService.vehicleUnavailability
        .create({
          data: {
            vehicleId,
            startDate: start,
            endDate: end,
            reason: `Đơn thuê #${rental.id}`,
          },
        })
        .catch(error => {
          this.logger.error('Failed to create vehicle unavailability', error);
        });
    }

    return {
      message: vehicle.instantBook
        ? 'Đơn thuê đã được tạo, vui lòng thanh toán'
        : 'Đơn thuê đã được tạo, đang chờ chủ xe xác nhận',
      rental,
    };
  }

  /**
   * Lấy danh sách đơn thuê của user (renter hoặc owner)
   */
  async getMyRentals(
    userId: string,
    role: 'renter' | 'owner' | 'all',
    status?: RentalStatus,
  ): Promise<RentalListResponse> {
    const where: Prisma.RentalWhereInput = {
      deletedAt: null,
      ...(role === 'renter'
        ? { renterId: userId }
        : role === 'owner'
          ? { ownerId: userId }
          : {
              OR: [{ renterId: userId }, { ownerId: userId }],
            }),
      ...(status ? { status } : {}),
    };

    const rentals = await this.prismaService.rental.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: selectRental,
    });

    return {
      rentals,
      total: rentals.length,
    };
  }

  /**
   * Helper method to get rental by ID and verify access
   */
  private async getRentalById(rentalId: string, userId: string) {
    const rental = await this.prismaService.rental.findUnique({
      where: { id: rentalId },
      select: selectRental,
    });

    if (!rental) {
      throw new NotFoundException('Không tìm thấy đơn thuê');
    }

    // Check if user has access (must be renter or owner)
    if (rental.renterId !== userId && rental.ownerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập đơn thuê này');
    }

    return rental;
  }

  /**
   * Lấy chi tiết đơn thuê
   */
  async getRentalDetail(
    userId: string,
    rentalId: string,
  ): Promise<RentalDetailResponse> {
    const rental = await this.getRentalById(rentalId, userId);
    return { rental };
  }

  /**
   * Cập nhật trạng thái đơn thuê (chủ xe xác nhận/từ chối, hoặc hủy)
   */
  async updateRentalStatus(
    userId: string,
    rentalId: string,
    updateStatusDto: UpdateRentalStatusDto,
  ): Promise<UpdateRentalStatusResponse> {
    const { status, cancelReason } = updateStatusDto;

    const rental = await this.prismaService.rental.findUnique({
      where: { id: rentalId },
      include: {
        vehicle: true,
      },
    });

    if (!rental) {
      throw new NotFoundException('Không tìm thấy đơn thuê');
    }

    // Check permissions based on status transition
    const isOwner = rental.ownerId === userId;
    const isRenter = rental.renterId === userId;

    // Only owner can approve/reject (from AWAIT_APPROVAL)
    if (
      status === RentalStatus.CONFIRMED &&
      rental.status === RentalStatus.AWAIT_APPROVAL &&
      !isOwner
    ) {
      throw new ForbiddenException('Chỉ chủ xe mới có thể xác nhận đơn thuê');
    }

    // Both owner and renter can cancel (depending on current status)
    if (status === RentalStatus.CANCELLED) {
      if (!isOwner && !isRenter) {
        throw new ForbiddenException('Bạn không có quyền hủy đơn thuê này');
      }
    }

    // Validate status transition
    const validTransitions: Record<RentalStatus, RentalStatus[]> = {
      [RentalStatus.PENDING_PAYMENT]: [
        RentalStatus.AWAIT_APPROVAL,
        RentalStatus.CANCELLED,
      ],
      [RentalStatus.AWAIT_APPROVAL]: [
        RentalStatus.CONFIRMED,
        RentalStatus.CANCELLED,
      ],
      [RentalStatus.CONFIRMED]: [RentalStatus.ON_TRIP, RentalStatus.CANCELLED],
      [RentalStatus.ON_TRIP]: [RentalStatus.COMPLETED, RentalStatus.CANCELLED],
      [RentalStatus.COMPLETED]: [],
      [RentalStatus.CANCELLED]: [],
      [RentalStatus.DISPUTED]: [],
    };

    if (!validTransitions[rental.status]?.includes(status)) {
      throw new BadRequestException(
        `Không thể chuyển từ ${rental.status} sang ${status}`,
      );
    }

    // Update rental
    const updated = await this.prismaService.rental.update({
      where: { id: rentalId },
      data: {
        status,
        cancelReason: status === RentalStatus.CANCELLED ? cancelReason : null,
      },
      select: selectRental,
    });

    // Quản lý VehicleUnavailability dựa trên status
    // Nếu rental được xác nhận (CONFIRMED) và chưa có unavailability, tạo mới
    // Nếu rental bị hủy (CANCELLED), xóa unavailability liên quan
    if (status === RentalStatus.CONFIRMED) {
      // Kiểm tra xem đã có unavailability chưa (có thể đã tạo khi tạo rental)
      // Tìm bằng rentalId trong reason để tránh duplicate
      const normalizedStart = this.normalizeDateToStartOfDay(rental.startDate);
      const normalizedEnd = this.normalizeDateToEndOfDay(rental.endDate);

      const existingUnavailability =
        await this.prismaService.vehicleUnavailability.findFirst({
          where: {
            vehicleId: rental.vehicleId,
            reason: { contains: rental.id },
          },
        });

      if (!existingUnavailability) {
        // Tạo unavailability nếu chưa có
        await this.prismaService.vehicleUnavailability
          .create({
            data: {
              vehicleId: rental.vehicleId,
              startDate: normalizedStart,
              endDate: normalizedEnd,
              reason: `Đơn thuê #${rental.id}`,
            },
          })
          .catch(error => {
            this.logger.error(
              'Failed to create vehicle unavailability on confirm',
              error,
            );
          });
      }
    } else if (
      status === RentalStatus.CANCELLED ||
      status === RentalStatus.COMPLETED
    ) {
      // Xóa unavailability khi rental bị hủy hoặc hoàn thành
      await this.prismaService.vehicleUnavailability
        .deleteMany({
          where: {
            vehicleId: rental.vehicleId,
            reason: { contains: rental.id },
          },
        })
        .catch(error => {
          this.logger.error(
            'Failed to delete vehicle unavailability on cancel/completion',
            error,
          );
        });
    }

    // Log audit
    await this.auditLogService
      .log({
        actorId: userId,
        action: AuditAction.UPDATE,
        targetId: rental.id,
        targetType: AuditTargetType.RENTAL,
        metadata: {
          action: 'update_rental_status',
          oldStatus: rental.status,
          newStatus: status,
          cancelReason,
        },
      })
      .catch(error => {
        this.logger.error('Failed to log rental status update audit', error);
      });

    // Send notification
    const notifyUserId = isOwner ? rental.renterId : rental.ownerId;

    const statusMessages: Record<RentalStatus, string> = {
      [RentalStatus.PENDING_PAYMENT]: 'Đơn thuê đang chờ thanh toán',
      [RentalStatus.AWAIT_APPROVAL]: 'Đơn thuê đang chờ xác nhận',
      [RentalStatus.CONFIRMED]: 'Đơn thuê đã được xác nhận',
      [RentalStatus.ON_TRIP]: 'Đơn thuê đang diễn ra',
      [RentalStatus.COMPLETED]: 'Đơn thuê đã hoàn thành',
      [RentalStatus.CANCELLED]: 'Đơn thuê đã bị hủy',
      [RentalStatus.DISPUTED]: 'Đơn thuê đang có tranh chấp',
    };

    await this.notificationService
      .createNotification({
        userId: notifyUserId,
        title: 'Cập nhật đơn thuê',
        message:
          statusMessages[status] || 'Trạng thái đơn thuê đã được cập nhật',
        type: 'RENTAL_UPDATE',
        data: {
          rentalId: rental.id,
          status,
        },
      })
      .catch(error => {
        this.logger.error('Failed to send notification', error);
      });

    return {
      message: statusMessages[status] || 'Trạng thái đơn thuê đã được cập nhật',
      rental: updated,
    };
  }

  /**
   * Upload evidence (ảnh hiện trạng) cho rental
   */
  async uploadEvidence(
    rentalId: string,
    userId: string,
    dto: UploadEvidenceDto,
  ) {
    // Verify rental exists and user has access
    const rental = await this.getRentalById(rentalId, userId);

    // Only renter can upload pickup evidence, both can upload return evidence
    const isRenter = rental.renterId === userId;
    const isOwner = rental.ownerId === userId;

    if (!isRenter && !isOwner) {
      throw new ForbiddenException(
        'Bạn không có quyền upload evidence cho đơn thuê này',
      );
    }

    // Check if evidence type matches user role
    const isPickupType = dto.type.startsWith('PICKUP_');

    if (isPickupType && !isRenter) {
      throw new ForbiddenException(
        'Chỉ người thuê mới có thể upload ảnh khi nhận xe',
      );
    }

    // Create evidence
    const evidence = await this.prismaService.rentalEvidence.create({
      data: {
        rentalId,
        url: dto.url,
        type: dto.type,
        note: dto.note,
        order: dto.order || 0,
      },
    });

    // Update rental updatedAt
    await this.prismaService.rental.update({
      where: { id: rentalId },
      data: { updatedAt: new Date() },
    });

    return {
      message: 'Upload evidence thành công',
      evidence,
    };
  }

  /**
   * Upload multiple evidences
   */
  async uploadMultipleEvidences(
    rentalId: string,
    userId: string,
    dto: UploadMultipleEvidenceDto,
  ) {
    // Verify rental exists and user has access
    const rental = await this.getRentalById(rentalId, userId);

    const isRenter = rental.renterId === userId;
    const isOwner = rental.ownerId === userId;

    if (!isRenter && !isOwner) {
      throw new ForbiddenException(
        'Bạn không có quyền upload evidence cho đơn thuê này',
      );
    }

    // Validate and create evidences
    const evidences = await Promise.all(
      dto.evidences.map(async (evidenceData, index) => {
        const isPickupType = evidenceData.type.startsWith('PICKUP_');
        if (isPickupType && !isRenter) {
          throw new ForbiddenException(
            'Chỉ người thuê mới có thể upload ảnh khi nhận xe',
          );
        }

        return this.prismaService.rentalEvidence.create({
          data: {
            rentalId,
            url: evidenceData.url,
            type: evidenceData.type,
            note: evidenceData.note,
            order: evidenceData.order ?? index,
          },
        });
      }),
    );

    // Update rental updatedAt
    await this.prismaService.rental.update({
      where: { id: rentalId },
      data: { updatedAt: new Date() },
    });

    return {
      message: 'Upload evidences thành công',
      evidences,
    };
  }

  /**
   * Tạo dispute (khiếu nại) cho rental
   */
  async createDispute(rentalId: string, userId: string, dto: CreateDisputeDto) {
    // Verify rental exists and user has access
    const rental = await this.getRentalById(rentalId, userId);

    const isRenter = rental.renterId === userId;
    const isOwner = rental.ownerId === userId;

    if (!isRenter && !isOwner) {
      throw new ForbiddenException(
        'Bạn không có quyền tạo dispute cho đơn thuê này',
      );
    }

    // Check if rental is completed
    if (rental.status !== RentalStatus.COMPLETED) {
      throw new BadRequestException(
        'Chỉ có thể tạo dispute cho đơn thuê đã hoàn thành',
      );
    }

    // Check if dispute already exists
    const existingDispute = await this.prismaService.dispute.findUnique({
      where: { rentalId },
    });

    if (existingDispute) {
      throw new BadRequestException('Đơn thuê này đã có dispute');
    }

    // Create dispute
    const dispute = await this.prismaService.dispute.create({
      data: {
        rentalId,
        reason: dto.reason,
        description: dto.description,
        status: 'OPEN',
      },
    });

    // Update rental status to DISPUTED
    const updatedRental = await this.prismaService.rental.update({
      where: { id: rentalId },
      data: { status: RentalStatus.DISPUTED },
      select: selectRental,
    });

    // Send notification to the other party
    const otherPartyId = isRenter ? rental.ownerId : rental.renterId;
    await this.notificationService
      .createNotification({
        userId: otherPartyId,
        title: 'Có khiếu nại về đơn thuê',
        message: `Đơn thuê ${rental.vehicle.brand} ${rental.vehicle.model} có khiếu nại mới`,
        type: 'RENTAL_UPDATE',
        data: {
          rentalId,
          disputeId: dispute.id,
        },
      })
      .catch(error => {
        this.logger.error('Failed to send dispute notification', error);
      });

    return {
      message: 'Tạo dispute thành công',
      dispute,
      rental: updatedRental,
    };
  }

  // ==================== ADMIN METHODS ====================

  private async assertAdminOrSupport(userId: string): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPPORT) {
      throw new ForbiddenException('Bạn không có quyền truy cập');
    }
  }

  /**
   * Admin: Lấy danh sách đơn thuê với filters
   */
  async listRentals(
    adminId: string,
    status?: RentalStatus,
    hasDispute?: boolean,
    page: number = 1,
    limit: number = 20,
  ): Promise<AdminRentalListResponse> {
    await this.assertAdminOrSupport(adminId);

    const skip = (page - 1) * limit;

    const where: Prisma.RentalWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(hasDispute !== undefined && {
        dispute: hasDispute ? { isNot: null } : { is: null },
      }),
    };

    const [items, total] = await Promise.all([
      this.prismaService.rental.findMany({
        where,
        select: selectAdminRental,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prismaService.rental.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * Admin: Lấy chi tiết đơn thuê
   */
  async getRentalDetailAdmin(
    adminId: string,
    rentalId: string,
  ): Promise<AdminRentalDetailResponse> {
    await this.assertAdminOrSupport(adminId);

    const rental = await this.prismaService.rental.findUnique({
      where: { id: rentalId },
      select: selectAdminRental,
    });

    if (!rental) {
      throw new NotFoundException('Đơn thuê không tồn tại');
    }

    return rental;
  }

  /**
   * Admin: Cập nhật trạng thái tranh chấp (dispute) của một rental
   */
  async updateRentalDisputeAdmin(
    adminId: string,
    rentalId: string,
    dto: UpdateRentalDisputeDto,
  ) {
    await this.assertAdminOrSupport(adminId);

    const rental = await this.prismaService.rental.findUnique({
      where: { id: rentalId },
      include: { dispute: true },
    });

    if (!rental) {
      throw new NotFoundException('Không tìm thấy đơn thuê');
    }

    if (!rental.dispute) {
      throw new BadRequestException('Đơn thuê này không có tranh chấp');
    }

    const { status, adminNotes } = dto;

    const isResolved =
      status === 'RESOLVED_REFUND' || status === 'RESOLVED_NO_REFUND';
    const isClosed = isResolved || status === 'CANCELLED';

    const updatedDispute = await this.prismaService.dispute.update({
      where: { id: rental.dispute.id },
      data: {
        status,
        adminNotes: adminNotes?.trim() ? adminNotes.trim() : null,
        resolvedBy: isClosed ? adminId : null,
        resolvedAt: isClosed ? new Date() : null,
      },
    });

    await this.auditLogService
      .log({
        actorId: adminId,
        action: AuditAction.UPDATE,
        targetId: rental.id,
        targetType: AuditTargetType.RENTAL,
        metadata: {
          action: 'admin_update_rental_dispute',
          disputeId: updatedDispute.id,
          oldStatus: rental.dispute.status,
          newStatus: status,
          adminNotes: adminNotes?.trim() || null,
        },
      })
      .catch(error => {
        this.logger.error('Failed to log admin dispute update audit', error);
      });

    return {
      message: 'Cập nhật tranh chấp thành công',
      dispute: updatedDispute,
    };
  }

  /**
   * Admin: Cập nhật trạng thái đơn thuê
   * Cho phép admin chuyển đơn tranh chấp đã giải quyết thành hoàn thành
   */
  async updateRentalStatusAdmin(
    adminId: string,
    rentalId: string,
    updateStatusDto: UpdateRentalStatusDto,
  ): Promise<UpdateRentalStatusResponse> {
    await this.assertAdminOrSupport(adminId);

    const { status, cancelReason } = updateStatusDto;

    const rental = await this.prismaService.rental.findUnique({
      where: { id: rentalId },
      include: {
        dispute: true,
        vehicle: true,
      },
    });

    if (!rental) {
      throw new NotFoundException('Không tìm thấy đơn thuê');
    }

    // Validate status transition for admin
    // Admin có thể chuyển từ DISPUTED sang COMPLETED hoặc CANCELLED
    if (rental.status === RentalStatus.DISPUTED) {
      if (!rental.dispute) {
        throw new BadRequestException('Đơn thuê này không có tranh chấp');
      }

      if (status === RentalStatus.COMPLETED) {
        // Chỉ cho phép chuyển sang COMPLETED nếu dispute đã được giải quyết
        const resolvedStatuses = ['RESOLVED_REFUND', 'RESOLVED_NO_REFUND'];
        if (!resolvedStatuses.includes(rental.dispute.status)) {
          throw new BadRequestException(
            'Chỉ có thể chuyển đơn tranh chấp đã giải quyết thành hoàn thành',
          );
        }
      } else if (status === RentalStatus.CANCELLED) {
        // Admin có thể hủy đơn tranh chấp bất kỳ lúc nào
        // Không cần kiểm tra dispute status
      } else {
        throw new BadRequestException(
          `Không thể chuyển từ ${rental.status} sang ${status}`,
        );
      }
    } else {
      // Các chuyển đổi khác cần tuân theo logic thông thường
      const validTransitions: Record<RentalStatus, RentalStatus[]> = {
        [RentalStatus.PENDING_PAYMENT]: [
          RentalStatus.AWAIT_APPROVAL,
          RentalStatus.CANCELLED,
        ],
        [RentalStatus.AWAIT_APPROVAL]: [
          RentalStatus.CONFIRMED,
          RentalStatus.CANCELLED,
        ],
        [RentalStatus.CONFIRMED]: [
          RentalStatus.ON_TRIP,
          RentalStatus.CANCELLED,
        ],
        [RentalStatus.ON_TRIP]: [
          RentalStatus.COMPLETED,
          RentalStatus.CANCELLED,
        ],
        [RentalStatus.COMPLETED]: [],
        [RentalStatus.CANCELLED]: [],
        [RentalStatus.DISPUTED]: [RentalStatus.COMPLETED, RentalStatus.CANCELLED], // Admin có thể chuyển từ DISPUTED sang COMPLETED hoặc CANCELLED
      };

      if (!validTransitions[rental.status]?.includes(status)) {
        throw new BadRequestException(
          `Không thể chuyển từ ${rental.status} sang ${status}`,
        );
      }
    }

    // Update rental
    const updated = await this.prismaService.rental.update({
      where: { id: rentalId },
      data: {
        status,
        cancelReason: status === RentalStatus.CANCELLED ? cancelReason : null,
      },
      select: selectRental,
    });

    // Quản lý VehicleUnavailability dựa trên status
    // Nếu rental bị hủy (CANCELLED) hoặc hoàn thành (COMPLETED), xóa unavailability liên quan
    if (
      status === RentalStatus.CANCELLED ||
      status === RentalStatus.COMPLETED
    ) {
      // Xóa unavailability khi rental bị hủy hoặc hoàn thành
      await this.prismaService.vehicleUnavailability
        .deleteMany({
          where: {
            vehicleId: rental.vehicleId,
            reason: { contains: rental.id },
          },
        })
        .catch(error => {
          this.logger.error(
            'Failed to delete vehicle unavailability on cancel/completion',
            error,
          );
        });
    }

    // Log audit
    await this.auditLogService
      .log({
        actorId: adminId,
        action: AuditAction.UPDATE,
        targetId: rental.id,
        targetType: AuditTargetType.RENTAL,
        metadata: {
          action: 'admin_update_rental_status',
          oldStatus: rental.status,
          newStatus: status,
          cancelReason,
        },
      })
      .catch(error => {
        this.logger.error(
          'Failed to log admin rental status update audit',
          error,
        );
      });

    // Send notification to both renter and owner
    const statusMessages: Record<RentalStatus, string> = {
      [RentalStatus.PENDING_PAYMENT]: 'Đơn thuê đang chờ thanh toán',
      [RentalStatus.AWAIT_APPROVAL]: 'Đơn thuê đang chờ xác nhận',
      [RentalStatus.CONFIRMED]: 'Đơn thuê đã được xác nhận',
      [RentalStatus.ON_TRIP]: 'Đơn thuê đang diễn ra',
      [RentalStatus.COMPLETED]: 'Đơn thuê đã hoàn thành',
      [RentalStatus.CANCELLED]: 'Đơn thuê đã bị hủy',
      [RentalStatus.DISPUTED]: 'Đơn thuê đang có tranh chấp',
    };

    // Notify renter
    await this.notificationService
      .createNotification({
        userId: rental.renterId,
        title: 'Cập nhật đơn thuê',
        message:
          statusMessages[status] ||
          'Trạng thái đơn thuê đã được cập nhật bởi quản trị viên',
        type: 'RENTAL_UPDATE',
        data: {
          rentalId: rental.id,
          status,
        },
      })
      .catch(error => {
        this.logger.error('Failed to send notification to renter', error);
      });

    // Notify owner
    await this.notificationService
      .createNotification({
        userId: rental.ownerId,
        title: 'Cập nhật đơn thuê',
        message:
          statusMessages[status] ||
          'Trạng thái đơn thuê đã được cập nhật bởi quản trị viên',
        type: 'RENTAL_UPDATE',
        data: {
          rentalId: rental.id,
          status,
        },
      })
      .catch(error => {
        this.logger.error('Failed to send notification to owner', error);
      });

    return {
      message: statusMessages[status] || 'Trạng thái đơn thuê đã được cập nhật',
      rental: updated,
    };
  }
}
