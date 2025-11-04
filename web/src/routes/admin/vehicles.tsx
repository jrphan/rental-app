import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehiclesApi } from '@/lib/api.vehicles'
import { authStore } from '@/store/auth'

export const Route = createFileRoute('/admin/vehicles')({
  beforeLoad: () => {
    const auth = authStore.state
    if (!auth.isAuthenticated) throw redirect({ to: '/admin/login' })
  },
  component: AdminVehiclesPage,
})

function AdminVehiclesPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-vehicles', { status: 'SUBMITTED', page: 1 }],
    queryFn: async () => {
      const res = await vehiclesApi.listForReview({ status: 'SUBMITTED', page: 1, limit: 20 })
      return res.data
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => vehiclesApi.verify(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-vehicles'] }),
  })
  const rejectMutation = useMutation({
    mutationFn: (payload: { id: string; reason?: string }) => vehiclesApi.reject(payload.id, payload.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-vehicles'] }),
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Xe chờ duyệt</h2>
          </div>
          {isLoading ? (
            <div className="text-gray-600">Đang tải...</div>
          ) : !data || data.items.length === 0 ? (
            <div className="text-gray-600">Không có xe nào</div>
          ) : (
            <div className="space-y-3">
              {data.items.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{v.brand} {v.model} ({v.year})</div>
                    <div className="text-sm text-gray-600">Biển số: {v.licensePlate}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-2 bg-green-600 text-white rounded-md text-sm" onClick={() => verifyMutation.mutate(v.id)} disabled={verifyMutation.isPending}>Duyệt</button>
                    <button className="px-3 py-2 bg-red-600 text-white rounded-md text-sm" onClick={() => rejectMutation.mutate({ id: v.id })} disabled={rejectMutation.isPending}>Từ chối</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


