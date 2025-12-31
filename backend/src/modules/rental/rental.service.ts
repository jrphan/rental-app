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
} from '@/types/rental.type';
import {
  RentalStatus,
  VehicleStatus,
  Prisma,
  AuditAction,
  AuditTargetType,
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
   * Kiểm tra xe có khả dụng trong khoảng thời gian không
   */
  private async checkVehicleAvailability(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeRentalId?: string,
  ): Promise<boolean> {
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

    // Check unavailabilities
    const hasUnavailability = vehicle.unavailabilities.some(
      unavailability =>
        unavailability.startDate <= endDate &&
        unavailability.endDate >= startDate,
    );

    if (hasUnavailability) {
      return false;
    }

    // Check existing rentals
    const hasConflict = vehicle.rentals.some(
      rental => rental.startDate <= endDate && rental.endDate >= startDate,
    );

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
  ): {
    durationMinutes: number;
    totalPrice: Decimal;
    depositPrice: Decimal;
    platformFee: Decimal;
    ownerEarning: Decimal;
  } {
    // Calculate duration in minutes
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const durationDays = Math.ceil(durationMinutes / (60 * 24)); // Round up to days

    // Calculate base price (days * price per day)
    const basePrice = pricePerDay.mul(durationDays);

    // insuranceFee passed in is already total for rental (rate * days) — treat as platform revenue (excluded from owner earning)
    const totalPrice = basePrice
      .plus(new Decimal(deliveryFee))
      .plus(new Decimal(insuranceFee))
      .minus(new Decimal(discountAmount));

    // Get deposit from vehicle
    const depositPrice = depositAmount || new Decimal(0);

    // Platform fee should be charged on rental revenue excluding insurance (since insurance goes to platform/partner)
    const revenueExcludingInsurance = totalPrice.minus(
      new Decimal(insuranceFee),
    );
    const platformFee = revenueExcludingInsurance.mul(this.PLATFORM_FEE_RATIO);

    // Owner earning = revenueExcludingInsurance - platformFee
    const ownerEarning = revenueExcludingInsurance.minus(platformFee);

    return {
      durationMinutes,
      totalPrice,
      depositPrice,
      platformFee,
      ownerEarning,
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

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (start >= end) {
      throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
    }

    if (start < new Date()) {
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

    // Calculate prices
    const priceCalculation = this.calculateRentalPrice(
      vehicle.pricePerDay,
      start,
      end,
      deliveryFee,
      discountAmount,
      insuranceFee ?? 0,
      vehicle.depositAmount,
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
        // persist deliveryAddress JSON (use undefined when absent and cast to Prisma.InputJsonValue)
        deliveryAddress: deliveryAddress
          ? (deliveryAddress as Prisma.InputJsonValue)
          : undefined,
        totalPrice: priceCalculation.totalPrice,
        depositPrice: priceCalculation.depositPrice,
        platformFeeRatio: this.PLATFORM_FEE_RATIO,
        platformFee: priceCalculation.platformFee,
        ownerEarning: priceCalculation.ownerEarning,
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
   * Tạo dispute (phàn nàn) cho rental
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
        title: 'Có phàn nàn về đơn thuê',
        message: `Đơn thuê ${rental.vehicle.brand} ${rental.vehicle.model} có phàn nàn mới`,
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
}
