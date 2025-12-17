import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth'

export const Route = createFileRoute('/admin/_protect/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Chào mừng đến với Hệ thống quản trị
        </h1>
        <p className="text-gray-600 mt-2">
          Dashboard quản lý hệ thống cho thuê xe máy
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Xin chào</p>
              <p className="text-2xl font-bold text-gray-900">
                {user?.fullName || user?.phone}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vai trò</p>
              <p className="text-2xl font-bold text-gray-900">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Tổng quan
        </h2>
        <p className="text-gray-600">
          Đây là trang dashboard. Bạn có thể bắt đầu quản lý hệ thống từ đây.
        </p>
      </div>
    </div>
  )
}
