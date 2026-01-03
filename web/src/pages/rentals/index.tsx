import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { adminRentalApi } from '@/services/api.admin-rental'
import type {
  AdminRentalItem,
  AdminRentalListResponse,
  RentalStatus,
} from '@/services/api.admin-rental'
import { RentalListTable } from './list'
import { RentalDetailPanel } from './detail'

export default function RentalsPage() {
  const [statusFilter, setStatusFilter] = useState<RentalStatus | undefined>(
    undefined,
  )
  const [hasDisputeFilter, setHasDisputeFilter] = useState<
    boolean | undefined
  >(undefined)
  const [selected, setSelected] = useState<AdminRentalItem | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const { data, isLoading, isError, refetch, isFetching } =
    useQuery<AdminRentalListResponse>({
      queryKey: [
        'adminRentals',
        { status: statusFilter, hasDispute: hasDisputeFilter, page, limit },
      ],
      queryFn: () =>
        adminRentalApi.list({
          status: statusFilter,
          hasDispute: hasDisputeFilter,
          page,
          limit,
        }),
    })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const currentPage = data?.page ?? page
  const pageSize = data?.limit ?? limit

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1

  const handleStatusFilterChange = (status: RentalStatus | undefined) => {
    setStatusFilter(status)
    setPage(1)
  }

  const handleDisputeFilterChange = (hasDispute: boolean | undefined) => {
    setHasDisputeFilter(hasDispute)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    setPage(newPage)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-lg bg-white border border-gray-200 h-fit">
        <RentalListTable
          items={items}
          selected={selected}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          statusFilter={statusFilter}
          hasDisputeFilter={hasDisputeFilter}
          onStatusFilterChange={handleStatusFilterChange}
          onDisputeFilterChange={handleDisputeFilterChange}
          onRefetch={() => refetch()}
          onSelect={(item) => setSelected(item)}
          page={currentPage}
          limit={pageSize}
          total={total}
          onPageChange={handlePageChange}
        />
      </div>

      <RentalDetailPanel
        selected={selected}
        onClearSelection={() => {
          setSelected(null)
        }}
        onUpdate={() => {
          refetch()
        }}
      />
    </div>
  )
}

