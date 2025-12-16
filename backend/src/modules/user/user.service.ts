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
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

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
      await this.prismaService.kyc.update({
        where: { userId },
        data: {
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
          status: 'PENDING',
          rejectionReason: null,
        },
      });
    } else {
      await this.prismaService.kyc.create({
        data: {
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
        },
      });
    }

    return { message: 'KYC đã được gửi, vui lòng chờ duyệt' };
  }
}
