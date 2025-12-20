import { StatusBadge } from './status-badge'
import type { AdminVehicleItem } from '@/services/api.admin-vehicle'

interface VehicleDetailPanelProps {
  selected: AdminVehicleItem | null
  rejectReason: string
  onRejectReasonChange: (value: string) => void
  onApprove: () => void
  onClearSelection: () => void
  onReject: () => void
  isApproving: boolean
  isRejecting: boolean
}

export function VehicleDetailPanel({
  selected,
  rejectReason,
  onRejectReasonChange,
  onApprove,
  onClearSelection,
  onReject,
  isApproving,
  isRejecting,
}: VehicleDetailPanelProps) {
  return (
    <div className="rounded-lg bg-white border border-gray-200">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">Chi tiết xe</h2>
      </div>

      <div className="space-y-4 p-4 text-sm max-h-[calc(100vh-170px)] overflow-auto">
        {!selected ? (
          <p className="text-gray-500">
            Chọn một xe từ danh sách để xem chi tiết và xử lý.
          </p>
        ) : (
          <>
            <Section title="Thông tin chủ xe">
              <DetailRow
                label="Họ tên"
                value={selected.owner.fullName || '—'}
              />
              <DetailRow label="Số điện thoại" value={selected.owner.phone} />
              <DetailRow label="Email" value={selected.owner.email || '—'} />
              <DetailRow
                label="Đã là chủ xe"
                value={selected.owner.isVendor ? 'Có' : 'Chưa'}
              />
            </Section>

            <Section title="Thông tin xe">
              <DetailRow label="Hãng" value={selected.brand} />
              <DetailRow label="Dòng xe" value={selected.model} />
              <DetailRow
                label="Năm sản xuất"
                value={selected.year.toString()}
              />
              <DetailRow label="Màu sắc" value={selected.color} />
              <DetailRow
                label="Biển số"
                value={
                  <span className="font-mono">{selected.licensePlate}</span>
                }
              />
              <DetailRow
                label="Dung tích xi lanh"
                value={`${selected.engineSize} cc`}
              />
              <DetailRow
                label="Bằng lái yêu cầu"
                value={selected.requiredLicense}
              />
              <DetailRow label="Mô tả" value={selected.description || '—'} />
            </Section>

            <Section title="Địa chỉ">
              <DetailRow label="Địa chỉ" value={selected.address} />
              <DetailRow label="Quận/Huyện" value={selected.district || '—'} />
              <DetailRow label="Thành phố/Tỉnh" value={selected.city || '—'} />
              <DetailRow
                label="Tọa độ"
                value={`${selected.lat}, ${selected.lng}`}
              />
            </Section>

            <Section title="Giá cả">
              <DetailRow
                label="Giá thuê/ngày"
                value={new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(selected.pricePerDay)}
              />
              <DetailRow
                label="Tiền cọc"
                value={new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(selected.depositAmount)}
              />
              <DetailRow
                label="Đặt nhanh"
                value={selected.instantBook ? 'Có' : 'Không'}
              />
            </Section>

            <Section title="Trạng thái">
              <DetailRow
                label="Trạng thái hiện tại"
                value={<StatusBadge status={selected.status} />}
              />
            </Section>

            <Section title="Hình ảnh">
              {!selected.images.length ? (
                <p className="text-xs text-gray-500">
                  Chưa có hình ảnh nào được tải lên.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {selected.images.map((img, index) => (
                    <ImagePreview
                      key={img.id}
                      label={`Ảnh ${index + 1}${img.isPrimary ? ' (Ảnh chính)' : ''}`}
                      src={img.url}
                    />
                  ))}
                </div>
              )}
            </Section>

            {(selected.cavetFront || selected.cavetBack) && (
              <Section title="Giấy đăng ký xe">
                <div className="grid grid-cols-2 gap-3">
                  {selected.cavetFront && (
                    <ImagePreview
                      label="Đăng ký xe (mặt trước)"
                      src={selected.cavetFront}
                    />
                  )}
                  {selected.cavetBack && (
                    <ImagePreview
                      label="Đăng ký xe (mặt sau)"
                      src={selected.cavetBack}
                    />
                  )}
                </div>
              </Section>
            )}

            {selected.status === 'PENDING' && (
              <Section title="Hành động">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      disabled={isApproving || isRejecting}
                      onClick={onApprove}
                      className="flex-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                    >
                      {isApproving ? 'Đang duyệt...' : 'Duyệt xe'}
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
                      placeholder="Nhập lý do chi tiết nếu cần từ chối xe..."
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
                      {isRejecting ? 'Đang từ chối...' : 'Từ chối xe'}
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
