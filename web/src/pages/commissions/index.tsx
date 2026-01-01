import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminCommissionApi, type CommissionPayment } from '@/services/api.admin-commission'
import { PaymentListTable } from './list'
import { PaymentDetailPanel } from './detail'
import { SettingsPanel } from './settings'

export default function CommissionsPage() {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<CommissionPayment | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const { data: paymentsData, isLoading, isError, refetch, isFetching } =
    useQuery({
      queryKey: ['adminCommissionPayments', { page, limit }],
      queryFn: () =>
        adminCommissionApi.getPendingPayments({
          limit,
          offset: (page - 1) * limit,
        }),
    })

  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ['adminCommissionSettings'],
    queryFn: () => adminCommissionApi.getCommissionSettings(),
  })

  const reviewMutation = useMutation({
    mutationFn: (payload: {
      paymentId: string
      status: 'APPROVED' | 'REJECTED'
      adminNotes?: string
    }) =>
      adminCommissionApi.reviewPayment(payload.paymentId, {
        status: payload.status,
        adminNotes: payload.adminNotes,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['adminCommissionPayments'],
      })
      setSelected(null)
      setRejectReason('')
    },
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (commissionRate: number) =>
      adminCommissionApi.updateCommissionSettings({ commissionRate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['adminCommissionSettings'],
      })
      refetchSettings()
    },
  })

  const items = paymentsData?.items ?? []
  const total = paymentsData?.total ?? 0
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    setPage(newPage)
  }

  const handleApprove = () => {
    if (!selected) return
    reviewMutation.mutate({
      paymentId: selected.id,
      status: 'APPROVED',
    })
  }

  const handleReject = () => {
    if (!selected || !rejectReason.trim()) return
    reviewMutation.mutate({
      paymentId: selected.id,
      status: 'REJECTED',
      adminNotes: rejectReason.trim(),
    })
  }

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <SettingsPanel
        settings={settingsData}
        onUpdate={(rate) => updateSettingsMutation.mutate(rate)}
        isUpdating={updateSettingsMutation.isPending}
      />

      {/* Payments List and Detail */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg bg-white border border-gray-200 h-fit">
          <PaymentListTable
            items={items}
            selected={selected}
            isLoading={isLoading}
            isError={isError}
            isFetching={isFetching}
            onRefetch={() => refetch()}
            onSelect={(item) => setSelected(item)}
            page={page}
            limit={limit}
            total={total}
            onPageChange={handlePageChange}
          />
        </div>

        <PaymentDetailPanel
          selected={selected}
          rejectReason={rejectReason}
          onRejectReasonChange={setRejectReason}
          onApprove={handleApprove}
          onClearSelection={() => {
            setSelected(null)
            setRejectReason('')
          }}
          onReject={handleReject}
          isReviewing={reviewMutation.isPending}
        />
      </div>
    </div>
  )
}

