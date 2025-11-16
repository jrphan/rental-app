import { apiClient } from './api'

export interface DashboardStats {
  totalUsers: number
  totalVehicles: number
  activeVehicles: number
  totalRentals: number
  activeRentals: number
  totalRevenue: number
  monthlyRevenue: number
  pendingKyc: number
  pendingOwnerApplications: number
  pendingVehicles: number
}

export interface RevenueData {
  date: string
  revenue: number
  rentals: number
}

export interface RentalStatusData {
  status: string
  count: number
}

export interface VehicleStatusData {
  status: string
  count: number
}

export interface DashboardData {
  stats: DashboardStats
  revenueChart: RevenueData[]
  rentalStatusChart: RentalStatusData[]
  vehicleStatusChart: VehicleStatusData[]
}

export const dashboardApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await apiClient.get<DashboardStats>('/admin/dashboard/stats')
    if (res.success && res.data) {
      return res.data
    }
    throw new Error(res.message || 'Lấy thống kê dashboard thất bại')
  },

  async getDashboardData(): Promise<DashboardData> {
    const res = await apiClient.get<DashboardData>('/admin/dashboard')
    if (res.success && res.data) {
      return res.data
    }
    throw new Error(res.message || 'Lấy dữ liệu dashboard thất bại')
  },

  async getRevenueChart(days: number = 30): Promise<RevenueData[]> {
    const res = await apiClient.get<RevenueData[]>(
      `/admin/dashboard/revenue?days=${days}`,
    )
    if (res.success && res.data) {
      return res.data
    }
    throw new Error(res.message || 'Lấy dữ liệu biểu đồ doanh thu thất bại')
  },

  async getRentalStatusChart(): Promise<RentalStatusData[]> {
    const res = await apiClient.get<RentalStatusData[]>(
      '/admin/dashboard/rentals/status',
    )
    if (res.success && res.data) {
      return res.data
    }
    throw new Error(
      res.message || 'Lấy dữ liệu biểu đồ trạng thái thuê thất bại',
    )
  },

  async getVehicleStatusChart(): Promise<VehicleStatusData[]> {
    const res = await apiClient.get<VehicleStatusData[]>(
      '/admin/dashboard/vehicles/status',
    )
    if (res.success && res.data) {
      return res.data
    }
    throw new Error(res.message || 'Lấy dữ liệu biểu đồ trạng thái xe thất bại')
  },
}
