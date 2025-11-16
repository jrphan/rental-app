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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RevenueData } from '@/lib/api.dashboard'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface RevenueChartProps {
  data: RevenueData[]
  title?: string
  description?: string
}

export function RevenueChart({
  data,
  title = 'Doanh thu theo ngày',
  description,
}: RevenueChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    dateLabel: format(new Date(item.date), 'dd/MM', { locale: vi }),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="dateLabel"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(1)}M`
                }
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(1)}K`
                }
                return value.toString()
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'revenue') {
                  return [
                    `${value.toLocaleString('vi-VN')} VNĐ`,
                    'Doanh thu',
                  ]
                }
                if (name === 'rentals') {
                  return [value, 'Số lượt thuê']
                }
                return [value, name]
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#FF6B35"
              strokeWidth={3}
              name="Doanh thu (VNĐ)"
              dot={{ fill: '#FF6B35', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="rentals"
              stroke="#4ECDC4"
              strokeWidth={3}
              name="Số lượt thuê"
              dot={{ fill: '#4ECDC4', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

