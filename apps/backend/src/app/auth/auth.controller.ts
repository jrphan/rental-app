import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from '../dto/user.dto';
import { createSuccessResponse, HTTP_STATUS } from '@rental-app/shared-utils';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto, @Res() res: any): Promise<void> {
    const result = await this.authService.register(createUserDto);
    
    if ('error' in result) {
      res.status(result.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(result);
    } else {
      res.status(HTTP_STATUS.CREATED).json(result);
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res() res: any): Promise<void> {
    const result = await this.authService.login(loginDto);
    
    if ('error' in result) {
      res.status(result.statusCode || HTTP_STATUS.UNAUTHORIZED).json(result);
    } else {
      res.status(HTTP_STATUS.OK).json(result);
    }
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
