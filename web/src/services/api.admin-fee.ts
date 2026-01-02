import API_ENDPOINTS from '@/services/api.endpoints'
import { apiClient } from '@/lib/api'

export interface FeeSettingsResponse {
  id: string
  deliveryFeePerKm: string
  insuranceRate50cc: string
  insuranceRateTayGa: string
  insuranceRateTayCon: string
  insuranceRateMoto: string
  insuranceRateDefault: string
  insuranceCommissionRatio: string // 0.20 = 20%
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateFeeSettingsRequest {
  deliveryFeePerKm: number
  insuranceRate50cc: number
  insuranceRateTayGa: number
  insuranceRateTayCon: number
  insuranceRateMoto: number
  insuranceRateDefault?: number
  insuranceCommissionRatio: number // 0.20 = 20%
}

export interface InsuranceStatsResponse {
  totalInsuranceFee: string
  totalInsuranceCommissionAmount: string
  totalInsurancePayableToPartner: string
  totalRentals: number
  periodStart: string
  periodEnd: string
  byVehicleType: {
    type: string
    count: number
    totalFee: string
    totalCommissionAmount: string
    totalPayableToPartner: string
  }[]
}

export const adminFeeApi = {
  async getFeeSettings(): Promise<FeeSettingsResponse> {
    const response = await apiClient.get<FeeSettingsResponse>(
      API_ENDPOINTS.ADMIN.FEE_SETTINGS,
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(
      response.message || 'Lấy cài đặt phí thất bại',
    )
  },

  async updateFeeSettings(
    data: UpdateFeeSettingsRequest,
  ): Promise<FeeSettingsResponse> {
    const response = await apiClient.put<FeeSettingsResponse>(
      API_ENDPOINTS.ADMIN.FEE_SETTINGS,
      data,
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(
      response.message || 'Cập nhật cài đặt phí thất bại',
    )
  },

  async getInsuranceStats(params?: {
    startDate?: string
    endDate?: string
  }): Promise<InsuranceStatsResponse> {
    const response = await apiClient.get<InsuranceStatsResponse>(
      API_ENDPOINTS.ADMIN.INSURANCE_STATS,
      { params },
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(
      response.message || 'Lấy thống kê bảo hiểm thất bại',
    )
  },
}

