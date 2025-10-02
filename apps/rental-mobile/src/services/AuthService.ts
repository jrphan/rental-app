import { RegisterDto } from '@rental-app/shared-types';
import { BaseApiService, ApiResponse } from './BaseApiService';

export class AuthService extends BaseApiService {
  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse> {
    return this.request({
      url: '/auth/login',
      method: 'POST',
      data: { email, password },
    });
  }

  async register(userData: RegisterDto): Promise<ApiResponse> {
    return this.request({
      url: '/auth/register',
      method: 'POST',
      data: userData,
    });
  }

  async getProfile(): Promise<ApiResponse> {
    return this.request({
      url: '/auth/profile',
      method: 'GET',
    });
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse> {
    return this.request({
      url: '/auth/refresh',
      method: 'POST',
      data: { refreshToken },
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request({
      url: '/auth/logout',
      method: 'POST',
    });
  }
}

export const authService = new AuthService();
