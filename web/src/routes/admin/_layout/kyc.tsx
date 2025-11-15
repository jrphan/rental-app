import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { authStore } from '@/store/auth'
import { kycApi, type KycStatus, type KycSubmission } from '@/lib/api.kyc'
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
import { useKycReviewForm, useKycRejectForm } from '@/forms/review.forms'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
  FileText,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react'

export const Route = createFileRoute('/admin/_layout/kyc')({
  beforeLoad: () => {
    const authState = authStore.state
    // Wait for auth verification to complete
    if (authState.isLoading) {
      // Return and let component handle loading state
      return
    }
    // If not authenticated, redirect to login
    if (!authState.isAuthenticated) {
      throw redirect({
        to: '/admin/login',
      })
    }
  },
  component: KycPage,
})

function KycPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const authState = useStore(authStore)
  const [selectedStatus, setSelectedStatus] = useState<KycStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [selectedKyc, setSelectedKyc] = useState<KycSubmission | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  // Forms for review
  const approveForm = useKycReviewForm()
  const rejectForm = useKycRejectForm()

  const limit = 10

  // Fetch KYC submissions
  const { data, isLoading, error } = useQuery({
    queryKey: ['kyc-submissions', selectedStatus, page],
    queryFn: () =>
      kycApi.listKYCSubmissions(
        selectedStatus === 'ALL' ? undefined : selectedStatus,
        page,
        limit,
      ),
  })

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({
      kycId,
      reviewNotes,
    }: {
      kycId: string
      reviewNotes?: string
    }) =>
      kycApi.approveKYC(kycId, {
        reviewNotes: reviewNotes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-submissions'] })
      setShowApproveModal(false)
      setSelectedKyc(null)
      approveForm.reset()
    },
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({
      kycId,
      reviewNotes,
    }: {
      kycId: string
      reviewNotes: string
    }) =>
      kycApi.rejectKYC(kycId, {
        reviewNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-submissions'] })
      setShowRejectModal(false)
      setSelectedKyc(null)
      rejectForm.reset()
    },
  })

  const handleApprove = (kyc: KycSubmission) => {
    setSelectedKyc(kyc)
    approveForm.reset()
    setShowApproveModal(true)
  }

  const handleReject = (kyc: KycSubmission) => {
    setSelectedKyc(kyc)
    rejectForm.reset()
    setShowRejectModal(true)
  }

  const handleConfirmApprove = (
    data: typeof approveForm.formState.defaultValues,
  ) => {
    if (selectedKyc) {
      approveMutation.mutate({
        kycId: selectedKyc.id,
        reviewNotes: data?.reviewNotes,
      })
    }
  }

  const handleConfirmReject = (
    data: typeof rejectForm.formState.defaultValues,
  ) => {
    if (selectedKyc && data?.reviewNotes) {
      rejectMutation.mutate({
        kycId: selectedKyc.id,
        reviewNotes: data.reviewNotes,
      })
    }
  }

  // Show loading while verifying auth - MUST be after all hooks
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

  const getStatusBadge = (status: KycStatus) => {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate({ to: '/admin/dashboard' })}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Quay lại
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý KYC</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Lọc theo trạng thái:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as KycStatus | 'ALL')
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

        {/* KYC List */}
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
        ) : !data || data.items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Không có KYC submission nào</p>
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
                        Số CMND/CCCD
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
                    {data.items.map((kyc) => (
                      <tr key={kyc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {kyc.user.email}
                              </div>
                              {kyc.user.phone && (
                                <div className="text-sm text-gray-500">
                                  {kyc.user.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {kyc.idNumber || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(kyc.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(kyc.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedKyc(kyc)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {kyc.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApprove(kyc)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Duyệt"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(kyc)}
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
            {data.total > limit && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Hiển thị {(page - 1) * limit + 1} -{' '}
                  {Math.min(page * limit, data.total)} trong tổng số{' '}
                  {data.total} KYC
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * limit >= data.total}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* KYC Detail Modal */}
      <Dialog
        open={!!selectedKyc && !showApproveModal && !showRejectModal}
        onOpenChange={(open) => !open && setSelectedKyc(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết KYC</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về yêu cầu xác thực danh tính
            </DialogDescription>
          </DialogHeader>

          {selectedKyc && (
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
                      {selectedKyc.user.email}
                    </span>
                  </div>
                  {selectedKyc.user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        SĐT:
                      </span>
                      <span className="text-sm font-medium">
                        {selectedKyc.user.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Ngày tạo:
                    </span>
                    <span className="text-sm font-medium">
                      {new Date(selectedKyc.user.createdAt).toLocaleDateString(
                        'vi-VN',
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* KYC Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Thông tin KYC</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Số CMND/CCCD:</Label>
                    <p className="text-sm mt-1">
                      {selectedKyc.idNumber || '-'}
                    </p>
                  </div>

                  {selectedKyc.idCardFrontUrl && (
                    <div>
                      <Label>Mặt trước CMND/CCCD:</Label>
                      <div className="mt-2">
                        <img
                          src={selectedKyc.idCardFrontUrl}
                          alt="Mặt trước CMND"
                          className="max-w-full h-auto rounded-lg border"
                        />
                      </div>
                    </div>
                  )}

                  {selectedKyc.idCardBackUrl && (
                    <div>
                      <Label>Mặt sau CMND/CCCD:</Label>
                      <div className="mt-2">
                        <img
                          src={selectedKyc.idCardBackUrl}
                          alt="Mặt sau CMND"
                          className="max-w-full h-auto rounded-lg border"
                        />
                      </div>
                    </div>
                  )}

                  {selectedKyc.selfieUrl && (
                    <div>
                      <Label>Ảnh selfie với CMND/CCCD:</Label>
                      <div className="mt-2">
                        <img
                          src={selectedKyc.selfieUrl}
                          alt="Selfie"
                          className="max-w-full h-auto rounded-lg border"
                        />
                      </div>
                    </div>
                  )}

                  {selectedKyc.passportUrl && (
                    <div>
                      <Label>Passport:</Label>
                      <div className="mt-2">
                        <img
                          src={selectedKyc.passportUrl}
                          alt="Passport"
                          className="max-w-full h-auto rounded-lg border"
                        />
                      </div>
                    </div>
                  )}

                  {selectedKyc.driverLicenseUrl && (
                    <div>
                      <Label>Bằng lái xe:</Label>
                      <div className="mt-2">
                        <img
                          src={selectedKyc.driverLicenseUrl}
                          alt="Bằng lái xe"
                          className="max-w-full h-auto rounded-lg border"
                        />
                      </div>
                    </div>
                  )}

                  {selectedKyc.notes && (
                    <div>
                      <Label>Ghi chú từ user:</Label>
                      <p className="text-sm mt-1">{selectedKyc.notes}</p>
                    </div>
                  )}

                  <div>
                    <Label>Trạng thái:</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedKyc.status)}
                    </div>
                  </div>

                  {selectedKyc.reviewNotes && (
                    <div>
                      <Label>Ghi chú từ admin:</Label>
                      <p className="text-sm mt-1">{selectedKyc.reviewNotes}</p>
                    </div>
                  )}

                  {selectedKyc.reviewedAt && (
                    <div>
                      <Label>Đã xem xét lúc:</Label>
                      <p className="text-sm mt-1">
                        {new Date(selectedKyc.reviewedAt).toLocaleString(
                          'vi-VN',
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedKyc.status === 'PENDING' && (
                <DialogFooter className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const kyc = selectedKyc
                      setSelectedKyc(null)
                      handleReject(kyc)
                    }}
                  >
                    Từ chối
                  </Button>
                  <Button
                    onClick={() => {
                      const kyc = selectedKyc
                      setSelectedKyc(null)
                      handleApprove(kyc)
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Duyệt
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt KYC</DialogTitle>
            <DialogDescription>
              Xác nhận duyệt yêu cầu xác thực danh tính này
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={approveForm.handleSubmit(handleConfirmApprove)}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="approve-notes">Ghi chú (tùy chọn)</Label>
              <Controller
                control={approveForm.control}
                name="reviewNotes"
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Textarea
                      id="approve-notes"
                      {...field}
                      rows={4}
                      placeholder="Nhập ghi chú nếu có..."
                      className={`mt-2 ${error ? 'border-red-500' : ''}`}
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
                  setShowApproveModal(false)
                  approveForm.reset()
                }}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={approveMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {approveMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối KYC</DialogTitle>
            <DialogDescription>
              Vui lòng cung cấp lý do từ chối yêu cầu xác thực danh tính này
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={rejectForm.handleSubmit(handleConfirmReject)}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="reject-notes">
                Lý do từ chối <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={rejectForm.control}
                name="reviewNotes"
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Textarea
                      id="reject-notes"
                      {...field}
                      rows={4}
                      placeholder="Nhập lý do từ chối..."
                      className={`mt-2 ${error ? 'border-red-500' : ''}`}
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
                  rejectForm.reset()
                }}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={
                  rejectMutation.isPending || !rejectForm.formState.isValid
                }
                variant="destructive"
              >
                {rejectMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
