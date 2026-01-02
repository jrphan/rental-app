import { RefreshCw } from 'lucide-react'
import type { InsuranceStatsResponse } from '@/services/api.admin-fee'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface StatsPanelProps {
  stats: InsuranceStatsResponse | undefined
  filterType: 'day' | 'month' | 'year'
  selectedDate: string // YYYY-MM-DD
  selectedMonth: string // YYYY-MM
  selectedYear: string // YYYY
  onFilterTypeChange: (type: 'day' | 'month' | 'year') => void
  onDateChange: (date: string) => void
  onMonthChange: (month: string) => void
  onYearChange: (year: string) => void
  onRefetch: () => void
}

export function StatsPanel({
  stats,
  filterType,
  selectedDate,
  selectedMonth,
  selectedYear,
  onFilterTypeChange,
  onDateChange,
  onMonthChange,
  onYearChange,
  onRefetch,
}: StatsPanelProps) {
  // Tách giá trị từ props
  const [year, month] = selectedMonth.split('-')

  // Tạo danh sách tháng từ 1 đến 12
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = (i + 1).toString().padStart(2, '0')
    return { value: m, label: `Tháng ${m}` }
  })

  // Tạo danh sách năm (từ năm hiện tại lùi về 5 năm trước)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => {
    const y = (currentYear - i).toString()
    return { value: y, label: `Năm ${y}` }
  })

  const handleMonthSelect = (newMonth: string) => {
    onMonthChange(`${year}-${newMonth}`)
  }

  const handleYearSelect = (newYear: string) => {
    if (filterType === 'month') {
      onMonthChange(`${newYear}-${month}`)
    } else {
      onYearChange(newYear)
    }
  }

  // Format period display
  const getPeriodDisplay = () => {
    if (filterType === 'day') {
      const [y, m, d] = selectedDate.split('-')
      return `Ngày ${d}/${m}/${y}`
    } else if (filterType === 'month') {
      return `Tháng ${month}/${year}`
    } else {
      return `Năm ${selectedYear}`
    }
  }

  return (
    <div className="rounded-lg bg-white border border-gray-200">
      <div className="border-b px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">
            Thống kê phí bảo hiểm
          </h2>
          <div className="flex gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Bộ lọc loại (Ngày/Tháng/Năm) */}
              <Select value={filterType} onValueChange={(v) => onFilterTypeChange(v as 'day' | 'month' | 'year')}>
                <SelectTrigger className="w-[120px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Theo ngày</SelectItem>
                  <SelectItem value="month">Theo tháng</SelectItem>
                  <SelectItem value="year">Theo năm</SelectItem>
                </SelectContent>
              </Select>

              {/* Bộ lọc theo ngày */}
              {filterType === 'day' && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-filter" className="text-xs text-gray-600 whitespace-nowrap">
                    Chọn ngày:
                  </Label>
                  <Input
                    id="date-filter"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="w-[150px] h-9 text-sm"
                  />
                </div>
              )}

              {/* Bộ lọc theo tháng */}
              {filterType === 'month' && (
                <>
                  <Select value={month} onValueChange={handleMonthSelect}>
                    <SelectTrigger className="w-[123px] h-9 text-sm">
                      <SelectValue placeholder="Chọn tháng" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={year} onValueChange={handleYearSelect}>
                    <SelectTrigger className="w-[120px] h-9 text-sm">
                      <SelectValue placeholder="Chọn năm" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y.value} value={y.value}>
                          {y.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}

              {/* Bộ lọc theo năm */}
              {filterType === 'year' && (
                <Select value={selectedYear} onValueChange={onYearChange}>
                  <SelectTrigger className="w-[120px] h-9 text-sm">
                    <SelectValue placeholder="Chọn năm" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y.value} value={y.value}>
                        {y.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefetch()}
              className="flex items-center gap-2 h-9"
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
          </div>
        </div>

      </div>

      <div className="p-4">
        {stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Tổng phí bảo hiểm</p>
                <p className="text-2xl font-bold text-gray-900">
                  {parseFloat(stats.totalInsuranceFee).toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 mb-1">Hoa hồng nền tảng</p>
                <p className="text-2xl font-bold text-blue-900">
                  {parseFloat(stats.totalInsuranceCommissionAmount).toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-green-600 mb-1">Phải trả đối tác</p>
                <p className="text-2xl font-bold text-green-900">
                  {parseFloat(stats.totalInsurancePayableToPartner).toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Tổng số đơn thuê</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalRentals}
                </p>
              </div>
            </div>

            {stats.byVehicleType.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Theo loại xe
                </h3>
                <div className="space-y-2">
                  {stats.byVehicleType.map((item) => (
                    <div
                      key={item.type}
                      className="p-4 bg-gray-50 rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.type || 'Khác'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.count} đơn thuê
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Tổng phí</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {parseFloat(item.totalFee).toLocaleString('vi-VN')} VNĐ
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 mb-1">Hoa hồng</p>
                          <p className="text-sm font-semibold text-blue-900">
                            {parseFloat(item.totalCommissionAmount).toLocaleString('vi-VN')} VNĐ
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-green-600 mb-1">Trả đối tác</p>
                          <p className="text-sm font-semibold text-green-900">
                            {parseFloat(item.totalPayableToPartner).toLocaleString('vi-VN')} VNĐ
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Không có dữ liệu thống kê cho {getPeriodDisplay()}</p>
          </div>
        )}
      </div>
    </div>
  )
}