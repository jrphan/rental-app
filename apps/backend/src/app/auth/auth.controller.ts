import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService, RegisterResponse, LoginResponse } from './auth.service';
import { CreateUserDto, LoginDto } from '../dto/user.dto';
import { createSuccessResponse } from '@rental-app/shared-utils';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<RegisterResponse> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: { refreshToken: string }) {
    return createSuccessResponse(
      'Refresh token endpoint - cần implement token validation',
      null,
      '/auth/refresh'
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return createSuccessResponse(
      'Lấy thông tin profile thành công',
      req.user,
      '/auth/profile'
    );
  }

  @Get('health')
  async healthCheck() {
    return createSuccessResponse(
      'Auth service hoạt động bình thường',
      null,
      '/auth/health'
    );
  }
}
