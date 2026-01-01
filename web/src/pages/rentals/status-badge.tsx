import { Badge } from '@/components/ui/badge'
import type { RentalStatus } from '@/services/api.admin-rental'

const statusLabels: Record<RentalStatus, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  AWAIT_APPROVAL: 'Chờ duyệt',
  CONFIRMED: 'Đã xác nhận',
  ON_TRIP: 'Đang thuê',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  DISPUTED: 'Có tranh chấp',
}

const statusColors: Record<RentalStatus, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  AWAIT_APPROVAL: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  ON_TRIP: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  DISPUTED: 'bg-orange-100 text-orange-800',
}

interface StatusBadgeProps {
  status: RentalStatus
}

export function RentalStatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge className={statusColors[status]}>
      {statusLabels[status]}
    </Badge>
  )
}

