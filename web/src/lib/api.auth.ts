import { apiClient } from './api'
import type { AuthResponse, LoginInput } from '@/types/api'

/**
 * Auth API service
 */
export const authApi = {
  /**
   * Đăng nhập
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.message || 'Đăng nhập thất bại')
  },

  /**
   * Lấy thông tin user hiện tại
   */
  async getMe(): Promise<AuthResponse['user']> {
    const response = await apiClient.get<AuthResponse['user']>('/auth/me')
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.message || 'Lấy thông tin thất bại')
  },

  /**
   * Refresh access token
   * Uses apiClient but the interceptor will handle token refresh automatically
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken?: string
  }> {
    const response = await apiClient.post<{
      accessToken: string
      refreshToken?: string
    }>('/auth/refresh', {
      refreshToken,
    })
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.message || 'Refresh token thất bại')
  },
}

