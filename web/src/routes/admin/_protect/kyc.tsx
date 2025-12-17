import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminKycApi } from '@/services/api.admin-kyc'
import type { KycStatus, AdminKycItem } from '@/types/auth.types'
import { useState } from 'react'

export const Route = createFileRoute('/admin/_protect/kyc')({
  component: KycPage,
})

const statusOptions: { label: string; value?: KycStatus }[] = [
  { label: 'Tất cả', value: undefined },
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Đã duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
]

function KycPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<KycStatus | undefined>(
    'PENDING',
  )
  const [selected, setSelected] = useState<AdminKycItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['adminKyc', { status: statusFilter }],
    queryFn: () =>
      adminKycApi.list({
        status: statusFilter,
        page: 1,
        limit: 20,
      }),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminKycApi.approve(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminKyc'] })
      setSelected(null)
      setRejectReason('')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (payload: { id: string; reason: string }) =>
      adminKycApi.reject(payload.id, payload.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminKyc'] })
      setSelected(null)
      setRejectReason('')
    },
  })

  const items = data?.items ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Quản lý & duyệt KYC
          </h1>
          <p className="text-sm text-gray-600">
            Xem và xử lý yêu cầu xác minh danh tính của người dùng.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            value={statusFilter ?? ''}
            onChange={(e) =>
              setStatusFilter(
                (e.target.value || undefined) as KycStatus | undefined,
              )
            }
          >
            {statusOptions.map((opt) => (
              <option key={opt.label} value={opt.value ?? ''}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Làm mới
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg bg-white shadow">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Danh sách yêu cầu KYC
            </h2>
            {isFetching && (
              <span className="text-xs text-gray-500">Đang tải...</span>
            )}
          </div>

          <div className="max-h-[520px] overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-500">
                Đang tải dữ liệu...
              </div>
            ) : isError ? (
              <div className="flex items-center justify-center py-10 text-red-500">
                Không tải được danh sách KYC
              </div>
            ) : items.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-500">
                Không có yêu cầu KYC nào.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Người dùng
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      CMND/CCCD
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      GPLX
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Trạng thái
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className={
                        selected?.id === item.id
                          ? 'bg-orange-50'
                          : 'hover:bg-gray-50'
                      }
                    >
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {item.user.fullName || item.fullNameInId || '—'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.user.phone}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-800">
                        {item.citizenId || '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-800">
                        {item.driverLicense || '—'}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => setSelected(item)}
                          className="text-sm font-medium text-orange-600 hover:text-orange-700"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white shadow">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Chi tiết KYC
            </h2>
          </div>

          <div className="p-4 space-y-4 text-sm">
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
                  <DetailRow
                    label="Số điện thoại"
                    value={selected.user.phone}
                  />
                  <DetailRow label="Email" value={selected.user.email || '—'} />
                </Section>

                <Section title="Thông tin giấy tờ">
                  <DetailRow
                    label="CMND/CCCD"
                    value={selected.citizenId || '—'}
                  />
                  <DetailRow
                    label="Địa chỉ trên giấy tờ"
                    value={selected.addressInId || '—'}
                  />
                  <DetailRow
                    label="GPLX"
                    value={selected.driverLicense || '—'}
                  />
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
                        <ImagePreview
                          label="Ảnh selfie"
                          src={selected.selfieImg}
                        />
                      )}
                    </div>
                  )}
                </Section>

                <Section title="Hành động">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        disabled={
                          approveMutation.isPending ||
                          rejectMutation.isPending ||
                          selected.status === 'APPROVED'
                        }
                        onClick={() => approveMutation.mutate(selected.id)}
                        className="flex-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                      >
                        {approveMutation.isPending
                          ? 'Đang duyệt...'
                          : 'Duyệt KYC'}
                      </button>
                      <button
                        disabled={
                          approveMutation.isPending || rejectMutation.isPending
                        }
                        onClick={() => setSelected(null)}
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
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="Nhập lý do chi tiết nếu cần từ chối KYC..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <button
                        disabled={
                          !rejectReason.trim() ||
                          approveMutation.isPending ||
                          rejectMutation.isPending
                        }
                        onClick={() =>
                          rejectMutation.mutate({
                            id: selected.id,
                            reason: rejectReason.trim(),
                          })
                        }
                        className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
                      >
                        {rejectMutation.isPending
                          ? 'Đang từ chối...'
                          : 'Từ chối KYC'}
                      </button>
                    </div>
                  </div>
                </Section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: KycStatus }) {
  const map: Record<
    KycStatus,
    { label: string; className: string; dotClass: string }
  > = {
    PENDING: {
      label: 'Chờ duyệt',
      className: 'bg-amber-50 text-amber-800 ring-amber-600/20',
      dotClass: 'bg-amber-500',
    },
    APPROVED: {
      label: 'Đã duyệt',
      className: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
      dotClass: 'bg-emerald-500',
    },
    REJECTED: {
      label: 'Từ chối',
      className: 'bg-red-50 text-red-800 ring-red-600/20',
      dotClass: 'bg-red-500',
    },
    NEEDS_UPDATE: {
      label: 'Cần bổ sung',
      className: 'bg-blue-50 text-blue-800 ring-blue-600/20',
      dotClass: 'bg-blue-500',
    },
  }

  const cfg = map[status]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </span>
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
      <span className="max-w-[60%] text-right text-gray-900 break-words">
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
