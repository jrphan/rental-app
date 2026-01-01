import { useQuery } from '@tanstack/react-query'
import {
  DollarSign,
  Package,
  Users,
  Bike,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import { adminStatsApi } from '@/services/api.admin-stats'
import { StatsWidget } from './components/StatsWidget'
import { RevenueChart } from './components/RevenueChart'
import { RentalsByStatusChart } from './components/RentalsByStatusChart'
import { RecentRentalsTable } from './components/RecentRentalsTable'
import { TopVehiclesTable } from './components/TopVehiclesTable'

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminStatsApi.getStats(),
    refetchInterval: 60000, // Refetch every minute
  })

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(numAmount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-500">
          <p>Không thể tải dữ liệu thống kê</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Tổng quan hệ thống và thống kê doanh thu
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsWidget
          title="Tổng doanh thu"
          value={formatCurrency(data.overview.totalRevenue)}
          icon={DollarSign}
          trend={null}
          description="Tổng phí nền tảng từ các đơn đã hoàn thành"
        />
        <StatsWidget
          title="Tổng đơn hàng"
          value={data.overview.totalRentals.toLocaleString('vi-VN')}
          icon={Package}
          trend={null}
          description={`${data.overview.completedRentals} đã hoàn thành`}
        />
        <StatsWidget
          title="Người dùng"
          value={data.overview.totalUsers.toLocaleString('vi-VN')}
          icon={Users}
          trend={null}
          description="Tổng số người dùng trong hệ thống"
        />
        <StatsWidget
          title="Xe"
          value={data.overview.totalVehicles.toLocaleString('vi-VN')}
          icon={Bike}
          trend={null}
          description="Tổng số xe trong hệ thống"
        />
      </div>

      {/* Revenue Period Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsWidget
          title="Doanh thu hôm nay"
          value={formatCurrency(data.revenue.today)}
          icon={TrendingUp}
          trend={null}
          description=""
          variant="success"
        />
        <StatsWidget
          title="Doanh thu tuần này"
          value={formatCurrency(data.revenue.thisWeek)}
          icon={TrendingUp}
          trend={null}
          description=""
          variant="success"
        />
        <StatsWidget
          title="Doanh thu tháng này"
          value={formatCurrency(data.revenue.thisMonth)}
          icon={TrendingUp}
          trend={null}
          description=""
          variant="success"
        />
        <StatsWidget
          title="Doanh thu tháng trước"
          value={formatCurrency(data.revenue.lastMonth)}
          icon={TrendingUp}
          trend={null}
          description=""
        />
      </div>

      {/* Rental Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsWidget
          title="Đang thuê"
          value={data.overview.activeRentals.toString()}
          icon={Bike}
          variant="primary"
        />
        <StatsWidget
          title="Chờ xử lý"
          value={data.overview.pendingRentals.toString()}
          icon={Clock}
          variant="warning"
        />
        <StatsWidget
          title="Hoàn thành"
          value={data.overview.completedRentals.toString()}
          icon={CheckCircle}
          variant="success"
        />
        <StatsWidget
          title="Đã hủy"
          value={data.overview.cancelledRentals.toString()}
          icon={XCircle}
          variant="danger"
        />
        <StatsWidget
          title="Tranh chấp"
          value={data.overview.disputedRentals.toString()}
          icon={AlertCircle}
          variant="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueChart data={data.revenueChart} />
        <RentalsByStatusChart data={data.rentalsByStatus} />
      </div>

      {/* Tables Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentRentalsTable data={data.recentRentals} />
        <TopVehiclesTable data={data.topVehicles} />
      </div>
    </div>
  )
}

