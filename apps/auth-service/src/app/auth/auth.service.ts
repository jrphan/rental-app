import { Injectable } from '@nestjs/common';
import { PrismaService } from '@rental-app/shared-prisma';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

import type { User, AuthToken, LoginResponse, RegisterDto } from '@rental-app/shared-types';

@Injectable()
export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_EXPIRES_IN = '1h';
  // private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';
  private readonly BCRYPT_ROUNDS = 12;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * User login
   */
  async login(loginDto: { email: string; password: string }, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const { email, password } = loginDto;

    try {
      // Find user by email
      const user = await this.prisma.client.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        await this.logAuthEvent(null, 'LOGIN_ATTEMPT', false, 'User not found', ipAddress, userAgent);
        throw new Error('Email không tồn tại');
      }

      // Check if user is active
      if (!user.isActive) {
        await this.logAuthEvent(user.id, 'LOGIN_ATTEMPT', false, 'User account is deactivated', ipAddress, userAgent);
        throw new Error('Tài khoản đã bị vô hiệu hóa');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        await this.logAuthEvent(user.id, 'LOGIN_ATTEMPT', false, 'Invalid password', ipAddress, userAgent);
        throw new Error('Mật khẩu không đúng');
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken();

      // Store refresh token in database
      await this.prisma.client.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: await bcrypt.hash(refreshToken, this.BCRYPT_ROUNDS),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Update last login
      await this.prisma.client.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Log successful login
      await this.logAuthEvent(user.id, 'LOGIN_SUCCESS', true, null, ipAddress, userAgent);

      return {
        user: this.mapUserToAuthUser(user),
        accessToken,
        refreshToken,
        expiresIn: 3600, // 1 hour
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      await this.logAuthEvent(null, 'LOGIN_ATTEMPT', false, 'Unknown error', ipAddress, userAgent);
      throw new Error('Đăng nhập thất bại');
    }
  }

  /**
   * User registration
   */
  async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const { email, password, firstName, lastName, phone } = registerDto;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      await this.logAuthEvent(null, 'REGISTRATION_ATTEMPT', false, 'Missing required fields', ipAddress, userAgent);
      throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
    }

    // Validate firstName and lastName are not empty strings
    if (firstName.trim().length === 0 || lastName.trim().length === 0) {
      await this.logAuthEvent(null, 'REGISTRATION_ATTEMPT', false, 'Empty first name or last name', ipAddress, userAgent);
      throw new Error('Họ và tên không được để trống');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await this.logAuthEvent(null, 'REGISTRATION_ATTEMPT', false, 'Invalid email format', ipAddress, userAgent);
      throw new Error('Email không hợp lệ');
    }

    // Validate password strength
    if (password.length < 6) {
      await this.logAuthEvent(null, 'REGISTRATION_ATTEMPT', false, 'Password too short', ipAddress, userAgent);
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
    }

    try {
      // Check if user already exists
      const existingUser = await this.prisma.client.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        await this.logAuthEvent(null, 'REGISTRATION_ATTEMPT', false, 'Email already exists', ipAddress, userAgent);
        throw new Error('Email đã được sử dụng');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);

      // Create new user
      const newUser = await this.prisma.client.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone?.trim() || null,
          role: 'USER',
          isActive: true,
          isVerified: false,
        },
      });

      // Generate tokens
      const accessToken = this.generateAccessToken(newUser.id);
      const refreshToken = this.generateRefreshToken();

      // Store refresh token
      await this.prisma.client.refreshToken.create({
        data: {
          userId: newUser.id,
          tokenHash: await bcrypt.hash(refreshToken, this.BCRYPT_ROUNDS),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Log successful registration
      await this.logAuthEvent(newUser.id, 'REGISTRATION_SUCCESS', true, null, ipAddress, userAgent);

      return {
        user: this.mapUserToAuthUser(newUser),
        accessToken,
        refreshToken,
        expiresIn: 3600,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      await this.logAuthEvent(null, 'REGISTRATION_ATTEMPT', false, 'Unknown error', ipAddress, userAgent);
      throw new Error('Đăng ký thất bại');
    }
  }

  /**
   * Get user profile by token
   */
  async getProfile(token: string): Promise<User> {
    try {
      // Verify and decode JWT token
      const payload = jwt.verify(token, this.JWT_SECRET) as { userId: string; iat: number; exp: number };
      
      // Find user
      const user = await this.prisma.client.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new Error('Người dùng không tồn tại');
      }

      if (!user.isActive) {
        throw new Error('Tài khoản đã bị vô hiệu hóa');
      }

      return this.mapUserToAuthUser(user);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token không hợp lệ');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token đã hết hạn');
      }
      throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthToken> {
    try {
      // Find refresh token in database
      const refreshTokens = await this.prisma.client.refreshToken.findMany({
        where: {
          isRevoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      // Check if refresh token matches any stored token
      let validRefreshToken = null;
      for (const tokenRecord of refreshTokens) {
        const isValid = await bcrypt.compare(refreshToken, tokenRecord.tokenHash);
        if (isValid) {
          validRefreshToken = tokenRecord;
          break;
        }
      }

      if (!validRefreshToken) {
        throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');
      }

      // Check if user is still active
      if (!validRefreshToken.user.isActive) {
        throw new Error('Tài khoản đã bị vô hiệu hóa');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(validRefreshToken.userId);
      const newRefreshToken = this.generateRefreshToken();

      // Revoke old refresh token
      await this.prisma.client.refreshToken.update({
        where: { id: validRefreshToken.id },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });

      // Store new refresh token
      await this.prisma.client.refreshToken.create({
        data: {
          userId: validRefreshToken.userId,
          tokenHash: await bcrypt.hash(newRefreshToken, this.BCRYPT_ROUNDS),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 3600,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Làm mới token thất bại');
    }
  }

  /**
   * Logout user
   */
  async logout(token: string): Promise<void> {
    try {
      // Decode token to get user ID
      const payload = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      
      // Revoke all refresh tokens for this user
      await this.prisma.client.refreshToken.updateMany({
        where: {
          userId: payload.userId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });
    } catch (error) {
      // If token is invalid, we don't need to do anything
      // The token will expire naturally
    }
  }

  /**
   * Generate JWT access token
   */
  private generateAccessToken(userId: string): string {
    return jwt.sign(
      { userId },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(): string {
    return require('crypto').randomBytes(64).toString('hex');
  }

  /**
   * Map Prisma User to AuthUser interface
   */
  private mapUserToAuthUser(user: any): any {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }

  /**
   * Log authentication events
   */
  private async logAuthEvent(
    userId: string | null,
    eventType: string,
    success: boolean,
    errorMessage: string | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.prisma.client.authAuditLog.create({
        data: {
          userId,
          eventType,
          success,
          errorMessage,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      // Don't throw error for logging failures
      console.error('Failed to log auth event:', error);
    }
  }
}
