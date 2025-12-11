import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '@/modules/auth/auth.service';
import { RegisterUserDto } from '@/common/dto/Auth/register-user.dto';
import { LoginDto } from '@/common/dto/Auth/login.dto';
import {
  ChangePasswordResponse,
  ForgotPasswordResponse,
  LoginResponse,
  LoginWithNoVerifyPhoneResponse,
  RegisterResponse,
  ResendOtpResponse,
  VerifyOtpResponse,
  VerifyResetPasswordResponse,
} from '@/types/auth.type';
import { ROUTES } from '@/config/routes';
import { VerifyOtpDto } from '@/common/dto/Auth/verify-otp.dto';
import { ResendOtpDto } from '@/common/dto/Auth/resend-otp.dto';
import { ForgotPasswordDto } from '@/common/dto/Auth/forgot-password.dto';
import { VerifyResetPasswordDto } from '@/common/dto/Auth/verify-reset-password.dto';
import { ChangePasswordDto } from '@/common/dto/Auth/change-password.dto';
import { AuthGuard } from '@/common/guards/auth.guard';

type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
  };
};

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(ROUTES.AUTH.CHANGE_PASSWORD)
  @UseGuards(AuthGuard)
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: Request,
  ): Promise<ChangePasswordResponse> {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Post(ROUTES.AUTH.REGISTER)
  register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<RegisterResponse> {
    return this.authService.register(registerUserDto);
  }

  @Post(ROUTES.AUTH.LOGIN)
  login(
    @Body() loginDto: LoginDto,
  ): Promise<LoginResponse | LoginWithNoVerifyPhoneResponse> {
    return this.authService.login(loginDto);
  }

  @Post(ROUTES.AUTH.FORGOT_PASSWORD)
  forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponse> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post(ROUTES.AUTH.VERIFY_RESET_PASSWORD)
  verifyResetPassword(
    @Body() verifyResetPasswordDto: VerifyResetPasswordDto,
  ): Promise<VerifyResetPasswordResponse> {
    return this.authService.verifyResetPassword(verifyResetPasswordDto);
  }

  @Post(ROUTES.AUTH.VERIFY_OTP)
  verifyOTP(@Body() verifyOtpDto: VerifyOtpDto): Promise<VerifyOtpResponse> {
    return this.authService.verifyOTP(verifyOtpDto);
  }

  @Post(ROUTES.AUTH.RESEND_OTP)
  resendOTP(@Body() resendOtpDto: ResendOtpDto): Promise<ResendOtpResponse> {
    return this.authService.resendOTP(resendOtpDto);
  }
}
