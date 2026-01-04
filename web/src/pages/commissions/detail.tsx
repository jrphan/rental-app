import type { CommissionPayment } from '@/services/api.admin-commission'

interface PaymentDetailPanelProps {
  selected: CommissionPayment | null
  rejectReason: string
  onRejectReasonChange: (value: string) => void
  onApprove: () => void
  onClearSelection: () => void
  onReject: () => void
  isReviewing: boolean
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

export function PaymentDetailPanel({
  selected,
  rejectReason,
  onRejectReasonChange,
  onApprove,
  onClearSelection,
  onReject,
  isReviewing,
}: PaymentDetailPanelProps) {
  return (
    <div className="rounded-lg bg-white border border-gray-200">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Chi tiết thanh toán
        </h2>
      </div>

      <div className="space-y-4 p-4 text-sm max-h-[calc(100vh-170px)] overflow-auto">
        {!selected ? (
          <p className="text-gray-500">
            Chọn một thanh toán từ danh sách để xem chi tiết và xử lý.
          </p>
        ) : (
          <>
            <Section title="Thông tin chủ xe">
              <DetailRow
                label="Họ tên"
                value={selected.owner.fullName || '—'}
              />
              <DetailRow label="Số điện thoại" value={selected.owner.phone} />
            </Section>

            <Section title="Thông tin commission">
              <DetailRow
                label="Tuần"
                value={`${formatDate(selected.commission.weekStartDate)} - ${formatDate(selected.commission.weekEndDate)}`}
              />
              <DetailRow
                label="Số tiền cần thanh toán"
                value={<span className="font-semibold text-orange-600">{formatCurrency(selected.amount)}</span>}
              />
            </Section>

            <Section title="Trạng thái">
              <DetailRow
                label="Trạng thái hiện tại"
                value={
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${selected.status === 'PAID'
                      ? 'bg-blue-100 text-blue-800'
                      : selected.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : selected.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {selected.status === 'PAID'
                      ? 'Đã gửi hóa đơn'
                      : selected.status === 'APPROVED'
                        ? 'Đã xác thực'
                        : selected.status === 'REJECTED'
                          ? 'Đã từ chối'
                          : 'Chờ thanh toán'}
                  </span>
                }
              />
              {selected.paidAt && (
                <DetailRow label="Ngày gửi hóa đơn" value={formatDate(selected.paidAt)} />
              )}
              {selected.reviewedAt && (
                <DetailRow label="Ngày xử lý" value={formatDate(selected.reviewedAt)} />
              )}
              {selected.adminNotes && (
                <DetailRow label="Ghi chú admin" value={selected.adminNotes} />
              )}
            </Section>

            <Section title="Hóa đơn">
              {selected.invoiceUrl ? (
                <ImagePreview src={selected.invoiceUrl} />
              ) : (
                <p className="text-xs text-gray-500">Chưa có hóa đơn.</p>
              )}
            </Section>

            {selected.status === 'PAID' && (
              <Section title="Hành động">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      disabled={isReviewing}
                      onClick={onApprove}
                      className="flex-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                    >
                      {isReviewing ? 'Đang xử lý...' : 'Duyệt thanh toán'}
                    </button>
                    <button
                      disabled={isReviewing}
                      onClick={onClearSelection}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Bỏ chọn
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">
                      Lý do từ chối (nếu cần)
                    </label>
                    <textarea
                      rows={3}
                      className="bg-white mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
                      placeholder="Nhập lý do từ chối nếu hóa đơn không hợp lệ..."
                      value={rejectReason}
                      onChange={(e) => onRejectReasonChange(e.target.value)}
                    />
                    <button
                      disabled={!rejectReason.trim() || isReviewing}
                      onClick={onReject}
                      className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
                    >
                      {isReviewing ? 'Đang từ chối...' : 'Từ chối thanh toán'}
                    </button>
                  </div>
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

function ImagePreview({ src }: { src: string }) {
  return (
    <div className="space-y-1">
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-md border border-gray-200 bg-gray-100"
      >
        <img
          src={src}
          alt="Hóa đơn thanh toán"
          className="h-64 w-full object-contain transition-transform duration-150 hover:scale-[1.02]"
        />
      </a>
      <p className="text-[11px] text-gray-500">
        Click để xem ảnh gốc
      </p>
    </div>
  )
}

