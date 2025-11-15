import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Put,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { AuthService, AuthResponse, RegisterResponse } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { KycSubmissionDto } from './dto/kyc-submission.dto';
import { SendPhoneOtpDto } from './dto/send-phone-otp.dto';
import { VerifyPhoneOtpDto } from './dto/verify-phone-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { User, UserRole, KycStatus } from '@prisma/client';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                role: { type: 'string' },
                isActive: { type: 'boolean' },
                isVerified: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
            accessToken: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({
    status: 409,
    description: 'Email hoặc số điện thoại đã tồn tại',
  })
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
    return this.authService.register(registerDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác thực OTP sau khi đăng ký' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        otpCode: { type: 'string' },
      },
      required: ['userId', 'otpCode'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Xác thực thành công',
    schema: {
      type: 'object',
      properties: {
        user: { type: 'object' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async verifyOTP(
    @Body() body: { userId: string; otpCode: string },
  ): Promise<AuthResponse> {
    return this.authService.verifyOTP(body.userId, body.otpCode);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi lại mã OTP' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
      },
      required: ['userId'],
    },
  })
  async resendOTP(@Body() body: { userId: string }): Promise<void> {
    await this.authService.resendOTP(body.userId);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                role: { type: 'string' },
                isActive: { type: 'boolean' },
                isVerified: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
            accessToken: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Tài khoản chưa được xác thực. Mã OTP mới đã được gửi đến email.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Tài khoản chưa được xác thực. Mã OTP mới đã được gửi đến email của bạn.',
        },
        userId: { type: 'string' },
        email: { type: 'string' },
        requiresVerification: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string' },
            isActive: { type: 'boolean' },
            isVerified: { type: 'boolean' },
            isPhoneVerified: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@GetUser() user: Omit<User, 'password'>) {
    return user;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Refresh token thành công',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        oldPassword: { type: 'string' },
        newPassword: { type: 'string' },
      },
      required: ['oldPassword', 'newPassword'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Đổi mật khẩu thành công',
  })
  @ApiResponse({ status: 401, description: 'Mật khẩu cũ không đúng' })
  async changePassword(
    @GetUser() user: Omit<User, 'password'>,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    await this.authService.updatePassword(
      user.id,
      body.oldPassword,
      body.newPassword,
    );
    return { message: 'Đổi mật khẩu thành công' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quên mật khẩu - gửi mã OTP' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Mã OTP đã được gửi đến email (nếu email tồn tại)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      message: 'Nếu email tồn tại, mã OTP đã được gửi đến email của bạn.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu bằng mã OTP' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        otpCode: { type: 'string' },
        newPassword: { type: 'string' },
      },
      required: ['email', 'otpCode', 'newPassword'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Đặt lại mật khẩu thành công',
    schema: {
      type: 'object',
      properties: {
        user: { type: 'object' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async resetPassword(
    @Body() body: { email: string } & ResetPasswordDto,
  ): Promise<AuthResponse> {
    const { email, ...resetPasswordDto } = body;
    return this.authService.resetPassword(email, resetPasswordDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({
    summary: 'Lấy thông tin profile đầy đủ (User + UserProfile)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin profile thành công',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@GetUser() user: Omit<User, 'password'>) {
    return this.authService.getProfile(user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật thông tin profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật profile thành công',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @GetUser() user: Omit<User, 'password'>,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, updateProfileDto);
  }

  @Post('profile/kyc')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Gửi thông tin KYC để xác thực danh tính' })
  @ApiBody({ type: KycSubmissionDto })
  @ApiResponse({
    status: 200,
    description: 'Gửi KYC thành công',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitKYC(
    @GetUser() user: Omit<User, 'password'>,
    @Body() kycSubmissionDto: KycSubmissionDto,
  ) {
    return this.authService.submitKYC(user.id, kycSubmissionDto);
  }

  @Get('profile/kyc')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Xem trạng thái KYC của mình' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin KYC thành công',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyKYC(@GetUser() user: Omit<User, 'password'>) {
    return this.authService.getMyKYC(user.id);
  }

  @Get('admin/kyc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Admin - Lấy danh sách KYC submissions' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách KYC thành công',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async listKYCSubmissions(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.authService.listKYCSubmissions(
      status as KycStatus | undefined,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post('admin/kyc/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Admin - Duyệt KYC' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reviewNotes: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Duyệt KYC thành công',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async approveKYC(
    @GetUser() admin: Omit<User, 'password'>,
    @Param('id') kycId: string,
    @Body('reviewNotes') reviewNotes?: string,
  ) {
    return this.authService.approveKYC(kycId, admin.id, reviewNotes);
  }

  @Post('admin/kyc/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Admin - Từ chối KYC' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reviewNotes: { type: 'string' },
      },
      required: ['reviewNotes'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Từ chối KYC thành công',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async rejectKYC(
    @GetUser() admin: Omit<User, 'password'>,
    @Param('id') kycId: string,
    @Body('reviewNotes') reviewNotes?: string,
  ) {
    return this.authService.rejectKYC(kycId, admin.id, reviewNotes);
  }

  @Post('phone/send-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi mã OTP qua SMS để xác minh số điện thoại' })
  @ApiBody({ type: SendPhoneOtpDto })
  @ApiResponse({
    status: 200,
    description: 'Mã OTP đã được gửi đến số điện thoại',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Số điện thoại đã được xác minh hoặc không hợp lệ',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Số điện thoại đã được sử dụng' })
  async sendPhoneOTP(
    @GetUser() user: Omit<User, 'password'>,
    @Body() sendPhoneOtpDto: SendPhoneOtpDto,
  ) {
    return this.authService.sendPhoneVerificationOTP(user.id, sendPhoneOtpDto);
  }

  @Post('phone/verify-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác minh mã OTP từ SMS' })
  @ApiBody({ type: VerifyPhoneOtpDto })
  @ApiResponse({
    status: 200,
    description: 'Xác minh số điện thoại thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        isPhoneVerified: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyPhoneOTP(
    @GetUser() user: Omit<User, 'password'>,
    @Body() verifyPhoneOtpDto: VerifyPhoneOtpDto,
  ) {
    return this.authService.verifyPhoneOTP(user.id, verifyPhoneOtpDto);
  }

  @Post('phone/resend-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi lại mã OTP qua SMS' })
  @ApiBody({ type: SendPhoneOtpDto })
  @ApiResponse({
    status: 200,
    description: 'Mã OTP đã được gửi lại',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Số điện thoại đã được xác minh hoặc không hợp lệ',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Số điện thoại đã được sử dụng' })
  async resendPhoneOTP(
    @GetUser() user: Omit<User, 'password'>,
    @Body() sendPhoneOtpDto: SendPhoneOtpDto,
  ) {
    return this.authService.resendPhoneOTP(user.id, sendPhoneOtpDto);
  }
}
