import { Controller, Post, Get, Put, Body, Headers, HttpException, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  RegisterDto,
  LoginResponse,
  RegisterResponse,
  RefreshTokenDto,
  RefreshTokenResponse,
  User
} from '@rental-app/shared-types';
import type { Request } from 'express';
import {
  createSuccessResponse,
  createErrorResponse,
  RESPONSE_MESSAGES,
  HTTP_STATUS
} from '@rental-app/shared-utils';

export interface LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * User login
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const result: LoginResponse = await this.authService.login(loginDto, ipAddress, userAgent);
      return createSuccessResponse(RESPONSE_MESSAGES.LOGIN_SUCCESS, result, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      const errorResponse = createErrorResponse(
        errorMessage || RESPONSE_MESSAGES.INVALID_CREDENTIALS,
        errorMessage || 'Login failed',
        HTTP_STATUS.UNAUTHORIZED,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.UNAUTHORIZED);
    }
  }

  /**
   * Update user profile
   */
  @Put('profile')
  async updateProfile(
    @Headers('authorization') authHeader: string,
    @Body() body: { firstName?: string; lastName?: string; email?: string; phone?: string | null },
    @Req() req: Request
  ) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const user: User = await this.authService.updateProfile(token, body);

      return createSuccessResponse(RESPONSE_MESSAGES.SUCCESS, user, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed';
      const errorResponse = createErrorResponse(
        errorMessage || RESPONSE_MESSAGES.VALIDATION_ERROR,
        errorMessage || 'Update failed',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * User registration
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const result: RegisterResponse = await this.authService.register(registerDto, ipAddress, userAgent);
      return createSuccessResponse(RESPONSE_MESSAGES.REGISTRATION_SUCCESS, result, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      const errorResponse = createErrorResponse(
        errorMessage || RESPONSE_MESSAGES.VALIDATION_ERROR,
        errorMessage || 'Registration failed',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Get user profile
   */
  @Get('profile')
  async getProfile(@Headers('authorization') authHeader: string, @Req() req: Request) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const user: User = await this.authService.getProfile(token);

      return createSuccessResponse(RESPONSE_MESSAGES.SUCCESS, user, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unauthorized';
      const errorResponse = createErrorResponse(
        errorMessage || RESPONSE_MESSAGES.UNAUTHORIZED,
        errorMessage || 'Unauthorized',
        HTTP_STATUS.UNAUTHORIZED,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.UNAUTHORIZED);
    }
  }

  /**
   * Refresh token
   */
  @Post('refresh')
  async refreshToken(@Body() body: RefreshTokenDto, @Req() req: Request) {
    try {
      const result: RefreshTokenResponse = await this.authService.refreshToken(body.refreshToken);
      return createSuccessResponse(RESPONSE_MESSAGES.SUCCESS, result, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      const errorResponse = createErrorResponse(
        errorMessage || RESPONSE_MESSAGES.INVALID_TOKEN,
        errorMessage || 'Token refresh failed',
        HTTP_STATUS.UNAUTHORIZED,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.UNAUTHORIZED);
    }
  }

  /**
   * Logout
   */
  @Post('logout')
  async logout(@Headers('authorization') authHeader: string, @Req() req: Request) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      await this.authService.logout(token);

      return createSuccessResponse(RESPONSE_MESSAGES.LOGOUT_SUCCESS, null, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      const errorResponse = createErrorResponse(
        errorMessage || 'Logout failed',
        errorMessage || 'Logout failed',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }
}
