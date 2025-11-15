import { apiClient } from './api'

export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface KycSubmission {
  id: string
  userId: string
  idNumber: string | null
  idCardFrontUrl: string | null
  idCardBackUrl: string | null
  passportUrl: string | null
  driverLicenseUrl: string | null
  selfieUrl: string | null
  notes: string | null
  status: KycStatus
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNotes: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    phone: string | null
    role: string
    createdAt: string
  }
  reviewer: {
    id: string
    email: string
  } | null
}

export interface KycListResponse {
  items: KycSubmission[]
  total: number
  page: number
  limit: number
}

export interface ApproveKycInput {
  reviewNotes?: string
}

export interface RejectKycInput {
  reviewNotes: string
}

/**
 * KYC API service
 */
export const kycApi = {
  /**
   * Admin: Lấy danh sách KYC submissions
   */
  async listKYCSubmissions(
    status?: KycStatus,
    page = 1,
    limit = 10,
  ): Promise<KycListResponse> {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    const response = await apiClient.get<KycListResponse>(
      `/auth/admin/kyc?${params.toString()}`,
    )
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.message || 'Lấy danh sách KYC thất bại')
  },

  /**
   * Admin: Duyệt KYC
   */
  async approveKYC(
    kycId: string,
    data?: ApproveKycInput,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `/auth/admin/kyc/${kycId}/approve`,
      data || {},
    )
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.message || 'Duyệt KYC thất bại')
  },

  /**
   * Admin: Từ chối KYC
   */
  async rejectKYC(
    kycId: string,
    data: RejectKycInput,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `/auth/admin/kyc/${kycId}/reject`,
      data,
    )
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.message || 'Từ chối KYC thất bại')
  },
}
