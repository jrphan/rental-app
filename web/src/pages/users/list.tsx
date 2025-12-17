import type { AdminUserItem, KycStatus, UserRole } from '@/types/auth.types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface UsersListTableProps {
  items: AdminUserItem[]
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  onRefetch: () => void
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  filters: {
    role?: UserRole
    isActive?: boolean
    isPhoneVerified?: boolean
    kycStatus?: KycStatus
    search: string
  }
  onChangeFilters: (updates: {
    role?: UserRole | 'all'
    isActive?: boolean | 'all'
    isPhoneVerified?: boolean | 'all'
    kycStatus?: KycStatus | 'all'
    search?: string
  }) => void
}

export function UsersListTable({
  items,
  isLoading,
  isError,
  isFetching,
  onRefetch,
  page,
  limit,
  total,
  onPageChange,
  filters,
  onChangeFilters,
}: UsersListTableProps) {
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1

  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div>
      <div className="border-b px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">
            Danh sách người dùng
          </h2>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Tìm theo tên, SĐT, email..."
              value={filters.search}
              onChange={(e) =>
                onChangeFilters({
                  search: e.target.value,
                })
              }
              className="h-9 text-xs"
            />
            <Select
              value={filters.role ?? 'all'}
              onValueChange={(value) =>
                onChangeFilters({
                  role: value === 'all' ? 'all' : (value as UserRole),
                })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="SUPPORT">Support</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={
                typeof filters.isActive === 'boolean'
                  ? filters.isActive
                    ? 'active'
                    : 'inactive'
                  : 'all'
              }
              onValueChange={(value) =>
                onChangeFilters({
                  isActive:
                    value === 'all'
                      ? 'all'
                      : ((value === 'active') as unknown as boolean),
                })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Trạng thái hoạt động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Đã khóa</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={
                typeof filters.isPhoneVerified === 'boolean'
                  ? filters.isPhoneVerified
                    ? 'verified'
                    : 'unverified'
                  : 'all'
              }
              onValueChange={(value) =>
                onChangeFilters({
                  isPhoneVerified:
                    value === 'all'
                      ? 'all'
                      : ((value === 'verified') as unknown as boolean),
                })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Xác minh SĐT" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả SĐT</SelectItem>
                <SelectItem value="verified">Đã xác minh</SelectItem>
                <SelectItem value="unverified">Chưa xác minh</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.kycStatus ?? 'all'}
              onValueChange={(value) =>
                onChangeFilters({
                  kycStatus: value === 'all' ? 'all' : (value as KycStatus),
                })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Trạng thái KYC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả KYC</SelectItem>
                <SelectItem value="PENDING">Đang chờ duyệt</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="REJECTED">Từ chối</SelectItem>
                <SelectItem value="NEEDS_UPDATE">Cần cập nhật</SelectItem>
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
      </div>
      <div className="max-h-[520px] overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-10 text-red-500">
            Không tải được danh sách người dùng
          </div>
        ) : !items.length ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            Không có người dùng nào.
          </div>
        ) : (
          <>
            <div className="p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {user.fullName || '—'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {user.phone}
                          </span>
                          {user.email && (
                            <span className="text-xs text-gray-500">
                              {user.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={user.isActive ? 'default' : 'outline'}
                            className={
                              user.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'text-gray-600'
                            }
                          >
                            {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                          </Badge>
                          <Badge
                            variant={
                              user.isPhoneVerified ? 'default' : 'outline'
                            }
                            className={
                              user.isPhoneVerified
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'text-gray-600'
                            }
                          >
                            {user.isPhoneVerified
                              ? 'Đã xác minh SĐT'
                              : 'Chưa xác minh SĐT'}
                          </Badge>
                          {user.kyc && (
                            <Badge
                              variant="outline"
                              className="text-xs border-orange-200 text-orange-700 bg-orange-50"
                            >
                              KYC: {user.kyc.status}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs border-gray-200 text-gray-700"
                        >
                          {user.role === 'ADMIN'
                            ? 'Admin'
                            : user.role === 'SUPPORT'
                              ? 'Support'
                              : 'User'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-600">
                          {new Date(user.createdAt).toLocaleString('vi-VN')}
                        </span>
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
                trong tổng số <span className="font-medium">{total}</span> người
                dùng
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
