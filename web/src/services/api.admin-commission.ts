import API_ENDPOINTS from '@/services/api.endpoints'
import { apiClient } from '@/lib/api'

export type CommissionPaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'APPROVED'
  | 'REJECTED'

export interface CommissionSettingsResponse {
  id: string
  commissionRate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CommissionPayment {
  id: string
  commissionId: string
  ownerId: string
  amount: string
  invoiceUrl: string | null
  status: CommissionPaymentStatus
  adminNotes: string | null
  paidAt: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    fullName: string | null
    phone: string
  }
  commission: {
    weekStartDate: string
    weekEndDate: string
  }
}

export interface AdminCommissionPaymentListResponse {
  items: CommissionPayment[]
  total: number
}

export interface UpdateCommissionSettingsRequest {
  commissionRate: number
}

export interface ReviewPaymentRequest {
  status: 'APPROVED' | 'REJECTED'
  adminNotes?: string
}

export const adminCommissionApi = {
  async getCommissionSettings(): Promise<CommissionSettingsResponse> {
    const response = await apiClient.get<CommissionSettingsResponse>(
      API_ENDPOINTS.ADMIN.COMMISSION_SETTINGS,
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(
      response.message || 'Lấy cài đặt commission thất bại',
    )
  },

  async updateCommissionSettings(
    data: UpdateCommissionSettingsRequest,
  ): Promise<CommissionSettingsResponse> {
    const response = await apiClient.put<CommissionSettingsResponse>(
      API_ENDPOINTS.ADMIN.COMMISSION_SETTINGS,
      data,
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(
      response.message || 'Cập nhật cài đặt commission thất bại',
    )
  },

  async getPendingPayments(params?: {
    limit?: number
    offset?: number
  }): Promise<AdminCommissionPaymentListResponse> {
    const response = await apiClient.get<AdminCommissionPaymentListResponse>(
      API_ENDPOINTS.ADMIN.COMMISSION_PAYMENTS,
      { params },
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(
      response.message || 'Lấy danh sách payment thất bại',
    )
  },

  async reviewPayment(
    paymentId: string,
    data: ReviewPaymentRequest,
  ): Promise<CommissionPayment> {
    const response = await apiClient.put<CommissionPayment>(
      API_ENDPOINTS.ADMIN.COMMISSION_PAYMENT_REVIEW(paymentId),
      data,
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(response.message || 'Review payment thất bại')
  },
}

