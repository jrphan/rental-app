import { RefreshCw, Calendar as CalendarIcon } from 'lucide-react'
import type { InsuranceStatsResponse } from '@/services/api.admin-fee'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface StatsPanelProps {
  stats: InsuranceStatsResponse | undefined
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onRefetch: () => void
}

export function StatsPanel({
  stats,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onRefetch,
}: StatsPanelProps) {

  // Format ngày hiển thị tiếng Việt (DD/MM/YYYY)
  const formatDateVN = (dateStr: string) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <div className="rounded-lg bg-white border border-gray-200">
      <div className="border-b px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-gray-800">
              Thống kê phí bảo hiểm
            </h2>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
              <div className="space-y-1">
                {/* <Label htmlFor="start-date" className="text-xs text-gray-500 ml-1">
                  Từ ngày
                </Label> */}
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="h-9 w-[140px] text-sm"
                />
              </div>
              {/* <span className="text-gray-400 mt-6">-</span> */}
              <span>-</span>
              <div className="space-y-1">
                {/* <Label htmlFor="end-date" className="text-xs text-gray-500 ml-1">
                  Đến ngày
                </Label> */}
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="h-9 w-[140px] text-sm"
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefetch()}
              className="flex items-center gap-2 h-9 mt-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {stats ? (
          <div className="space-y-6">
            {/* Tổng quan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1 font-medium">Tổng phí bảo hiểm</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">
                  {parseFloat(stats.totalInsuranceFee).toLocaleString('vi-VN')}
                  <span className="text-xs font-normal text-gray-500 ml-1">VNĐ</span>
                </p>
              </div>
              <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                <p className="text-xs text-blue-600 mb-1 font-medium">Hoa hồng nền tảng</p>
                <p className="text-xl lg:text-2xl font-bold text-blue-700">
                  {parseFloat(stats.totalInsuranceCommissionAmount).toLocaleString('vi-VN')}
                  <span className="text-xs font-normal text-blue-500 ml-1">VNĐ</span>
                </p>
              </div>
              <div className="bg-green-50/50 rounded-lg p-4 border border-green-100">
                <p className="text-xs text-green-600 mb-1 font-medium">Phải trả đối tác</p>
                <p className="text-xl lg:text-2xl font-bold text-green-700">
                  {parseFloat(stats.totalInsurancePayableToPartner).toLocaleString('vi-VN')}
                  <span className="text-xs font-normal text-green-500 ml-1">VNĐ</span>
                </p>
              </div>
              <div className="bg-purple-50/50 rounded-lg p-4 border border-purple-100">
                <p className="text-xs text-purple-600 mb-1 font-medium">Tổng số đơn thuê</p>
                <p className="text-xl lg:text-2xl font-bold text-purple-700">
                  {stats.totalRentals}
                  <span className="text-xs font-normal text-purple-500 ml-1">đơn</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500 italic">
                Dữ liệu thống kê từ ngày <span className="font-medium text-gray-900">{formatDateVN(startDate)}</span> đến ngày <span className="font-medium text-gray-900">{formatDateVN(endDate)}</span>
              </p>
            </div>

            {/* Chi tiết theo loại xe */}
            {stats.byVehicleType.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                  Chi tiết theo loại xe
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stats.byVehicleType.map((item) => (
                    <div
                      key={item.type}
                      className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-50">
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {item.type || 'Khác'}
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {item.count} đơn
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Tổng thu</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {parseFloat(item.totalFee).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-blue-500 mb-1">Hoa hồng</p>
                          <p className="text-sm font-semibold text-blue-700">
                            {parseFloat(item.totalCommissionAmount).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-green-500 mb-1">Trả đối tác</p>
                          <p className="text-sm font-semibold text-green-700">
                            {parseFloat(item.totalPayableToPartner).toLocaleString('vi-VN')}
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
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="p-4 bg-gray-50 rounded-full mb-3">
              <CalendarIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p>Không có dữ liệu thống kê từ {formatDateVN(startDate)} đến {formatDateVN(endDate)}</p>
          </div>
        )}
      </div>
    </div>
  )
}