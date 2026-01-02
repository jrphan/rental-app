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

  const [filterType, setFilterType] = useState<'day' | 'month' | 'year'>('month')
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10) // YYYY-MM-DD format for day
  )
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM format for month
  )
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString() // YYYY format for year
  )

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['adminInsuranceStats', filterType, selectedDate, selectedMonth, selectedYear],
    queryFn: () => {
      let startDate: Date
      let endDate: Date

      if (filterType === 'day') {
        const [year, month, day] = selectedDate.split('-').map(Number)
        startDate = new Date(year, month - 1, day, 0, 0, 0, 0)
        endDate = new Date(year, month - 1, day, 23, 59, 59, 999)
      } else if (filterType === 'month') {
        const [year, month] = selectedMonth.split('-').map(Number)
        startDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
        endDate = new Date(year, month, 0, 23, 59, 59, 999)
      } else {
        // year
        const year = Number(selectedYear)
        startDate = new Date(year, 0, 1, 0, 0, 0, 0)
        endDate = new Date(year, 11, 31, 23, 59, 59, 999)
      }

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

      {/* Stats Panel */}
      <StatsPanel
        stats={statsData}
        filterType={filterType}
        selectedDate={selectedDate}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onFilterTypeChange={setFilterType}
        onDateChange={setSelectedDate}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onRefetch={() => refetchStats()}
      />
    </div>
  )
}

