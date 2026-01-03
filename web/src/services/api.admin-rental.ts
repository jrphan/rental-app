import API_ENDPOINTS from '@/services/api.endpoints'
import { apiClient } from '@/lib/api'

export type RentalStatus =
  | 'PENDING_PAYMENT'
  | 'AWAIT_APPROVAL'
  | 'CONFIRMED'
  | 'ON_TRIP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED_REFUND'
  | 'RESOLVED_NO_REFUND'
  | 'CANCELLED'

export interface RentalUser {
  id: string
  phone: string
  email: string | null
  fullName: string | null
  avatar: string | null
}

export interface RentalVehicle {
  id: string
  brand: string
  model: string
  year: number
  color: string
  licensePlate: string
  engineSize: number
  images: {
    id: string
    url: string
    isPrimary: boolean
    order: number
  }[]
  pricePerDay: number
  depositAmount: number
  fullAddress: string | null
  address: string
  ward: string | null
  district: string | null
  city: string | null
  lat: number
  lng: number
}

export interface RentalEvidence {
  id: string
  url: string
  type: string
  order: number
  note: string | null
  createdAt: string
}

export interface RentalDispute {
  id: string
  rentalId: string
  reason: string
  description: string | null
  status: DisputeStatus
  adminNotes: string | null
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface RentalTransaction {
  id: string
  type: string
  amount: number
  currency: string
  status: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminRentalItem {
  id: string
  renterId: string
  ownerId: string
  vehicleId: string
  startDate: string
  endDate: string
  durationMinutes: number
  currency: string
  pricePerDay: number
  deliveryFee: number
  insuranceFee: number
  discountAmount: number
  deliveryAddress: Record<string, any> | null
  totalPrice: number
  depositPrice: number
  platformFeeRatio: number
  platformFee: number
  ownerEarning: number
  status: RentalStatus
  startOdometer: number | null
  endOdometer: number | null
  cancelReason: string | null
  createdAt: string
  updatedAt: string
  renter: RentalUser
  owner: RentalUser
  vehicle: RentalVehicle
  evidences: RentalEvidence[]
  dispute: RentalDispute | null
  transactions: RentalTransaction[]
}

export interface AdminRentalListResponse {
  items: AdminRentalItem[]
  total: number
  page: number
  limit: number
}

export type AdminRentalDetail = AdminRentalItem

export const adminRentalApi = {
  async list(params?: {
    status?: RentalStatus
    hasDispute?: boolean
    page?: number
    limit?: number
  }): Promise<AdminRentalListResponse> {
    const response = await apiClient.get<AdminRentalListResponse>(
      API_ENDPOINTS.ADMIN.LIST_RENTALS,
      {
        params: {
          status: params?.status,
          hasDispute:
            params?.hasDispute !== undefined
              ? String(params.hasDispute)
              : undefined,
          page: params?.page,
          limit: params?.limit,
        },
      },
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(response.message || 'Lấy danh sách đơn hàng thất bại')
  },

  async detail(id: string): Promise<AdminRentalDetail> {
    const response = await apiClient.get<AdminRentalDetail>(
      API_ENDPOINTS.ADMIN.GET_RENTAL_DETAIL(id),
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(response.message || 'Lấy chi tiết đơn hàng thất bại')
  },

  async updateStatus(
    id: string,
    status: RentalStatus,
  ): Promise<{ message: string; rental: AdminRentalDetail }> {
    const response = await apiClient.patch<
      { message: string; rental: AdminRentalDetail }
    >(API_ENDPOINTS.ADMIN.UPDATE_RENTAL_STATUS(id), {
      status,
    })
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(response.message || 'Cập nhật trạng thái đơn hàng thất bại')
  },
}

