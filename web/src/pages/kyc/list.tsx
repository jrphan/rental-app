import type { AdminKycItem } from '@/types/auth.types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from './status-badge'

interface KycListTableProps {
  items: AdminKycItem[]
  selected?: AdminKycItem | null
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  onSelect: (item: AdminKycItem) => void
}

export function KycListTable({
  items,
  selected,
  isLoading,
  isError,
  isFetching,
  onSelect,
}: KycListTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500">
        Đang tải dữ liệu...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-10 text-red-500">
        Không tải được danh sách KYC
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500">
        Không có yêu cầu KYC nào.
      </div>
    )
  }

  return (
    <div className="max-h-[520px] overflow-auto">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Danh sách yêu cầu KYC
        </h2>
        {isFetching && (
          <span className="text-xs text-gray-500">Đang tải...</span>
        )}
      </div>

      <div className="p-2">
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
                data-state={selected?.id === item.id ? 'selected' : undefined}
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
    </div>
  )
}
