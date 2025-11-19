import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { MailService } from '@/mail/mail.service';
import { SmsService } from '@/sms/sms.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { KycSubmissionDto } from './dto/kyc-submission.dto';
import { SendPhoneOtpDto } from './dto/send-phone-otp.dto';
import { VerifyPhoneOtpDto } from './dto/verify-phone-otp.dto';
import * as bcrypt from 'bcrypt';
import { User, UserRole, Prisma, OtpType, KycStatus } from '@prisma/client';

interface RefreshTokenPayload {
  sub: string;
  email: string;
  role: string;
  type?: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  message: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private smsService: SmsService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    const { email, password, phone, role } = registerDto;

    this.logger.log(`Đăng ký người dùng mới: ${email}`);

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      this.logger.warn(`Đăng ký thất bại - Email đã tồn tại: ${email}`);
      throw new ConflictException('Email đã tồn tại');
    }

    // Check if phone is provided and already exists
    if (phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone },
      });

      if (existingPhone) {
        this.logger.warn(
          `Đăng ký thất bại - Số điện thoại đã tồn tại: ${phone}`,
        );
        throw new ConflictException('Số điện thoại đã tồn tại trong hệ thống');
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        phone,
        role: role || UserRole.RENTER,
        isActive: true,
        isVerified: false,
      },
      select: {
        id: true,
        email: true,
      },
    });

    this.logger.log(`User created: ${user.id}`);

    // Generate and send OTP
    const otpCode = this.generateOTPCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.otp.create({
      data: {
        userId: user.id,
        code: otpCode,
        type: OtpType.EMAIL_VERIFICATION,
        expiresAt,
      },
    });

    // Send OTP email (async, don't wait for it)
    this.mailService.sendVerificationEmail(user.email, otpCode).catch(err => {
      this.logger.error('Failed to send OTP email:', err);
    });

    // If phone is provided, send OTP via SMS as well
    if (phone) {
      this.smsService.sendOTP(phone, otpCode).catch(err => {
        this.logger.error('Failed to send OTP SMS:', err);
      });
      this.logger.log(`OTP sent to email and SMS: ${email}, ${phone}`);
    } else {
      this.logger.log(`OTP sent to ${email}`);
    }

    return {
      userId: user.id,
      email: user.email,
      message: phone
        ? 'Đăng ký thành công. Vui lòng kiểm tra email và SMS để lấy mã OTP xác thực.'
        : 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác thực.',
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password: loginPassword } = loginDto;

    this.logger.log(`Đăng nhập: ${email}`);

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn(`Đăng nhập thất bại - User không tồn tại: ${email}`);
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Check if user is active
    if (!user.isActive) {
      this.logger.warn(
        `Đăng nhập thất bại - Tài khoản bị vô hiệu hóa: ${email}`,
      );
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    // Verify password first
    const isPasswordValid = await bcrypt.compare(loginPassword, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Đăng nhập thất bại - Mật khẩu không đúng: ${email}`);
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // If password is correct but user not verified, send new OTP
    if (!user.isVerified) {
      this.logger.log(
        `Tài khoản chưa xác thực - Gửi OTP mới cho user: ${email}`,
      );

      // Generate and send new OTP
      const otpCode = this.generateOTPCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      this.logger.log(`OTP code: ${otpCode}`);

      await this.prisma.otp.create({
        data: {
          userId: user.id,
          code: otpCode,
          type: OtpType.EMAIL_VERIFICATION,
          expiresAt,
        },
      });

      // Send OTP email
      this.mailService.sendVerificationEmail(user.email, otpCode).catch(err => {
        this.logger.error('Failed to send OTP email:', err);
      });

      this.logger.log(`OTP sent to ${email} for verification`);

      // Throw exception with metadata to inform frontend that verification is required
      throw new BadRequestException({
        message:
          'Tài khoản chưa được xác thực. Mã OTP mới đã được gửi đến email của bạn.',
        userId: user.id,
        email: user.email,
        requiresVerification: true,
      });
    }

    // Generate tokens
    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    this.logger.log(`Đăng nhập thành công: ${email}`);

    // Return user without password
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      isVerified: user.isVerified,
      isPhoneVerified: user.isPhoneVerified,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: userWithoutPassword as Omit<User, 'password'>,
      accessToken,
      refreshToken,
    };
  }

  async validateUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        isActive: true,
        isVerified: true,
        role: true,
        stripeAccountId: true,
        stripeAccountStatus: true,
        createdAt: true,
        updatedAt: true,
        isPhoneVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    return user;
  }

  private generateToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  private generateRefreshToken(
    user: Pick<User, 'id' | 'email' | 'role'>,
  ): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, { expiresIn: '30d' });
  }

  async refreshToken(refreshTokenString: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshTokenString) as unknown;

      if (!decoded || typeof decoded !== 'object') {
        throw new UnauthorizedException('Invalid token');
      }

      const payload = decoded as RefreshTokenPayload;

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Người dùng không tồn tại');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
      }

      // Generate new tokens
      const newAccessToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      this.logger.log(`Refresh token thành công cho user: ${user.email}`);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      this.logger.error('Refresh token failed:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async updatePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Mật khẩu cũ không đúng');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  // Generate 6-digit OTP code
  private generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Verify OTP and complete registration
  async verifyOTP(userId: string, otpCode: string): Promise<AuthResponse> {
    this.logger.log(`Verifying OTP for user: ${userId}`);

    // Find valid OTP (only EMAIL_VERIFICATION type)
    const otp = await this.prisma.otp.findFirst({
      where: {
        userId,
        code: otpCode,
        type: OtpType.EMAIL_VERIFICATION,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp) {
      this.logger.warn(`Invalid or expired OTP for user: ${userId}`);
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        isActive: true,
        isVerified: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Mark OTP as used
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    // Update user as verified
    await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    this.logger.log(`User verified successfully: ${userId}`);

    // Generate tokens
    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Send welcome email (async, don't wait for it)
    this.mailService
      .sendWelcomeEmail(user.email, user.email.split('@')[0])
      .catch(err => {
        this.logger.error('Failed to send welcome email:', err);
      });

    return {
      user: user as Omit<User, 'password'>,
      accessToken,
      refreshToken,
    };
  }

  // Resend OTP
  async resendOTP(userId: string): Promise<void> {
    this.logger.log(`Resending OTP for user: ${userId}`);

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    if (user.isVerified) {
      throw new BadRequestException('Tài khoản đã được xác thực');
    }

    // Generate new OTP
    const otpCode = this.generateOTPCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.otp.create({
      data: {
        userId: user.id,
        code: otpCode,
        type: OtpType.EMAIL_VERIFICATION,
        expiresAt,
      },
    });

    // Send OTP email
    await this.mailService.sendVerificationEmail(user.email, otpCode);

    this.logger.log(`OTP resent to ${user.email}`);
  }

  // Forgot password - send OTP to email
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    this.logger.log(`Forgot password request for: ${email}`);

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });

    // Always return success for security reasons (don't reveal if email exists)
    if (!user) {
      this.logger.warn(`User not found for forgot password: ${email}`);
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      this.logger.warn(`Inactive user tried to reset password: ${email}`);
      return;
    }

    // Generate OTP
    const otpCode = this.generateOTPCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.otp.create({
      data: {
        userId: user.id,
        code: otpCode,
        type: OtpType.PASSWORD_RESET,
        expiresAt,
      },
    });

    // Send OTP email
    this.mailService.sendVerificationEmail(user.email, otpCode).catch(err => {
      this.logger.error('Failed to send forgot password OTP email:', err);
    });

    this.logger.log(`Forgot password OTP sent to ${email}`);
  }

  // Reset password using OTP
  async resetPassword(
    email: string,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<AuthResponse> {
    const { otpCode, newPassword } = resetPasswordDto;

    this.logger.log(`Reset password request for: ${email}`);

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        phone: true,
        isActive: true,
        isVerified: true,
        isPhoneVerified: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    // Find valid OTP
    const otp = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
        code: otpCode,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp) {
      this.logger.warn(`Invalid or expired OTP for password reset: ${email}`);
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    // Mark OTP as used
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    this.logger.log(`Password reset successfully for: ${email}`);

    // Generate tokens
    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: user as Omit<User, 'password'>,
      accessToken,
      refreshToken,
    };
  }

  // Get user profile with UserProfile
  async getProfile(userId: string): Promise<
    Omit<User, 'password'> & {
      profile?: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string | null;
        dateOfBirth?: Date | null;
        gender?: string | null;
        bio?: string | null;
        address?: string | null;
        cityId?: string | null;
        zipCode?: string | null;
      } | null;
    }
  > {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        isActive: true,
        isVerified: true,
        isPhoneVerified: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            dateOfBirth: true,
            gender: true,
            bio: true,
            address: true,
            cityId: true,
            zipCode: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return user as Omit<User, 'password'> & {
      profile?: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string | null;
        dateOfBirth?: Date | null;
        gender?: string | null;
        bio?: string | null;
        address?: string | null;
        cityId?: string | null;
        zipCode?: string | null;
      } | null;
    };
  }

  // Update user profile
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<
    Omit<User, 'password'> & {
      profile?: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string | null;
        dateOfBirth?: Date | null;
        gender?: string | null;
        bio?: string | null;
        address?: string | null;
        cityId?: string | null;
        zipCode?: string | null;
      } | null;
    }
  > {
    this.logger.log(`Updating profile for user: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Extract phone if provided (update in User table)
    const { phone, ...profileData } = updateProfileDto;

    // Prepare user update data
    const userUpdateData: Prisma.UserUpdateInput = {};
    if (phone !== undefined) {
      // Check if phone already exists
      if (phone) {
        const existingUser = await this.prisma.user.findUnique({
          where: { phone },
        });
        if (existingUser && existingUser.id !== userId) {
          throw new ConflictException('Số điện thoại đã được sử dụng');
        }

        // If phone is being changed, reset phone verification status
        if (user.phone !== phone) {
          userUpdateData.phone = phone;
          userUpdateData.isPhoneVerified = false; // Yêu cầu xác minh lại
          this.logger.log(
            `Phone changed for user ${userId}. Phone verification required.`,
          );
        }
      } else {
        // If phone is being removed, also remove verification
        userUpdateData.phone = null;
        userUpdateData.isPhoneVerified = false;
      }
    }

    // Update user if needed
    if (Object.keys(userUpdateData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }

    // Prepare profile update data
    const profileUpdateData: Prisma.UserProfileUpdateInput = {};
    if (profileData.firstName !== undefined) {
      profileUpdateData.firstName = profileData.firstName;
    }
    if (profileData.lastName !== undefined) {
      profileUpdateData.lastName = profileData.lastName;
    }
    if (profileData.avatar !== undefined) {
      profileUpdateData.avatar = profileData.avatar;
    }
    if (profileData.dateOfBirth !== undefined) {
      profileUpdateData.dateOfBirth = profileData.dateOfBirth
        ? new Date(profileData.dateOfBirth)
        : null;
    }
    if (profileData.gender !== undefined) {
      profileUpdateData.gender = profileData.gender;
    }
    if (profileData.bio !== undefined) {
      profileUpdateData.bio = profileData.bio;
    }
    if (profileData.address !== undefined) {
      profileUpdateData.address = profileData.address;
    }
    if (profileData.cityId !== undefined) {
      if (profileData.cityId) {
        // Connect to city if cityId is provided
        profileUpdateData.city = {
          connect: { id: profileData.cityId },
        };
      } else {
        // Disconnect if cityId is empty
        profileUpdateData.city = { disconnect: true };
      }
    }
    if (profileData.zipCode !== undefined) {
      profileUpdateData.zipCode = profileData.zipCode;
    }

    // Check if profile exists
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      // Update existing profile
      await this.prisma.userProfile.update({
        where: { userId },
        data: profileUpdateData,
      });
    } else {
      // Create new profile if doesn't exist
      if (!profileData.firstName || !profileData.lastName) {
        throw new BadRequestException(
          'firstName và lastName là bắt buộc khi tạo profile mới',
        );
      }
      const createData: Prisma.UserProfileCreateInput = {
        user: { connect: { id: userId } },
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        avatar: profileData.avatar,
        dateOfBirth: profileData.dateOfBirth
          ? new Date(profileData.dateOfBirth)
          : null,
        gender: profileData.gender,
        bio: profileData.bio,
        address: profileData.address,
        zipCode: profileData.zipCode,
      };

      if (profileData.cityId) {
        createData.city = { connect: { id: profileData.cityId } };
      }

      await this.prisma.userProfile.create({
        data: createData,
      });
    }

    // Return updated user with profile
    return this.getProfile(userId);
  }

  // Submit KYC documents
  async submitKYC(
    userId: string,
    kycSubmissionDto: KycSubmissionDto,
  ): Promise<{ message: string; kycId: string }> {
    this.logger.log(`Submitting KYC for user: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Check if KYC already exists
    const existingKyc = await this.prisma.kyc.findUnique({
      where: { userId },
    });

    let kyc: { id: string };
    if (existingKyc) {
      // Update existing KYC (nếu bị reject, có thể submit lại)
      if (existingKyc.status === KycStatus.APPROVED) {
        throw new BadRequestException(
          'KYC của bạn đã được duyệt. Không thể cập nhật.',
        );
      }

      // Update KYC và reset status về PENDING
      kyc = await this.prisma.kyc.update({
        where: { userId },
        data: {
          ...kycSubmissionDto,
          status: KycStatus.PENDING,
          reviewedBy: null,
          reviewedAt: null,
          reviewNotes: null,
        },
        select: { id: true },
      });
    } else {
      // Create new KYC
      kyc = await this.prisma.kyc.create({
        data: {
          userId,
          ...kycSubmissionDto,
          status: KycStatus.PENDING,
        },
        select: { id: true },
      });
    }

    this.logger.log(`KYC submitted for user: ${userId}, KYC ID: ${kyc.id}`);

    return {
      message:
        'Đã gửi thông tin KYC thành công. Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ.',
      kycId: kyc.id,
    };
  }

  // Get user's KYC status
  async getMyKYC(userId: string): Promise<{
    id: string;
    userId: string;
    idNumber: string | null;
    idCardFrontUrl: string | null;
    idCardBackUrl: string | null;
    driverLicenseUrl: string | null;
    selfieUrl: string | null;
    notes: string | null;
    status: KycStatus;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    reviewNotes: string | null;
    createdAt: Date;
    updatedAt: Date;
    reviewer: {
      id: string;
      email: string;
    } | null;
  } | null> {
    const kyc = await this.prisma.kyc.findUnique({
      where: { userId },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return kyc;
  }

  // ==================== ADMIN KYC MANAGEMENT ====================

  /**
   * Admin: Lấy danh sách KYC submissions
   */
  async listKYCSubmissions(
    status?: KycStatus,
    page = 1,
    limit = 10,
  ): Promise<{
    items: Array<{
      id: string;
      userId: string;
      idNumber: string | null;
      idCardFrontUrl: string | null;
      idCardBackUrl: string | null;
      driverLicenseUrl: string | null;
      selfieUrl: string | null;
      notes: string | null;
      status: KycStatus;
      reviewedBy: string | null;
      reviewedAt: Date | null;
      reviewNotes: string | null;
      createdAt: Date;
      updatedAt: Date;
      user: {
        id: string;
        email: string;
        phone: string | null;
        role: UserRole;
        createdAt: Date;
      };
      reviewer: {
        id: string;
        email: string;
      } | null;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const where: Prisma.KycWhereInput = {};
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.kyc.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: true,
              createdAt: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.kyc.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * Admin: Duyệt KYC
   */
  async approveKYC(
    kycId: string,
    adminId: string,
    reviewNotes?: string,
  ): Promise<{ message: string }> {
    const kyc = await this.prisma.kyc.findUnique({
      where: { id: kycId },
    });

    if (!kyc) {
      throw new NotFoundException('Không tìm thấy KYC submission');
    }

    if (kyc.status === KycStatus.APPROVED) {
      throw new BadRequestException('KYC đã được duyệt trước đó');
    }

    await this.prisma.kyc.update({
      where: { id: kycId },
      data: {
        status: KycStatus.APPROVED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes,
      },
    });

    this.logger.log(`KYC ${kycId} approved by admin ${adminId}`);

    return {
      message: 'Đã duyệt KYC thành công',
    };
  }

  /**
   * Admin: Từ chối KYC
   */
  async rejectKYC(
    kycId: string,
    adminId: string,
    reviewNotes?: string,
  ): Promise<{ message: string }> {
    const kyc = await this.prisma.kyc.findUnique({
      where: { id: kycId },
    });

    if (!kyc) {
      throw new NotFoundException('Không tìm thấy KYC submission');
    }

    if (kyc.status === KycStatus.APPROVED) {
      throw new BadRequestException('KYC đã được duyệt. Không thể từ chối.');
    }

    if (!reviewNotes) {
      throw new BadRequestException(
        'Vui lòng cung cấp lý do từ chối (reviewNotes)',
      );
    }

    await this.prisma.kyc.update({
      where: { id: kycId },
      data: {
        status: KycStatus.REJECTED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes,
      },
    });

    this.logger.log(`KYC ${kycId} rejected by admin ${adminId}`);

    return {
      message: 'Đã từ chối KYC',
    };
  }

  // ==================== PHONE VERIFICATION ====================

  /**
   * Gửi OTP qua SMS để xác minh số điện thoại
   * @param userId ID của user
   * @param phone Số điện thoại cần xác minh
   */
  async sendPhoneVerificationOTP(
    userId: string,
    sendPhoneOtpDto: SendPhoneOtpDto,
  ): Promise<{ message: string }> {
    const { phone } = sendPhoneOtpDto;

    this.logger.log(
      `Sending phone verification OTP to ${phone} for user: ${userId}`,
    );

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Check if phone is already verified and matches
    if (user.isPhoneVerified && user.phone === phone) {
      throw new BadRequestException('Số điện thoại này đã được xác minh');
    }

    // Check if phone is already used by another user
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException(
        'Số điện thoại này đã được sử dụng bởi tài khoản khác',
      );
    }

    // Generate OTP
    const otpCode = this.generateOTPCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create OTP record
    await this.prisma.otp.create({
      data: {
        userId: user.id,
        code: otpCode,
        type: OtpType.PHONE_VERIFICATION,
        phone,
        expiresAt,
      },
    });

    // Send OTP via SMS
    const smsResult = await this.smsService.sendOTP(phone, otpCode);

    if (!smsResult.success) {
      this.logger.error(`Failed to send SMS to ${phone}: ${smsResult.message}`);
      throw new BadRequestException('Không thể gửi SMS. Vui lòng thử lại sau.');
    }

    this.logger.log(
      `Phone verification OTP sent to ${phone} for user: ${userId}`,
    );

    return {
      message: 'Mã OTP đã được gửi đến số điện thoại của bạn',
    };
  }

  /**
   * Xác minh OTP từ SMS
   * @param userId ID của user
   * @param verifyPhoneOtpDto DTO chứa phone và otpCode
   */
  async verifyPhoneOTP(
    userId: string,
    verifyPhoneOtpDto: VerifyPhoneOtpDto,
  ): Promise<{ message: string; isPhoneVerified: boolean }> {
    const { phone, otpCode } = verifyPhoneOtpDto;

    this.logger.log(`Verifying phone OTP for user: ${userId}, phone: ${phone}`);

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        isPhoneVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Find valid OTP
    const otp = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
        code: otpCode,
        type: OtpType.PHONE_VERIFICATION,
        phone,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp) {
      this.logger.warn(
        `Invalid or expired phone OTP for user: ${userId}, phone: ${phone}`,
      );
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    // Mark OTP as used
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    // Update user: set phone and mark as verified
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phone,
        isPhoneVerified: true,
      },
    });

    this.logger.log(
      `Phone verified successfully for user: ${userId}, phone: ${phone}`,
    );

    return {
      message: 'Xác minh số điện thoại thành công',
      isPhoneVerified: true,
    };
  }

  /**
   * Gửi lại OTP xác minh số điện thoại
   * @param userId ID của user
   * @param sendPhoneOtpDto DTO chứa phone
   */
  async resendPhoneOTP(
    userId: string,
    sendPhoneOtpDto: SendPhoneOtpDto,
  ): Promise<{ message: string }> {
    return this.sendPhoneVerificationOTP(userId, sendPhoneOtpDto);
  }
}
