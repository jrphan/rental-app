import API_ENDPOINTS from '@/services/api.endpoints'
import { apiClient } from '@/lib/api'
import type {
  AdminKycListResponse,
  AdminKycDetail,
  KycStatus,
} from '@/types/auth.types'

export const adminKycApi = {
  async list(params?: {
    status?: KycStatus
    page?: number
    limit?: number
  }): Promise<AdminKycListResponse> {
    const response = await apiClient.get<AdminKycListResponse>(
      API_ENDPOINTS.ADMIN.LIST_KYC,
      {
        params: {
          status: params?.status,
          page: params?.page,
          limit: params?.limit,
        },
      },
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(response.message || 'Lấy danh sách KYC thất bại')
  },

  async detail(id: string): Promise<AdminKycDetail> {
    const response = await apiClient.get<AdminKycDetail>(
      API_ENDPOINTS.ADMIN.GET_KYC_DETAIL(id),
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(response.message || 'Lấy chi tiết KYC thất bại')
  },

  async approve(id: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.ADMIN.APPROVE_KYC(id),
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(response.message || 'Duyệt KYC thất bại')
  },

  async reject(id: string, reason: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.ADMIN.REJECT_KYC(id),
      { reason },
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(response.message || 'Từ chối KYC thất bại')
  },
}
