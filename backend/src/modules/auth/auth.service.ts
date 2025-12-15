import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';
import { PrismaService } from '@/prisma/prisma.service';
import { RegisterUserDto } from '@/common/dto/Auth/register-user.dto';
import { LoginDto } from '@/common/dto/Auth/login.dto';
import {
  LoginResponse,
  selectLoginUser,
  LoginUserResponse,
  LoginWithNoVerifyPhoneResponse,
  RegisterResponse,
  ResendOtpResponse,
  VerifyOtpResponse,
  ForgotPasswordResponse,
  VerifyResetPasswordResponse,
  ChangePasswordResponse,
  RefreshTokenResponse,
} from '@/types/auth.type';
import { UserService } from '@/modules/user/user.service';
import { SmsService } from '@/modules/sms/sms.service';
import { LOG_CATEGORY, LoggerService } from '@/modules/logger/logger.service';
import { RateLimitService } from '@/modules/rate-limit/rate-limit.service';
import { AuditAction, AuditTargetType, OtpType } from '@prisma/client';
import { VerifyOtpDto } from '@/common/dto/Auth/verify-otp.dto';
import { ResendOtpDto } from '@/common/dto/Auth/resend-otp.dto';
import { ENV } from '@/config/env';
import * as bcrypt from 'bcrypt';
import { ForgotPasswordDto } from '@/common/dto/Auth/forgot-password.dto';
import { VerifyResetPasswordDto } from '@/common/dto/Auth/verify-reset-password.dto';
import { ChangePasswordDto } from '@/common/dto/Auth/change-password.dto';
import { AuditLogService } from '@/modules/audit/audit-log.service';

