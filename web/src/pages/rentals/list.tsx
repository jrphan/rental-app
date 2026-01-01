import { Loader2, RefreshCw } from 'lucide-react'
import { RentalStatusBadge } from './status-badge'
import type {
  AdminRentalItem,
  RentalStatus,
} from '@/services/api.admin-rental'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const statusOptions: Array<{ label: string; value?: RentalStatus }> = [
  { label: 'Tất cả', value: undefined },
  { label: 'Chờ thanh toán', value: 'PENDING_PAYMENT' },
  { label: 'Chờ duyệt', value: 'AWAIT_APPROVAL' },
  { label: 'Đã xác nhận', value: 'CONFIRMED' },
  { label: 'Đang thuê', value: 'ON_TRIP' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
  { label: 'Có tranh chấp', value: 'DISPUTED' },
]

const disputeOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Có tranh chấp', value: 'true' },
  { label: 'Không có tranh chấp', value: 'false' },
]

interface RentalListTableProps {
  items: Array<AdminRentalItem>
  selected?: AdminRentalItem | null
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  statusFilter?: RentalStatus | undefined
  hasDisputeFilter?: boolean | undefined
  onStatusFilterChange: (status: RentalStatus | undefined) => void
  onDisputeFilterChange: (hasDispute: boolean | undefined) => void
  onRefetch: () => void
  onSelect: (item: AdminRentalItem) => void
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
}

export function RentalListTable({
  items,
  selected,
  isLoading,
  isError,
  isFetching,
  statusFilter,
  hasDisputeFilter,
  onStatusFilterChange,
  onDisputeFilterChange,
  onRefetch,
  onSelect,
  page,
  limit,
  total,
  onPageChange,
}: RentalListTableProps) {
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1

  const canPrev = page > 1
  const canNext = page < totalPages

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">Danh sách đơn hàng</h2>
        <div className="flex items-center gap-3">
          <Select
            value={hasDisputeFilter === undefined ? 'all' : String(hasDisputeFilter)}
            onValueChange={(value) => {
              if (value === 'all') {
                onDisputeFilterChange(undefined)
              } else {
                onDisputeFilterChange(value === 'true')
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc tranh chấp" />
            </SelectTrigger>
            <SelectContent>
              {disputeOptions.map((opt) => (
                <SelectItem key={opt.label} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter ?? 'all'}
            onValueChange={(value) =>
              onStatusFilterChange(
                value === 'all' ? undefined : (value as RentalStatus),
              )
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.label} value={opt.value ?? 'all'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="default" onClick={onRefetch}>
            {isFetching ? (
              <Loader2 className="size-4 animate-spin text-gray-500" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Làm mới
          </Button>
        </div>
      </div>
      <div className="max-h-[520px] overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-10 text-red-500">
            Không tải được danh sách đơn hàng
          </div>
        ) : !items.length ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            Không có đơn hàng nào.
          </div>
        ) : (
          <>
            <div className="p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Người thuê</TableHead>
                    <TableHead>Xe</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      data-state={
                        selected?.id === item.id ? 'selected' : undefined
                      }
                      className={item.dispute ? 'bg-orange-50' : ''}
                    >
                      <TableCell className="font-mono text-xs">
                        {item.id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {item.renter.fullName || '—'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.renter.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {item.vehicle.brand} {item.vehicle.model}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">
                            {item.vehicle.licensePlate}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span>{formatDate(item.startDate)}</span>
                          <span className="text-gray-500">→</span>
                          <span>{formatDate(item.endDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(item.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <RentalStatusBadge status={item.status} />
                          {item.dispute && (
                            <span className="text-xs text-orange-600 font-medium">
                              ⚠ Có tranh chấp
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => onSelect(item)}
                          className="text-sm font-medium text-orange-600 hover:text-orange-700"
                        >
                          Xem chi tiết
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-gray-600">
              <div>
                Hiển thị{' '}
                <span className="font-medium">
                  {items.length ? (page - 1) * limit + 1 : 0}
                </span>{' '}
                -{' '}
                <span className="font-medium">
                  {(page - 1) * limit + items.length}
                </span>{' '}
                trong tổng số <span className="font-medium">{total}</span> đơn hàng
              </div>
              <div className="flex items-center gap-2">
                <span>
                  Trang{' '}
                  <span className="font-semibold">
                    {page} / {totalPages}
                  </span>
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canPrev}
                    onClick={() => onPageChange(page - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canNext}
                    onClick={() => onPageChange(page + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

