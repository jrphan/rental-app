import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehiclesApi } from '@/lib/api.vehicles'
import { authStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/admin/page-header'

export const Route = createFileRoute('/admin/_layout/vehicles')({
  path: '/vehicles',
  beforeLoad: () => {
    const auth = authStore.state
    if (!auth.isAuthenticated) throw redirect({ to: '/admin/login' })
  },
  component: AdminVehiclesPage,
})

function AdminVehiclesPage() {
  const qc = useQueryClient()
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vehicles', { status: 'SUBMITTED', page: 1 }],
    queryFn: async () => {
      const res = await vehiclesApi.listForReview({ status: 'SUBMITTED', page: 1, limit: 20 })
      return res.data
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => vehiclesApi.verify(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-vehicles'] })
      setDetailDialogOpen(false)
      setSelectedVehicle(null)
    },
  })
  const rejectMutation = useMutation({
    mutationFn: (payload: { id: string; reason?: string }) => vehiclesApi.reject(payload.id, payload.reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-vehicles'] })
      setDetailDialogOpen(false)
      setSelectedVehicle(null)
    },
  })

  const handleViewDetails = (vehicle: any) => {
    setSelectedVehicle(vehicle)
    setDetailDialogOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Quản lý Xe"
        description="Duyệt và quản lý các yêu cầu đăng ký xe"
      />
      <div className="bg-card rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Xe chờ duyệt</h2>
          </div>
          {isLoading ? (
            <div className="text-muted-foreground py-8 text-center">Đang tải...</div>
          ) : !data || data.items.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">Không có xe nào</div>
          ) : (
            <div className="space-y-3">
              {data.items.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Hình ảnh xe */}
                    {v.images && v.images.length > 0 && (
                      <img
                        src={v.images[0].url}
                        alt={`${v.brand} ${v.model}`}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{v.brand} {v.model} ({v.year})</div>
                      <div className="text-sm text-muted-foreground">Biển số: {v.licensePlate}</div>
                      {v.owner && (
                        <div className="text-sm text-muted-foreground">Chủ xe: {v.owner.email}</div>
                      )}
                      <div className="mt-1">
                        <Badge variant={v.status === 'SUBMITTED' ? 'default' : 'secondary'}>
                          {v.status === 'SUBMITTED' ? 'Chờ duyệt' : v.status}
                        </Badge>
                        {v.images && v.images.length > 0 && (
                          <Badge variant="outline" className="ml-2">
                            {v.images.length} hình
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(v)}>
                      Chi tiết
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => verifyMutation.mutate(v.id)} disabled={verifyMutation.isPending}>Duyệt</Button>
                    <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate({ id: v.id })} disabled={rejectMutation.isPending}>Từ chối</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Vehicle Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết xe</DialogTitle>
            <DialogDescription>
              Thông tin và hình ảnh của xe
            </DialogDescription>
          </DialogHeader>

          {selectedVehicle && (
            <div className="space-y-4 mt-4">
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hãng xe</Label>
                  <p className="text-sm font-medium">{selectedVehicle.brand}</p>
                </div>
                <div>
                  <Label>Dòng xe</Label>
                  <p className="text-sm font-medium">{selectedVehicle.model}</p>
                </div>
                <div>
                  <Label>Loại xe</Label>
                  <p className="text-sm font-medium">{selectedVehicle.vehicleType?.description}</p>
                </div>
                <div>
                  <Label>Năm sản xuất</Label>
                  <p className="text-sm font-medium">{selectedVehicle.year}</p>
                </div>
                <div>
                  <Label>Màu sắc</Label>
                  <p className="text-sm font-medium">{selectedVehicle.color}</p>
                </div>
                <div>
                  <Label>Biển số</Label>
                  <p className="text-sm font-medium">{selectedVehicle.licensePlate}</p>
                </div>
                <div>
                  <Label>Địa chỉ</Label>
                  <p className="text-sm font-medium">{selectedVehicle.location}</p>
                </div>
                <div>
                  <Label>Thành phố</Label>
                  <p className="text-sm font-medium">{selectedVehicle.city?.name}</p>
                </div>
                <div>
                  <Label>Giá ngày</Label>
                  <p className="text-sm font-medium">{Number(selectedVehicle.dailyRate).toLocaleString('vi-VN')} đ</p>
                </div>
                <div>
                  <Label>Tiền cọc</Label>
                  <p className="text-sm font-medium">{Number(selectedVehicle.depositAmount).toLocaleString('vi-VN')} đ</p>
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <div className="mt-1">
                    <Badge variant={selectedVehicle.status === 'SUBMITTED' ? 'default' : 'secondary'}>
                      {selectedVehicle.status === 'SUBMITTED' ? 'Chờ duyệt' : selectedVehicle.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedVehicle.owner && (
                <div>
                  <Label>Thông tin chủ xe</Label>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm">Email: {selectedVehicle.owner.email}</p>
                    {selectedVehicle.owner.phone && (
                      <p className="text-sm">SĐT: {selectedVehicle.owner.phone}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Hình ảnh xe */}
              {selectedVehicle.images && selectedVehicle.images.length > 0 ? (
                <div>
                  <Label>Hình ảnh xe ({selectedVehicle.images.length})</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {selectedVehicle.images.map((img: any) => (
                      <div key={img.id} className="relative">
                        <img
                          src={img.url}
                          alt={img.alt || `${selectedVehicle.brand} ${selectedVehicle.model}`}
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                        {img.isPrimary && (
                          <Badge className="absolute top-2 left-2">Ảnh chính</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <Label>Hình ảnh xe</Label>
                  <p className="text-sm text-muted-foreground mt-2">Chưa có hình ảnh</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setDetailDialogOpen(false)}
                >
                  Đóng
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => verifyMutation.mutate(selectedVehicle.id)}
                  disabled={verifyMutation.isPending}
                >
                  Duyệt xe
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => rejectMutation.mutate({ id: selectedVehicle.id })}
                  disabled={rejectMutation.isPending}
                >
                  Từ chối
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}


