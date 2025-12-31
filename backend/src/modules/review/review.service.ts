import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from '@/common/dto/Review/create-review.dto';
import { ReviewType, RentalStatus } from '@prisma/client';
import { AuditLogService } from '@/modules/audit/audit-log.service';
import { NotificationService } from '@/modules/notification/notification.service';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Tạo review cho rental
   */
  async createReview(rentalId: string, authorId: string, dto: CreateReviewDto) {
    // Kiểm tra rental có tồn tại không
    const rental = await this.prismaService.rental.findUnique({
      where: { id: rentalId },
      include: {
        renter: { select: { id: true, fullName: true } },
        owner: { select: { id: true, fullName: true } },
        vehicle: {
          select: {
            id: true,
            ownerId: true,
            brand: true,
            model: true,
            licensePlate: true,
          },
        },
      },
    });

    if (!rental) {
      throw new NotFoundException('Đơn thuê không tồn tại');
    }

    // Kiểm tra rental đã hoàn thành chưa
    if (rental.status !== RentalStatus.COMPLETED) {
      throw new BadRequestException(
        'Chỉ có thể đánh giá khi đơn thuê đã hoàn thành',
      );
    }

    // Kiểm tra quyền đánh giá
    if (dto.type === ReviewType.RENTER_TO_VEHICLE) {
      // Renter đánh giá xe (và gián tiếp đánh giá owner)
      if (rental.renterId !== authorId) {
        throw new ForbiddenException('Chỉ người thuê mới có thể đánh giá xe');
      }
    } else if (dto.type === ReviewType.OWNER_TO_RENTER) {
      // Owner đánh giá renter
      if (rental.ownerId !== authorId) {
        throw new ForbiddenException(
          'Chỉ chủ xe mới có thể đánh giá người thuê',
        );
      }
    }

    // Kiểm tra đã đánh giá chưa
    const existingReview = await this.prismaService.review.findUnique({
      where: {
        rentalId_authorId_type: {
          rentalId,
          authorId,
          type: dto.type,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('Bạn đã đánh giá cho đơn thuê này rồi');
    }

    // Tạo review
    const review = await this.prismaService.review.create({
      data: {
        rentalId,
        type: dto.type,
        authorId,
        rating: dto.rating,
        content: dto.content || null,
        // Xác định revieweeId và vehicleId dựa trên type
        ...(dto.type === ReviewType.RENTER_TO_VEHICLE
          ? {
              revieweeId: rental.ownerId, // Renter đánh giá owner
              vehicleId: rental.vehicleId, // Và đánh giá xe
            }
          : {
              revieweeId: rental.renterId, // Owner đánh giá renter
              vehicleId: null,
            }),
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
    });

    // Ghi audit log
    await this.auditLogService.log({
      actorId: authorId,
      action: 'CREATE',
      targetId: rentalId,
      targetType: 'RENTAL',
      metadata: {
        reviewId: review.id,
        type: dto.type,
        rating: dto.rating,
      },
    });

    // Gửi thông báo
    const notificationTargetId =
      dto.type === ReviewType.RENTER_TO_VEHICLE
        ? rental.ownerId
        : rental.renterId;

    // Tạo message chi tiết với rating và thông tin xe
    const vehicleInfo = `${rental.vehicle.brand} ${rental.vehicle.model} (${rental.vehicle.licensePlate})`;
    const ratingStars = '⭐'.repeat(dto.rating);
    const message =
      dto.type === ReviewType.RENTER_TO_VEHICLE
        ? `${rental.renter.fullName || 'Người thuê'} đã đánh giá xe ${vehicleInfo} của bạn ${ratingStars} (${dto.rating}/5)`
        : `${rental.owner.fullName || 'Chủ xe'} đã đánh giá bạn ${ratingStars} (${dto.rating}/5)`;

    await this.notificationService
      .createNotification({
        userId: notificationTargetId,
        title: 'Bạn có đánh giá mới',
        message,
        type: 'RENTAL_UPDATE',
        data: {
          rentalId,
          reviewId: review.id,
          rating: dto.rating,
          vehicleId: rental.vehicleId,
        },
      })
      .catch(error => {
        this.logger.error('Failed to send review notification', error);
      });

    this.logger.log(
      `Review created: ${review.id} for rental ${rentalId} by ${authorId}`,
    );

    return {
      message: 'Đánh giá đã được tạo thành công',
      review,
    };
  }

  /**
   * Lấy reviews của một rental (để kiểm tra đã đánh giá chưa)
   */
  async getRentalReviews(rentalId: string, userId?: string) {
    const rental = await this.prismaService.rental.findUnique({
      where: { id: rentalId },
      select: { id: true },
    });

    if (!rental) {
      throw new NotFoundException('Đơn thuê không tồn tại');
    }

    const reviews = await this.prismaService.review.findMany({
      where: { rentalId },
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

    // Kiểm tra user đã đánh giá chưa
    let userHasReviewed = false;
    if (userId) {
      userHasReviewed = reviews.some(review => review.authorId === userId);
    }

    return {
      reviews,
      userHasReviewed,
    };
  }

  /**
   * Xóa review (chỉ cho phép người tạo review xóa)
   */
  async deleteReview(reviewId: string, userId: string) {
    // Kiểm tra review có tồn tại không
    const review = await this.prismaService.review.findUnique({
      where: { id: reviewId },
      include: {
        rental: {
          select: {
            id: true,
            vehicleId: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    // Kiểm tra quyền: chỉ người tạo review mới được xóa
    if (review.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    // Xóa review
    await this.prismaService.review.delete({
      where: { id: reviewId },
    });

    // Ghi audit log
    await this.auditLogService
      .log({
        actorId: userId,
        action: 'DELETE',
        targetId: review.rental.id,
        targetType: 'RENTAL',
        metadata: {
          reviewId,
          type: review.type,
          rating: review.rating,
        },
      })
      .catch(error => {
        this.logger.error('Failed to log review deletion audit', error);
      });

    this.logger.log(`Review deleted: ${reviewId} by ${userId}`);

    return {
      message: 'Đánh giá đã được xóa thành công',
    };
  }
}
