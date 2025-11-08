import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { vehiclesApi, rentalsApi } from '@/lib/api.vehicles'

export const Route = createFileRoute('/vehicles')({
  component: PublicVehiclesPage,
})

function PublicVehiclesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['web-vehicles', { page: 1 }],
    queryFn: async () => {
      const res = await vehiclesApi.listPublic({ page: 1, limit: 20 })
      return res.data
    },
  })

  const createRentalMutation = useMutation({
    mutationFn: (vehicleId: string) =>
      rentalsApi.create({
        vehicleId,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Danh sách xe</h2>
          {isLoading ? (
            <div className="text-gray-600">Đang tải...</div>
          ) : !data || data.items.length === 0 ? (
            <div className="text-gray-600">Không có xe</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.items.map((v) => (
                <div key={v.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{v.brand} {v.model} ({v.year})</div>
                    <div className="text-sm text-gray-600">Biển số: {v.licensePlate}</div>
                    <div className="text-sm text-gray-600">Giá ngày: {v.dailyRate} đ</div>
                  </div>
                  <button className="px-3 py-2 bg-orange-600 text-white rounded-md text-sm" onClick={() => createRentalMutation.mutate(v.id)} disabled={createRentalMutation.isPending}>Đặt xe</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


