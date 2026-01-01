import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { RentalStatus } from '@/services/api.admin-stats'

interface RentalsByStatusChartProps {
  data: Array<{
    status: RentalStatus
    count: number
  }>
}

const statusLabels: Record<RentalStatus, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  AWAIT_APPROVAL: 'Chờ duyệt',
  CONFIRMED: 'Đã xác nhận',
  ON_TRIP: 'Đang thuê',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  DISPUTED: 'Có tranh chấp',
}

const COLORS = [
  '#f97316', // orange
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#6b7280', // gray
  '#ef4444', // red
  '#f59e0b', // yellow
]

export function RentalsByStatusChart({ data }: RentalsByStatusChartProps) {
  const chartData = data.map((item) => ({
    name: statusLabels[item.status] || item.status,
    value: item.count,
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Phân bố đơn hàng theo trạng thái
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-1">
        {chartData.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-600">{item.name}</span>
            </div>
            <span className="font-semibold text-gray-900">
              {item.value.toLocaleString('vi-VN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

