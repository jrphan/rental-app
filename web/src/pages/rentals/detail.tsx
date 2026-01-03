import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RentalStatusBadge } from './status-badge'
import type { AdminRentalItem, DisputeStatus, RentalStatus } from '@/services/api.admin-rental'
import { adminRentalApi } from '@/services/api.admin-rental'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface RentalDetailPanelProps {
  selected: AdminRentalItem | null
  onClearSelection: () => void
  onUpdate?: () => void
}

const disputeStatusLabels: Record<DisputeStatus, string> = {
  OPEN: 'Mở',
  UNDER_REVIEW: 'Đang xem xét',
  RESOLVED_REFUND: 'Đã giải quyết (Hoàn tiền)',
  RESOLVED_NO_REFUND: 'Đã giải quyết (Không hoàn tiền)',
  CANCELLED: 'Đã hủy',
}

const disputeStatusColors: Record<DisputeStatus, string> = {
  OPEN: 'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  RESOLVED_REFUND: 'bg-green-100 text-green-800',
  RESOLVED_NO_REFUND: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export function RentalDetailPanel({
  selected,
  onClearSelection,
  onUpdate,
}: RentalDetailPanelProps) {
  const queryClient = useQueryClient()
  const [isUpdating, setIsUpdating] = useState(false)

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RentalStatus }) =>
      adminRentalApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRentals'] })
      onUpdate?.()
    },
    onSettled: () => {
      setIsUpdating(false)
    },
  })

  const handleCompleteDisputedRental = async () => {
    if (!selected) return

    if (
      !confirm(
        'Bạn có chắc chắn muốn chuyển đơn tranh chấp đã giải quyết thành hoàn thành?',
      )
    ) {
      return
    }

    setIsUpdating(true)
    try {
      await updateStatusMutation.mutateAsync({
        id: selected.id,
        status: 'COMPLETED',
      })
    } catch (error) {
      console.error('Failed to update rental status:', error)
      alert('Cập nhật trạng thái thất bại. Vui lòng thử lại.')
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  return (
    <div className="rounded-lg bg-white border border-gray-200">
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">
            Chi tiết đơn hàng
          </h2>
          {selected && (
            <button
              onClick={onClearSelection}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Đóng
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4 text-sm max-h-[calc(100vh-170px)] overflow-auto">
        {!selected ? (
          <p className="text-gray-500">
            Chọn một đơn hàng từ danh sách để xem chi tiết.
          </p>
        ) : (
          <>
            <Section title="Thông tin đơn hàng">
              <DetailRow label="Mã đơn" value={<span className="font-mono text-xs">{selected.id}</span>} />
              <DetailRow
                label="Trạng thái"
                value={<RentalStatusBadge status={selected.status} />}
              />
              <DetailRow
                label="Ngày tạo"
                value={formatDate(selected.createdAt)}
              />
              <DetailRow
                label="Cập nhật lần cuối"
                value={formatDate(selected.updatedAt)}
              />
            </Section>

            <Section title="Thông tin người thuê">
              <DetailRow
                label="Họ tên"
                value={selected.renter.fullName || '—'}
              />
              <DetailRow label="Số điện thoại" value={selected.renter.phone} />
              <DetailRow label="Email" value={selected.renter.email || '—'} />
            </Section>

            <Section title="Thông tin chủ xe">
              <DetailRow
                label="Họ tên"
                value={selected.owner.fullName || '—'}
              />
              <DetailRow label="Số điện thoại" value={selected.owner.phone} />
              <DetailRow label="Email" value={selected.owner.email || '—'} />
            </Section>

            <Section title="Thông tin xe">
              <DetailRow
                label="Xe"
                value={`${selected.vehicle.brand} ${selected.vehicle.model} (${selected.vehicle.year})`}
              />
              <DetailRow
                label="Biển số"
                value={<span className="font-mono">{selected.vehicle.licensePlate}</span>}
              />
              <DetailRow label="Màu" value={selected.vehicle.color} />
              <DetailRow
                label="Dung tích"
                value={`${selected.vehicle.engineSize} cc`}
              />
              <DetailRow
                label="Giá thuê/ngày"
                value={formatCurrency(selected.vehicle.pricePerDay)}
              />
            </Section>

            <Section title="Thời gian thuê">
              <DetailRow
                label="Ngày bắt đầu"
                value={formatDate(selected.startDate)}
              />
              <DetailRow
                label="Ngày kết thúc"
                value={formatDate(selected.endDate)}
              />
              <DetailRow
                label="Thời lượng"
                value={`${Math.round(selected.durationMinutes / 60)} giờ (${selected.durationMinutes} phút)`}
              />
            </Section>

            <Section title="Thông tin giao hàng">
              {selected.deliveryAddress ? (
                <>
                  <DetailRow
                    label="Địa chỉ"
                    value={
                      typeof selected.deliveryAddress === 'object'
                        ? selected.deliveryAddress.address || '—'
                        : '—'
                    }
                  />
                  {typeof selected.deliveryAddress === 'object' &&
                    selected.deliveryAddress.lat &&
                    selected.deliveryAddress.lng && (
                      <DetailRow
                        label="Tọa độ"
                        value={`${selected.deliveryAddress.lat}, ${selected.deliveryAddress.lng}`}
                      />
                    )}
                </>
              ) : (
                <DetailRow label="Giao hàng" value="Không" />
              )}
              <DetailRow
                label="Phí giao hàng"
                value={formatCurrency(selected.deliveryFee)}
              />
            </Section>

            <Section title="Thông tin tài chính">
              <DetailRow
                label="Giá thuê/ngày"
                value={formatCurrency(Number(selected.pricePerDay))}
              />
              <DetailRow
                label="Tổng tiền thuê"
                value={formatCurrency(
                  Number(selected.pricePerDay) *
                  (selected.durationMinutes / 60 / 24),
                )}
              />
              <DetailRow
                label="Phí giao hàng"
                value={formatCurrency(Number(selected.deliveryFee))}
              />
              <DetailRow
                label="Giảm giá"
                value={`-${formatCurrency(Number(selected.discountAmount))}`}
              />
              <DetailRow
                label="Phí bảo hiểm"
                value={formatCurrency(Number(selected.insuranceFee))}
              />
              <DetailRow
                label="Tổng cộng"
                value={
                  <span className="font-semibold">
                    {formatCurrency(Number(selected.totalPrice))}
                  </span>
                }
              />
              <DetailRow
                label="Tiền cọc"
                value={formatCurrency(Number(selected.depositPrice))}
              />
              <DetailRow
                label={`Phí nền tảng (${Math.round(Number(selected.platformFeeRatio) * 100)}%)`}
                value={formatCurrency(Number(selected.platformFee))}
              />
              <DetailRow
                label="Chủ xe nhận được"
                value={
                  <span className="font-semibold text-green-600">
                    {formatCurrency(Number(selected.ownerEarning))}
                  </span>
                }
              />
            </Section>

            {(selected.startOdometer !== null ||
              selected.endOdometer !== null) && (
                <Section title="Số km">
                  <DetailRow
                    label="Số km bắt đầu"
                    value={
                      selected.startOdometer !== null
                        ? `${selected.startOdometer.toLocaleString('vi-VN')} km`
                        : '—'
                    }
                  />
                  <DetailRow
                    label="Số km kết thúc"
                    value={
                      selected.endOdometer !== null
                        ? `${selected.endOdometer.toLocaleString('vi-VN')} km`
                        : '—'
                    }
                  />
                  {selected.startOdometer !== null &&
                    selected.endOdometer !== null && (
                      <DetailRow
                        label="Tổng km đã đi"
                        value={`${(
                          selected.endOdometer - selected.startOdometer
                        ).toLocaleString('vi-VN')} km`}
                      />
                    )}
                </Section>
              )}

            {selected.cancelReason && (
              <Section title="Lý do hủy">
                <DetailRow label="Lý do" value={selected.cancelReason} />
              </Section>
            )}

            {selected.evidences.length > 0 && (
              <Section title="Bằng chứng">
                <div className="grid grid-cols-2 gap-3">
                  {selected.evidences.map((evidence) => (
                    <ImagePreview
                      key={evidence.id}
                      label={`${evidence.type} ${evidence.order + 1}${evidence.note ? ` - ${evidence.note}` : ''}`}
                      src={evidence.url}
                      date={evidence.createdAt}
                    />
                  ))}
                </div>
              </Section>
            )}

            {selected.dispute && (
              <Section title="Tranh chấp">
                <div className="space-y-3 rounded-md bg-orange-50 p-3">
                  <DetailRow
                    label="Trạng thái"
                    value={
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${disputeStatusColors[selected.dispute.status]}`}
                      >
                        {disputeStatusLabels[selected.dispute.status]}
                      </span>
                    }
                  />
                  <DetailRow
                    label="Lý do"
                    value={selected.dispute.reason}
                  />
                  {selected.dispute.description && (
                    <DetailRow
                      label="Mô tả"
                      value={selected.dispute.description}
                    />
                  )}
                  <DetailRow
                    label="Ngày tạo"
                    value={formatDate(selected.dispute.createdAt)}
                  />
                  <DetailRow
                    label="Cập nhật lần cuối"
                    value={formatDate(selected.dispute.updatedAt)}
                  />
                  {selected.dispute.adminNotes && (
                    <DetailRow
                      label="Ghi chú admin"
                      value={
                        <span className="font-medium text-orange-900">
                          {selected.dispute.adminNotes}
                        </span>
                      }
                    />
                  )}
                  {selected.dispute.resolvedBy && (
                    <DetailRow
                      label="Người xử lý"
                      value={<span className="font-mono text-xs">{selected.dispute.resolvedBy}</span>}
                    />
                  )}
                  {selected.dispute.resolvedAt && (
                    <DetailRow
                      label="Thời gian xử lý"
                      value={formatDate(selected.dispute.resolvedAt)}
                    />
                  )}
                  {/* Button để chuyển đổi sang COMPLETED khi dispute đã được giải quyết */}
                  {selected.status === 'DISPUTED' && (
                    <div className="pt-2 border-t border-orange-200">
                      <Button
                        onClick={handleCompleteDisputedRental}
                        disabled={isUpdating}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          'Chuyển thành hoàn thành'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {selected.transactions.length > 0 && (
              <Section title="Giao dịch">
                <div className="space-y-2">
                  {selected.transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="rounded-md border border-gray-200 bg-white p-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-900">
                            {transaction.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span
                            className={`text-xs font-semibold ${transaction.type === 'REFUND'
                              ? 'text-green-600'
                              : transaction.type === 'PAYMENT'
                                ? 'text-red-600'
                                : 'text-gray-600'
                              }`}
                          >
                            {transaction.type === 'REFUND' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </span>
                          <span
                            className={`text-xs ${transaction.status === 'COMPLETED'
                              ? 'text-green-600'
                              : transaction.status === 'FAILED'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                              }`}
                          >
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                      {transaction.description && (
                        <p className="mt-1 text-xs text-gray-500">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      <div className="space-y-1 rounded-md bg-gray-50 px-3 py-2">
        {children}
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="max-w-[60%] whitespace-pre-wrap text-right text-gray-900">
        {value || '—'}
      </span>
    </div>
  )
}

function ImagePreview({
  label,
  src,
  date,
}: {
  label: string
  src: string
  date?: string
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-gray-600">{label}</p>
      {date && (
        <p className="text-[10px] text-gray-500">
          {new Date(date).toLocaleString('vi-VN')}
        </p>
      )}
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-md border border-gray-200 bg-gray-100"
      >
        <img
          src={src}
          alt={label}
          className="h-32 w-full object-contain transition-transform duration-150 hover:scale-[1.02]"
        />
      </a>
    </div>
  )
}

