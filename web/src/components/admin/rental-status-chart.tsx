import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RentalStatusData } from '@/lib/api.dashboard'

interface RentalStatusChartProps {
  data: RentalStatusData[]
  title?: string
  description?: string
}

const COLORS = {
  PENDING: '#FFA500', // Cam nhạt - Chờ duyệt
  CONFIRMED: '#FF6B35', // Cam Shopee - Đã xác nhận
  COMPLETED: '#10B981', // Xanh lá - Hoàn thành
  CANCELLED: '#EF4444', // Đỏ - Đã hủy
  ACTIVE: '#3B82F6', // Xanh dương - Đang hoạt động
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  ACTIVE: 'Đang hoạt động',
}

export function RentalStatusChart({
  data,
  title = 'Trạng thái thuê xe',
  description,
}: RentalStatusChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    label: STATUS_LABELS[item.status] || item.status,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ label, percent }) => {
                if (percent < 0.05) return '' // Ẩn label nếu quá nhỏ
                return `${label}: ${(percent * 100).toFixed(0)}%`
              }}
              outerRadius={90}
              fill="#FF6B35"
              dataKey="count"
            >
              {formattedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.status as keyof typeof COLORS] || '#FF6B35'}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, payload: any) => {
                return [value, payload.payload.label]
              }}
            />
            <Legend
              formatter={(value, entry: any) => entry.payload.label}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

