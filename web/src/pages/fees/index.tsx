import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminFeeApi } from '@/services/api.admin-fee'
import { SettingsPanel } from './settings'
import { StatsPanel } from './stats'

export default function FeesPage() {
  const queryClient = useQueryClient()

  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ['adminFeeSettings'],
    queryFn: () => adminFeeApi.getFeeSettings(),
  })

  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  )

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['adminInsuranceStats', selectedMonth],
    queryFn: () => {
      const [year, month] = selectedMonth.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59, 999)
      return adminFeeApi.getInsuranceStats({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
    },
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (data: {
      deliveryFeePerKm: number
      insuranceRate50cc: number
      insuranceRateTayGa: number
      insuranceRateTayCon: number
      insuranceRateMoto: number
      insuranceRateDefault?: number
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

      {/* Stats Panel */}
      <StatsPanel
        stats={statsData}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onRefetch={() => refetchStats()}
      />
    </div>
  )
}

