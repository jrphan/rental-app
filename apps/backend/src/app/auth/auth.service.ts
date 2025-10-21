import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto, LoginDto } from '../dto/user.dto';
import { User } from '@prisma/client';
import { createSuccessResponse, createErrorResponse, ApiResponse, HTTP_STATUS } from '@rental-app/shared-utils';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthData {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

export type LoginResponse = ApiResponse<AuthData>;
export type RegisterResponse = ApiResponse<AuthData>;
export type ErrorResponse = ApiResponse;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<RegisterResponse | ErrorResponse> {
    try {
      const user = await this.usersService.create(createUserDto);
      const tokens = await this.generateTokens(user);
      
      return createSuccessResponse(
        'Đăng ký thành công',
        {
          user: this.excludePassword(user),
          ...tokens,
        },
        '/auth/register'
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        return createErrorResponse(
          'Đăng ký thất bại',
          error.message,
          HTTP_STATUS.CONFLICT,
          '/auth/register'
        );
      }
      return createErrorResponse(
        'Đăng ký thất bại',
        'Có lỗi xảy ra trong quá trình đăng ký',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        '/auth/register'
      );
    }
  }

  async login(loginDto: LoginDto): Promise<LoginResponse | ErrorResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if ('error' in user) {
      return user;
    }

    const tokens = await this.generateTokens(user as User);
    
    return createSuccessResponse(
      'Đăng nhập thành công',
      {
        user: this.excludePassword(user as User),
        ...tokens,
      },
      '/auth/login'
    );
  }

  async validateUser(email: string, password: string): Promise<User | ErrorResponse> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return createErrorResponse(
        'Đăng nhập thất bại',
        'Email hoặc mật khẩu không đúng',
        HTTP_STATUS.UNAUTHORIZED,
        '/auth/login'
      );
    }

    const isPasswordValid = await this.usersService.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return createErrorResponse(
        'Đăng nhập thất bại',
        'Email hoặc mật khẩu không đúng',
        HTTP_STATUS.UNAUTHORIZED,
        '/auth/login'
      );
    }

    return user;
  }

  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  async refreshToken(userId: string): Promise<{ accessToken: string }> {
    const user = await this.usersService.findOne(userId);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  private excludePassword(user: User): Omit<User, 'password'> {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
