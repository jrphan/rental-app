import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { adminKycApi } from '@/services/api.admin-kyc'
import type {
  AdminKycItem,
  AdminKycListResponse,
  KycStatus,
} from '@/types/auth.types'
import { KycListTable } from './list'
import { KycDetailPanel } from './detail'

export default function KycPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<KycStatus | undefined>(
    'PENDING',
  )
  const [selected, setSelected] = useState<AdminKycItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const { data, isLoading, isError, refetch, isFetching } =
    useQuery<AdminKycListResponse>({
      queryKey: ['adminKyc', { status: statusFilter, page, limit }],
      queryFn: () =>
        adminKycApi.list({
          status: statusFilter,
          page,
          limit,
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
  const total = data?.total ?? 0
  const currentPage = data?.page ?? page
  const pageSize = data?.limit ?? limit

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1

  const handleStatusFilterChange = (status: KycStatus | undefined) => {
    setStatusFilter(status)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    setPage(newPage)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-lg bg-white border border-gray-200 h-fit">
        <KycListTable
          items={items}
          selected={selected}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          onRefetch={() => refetch()}
          onSelect={(item) => setSelected(item)}
          page={currentPage}
          limit={pageSize}
          total={total}
          onPageChange={handlePageChange}
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
  )
}
