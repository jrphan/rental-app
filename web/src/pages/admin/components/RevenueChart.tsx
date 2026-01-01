import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface RevenueChartProps {
  data: Array<{
    date: string
    revenue: string
    count: number
  }>
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    }),
    revenue: parseFloat(item.revenue),
    count: item.count,
  }))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Doanh thu 30 ngày qua
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              if (value >= 1000000) {
                return `${(value / 1000000).toFixed(1)}M`
              }
              if (value >= 1000) {
                return `${(value / 1000).toFixed(0)}K`
              }
              return value.toString()
            }}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label) => `Ngày: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#f97316"
            strokeWidth={2}
            name="Doanh thu (VNĐ)"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 text-sm text-gray-600">
        <p>
          Tổng doanh thu:{' '}
          <span className="font-semibold text-gray-900">
            {formatCurrency(
              chartData.reduce((sum, item) => sum + item.revenue, 0),
            )}
          </span>
        </p>
        <p>
          Tổng đơn hàng:{' '}
          <span className="font-semibold text-gray-900">
            {chartData.reduce((sum, item) => sum + item.count, 0)}
          </span>
        </p>
      </div>
    </div>
  )
}

