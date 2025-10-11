import {
  RegisterDto,
  LoginResponse,
  RegisterResponse,
  RefreshTokenDto,
  RefreshTokenResponse,
  User
} from '@rental-app/shared-types';
import { BaseApiService, ApiResponse } from './BaseApiService';

export class AuthService extends BaseApiService {
  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>({
      url: '/auth/login',
      method: 'POST',
      data: { email, password },
    });
  }

  async register(userData: RegisterDto): Promise<ApiResponse<RegisterResponse>> {
    return this.request<RegisterResponse>({
      url: '/auth/register',
      method: 'POST',
      data: userData,
    });
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>({
      url: '/auth/profile',
      method: 'GET',
    });
  }

  async updateProfile(data: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>>): Promise<ApiResponse<User>> {
    return this.request<User>({
      url: '/auth/profile',
      method: 'PUT',
      data,
    });
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
    return this.request<RefreshTokenResponse>({
      url: '/auth/refresh',
      method: 'POST',
      data: { refreshToken } as RefreshTokenDto,
    });
  }

  async logout(): Promise<ApiResponse<null>> {
    return this.request<null>({
      url: '/auth/logout',
      method: 'POST',
    });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<null>> {
    return this.request<null>({
      url: '/auth/change_password',
      method: 'PUT',
      data: { oldPassword, newPassword },
    });
  }
}

export const authService = new AuthService();
