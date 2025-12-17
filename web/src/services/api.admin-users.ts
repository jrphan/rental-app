import API_ENDPOINTS from '@/services/api.endpoints'
import { apiClient } from '@/lib/api'
import type { AdminUserListResponse, KycStatus, UserRole } from '@/types/auth.types'

export const adminUsersApi = {
  async list(params?: {
    page?: number
    limit?: number
    role?: UserRole
    isActive?: boolean
    isPhoneVerified?: boolean
    kycStatus?: KycStatus
    search?: string
  }): Promise<AdminUserListResponse> {
    const response = await apiClient.get<AdminUserListResponse>(
      API_ENDPOINTS.ADMIN.LIST_USERS,
      {
        params: {
          page: params?.page,
          limit: params?.limit,
          role: params?.role,
          isActive: params?.isActive,
          isPhoneVerified: params?.isPhoneVerified,
          kycStatus: params?.kycStatus,
          search: params?.search?.trim() || undefined,
        },
      },
    )

    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }

    throw new Error(response.message || 'Lấy danh sách người dùng thất bại')
  },
}
