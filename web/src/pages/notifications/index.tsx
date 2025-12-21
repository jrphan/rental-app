import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiNotification } from '@/services/api.notification'
import { NotificationList } from './list'
import { formatTimeAgo } from '@/utils/date.utils'
import { useNotificationSocket } from '@/hooks/notifications/useNotificationSocket'
import { useAuthStore } from '@/store/auth'

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const { isAuthenticated } = useAuthStore()

  // Setup WebSocket connection for real-time notifications
  useNotificationSocket({
    enabled: isAuthenticated,
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () =>
      apiNotification.getNotifications({
        isRead: filter === 'unread' ? false : undefined,
        limit: 100,
      }),
  })

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiNotification.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiNotification.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const notifications = data?.items ?? []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'unread'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Chưa đọc {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      <NotificationList
        notifications={notifications}
        isLoading={isLoading}
        onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
        formatTime={formatTimeAgo}
      />
    </div>
  )
}

