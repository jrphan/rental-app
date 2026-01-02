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

interface StatsPanelProps {
  stats: InsuranceStatsResponse | undefined
  selectedMonth: string // Định dạng YYYY-MM
  onMonthChange: (month: string) => void
  onRefetch: () => void
}

export function StatsPanel({
  stats,
  selectedMonth,
  onMonthChange,
  onRefetch,
}: StatsPanelProps) {
  // Tách giá trị YYYY-MM từ prop selectedMonth
  const [year, month] = selectedMonth.split('-')

  // Tạo danh sách tháng từ 1 đến 12
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = (i + 1).toString().padStart(2, '0')
    return { value: m, label: `Tháng ${m}` }
  })

  // Tạo danh sách năm (từ năm hiện tại lùi về 5 năm trước, hoặc tùy chỉnh)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => {
    const y = (currentYear - i).toString()
    return { value: y, label: `Năm ${y}` }
  })

  const handleMonthSelect = (newMonth: string) => {
    onMonthChange(`${year}-${newMonth}`)
  }

  const handleYearSelect = (newYear: string) => {
    onMonthChange(`${newYear}-${month}`)
  }

  return (
    <div className="rounded-lg bg-white border border-gray-200">
      <div className="border-b px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Thống kê phí bảo hiểm
        </h2>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Bộ lọc Tháng */}
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

          {/* Bộ lọc Năm */}
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

      <div className="p-4">
        {stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Tổng phí bảo hiểm</p>
                <p className="text-2xl font-bold text-gray-900">
                  {parseFloat(stats.totalInsuranceFee).toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Tổng số đơn thuê</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalRentals}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Kỳ thống kê</p>
                <p className="text-sm font-medium text-gray-900">
                  Tháng {month} / {year}
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
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.type || 'Khác'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.count} đơn thuê
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {parseFloat(item.totalFee).toLocaleString('vi-VN')} VNĐ
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Không có dữ liệu thống kê cho {`tháng ${month}/${year}`}</p>
          </div>
        )}
      </div>
    </div>
  )
}