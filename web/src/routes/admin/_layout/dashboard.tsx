import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { authStore } from '@/store/auth'
import { User, Shield, Activity, FileCheck } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/admin/_layout/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const authState = useStore(authStore)
  const user = authState.user

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            Chào mừng trở lại, {user?.email}! Đây là trang quản lý hệ thống thuê
            xe P2P
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate({ to: '/admin/kyc' })}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Quản lý KYC
                </p>
                <p className="text-lg font-semibold mt-1">Xác thực danh tính</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <FileCheck className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tổng giao dịch
                </p>
                <p className="text-2xl font-bold mt-1">0</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Activity className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tổng người dùng
                </p>
                <p className="text-2xl font-bold mt-1">0</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <User className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Xe đang hoạt động
                </p>
                <p className="text-2xl font-bold mt-1">0</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài khoản</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">
                Số điện thoại
              </span>
              <span className="text-sm font-medium">
                {user?.phone || 'Chưa cập nhật'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Vai trò</span>
              <Badge variant="secondary">{user?.role || 'N/A'}</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Trạng thái</span>
              {user?.isActive ? (
                <Badge variant="default">Đang hoạt động</Badge>
              ) : (
                <Badge variant="destructive">Đã khóa</Badge>
              )}
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Xác thực</span>
              {user?.isVerified ? (
                <Badge variant="default">Đã xác thực</Badge>
              ) : (
                <Badge variant="outline">Chưa xác thực</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
