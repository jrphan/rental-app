import type { RentalStatus } from '@/services/api.admin-rental'
import { RentalStatusBadge } from '@/pages/rentals/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface RecentRentalsTableProps {
  data: Array<{
    id: string
    renterName: string | null
    vehicleName: string
    totalPrice: string
    status: RentalStatus
    createdAt: string
  }>
}

export function RecentRentalsTable({ data }: RecentRentalsTableProps) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(parseFloat(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Đơn hàng gần đây
        </h2>
      </div>
      <div className="overflow-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Người thuê</TableHead>
              <TableHead>Xe</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              data.map((rental) => (
                <TableRow key={rental.id}>
                  <TableCell className="font-mono text-xs">
                    {rental.id.slice(-8)}
                  </TableCell>
                  <TableCell>{rental.renterName || '—'}</TableCell>
                  <TableCell className="text-sm">{rental.vehicleName}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(rental.totalPrice)}
                  </TableCell>
                  <TableCell>
                    <RentalStatusBadge status={rental.status} />
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {formatDate(rental.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

