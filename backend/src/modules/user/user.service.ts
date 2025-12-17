import { CreateUserDto } from '@/common/dto/User/create-user-dto';
import { UpdateProfileDto } from '@/common/dto/User/update-profile.dto';
import { SubmitKycDto } from '@/common/dto/User/submit-kyc.dto';
import { PrismaService } from '@/prisma/prisma.service';
import {
  GetUserInfoResponse,
  selectGetUserInfo,
  UpdateProfileResponse,
  SubmitKycResponse,
  AdminKycListResponse,
  AdminKycDetailResponse,
  AdminKycActionResponse,
  selectAdminKyc,
} from '@/types/user.type';
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
  User,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditLogService } from '@/modules/audit/audit-log.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogService: AuditLogService,
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

    return { message: 'KYC đã bị từ chối' };
  }
}
