import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { authStore } from '@/store/auth'
import {
  ownerApi,
  type OwnerApplicationStatus,
  type OwnerApplication,
} from '@/lib/api.owner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Controller } from 'react-hook-form'
import { useOwnerReviewForm } from '@/forms/review.forms'
import { PageHeader } from '@/components/admin/page-header'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
  Mail,
  Phone,
  Calendar,
  Car,
} from 'lucide-react'

export const Route = createFileRoute('/admin/_layout/owners')({
  beforeLoad: () => {
    const authState = authStore.state
    if (authState.isLoading) {
      return
    }
    if (!authState.isAuthenticated) {
      throw redirect({
        to: '/admin/login',
      })
    }
  },
  component: OwnersPage,
})

function OwnersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const authState = useStore(authStore)
  const [selectedStatus, setSelectedStatus] = useState<
    OwnerApplicationStatus | 'ALL'
  >('ALL')
  const [page, setPage] = useState(1)
  const [selectedApp, setSelectedApp] = useState<OwnerApplication | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  // Form for review
  const rejectForm = useOwnerReviewForm()

  const limit = 10

  // Fetch owner applications
  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-applications', selectedStatus, page],
    queryFn: () =>
      ownerApi.listOwnerApplications(
        selectedStatus === 'ALL' ? undefined : selectedStatus,
        page,
        limit,
      ),
  })

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (appId: string) => ownerApi.approveOwnerApplication(appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-applications'] })
      setShowApproveModal(false)
      setSelectedApp(null)
    },
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({
      appId,
      reviewNotes,
    }: {
      appId: string
      reviewNotes?: string
    }) => ownerApi.rejectOwnerApplication(appId, reviewNotes || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-applications'] })
      setShowRejectModal(false)
      setSelectedApp(null)
      rejectForm.reset()
    },
  })

  const handleApprove = (app: OwnerApplication) => {
    setSelectedApp(app)
    setShowApproveModal(true)
  }

  const handleReject = (app: OwnerApplication) => {
    setSelectedApp(app)
    rejectForm.reset()
    setShowRejectModal(true)
  }

  const handleConfirmApprove = () => {
    if (selectedApp) {
      approveMutation.mutate(selectedApp.id)
    }
  }

  const handleConfirmReject = (
    data: typeof rejectForm.formState.defaultValues,
  ) => {
    if (selectedApp) {
      rejectMutation.mutate({
        appId: selectedApp.id,
        reviewNotes: data?.reviewNotes,
      })
    }
  }

  // Show loading while verifying auth
  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Đang xác thực...</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: OwnerApplicationStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3" />
            Đã duyệt
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Đã từ chối
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Đang chờ
          </span>
        )
    }
  }

  return (
    <>
      <PageHeader
        title="Quản lý đăng ký chủ xe"
        description="Duyệt và quản lý các yêu cầu đăng ký làm chủ xe"
        showBackButton
        backTo="/admin/dashboard"
      />
      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Lọc theo trạng thái:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(
                  e.target.value as OwnerApplicationStatus | 'ALL',
                )
                setPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">Tất cả</option>
              <option value="PENDING">Đang chờ</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Đã từ chối</option>
            </select>
          </div>
        </div>

        {/* Owner Applications List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              Lỗi: {error instanceof Error ? error.message : 'Có lỗi xảy ra'}
            </p>
          </div>
        ) : !data || !data.data || data.data.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Không có yêu cầu đăng ký chủ xe nào</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ghi chú
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày gửi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.data.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {app.user.email}
                              </div>
                              {app.user.phone && (
                                <div className="text-sm text-gray-500">
                                  {app.user.phone}
                                </div>
                              )}
                              <div className="text-xs text-gray-400 mt-1">
                                Role: {app.user.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {app.notes || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(app.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="text-orange-600 hover:text-orange-900"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {app.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApprove(app)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Duyệt"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(app)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Từ chối"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Hiển thị {(data.page - 1) * data.limit + 1} -{' '}
                  {Math.min(data.page * data.limit, data.total)} trong tổng số{' '}
                  {data.total} yêu cầu
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={data.page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={data.page >= data.totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      {/* Owner Application Detail Modal */}
      <Dialog
        open={!!selectedApp && !showApproveModal && !showRejectModal}
        onOpenChange={(open) => !open && setSelectedApp(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu đăng ký chủ xe</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về yêu cầu làm chủ xe
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-muted rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">
                  Thông tin người dùng
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Email:
                    </span>
                    <span className="text-sm font-medium">
                      {selectedApp.user.email}
                    </span>
                  </div>
                  {selectedApp.user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        SĐT:
                      </span>
                      <span className="text-sm font-medium">
                        {selectedApp.user.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Ngày tạo tài khoản:
                    </span>
                    <span className="text-sm font-medium">
                      {new Date(selectedApp.user.createdAt).toLocaleDateString(
                        'vi-VN',
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Vai trò:
                    </span>
                    <span className="text-sm font-medium">
                      {selectedApp.user.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Application Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Thông tin yêu cầu
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Trạng thái</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedApp.status)}
                    </div>
                  </div>
                  <div>
                    <Label>Ghi chú</Label>
                    <p className="mt-1 text-sm text-gray-700">
                      {selectedApp.notes || 'Không có ghi chú'}
                    </p>
                  </div>
                  <div>
                    <Label>Ngày gửi yêu cầu</Label>
                    <p className="mt-1 text-sm text-gray-700">
                      {new Date(selectedApp.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <Label>Cập nhật lần cuối</Label>
                    <p className="mt-1 text-sm text-gray-700">
                      {new Date(selectedApp.updatedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Yêu cầu này được tự động tạo khi user
                  có ít nhất 1 xe được duyệt. Khi duyệt, user sẽ được chuyển
                  role thành OWNER.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedApp(null)}>
              Đóng
            </Button>
            {selectedApp && selectedApp.status === 'PENDING' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowRejectModal(true)
                  }}
                >
                  Từ chối
                </Button>
                <Button
                  onClick={() => {
                    setShowApproveModal(true)
                  }}
                >
                  Duyệt
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt yêu cầu làm chủ xe</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn duyệt yêu cầu này? User sẽ được chuyển role thành
              OWNER.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedApp && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium">
                  User: {selectedApp.user.email}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveModal(false)
                setSelectedApp(null)
              }}
              disabled={approveMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Đang xử lý...' : 'Xác nhận duyệt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu làm chủ xe</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối (tùy chọn)
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={rejectForm.handleSubmit(handleConfirmReject)}
            className="space-y-4"
          >
            {selectedApp && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium">
                  User: {selectedApp.user.email}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="reject-notes">Lý do từ chối</Label>
              <Controller
                control={rejectForm.control}
                name="reviewNotes"
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Textarea
                      id="reject-notes"
                      placeholder="Nhập lý do từ chối (tùy chọn)"
                      {...field}
                      className={`mt-2 ${error ? 'border-red-500' : ''}`}
                      rows={4}
                    />
                    {error && (
                      <p className="mt-1 text-sm text-red-600">
                        {error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedApp(null)
                  rejectForm.reset()
                }}
                disabled={rejectMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending
                  ? 'Đang xử lý...'
                  : 'Xác nhận từ chối'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
