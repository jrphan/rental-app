import { Loader2, RefreshCw } from 'lucide-react'
import type { CommissionPayment } from '@/services/api.admin-commission'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

interface PaymentListTableProps {
  items: CommissionPayment[]
  selected?: CommissionPayment | null
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  onRefetch: () => void
  onSelect: (item: CommissionPayment) => void
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatCurrency(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(numAmount)
}

function getStatusBadge(status: string) {
  const styles = {
    PENDING: 'bg-gray-100 text-gray-800',
    PAID: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  }
  const labels = {
    PENDING: 'Chờ thanh toán',
    PAID: 'Đã gửi hóa đơn',
    APPROVED: 'Duyệt',
    REJECTED: 'Đã từ chối',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status as keyof typeof styles] || styles.PENDING
        }`}
    >
      {labels[status as keyof typeof labels] || status}
    </span>
  )
}

export function PaymentListTable({
  items,
  selected,
  isLoading,
  isError,
  isFetching,
  onRefetch,
  onSelect,
  page,
  limit,
  total,
  onPageChange,
}: PaymentListTableProps) {
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Thanh toán chiết khấu ({total})
        </h2>
        <Button variant="outline" size="default" onClick={onRefetch}>
          {isFetching ? (
            <Loader2 className="size-4 animate-spin text-gray-500" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Làm mới
        </Button>
      </div>
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-10 text-red-500">
            Không tải được danh sách thanh toán
          </div>
        ) : !items.length ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            Không có thanh toán nào cần xử lý.
          </div>
        ) : (
          <>
            <div className="p-2 max-h-[calc(100vh-250px)] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chủ xe</TableHead>
                    <TableHead>Tuần</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày gửi</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      className={
                        selected?.id === item.id
                          ? 'bg-orange-50'
                          : 'cursor-pointer hover:bg-gray-50'
                      }
                      onClick={() => onSelect(item)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {item.owner.fullName || '—'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.owner.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>
                            {formatDate(item.commission.weekStartDate)} -{' '}
                            {formatDate(item.commission.weekEndDate)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(item.amount)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">
                          {item.paidAt ? formatDate(item.paidAt) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelect(item)
                          }}
                        >
                          Xem chi tiết
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <div className="text-sm text-gray-700">
                  Trang {page} / {totalPages} ({total} kết quả)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={!canPrev}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={!canNext}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
