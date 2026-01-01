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

export interface AdminStatsResponse {
  overview: {
    totalRevenue: string
    totalRentals: number
    totalUsers: number
    totalVehicles: number
    activeRentals: number
    pendingRentals: number
    completedRentals: number
    cancelledRentals: number
    disputedRentals: number
  }
  revenue: {
    today: string
    thisWeek: string
    thisMonth: string
    lastMonth: string
  }
  rentalsByStatus: Array<{
    status: RentalStatus
    count: number
  }>
  revenueChart: Array<{
    date: string
    revenue: string
    count: number
  }>
  recentRentals: Array<{
    id: string
    renterName: string | null
    vehicleName: string
    totalPrice: string
    status: RentalStatus
    createdAt: string
  }>
  topVehicles: Array<{
    vehicleId: string
    brand: string
    model: string
    licensePlate: string
    rentalCount: number
    totalRevenue: string
  }>
}

export const adminStatsApi = {
  async getStats(): Promise<AdminStatsResponse> {
    const response = await apiClient.get<AdminStatsResponse>(
      API_ENDPOINTS.ADMIN.STATS,
    )
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data
    }
    throw new Error(response.message || 'Lấy thống kê thất bại')
  },
}
