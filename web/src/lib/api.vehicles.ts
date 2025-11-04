import { apiClient } from './api'

export interface VehicleItem {
  id: string
  ownerId: string
  brand: string
  model: string
  year: number
  color: string
  licensePlate: string
  dailyRate: string
  hourlyRate?: string | null
  depositAmount: string
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED'
  isActive: boolean
  isAvailable: boolean
  createdAt: string
}

export interface Paginated<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export const vehiclesApi = {
  async listPublic(params?: {
    cityId?: string
    page?: number
    limit?: number
  }) {
    const s = new URLSearchParams()
    if (params?.cityId) s.set('cityId', params.cityId)
    if (params?.page) s.set('page', String(params.page))
    if (params?.limit) s.set('limit', String(params.limit))
    return apiClient.get<Paginated<VehicleItem>>(
      `/vehicles${s.toString() ? `?${s.toString()}` : ''}`,
    )
  },

  async listForReview(params?: {
    status?: string
    page?: number
    limit?: number
  }) {
    const s = new URLSearchParams()
    if (params?.status) s.set('status', params.status)
    if (params?.page) s.set('page', String(params.page))
    if (params?.limit) s.set('limit', String(params.limit))
    return apiClient.get<Paginated<VehicleItem>>(
      `/vehicles/admin/reviews${s.toString() ? `?${s.toString()}` : ''}`,
    )
  },

  async verify(id: string) {
    return apiClient.post(`/vehicles/${id}/verify`)
  },

  async reject(id: string, reason?: string) {
    return apiClient.post(`/vehicles/${id}/reject`, { reason })
  },
}

export const rentalsApi = {
  async create(payload: {
    vehicleId: string
    startDate: string
    endDate: string
  }) {
    return apiClient.post('/rentals', payload)
  },
}
