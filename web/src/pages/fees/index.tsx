import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SettingsPanel } from './settings'
import { StatsPanel } from './stats'
import { adminFeeApi } from '@/services/api.admin-fee'

export default function FeesPage() {
  const queryClient = useQueryClient()

  // Lấy dữ liệu cài đặt phí
  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ['adminFeeSettings'],
    queryFn: () => adminFeeApi.getFeeSettings(),
  })

  // State cho bộ lọc khoảng thời gian
  // Mặc định: Từ ngày 1 của tháng hiện tại đến ngày cuối cùng của tháng hiện tại
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    // Format YYYY-MM-DD để dùng cho input type="date"
    return {
      startDate: firstDay.toISOString().slice(0, 10),
      endDate: lastDay.toISOString().slice(0, 10)
    }
  })

  // Query lấy dữ liệu thống kê
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['adminInsuranceStats', dateRange.startDate, dateRange.endDate],
    queryFn: () => {
      // Chuyển đổi sang đối tượng Date để set giờ cụ thể
      // startDate: bắt đầu từ 00:00:00
      const start = new Date(dateRange.startDate)
      start.setHours(0, 0, 0, 0)

      // endDate: kết thúc lúc 23:59:59
      const end = new Date(dateRange.endDate)
      end.setHours(23, 59, 59, 999)

      return adminFeeApi.getInsuranceStats({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      })
    },
  })

  // Mutation cập nhật cài đặt phí
  const updateSettingsMutation = useMutation({
    mutationFn: (data: {
      deliveryFeePerKm: number
      insuranceRate50cc: number
      insuranceRateTayGa: number
      insuranceRateTayCon: number
      insuranceRateMoto: number
      insuranceRateDefault?: number
      insuranceCommissionRatio: number
    }) => {
      console.log('Updating fee settings:', data)
      return adminFeeApi.updateFeeSettings(data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['adminFeeSettings'],
      })
      refetchSettings()
    },
    onError: (error) => {
      console.error('Failed to update fee settings:', error)
    },
  })

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <SettingsPanel
        settings={settingsData}
        onUpdate={(data) => updateSettingsMutation.mutate(data)}
        isUpdating={updateSettingsMutation.isPending}
      />

      {/* Stats Panel với bộ lọc khoảng thời gian */}
      <StatsPanel
        stats={statsData}
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onStartDateChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
        onEndDateChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
        onRefetch={() => refetchStats()}
      />
    </div>
  )
}