import { Loader2, RefreshCw } from 'lucide-react'
import { StatusBadge } from './status-badge'
import type { AdminKycItem, KycStatus } from '@/types/auth.types'
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

const statusOptions: Array<{ label: string; value?: KycStatus }> = [
  { label: 'Tất cả', value: undefined },
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Đã duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
]

interface KycListTableProps {
  items: Array<AdminKycItem>
  selected?: AdminKycItem | null
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  statusFilter?: KycStatus | undefined
  onStatusFilterChange: (status: KycStatus | undefined) => void
  onRefetch: () => void
  onSelect: (item: AdminKycItem) => void
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
}

export function KycListTable({
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
}: KycListTableProps) {
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1

  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Danh sách yêu cầu KYC
        </h2>
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter ?? 'all'}
            onValueChange={(value) =>
              onStatusFilterChange(
                value === 'all' ? undefined : (value as KycStatus),
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
            Không tải được danh sách KYC
          </div>
        ) : !items.length ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            Không có yêu cầu KYC nào.
          </div>
        ) : (
          <>
            <div className="p-2 max-h-[calc(100vh-250px)] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>CMND/CCCD</TableHead>
                    <TableHead>GPLX</TableHead>
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
                            {item.user.fullName || item.fullNameInId || '—'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.user.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{item.citizenId || '—'}</TableCell>
                      <TableCell>{item.driverLicense || '—'}</TableCell>
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
                trong tổng số <span className="font-medium">{total}</span> yêu
                cầu
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
