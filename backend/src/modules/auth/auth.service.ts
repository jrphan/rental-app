import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { MailService } from '@/mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { KycSubmissionDto } from './dto/kyc-submission.dto';
import * as bcrypt from 'bcrypt';
import { User, UserRole, Prisma } from '@/generated/prisma';

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
        expiresAt,
      },
    });

    // Send OTP email (async, don't wait for it)
    this.mailService.sendVerificationEmail(user.email, otpCode).catch(err => {
      this.logger.error('Failed to send OTP email:', err);
    });

    this.logger.log(`OTP sent to ${email}`);

    return {
      userId: user.id,
      email: user.email,
      message:
        'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác thực.',
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

      await this.prisma.otp.create({
        data: {
          userId: user.id,
          code: otpCode,
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

    // Find valid OTP
    const otp = await this.prisma.otp.findFirst({
      where: {
        userId,
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
      }
      userUpdateData.phone = phone;
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
  ): Promise<{ message: string }> {
    this.logger.log(`Submitting KYC for user: ${userId}`);

    // For now, we'll just store KYC data in user profile notes or create a KYC table later
    // For simplicity, we'll update the profile with notes about KYC submission
    // In production, you might want to create a separate KYC table

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Store KYC submission data (for now, we'll add notes to profile)
    // In production, create a separate KYC model
    const kycNotes = JSON.stringify({
      ...kycSubmissionDto,
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
    });

    if (user.profile) {
      await this.prisma.userProfile.update({
        where: { userId },
        data: {
          // We can use bio field temporarily or create a dedicated field
          bio: kycNotes,
        },
      });
    } else {
      // Create profile if doesn't exist
      await this.prisma.userProfile.create({
        data: {
          userId,
          firstName: user.email.split('@')[0],
          lastName: '',
          bio: kycNotes,
        },
      });
    }

    // Mark user as pending KYC verification
    // You might want to add a kycStatus field to User model
    // For now, we'll use isVerified flag logic differently

    this.logger.log(`KYC submitted for user: ${userId}`);

    return {
      message:
        'Đã gửi thông tin KYC thành công. Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ.',
    };
  }
}
