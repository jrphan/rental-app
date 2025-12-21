import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { adminVehicleApi } from '@/services/api.admin-vehicle'
import type {
  AdminVehicleItem,
  AdminVehicleListResponse,
  VehicleStatus,
} from '@/services/api.admin-vehicle'
import { VehicleListTable } from './list'
import { VehicleDetailPanel } from './detail'

export default function VehiclesPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | undefined>(
    'PENDING',
  )
  const [selected, setSelected] = useState<AdminVehicleItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const { data, isLoading, isError, refetch, isFetching } =
    useQuery<AdminVehicleListResponse>({
      queryKey: ['adminVehicles', { status: statusFilter, page, limit }],
      queryFn: () =>
        adminVehicleApi.list({
          status: statusFilter,
          page,
          limit,
        }),
    })

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminVehicleApi.approve(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminVehicles'] })
      setSelected(null)
      setRejectReason('')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (payload: { id: string; reason: string }) =>
      adminVehicleApi.reject(payload.id, payload.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminVehicles'] })
      setSelected(null)
      setRejectReason('')
    },
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const currentPage = data?.page ?? page
  const pageSize = data?.limit ?? limit

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1

  const handleStatusFilterChange = (status: VehicleStatus | undefined) => {
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
        <VehicleListTable
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

      <VehicleDetailPanel
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

