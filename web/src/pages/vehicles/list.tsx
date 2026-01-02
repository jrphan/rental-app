import { Loader2, RefreshCw } from 'lucide-react'
import { StatusBadge } from './status-badge'
import type {
  AdminVehicleItem,
  VehicleStatus,
} from '@/services/api.admin-vehicle'
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

const statusOptions: Array<{ label: string; value?: VehicleStatus }> = [
  { label: 'Tất cả', value: undefined },
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Đã duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
  { label: 'Nháp', value: 'DRAFT' },
  { label: 'Bảo trì', value: 'MAINTENANCE' },
]

interface VehicleListTableProps {
  items: Array<AdminVehicleItem>
  selected?: AdminVehicleItem | null
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  statusFilter?: VehicleStatus | undefined
  onStatusFilterChange: (status: VehicleStatus | undefined) => void
  onRefetch: () => void
  onSelect: (item: AdminVehicleItem) => void
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
}

export function VehicleListTable({
  items,
  selected,
  isLoading,
  isError,
  isFetching,
  statusFilter,
  onStatusFilterChange,
  onRefetch,
  onSelect,
  page,
  limit,
  total,
  onPageChange,
}: VehicleListTableProps) {
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1

  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">Danh sách xe</h2>
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter ?? 'all'}
            onValueChange={(value) =>
              onStatusFilterChange(
                value === 'all' ? undefined : (value as VehicleStatus),
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
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-10 text-red-500">
            Không tải được danh sách xe
          </div>
        ) : !items.length ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            Không có xe nào.
          </div>
        ) : (
          <>
            <div className="p-2 max-h-[calc(100vh-250px)] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chủ xe</TableHead>
                    <TableHead>Xe</TableHead>
                    <TableHead>Biển số</TableHead>
                    <TableHead>Giá/ngày</TableHead>
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
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {item.brand} {item.model}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.year} • {item.color}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.licensePlate}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(item.pricePerDay)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
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
                trong tổng số <span className="font-medium">{total}</span> xe
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
