import { Controller, Post, Get, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * User login
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto);
      return {
        success: true,
        message: 'Login successful',
        data: result,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Login failed',
        },
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  /**
   * User registration
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      const result = await this.authService.register(registerDto);
      return {
        success: true,
        message: 'Registration successful',
        data: result,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Registration failed',
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Get user profile
   */
  @Get('profile')
  async getProfile(@Headers('authorization') authHeader: string) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const user = await this.authService.getProfile(token);
      
      return {
        success: true,
        data: user,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Unauthorized',
        },
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  /**
   * Refresh token
   */
  @Post('refresh')
  async refreshToken(@Body() body: { refreshToken: string }) {
    try {
      const result = await this.authService.refreshToken(body.refreshToken);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Token refresh failed',
        },
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  /**
   * Logout
   */
  @Post('logout')
  async logout(@Headers('authorization') authHeader: string) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      await this.authService.logout(token);
      
      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Logout failed',
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
