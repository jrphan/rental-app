import API_ENDPOINTS from '@/services/api.endpoints'
import { apiClient } from '@/lib/api'

export type VehicleStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'MAINTENANCE'
  | 'HIDDEN'

export interface VehicleImage {
  id: string
  url: string
  isPrimary: boolean
  order: number
}

export interface AdminVehicleItem {
  id: string
  ownerId: string
  type: string
  brand: string
  model: string
  year: number
  color: string
  licensePlate: string
  engineSize: number
  requiredLicense: string
  cavetFront: string | null
  cavetBack: string | null
  description: string | null
  fullAddress?: string | null
  address: string
  ward: string | null
  district: string | null
  city: string | null
  lat: number
  lng: number
  pricePerDay: number
  depositAmount: number
  instantBook: boolean
  status: VehicleStatus
  createdAt: string
  updatedAt: string
  images: VehicleImage[]
  owner: {
    id: string
    phone: string
    fullName: string | null
    email: string | null
    isVendor: boolean
  }
}

export interface AdminVehicleListResponse {
  items: AdminVehicleItem[]
  total: number
  page: number
  limit: number
}

export type AdminVehicleDetail = AdminVehicleItem

export const adminVehicleApi = {
  async list(params?: {
    status?: VehicleStatus
    page?: number
    limit?: number
  }): Promise<AdminVehicleListResponse> {
    const response = await apiClient.get<AdminVehicleListResponse>(
      API_ENDPOINTS.ADMIN.LIST_VEHICLES,
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
    throw new Error(response.message || 'Lấy danh sách xe thất bại')
  },

  async detail(id: string): Promise<AdminVehicleDetail> {
    const response = await apiClient.get<AdminVehicleDetail>(
      API_ENDPOINTS.ADMIN.GET_VEHICLE_DETAIL(id),
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(response.message || 'Lấy chi tiết xe thất bại')
  },

  async approve(id: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.ADMIN.APPROVE_VEHICLE(id),
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(response.message || 'Duyệt xe thất bại')
  },

  async reject(id: string, reason: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.ADMIN.REJECT_VEHICLE(id),
      { reason },
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(response.message || 'Từ chối xe thất bại')
  },
}
