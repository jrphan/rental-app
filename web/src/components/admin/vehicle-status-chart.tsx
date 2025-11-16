import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VehicleStatusData } from '@/lib/api.dashboard'

interface VehicleStatusChartProps {
  data: VehicleStatusData[]
  title?: string
  description?: string
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Ngừng hoạt động',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#FFA500', // Cam nhạt
  APPROVED: '#10B981', // Xanh lá
  REJECTED: '#EF4444', // Đỏ
  ACTIVE: '#FF6B35', // Cam Shopee
  INACTIVE: '#6B7280', // Xám
}

export function VehicleStatusChart({
  data,
  title = 'Trạng thái xe',
  description,
}: VehicleStatusChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    label: STATUS_LABELS[item.status] || item.status,
    color: STATUS_COLORS[item.status] || '#FF6B35',
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => value.toLocaleString('vi-VN')}
            />
            <Legend />
            <Bar dataKey="count" name="Số lượng xe" radius={[8, 8, 0, 0]}>
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

