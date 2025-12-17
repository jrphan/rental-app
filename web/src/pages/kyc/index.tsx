import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { adminKycApi } from '@/services/api.admin-kyc'
import type { AdminKycItem, KycStatus } from '@/types/auth.types'
import { KycListTable } from './list'
import { KycDetailPanel } from './detail'

const statusOptions: { label: string; value?: KycStatus }[] = [
  { label: 'Tất cả', value: undefined },
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Đã duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
]

export default function KycPage() {
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
        <div className="lg:col-span-2 rounded-lg bg-white shadow h-fit">
          <KycListTable
            items={items}
            selected={selected}
            isLoading={isLoading}
            isError={isError}
            isFetching={isFetching}
            onSelect={(item) => setSelected(item)}
          />
        </div>

        <KycDetailPanel
          selected={selected}
          rejectReason={rejectReason}
          onRejectReasonChange={setRejectReason}
          onApprove={() => selected && approveMutation.mutate(selected.id)}
          onClearSelection={() => {
            setSelected(null)
            setRejectReason('')
          }}
          onReject={() =>
            selected &&
            rejectMutation.mutate({
              id: selected.id,
              reason: rejectReason.trim(),
            })
          }
          isApproving={approveMutation.isPending}
          isRejecting={rejectMutation.isPending}
        />
      </div>
    </div>
  )
}
