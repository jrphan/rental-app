import { StatusBadge } from './status-badge'
import type { AdminKycItem } from '@/types/auth.types'

interface KycDetailPanelProps {
  selected: AdminKycItem | null
  rejectReason: string
  onRejectReasonChange: (value: string) => void
  onApprove: () => void
  onClearSelection: () => void
  onReject: () => void
  isApproving: boolean
  isRejecting: boolean
}

export function KycDetailPanel({
  selected,
  rejectReason,
  onRejectReasonChange,
  onApprove,
  onClearSelection,
  onReject,
  isApproving,
  isRejecting,
}: KycDetailPanelProps) {
  return (
    <div className="rounded-lg bg-white border border-gray-200">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">Chi tiết KYC</h2>
      </div>

      <div className="space-y-4 p-4 text-sm max-h-[calc(100vh-170px)] overflow-auto">
        {!selected ? (
          <p className="text-gray-500">
            Chọn một yêu cầu KYC từ danh sách để xem chi tiết và xử lý.
          </p>
        ) : (
          <>
            <Section title="Thông tin người dùng">
              <DetailRow
                label="Họ tên"
                value={selected.user.fullName || selected.fullNameInId}
              />
              <DetailRow label="Số điện thoại" value={selected.user.phone} />
              <DetailRow label="Email" value={selected.user.email || '—'} />
            </Section>

            <Section title="Thông tin giấy tờ">
              <DetailRow label="CMND/CCCD" value={selected.citizenId || '—'} />
              <DetailRow
                label="Địa chỉ trên giấy tờ"
                value={selected.addressInId || '—'}
              />
              <DetailRow label="GPLX" value={selected.driverLicense || '—'} />
              <DetailRow
                label="Hạng GPLX"
                value={selected.licenseType || '—'}
              />
            </Section>

            <Section title="Trạng thái">
              <DetailRow
                label="Trạng thái hiện tại"
                value={<StatusBadge status={selected.status} />}
              />
              {selected.rejectionReason && (
                <DetailRow
                  label="Lý do từ chối"
                  value={selected.rejectionReason}
                />
              )}
            </Section>

            <Section title="Hình ảnh giấy tờ">
              {!(
                selected.idCardFront ||
                selected.idCardBack ||
                selected.licenseFront ||
                selected.licenseBack ||
                selected.selfieImg
              ) ? (
                <p className="text-xs text-gray-500">
                  Chưa có hình ảnh nào được tải lên.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {selected.idCardFront && (
                    <ImagePreview
                      label="CMND/CCCD (mặt trước)"
                      src={selected.idCardFront}
                    />
                  )}
                  {selected.idCardBack && (
                    <ImagePreview
                      label="CMND/CCCD (mặt sau)"
                      src={selected.idCardBack}
                    />
                  )}
                  {selected.licenseFront && (
                    <ImagePreview
                      label="GPLX (mặt trước)"
                      src={selected.licenseFront}
                    />
                  )}
                  {selected.licenseBack && (
                    <ImagePreview
                      label="GPLX (mặt sau)"
                      src={selected.licenseBack}
                    />
                  )}
                  {selected.selfieImg && (
                    <ImagePreview label="Ảnh selfie" src={selected.selfieImg} />
                  )}
                </div>
              )}
            </Section>

            {selected.status === 'PENDING' && (
              <Section title="Hành động">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      disabled={isApproving || isRejecting}
                      onClick={onApprove}
                      className="flex-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                    >
                      {isApproving ? 'Đang duyệt...' : 'Duyệt KYC'}
                    </button>
                    <button
                      disabled={isApproving || isRejecting}
                      onClick={onClearSelection}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Bỏ chọn
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">
                      Lý do từ chối
                    </label>
                    <textarea
                      rows={3}
                      className="bg-white mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
                      placeholder="Nhập lý do chi tiết nếu cần từ chối KYC..."
                      value={rejectReason}
                      onChange={(e) => onRejectReasonChange(e.target.value)}
                    />
                    <button
                      disabled={
                        !rejectReason.trim() || isApproving || isRejecting
                      }
                      onClick={onReject}
                      className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
                    >
                      {isRejecting ? 'Đang từ chối...' : 'Từ chối KYC'}
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

function ImagePreview({ label, src }: { label: string; src: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-gray-600">{label}</p>
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