type FlexibleSignOptions = Omit<SignOptions, 'expiresIn'> & {
  expiresIn?: string | number;
  secret?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly smsService: SmsService,
    private readonly prismaService: PrismaService,
    private readonly loggerService: LoggerService,
    private readonly jwtService: JwtService,
    private readonly rateLimitService: RateLimitService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponse> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        phone: true,
        password: true,
      },
    });

    if (!user) {
      void this.auditLogService.log({
        actorId: userId,
        action: AuditAction.UPDATE,
        targetId: userId,
        targetType: AuditTargetType.USER,
        metadata: {
          result: 'failure',
          reason: 'user_not_found',
          action: 'change_password',
        },
      });
      throw new BadRequestException('Người dùng không tồn tại');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isPasswordValid) {
      void this.auditLogService.log({
        actorId: userId,
        action: AuditAction.UPDATE,
        targetId: userId,
        targetType: AuditTargetType.USER,
        metadata: {
          result: 'failure',
          reason: 'invalid_old_password',
          action: 'change_password',
        },
      });
      throw new BadRequestException('Mật khẩu cũ không đúng');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    void this.loggerService.log(
      `User ${user.id} changed password successfully`,
      { userId: user.id },
      { category: LOG_CATEGORY.AUTH },
    );
    void this.auditLogService.log({
      actorId: user.id,
      action: AuditAction.UPDATE,
      targetId: user.id,
      targetType: AuditTargetType.USER,
      metadata: { result: 'success', action: 'change_password' },
    });

    return {
      message: 'Mật khẩu đã được đổi thành công',
    };
  }

  async register(registerUserDto: RegisterUserDto): Promise<RegisterResponse> {
    const userCheck = await this.prismaService.user.findUnique({
      where: {
        phone: registerUserDto.phone,
      },
      select: {
        id: true,
        phone: true,
      },
    });

    if (userCheck) {
      void this.auditLogService.log({
        actorId: null,
        action: AuditAction.CREATE,
        targetId: userCheck.id,
        targetType: AuditTargetType.USER,
        metadata: {
          result: 'failure',
          reason: 'phone_exists',
          phone: registerUserDto.phone,
        },
      });
      throw new BadRequestException('Số điện thoại đã tồn tại');
    }

    const user = await this.userService.createUser(registerUserDto);

    try {
      await this.sendOTP(user.id, registerUserDto.phone, OtpType.REGISTER);
    } catch (error) {
      void this.loggerService.error(
        `Failed to send OTP after registration for user ${user.id}`,
        error,
        { category: LOG_CATEGORY.AUTH },
      );
      throw new BadRequestException(error || 'Failed to send OTP');
    }

    void this.loggerService.log(
      `User ${user.id} registered successfully`,
      { userId: user.id },
      { category: LOG_CATEGORY.AUTH },
    );
    void this.auditLogService.log({
      actorId: user.id,
      action: AuditAction.CREATE,
      targetId: user.id,
      targetType: AuditTargetType.USER,
      metadata: { result: 'success', phone: registerUserDto.phone },
    });

    return {
      userId: user.id,
      message: 'Mã OTP đã được gửi đến số điện thoại của bạn',
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<LoginResponse | LoginWithNoVerifyPhoneResponse> {
    const user = await this.prismaService.user.findUnique({
      where: {
        phone: loginDto.phone,
      },
      select: {
        ...selectLoginUser,
        password: true,
      },
    });

    if (!user) {
      void this.auditLogService.log({
        action: AuditAction.LOGIN,
        targetType: AuditTargetType.SYSTEM,
        metadata: {
          result: 'failure',
          reason: 'user_not_found',
          phone: loginDto.phone,
        },
      });
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng');
    }

    if (!user.isActive) {
      void this.auditLogService.log({
        actorId: user.id,
        action: AuditAction.LOGIN,
        targetType: AuditTargetType.SYSTEM,
        metadata: {
          result: 'failure',
          reason: 'user_inactive',
          userId: user.id,
        },
      });
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    if (!user.password) {
      void this.auditLogService.log({
        actorId: user.id,
        action: AuditAction.LOGIN,
        targetType: AuditTargetType.SYSTEM,
        metadata: {
          result: 'failure',
          reason: 'missing_password',
          userId: user.id,
        },
      });
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      void this.auditLogService.log({
        actorId: user.id,
        action: AuditAction.LOGIN,
        targetType: AuditTargetType.SYSTEM,
        metadata: {
          result: 'failure',
          reason: 'invalid_password',
          userId: user.id,
        },
      });
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng');
    }

    if (!user.isPhoneVerified) {
      try {
        await this.sendOTP(user.id, user.phone, OtpType.REGISTER);
      } catch (error) {
        void this.loggerService.error(
          `Failed to send OTP after login for user ${user.id}`,
          error,
          { category: LOG_CATEGORY.AUTH },
        );
        throw new BadRequestException(error || 'Failed to send OTP');
      }

      void this.auditLogService.log({
        actorId: user.id,
        action: AuditAction.LOGIN,
        targetId: user.id,
        targetType: AuditTargetType.USER,
        metadata: { result: 'pending_phone_verification', phone: user.phone },
      });

      return {
        message: 'Mã OTP đã được gửi đến số điện thoại của bạn',
        userId: user.id,
      };
    }

    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    let accessToken: string;
    let refreshToken: string;

    try {
      const accessTokenOptions: FlexibleSignOptions = {
        secret: ENV.jwtSecret,
        expiresIn: ENV.jwtExpiration,
      };
      const refreshTokenOptions: FlexibleSignOptions = {
        secret: ENV.jwtRefreshSecret,
        expiresIn: ENV.jwtRefreshExpiration,
      };
      accessToken = await this.jwtService.signAsync(
        payload,
        accessTokenOptions as SignOptions,
      );
      refreshToken = await this.jwtService.signAsync(
        payload,
        refreshTokenOptions as SignOptions,
      );
    } catch (error) {
      void this.loggerService.error(
        `Failed to generate tokens for user ${user.id}`,
        error,
        { category: LOG_CATEGORY.AUTH },
      );
      throw new Error('Failed to generate tokens');
    }

    void this.loggerService.log(
      `User ${user.id} logged in successfully`,
      { userId: user.id, phone: user.phone },
      { category: LOG_CATEGORY.AUTH },
    );
    void this.auditLogService.log({
      actorId: user.id,
      action: AuditAction.LOGIN,
      targetId: user.id,
      targetType: AuditTargetType.USER,
      metadata: { result: 'success', phone: user.phone },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword as LoginUserResponse,
    };
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    let payload: { sub: string; phone: string; role: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: ENV.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
      select: selectLoginUser,
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const newPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const accessTokenOptions: FlexibleSignOptions = {
      secret: ENV.jwtSecret,
      expiresIn: ENV.jwtExpiration,
    };
    const refreshTokenOptions: FlexibleSignOptions = {
      secret: ENV.jwtRefreshSecret,
      expiresIn: ENV.jwtRefreshExpiration,
    };

    const newAccessToken = await this.jwtService.signAsync(
      newPayload,
      accessTokenOptions as SignOptions,
    );
    const newRefreshToken = await this.jwtService.signAsync(
      newPayload,
      refreshTokenOptions as SignOptions,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user,
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponse> {
    const userCheck = await this.prismaService.user.findUnique({
      where: {
        phone: forgotPasswordDto.phone,
      },
      select: {
        id: true,
        phone: true,
      },
    });

    if (!userCheck) {
      void this.auditLogService.log({
        action: AuditAction.UPDATE,
        targetType: AuditTargetType.USER,
        metadata: {
          result: 'failure',
          reason: 'user_not_found',
          action: 'forgot_password',
          phone: forgotPasswordDto.phone,
        },
      });
      throw new BadRequestException('Số điện thoại không tồn tại');
    }

    try {
      await this.sendOTP(userCheck.id, userCheck.phone, OtpType.RESET_PASSWORD);
    } catch (error) {
      void this.loggerService.error(
        `Failed to send OTP after forgot password for user ${userCheck.id}`,
        error,
        { category: LOG_CATEGORY.AUTH },
      );
      void this.auditLogService.log({
        actorId: userCheck.id,
        action: AuditAction.UPDATE,
        targetId: userCheck.id,
        targetType: AuditTargetType.USER,
        metadata: {
          result: 'failure',
          reason: 'send_otp_failed',
          action: 'forgot_password',
        },
      });

      throw new BadRequestException(error || 'Failed to send OTP');
    }

    void this.auditLogService.log({
      actorId: userCheck.id,
      action: AuditAction.UPDATE,
      targetId: userCheck.id,
      targetType: AuditTargetType.USER,
      metadata: {
        result: 'success',
        action: 'forgot_password',
        phone: userCheck.phone,
      },
    });

    return { message: 'Mã OTP đã được gửi đến số điện thoại của bạn' };
  }

  async verifyResetPassword(
    verifyResetPasswordDto: VerifyResetPasswordDto,
  ): Promise<VerifyResetPasswordResponse> {
    const user = await this.prismaService.user.findUnique({
      where: {
        phone: verifyResetPasswordDto.phone,
      },
      select: {
        id: true,
        phone: true,
      },
    });

    if (!user) {
      void this.auditLogService.log({
        action: AuditAction.UPDATE,
        targetType: AuditTargetType.USER,
        metadata: {
          result: 'failure',
          reason: 'user_not_found',
          action: 'verify_reset_password',
          phone: verifyResetPasswordDto.phone,
        },
      });
      throw new BadRequestException('Số điện thoại không tồn tại');
    }

    const otp = await this.prismaService.otp.findFirst({
      where: {
        phone: verifyResetPasswordDto.phone,
        code: verifyResetPasswordDto.otpCode,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
        type: OtpType.RESET_PASSWORD,
      },
    });

    if (!otp) {
      void this.auditLogService.log({
        actorId: user.id,
        action: AuditAction.UPDATE,
        targetId: user.id,
        targetType: AuditTargetType.USER,
        metadata: {
          result: 'failure',
          reason: 'otp_invalid',
          action: 'verify_reset_password',
          phone: verifyResetPasswordDto.phone,
        },
      });
      throw new BadRequestException('Mã OTP không hợp lệ');
    }

    const hashedPassword = await bcrypt.hash(
      verifyResetPasswordDto.password,
      10,
    );

    try {
      await this.prismaService.$transaction(async tx => {
        await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            password: hashedPassword,
            isPhoneVerified: true,
          },
        });

        await tx.otp.update({
          where: {
            id: otp.id,
          },
          data: {
            isUsed: true,
          },
        });
      });
    } catch (error) {
      void this.loggerService.error(
        `Failed to verify reset password for user ${user.id} with error: ${error}`,
        error,
        { category: LOG_CATEGORY.AUTH },
      );
      void this.auditLogService.log({
        actorId: user.id,
        action: AuditAction.UPDATE,
        targetId: user.id,
        targetType: AuditTargetType.USER,
        metadata: {
          result: 'failure',
          reason: 'transaction_error',
          action: 'verify_reset_password',
        },
      });
      throw new BadRequestException(error || 'Failed to verify reset password');
    }

    void this.auditLogService.log({
      actorId: user.id,
      action: AuditAction.UPDATE,
      targetId: user.id,
      targetType: AuditTargetType.USER,
      metadata: {
        result: 'success',
        action: 'verify_reset_password',
        phone: verifyResetPasswordDto.phone,
      },
    });

    return {
      message: 'Mật khẩu đã được đặt lại thành công',
    };
  }

  async verifyOTP(verifyOtpDto: VerifyOtpDto): Promise<VerifyOtpResponse> {
    const otp = await this.prismaService.otp.findFirst({
      where: {
        userId: verifyOtpDto.userId,
        code: verifyOtpDto.otpCode,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
        type: OtpType.REGISTER,
      },
    });

    if (!otp) {
      void this.auditLogService.log({
        actorId: verifyOtpDto.userId,
        action: AuditAction.UPDATE,
        targetId: verifyOtpDto.userId,
        targetType: AuditTargetType.USER,
        metadata: {
          result: 'failure',
          reason: 'otp_invalid',
          action: 'verify_register_otp',
        },
      });
      throw new BadRequestException('Mã OTP không hợp lệ');
    }

    try {
      await this.prismaService.$transaction(async tx => {
        await tx.otp.update({
          where: {
            id: otp.id,
          },
          data: {
            isUsed: true,
          },
        });
        await tx.user.update({
          where: {
            id: verifyOtpDto.userId,
          },
          data: {
            isPhoneVerified: true,
          },
        });
      });
    } catch (error) {
      void this.loggerService.error(
        `Failed to verify OTP for user ${verifyOtpDto.userId} with error: ${error}`,
        error,
        { category: LOG_CATEGORY.AUTH },
      );
      void this.auditLogService.log({
        actorId: verifyOtpDto.userId,
        action: AuditAction.UPDATE,
        targetId: verifyOtpDto.userId,
        targetType: AuditTargetType.USER,
        metadata: {
          result: 'failure',
          reason: 'transaction_error',
          action: 'verify_register_otp',
        },
      });
      throw new BadRequestException(error || 'Failed to verify OTP');
    }

    void this.auditLogService.log({
      actorId: verifyOtpDto.userId,
      action: AuditAction.UPDATE,
      targetId: verifyOtpDto.userId,
      targetType: AuditTargetType.USER,
      metadata: {
        result: 'success',
        action: 'verify_register_otp',
      },
    });

    return {
      message: 'Mã OTP đã được xác thực thành công',
    };
  }

  async resendOTP(resendOtpDto: ResendOtpDto): Promise<ResendOtpResponse> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: resendOtpDto.userId,
        isPhoneVerified: false,
      },
      select: {
        id: true,
        phone: true,
      },
    });

    if (!user) {
      void this.auditLogService.log({
        action: AuditAction.UPDATE,
        targetType: AuditTargetType.USER,
        metadata: {
          result: 'failure',
          reason: 'user_not_found_or_verified',
          action: 'resend_register_otp',
          userId: resendOtpDto.userId,
        },
      });
      throw new BadRequestException(
        'Người dùng không tồn tại hoặc đã xác thực số điện thoại',
      );
    }

    try {
      await this.sendOTP(user.id, user.phone, OtpType.REGISTER);
    } catch (error) {
      void this.loggerService.error(
        `Failed to send OTP after resend for user ${user.id}`,
        error,
        { category: LOG_CATEGORY.AUTH },
      );
      throw new BadRequestException(error || 'Failed to send OTP');
    }

    void this.loggerService.log(
      `OTP resent to ${user.phone} for user ${user.id}`,
      { userId: user.id, phone: user.phone },
      { category: LOG_CATEGORY.AUTH },
    );
    void this.auditLogService.log({
      actorId: user.id,
      action: AuditAction.UPDATE,
      targetId: user.id,
      targetType: AuditTargetType.USER,
      metadata: {
        result: 'success',
        action: 'resend_register_otp',
        phone: user.phone,
      },
    });

    return {
      message: 'Mã OTP đã được gửi đến số điện thoại của bạn',
    };
  }

  //Private
  private async sendOTP(
    userId: string,
    phone: string,
    type: OtpType,
  ): Promise<void> {
    // Kiểm tra rate limit trước khi gửi OTP
    const canSend = await this.rateLimitService.checkOTPRateLimit(phone);

    console.log('canSend', canSend);

    if (!canSend) {
      const rateLimitInfo =
        await this.rateLimitService.getOTPRateLimitInfo(phone);
      const remainingMinutes = Math.ceil(rateLimitInfo.remainingSeconds / 60);

      throw new Error(
        `Bạn đã gửi quá nhiều mã OTP. Vui lòng thử lại sau ${remainingMinutes} phút.`,
      );
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.prismaService.otp.create({
      data: {
        phone,
        code: otpCode,
        type,
        expiresAt,
        userId,
      },
    });

    await this.smsService.sendOTP(phone, otpCode);
    void this.loggerService.log(
      `OTP sent to ${phone} for user ${userId}`,
      { userId, phone, type },
      { category: LOG_CATEGORY.AUTH },
    );
  }
}
