import { CreateUserDto } from '@/common/dto/User/create-user-dto';
import { UpdateProfileDto } from '@/common/dto/User/update-profile.dto';
import { SubmitKycDto } from '@/common/dto/User/submit-kyc.dto';
import { PrismaService } from '@/prisma/prisma.service';
import {
  GetUserInfoResponse,
  selectGetUserInfo,
  UpdateProfileResponse,
  SubmitKycResponse,
} from '@/types/user.type';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  AuditAction,
  AuditTargetType,
  KycStatus,
  Prisma,
  User,
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
}
