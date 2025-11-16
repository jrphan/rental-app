import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { authStore } from '@/store/auth'
import {
  notificationsApi,
  type Notification,
  type NotificationType,
} from '@/lib/api.notifications'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/admin/page-header'
import {
  Bell,
  CheckCircle2,
  XCircle,
  Trash2,
  CheckCheck,
  Filter,
} from 'lucide-react'

export const Route = createFileRoute('/admin/_layout/notifications')({
  beforeLoad: () => {
    const authState = authStore.state
    if (authState.isLoading) {
      return
    }
    if (!authState.isAuthenticated) {
      throw redirect({
        to: '/admin/login',
      })
    }
  },
  component: NotificationsPage,
})

function NotificationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const authState = useStore(authStore)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)

  const limit = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', selectedFilter, page],
    queryFn: () =>
      notificationsApi.getMyNotifications(
        page,
        limit,
        selectedFilter === 'unread' ? false : undefined,
      ),
  })

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Đang xác thực...</p>
        </div>
      </div>
    )
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'RENTAL_REQUEST':
      case 'RENTAL_CONFIRMED':
        return '🚗'
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
        return '💳'
      case 'REVIEW_RECEIVED':
        return '⭐'
      case 'MESSAGE_RECEIVED':
        return '💬'
      case 'SYSTEM_ANNOUNCEMENT':
        return '📢'
      case 'DISPUTE_CREATED':
      case 'DISPUTE_RESOLVED':
        return '⚖️'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'RENTAL_CONFIRMED':
      case 'PAYMENT_SUCCESS':
        return 'text-green-600 bg-green-50'
      case 'PAYMENT_FAILED':
      case 'RENTAL_CANCELLED':
        return 'text-red-600 bg-red-50'
      case 'MESSAGE_RECEIVED':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-orange-600 bg-orange-50'
    }
  }

  return (
    <>
      <PageHeader
        title="Thông báo"
        description="Xem và quản lý tất cả thông báo"
        showBackButton
        backTo="/admin/dashboard"
        action={
          data &&
          data.data.some((n) => !n.isRead) &&
          selectedFilter === 'all' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Đọc tất cả
            </Button>
          ) : undefined
        }
      />
      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-2">
            <Button
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedFilter('all')
                setPage(1)
              }}
            >
              Tất cả
            </Button>
            <Button
              variant={selectedFilter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedFilter('unread')
                setPage(1)
              }}
            >
              Chưa đọc
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="bg-card rounded-lg shadow-sm p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-muted-foreground">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">
            Lỗi: {error instanceof Error ? error.message : 'Có lỗi xảy ra'}
          </p>
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="bg-card rounded-lg shadow-sm p-8 text-center">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {selectedFilter === 'unread'
              ? 'Không có thông báo chưa đọc'
              : 'Chưa có thông báo'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-lg shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-200">
                {data.data.map((notification) => {
                  const isUnread = !notification.isRead
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors ${
                        isUnread ? 'bg-orange-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getNotificationColor(
                            notification.type,
                          )}`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3
                                  className={`text-sm font-semibold ${
                                    isUnread
                                      ? 'text-foreground'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {notification.title}
                                </h3>
                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-orange-600 flex-shrink-0"></span>
                                )}
                              </div>
                              <p
                                className={`text-sm mb-2 ${
                                  isUnread
                                    ? 'text-foreground/90'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(
                                  notification.createdAt,
                                ).toLocaleString('vi-VN')}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              {isUnread && (
                                <button
                                  onClick={() =>
                                    markAsReadMutation.mutate(notification.id)
                                  }
                                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                  title="Đánh dấu đã đọc"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  deleteMutation.mutate(notification.id)
                                }
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Hiển thị {(data.page - 1) * data.limit + 1} -{' '}
                {Math.min(data.page * data.limit, data.total)} trong tổng số{' '}
                {data.total} thông báo
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.page === 1}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={data.page >= data.totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
          </>
        )}
    </>
  )
}
