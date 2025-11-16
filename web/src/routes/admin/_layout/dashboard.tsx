import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { authStore } from '@/store/auth'
import {
  User,
  Shield,
  Activity,
  FileCheck,
  Car,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/admin/stat-card'
import { RevenueChart } from '@/components/admin/revenue-chart'
import { RentalStatusChart } from '@/components/admin/rental-status-chart'
import { VehicleStatusChart } from '@/components/admin/vehicle-status-chart'
import { dashboardApi } from '@/lib/api.dashboard'

export const Route = createFileRoute('/admin/_layout/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const authState = useStore(authStore)
  const user = authState.user

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getDashboardStats(),
  })

  // Fetch revenue chart data
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: () => dashboardApi.getRevenueChart(30),
  })

  // Fetch rental status chart data
  const { data: rentalStatusData, isLoading: rentalStatusLoading } = useQuery({
    queryKey: ['dashboard', 'rental-status'],
    queryFn: () => dashboardApi.getRentalStatusChart(),
  })

  // Fetch vehicle status chart data
  const { data: vehicleStatusData, isLoading: vehicleStatusLoading } = useQuery(
    {
      queryKey: ['dashboard', 'vehicle-status'],
      queryFn: () => dashboardApi.getVehicleStatusChart(),
    },
  )

  // Mock data for now (will be replaced with real API data)
  const mockRevenueData = revenueData || [
    { date: '2024-01-01', revenue: 5000000, rentals: 5 },
    { date: '2024-01-02', revenue: 7500000, rentals: 8 },
    { date: '2024-01-03', revenue: 6000000, rentals: 6 },
    { date: '2024-01-04', revenue: 9000000, rentals: 10 },
    { date: '2024-01-05', revenue: 8000000, rentals: 9 },
  ]

  const mockRentalStatusData = rentalStatusData || [
    { status: 'PENDING', count: 5 },
    { status: 'CONFIRMED', count: 12 },
    { status: 'COMPLETED', count: 45 },
    { status: 'CANCELLED', count: 3 },
  ]

  const mockVehicleStatusData = vehicleStatusData || [
    { status: 'PENDING', count: 3 },
    { status: 'APPROVED', count: 25 },
    { status: 'ACTIVE', count: 20 },
    { status: 'INACTIVE', count: 5 },
  ]

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('vi-VN')} VNĐ`
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            Chào mừng trở lại, {user?.email}! Đây là trang quản lý hệ thống thuê
            xe P2P
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng người dùng"
          value={stats?.totalUsers || 0}
          icon={<User className="h-4 w-4" />}
          trend={{
            value: 12.5,
            label: 'so với tháng trước',
            isPositive: true,
          }}
        />
        <StatCard
          title="Tổng xe"
          value={stats?.totalVehicles || 0}
          icon={<Car className="h-4 w-4" />}
          onClick={() => navigate({ to: '/admin/vehicles' })}
        />
        <StatCard
          title="Xe đang hoạt động"
          value={stats?.activeVehicles || 0}
          icon={<Shield className="h-4 w-4" />}
          description={`${stats?.totalVehicles || 0} tổng xe`}
        />
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={<DollarSign className="h-4 w-4" />}
          trend={{
            value: 8.2,
            label: 'so với tháng trước',
            isPositive: true,
          }}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Doanh thu tháng này"
          value={formatCurrency(stats?.monthlyRevenue || 0)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Tổng lượt thuê"
          value={stats?.totalRentals || 0}
          icon={<Activity className="h-4 w-4" />}
          description={`${stats?.activeRentals || 0} đang hoạt động`}
        />
        <StatCard
          title="KYC chờ duyệt"
          value={stats?.pendingKyc || 0}
          icon={<FileCheck className="h-4 w-4" />}
          onClick={() => navigate({ to: '/admin/kyc' })}
          className={stats && stats.pendingKyc > 0 ? 'border-orange-500' : ''}
        />
        <StatCard
          title="Yêu cầu chủ xe"
          value={stats?.pendingOwnerApplications || 0}
          icon={<Users className="h-4 w-4" />}
          onClick={() => navigate({ to: '/admin/owners' })}
          className={
            stats && stats.pendingOwnerApplications > 0
              ? 'border-orange-500'
              : ''
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart
          data={mockRevenueData}
          title="Doanh thu 30 ngày gần đây"
          description="Biểu đồ doanh thu và số lượt thuê theo ngày"
        />
        <RentalStatusChart
          data={mockRentalStatusData}
          title="Phân bố trạng thái thuê xe"
          description="Tỷ lệ các trạng thái trong tổng số lượt thuê"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <VehicleStatusChart
          data={mockVehicleStatusData}
          title="Phân bố trạng thái xe"
          description="Số lượng xe theo từng trạng thái"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate({ to: '/admin/kyc' })}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Quản lý KYC
            </CardTitle>
            <CardDescription>
              Duyệt các yêu cầu xác thực danh tính
              {stats && stats.pendingKyc > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {stats.pendingKyc} chờ duyệt
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate({ to: '/admin/owners' })}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Quản lý Chủ xe
            </CardTitle>
            <CardDescription>
              Duyệt các yêu cầu đăng ký làm chủ xe
              {stats && stats.pendingOwnerApplications > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {stats.pendingOwnerApplications} chờ duyệt
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
