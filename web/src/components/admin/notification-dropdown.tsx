import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi, type Notification } from '@/lib/api.notifications'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  CheckCircle2,
  Trash2,
  CheckCheck,
  MessageSquare,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export function NotificationDropdown() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  // Fetch unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch recent notifications (latest 10)
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationsApi.getMyNotifications(1, 10),
    enabled: open,
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

  const notifications = notificationsData?.data || []
  const hasUnread = notifications.some((n) => !n.isRead)

  // Helper function to determine navigation route based on notification
  const getNotificationRoute = (notification: Notification): string | null => {
    const notificationData = notification.data as any

    if (!notificationData) {
      return null
    }

    // Vehicle submission notification
    // Can be identified by notification.type === 'RENTAL_REQUEST' with data.type === 'VEHICLE_SUBMITTED'
    // or directly by data.type === 'VEHICLE_SUBMITTED'
    if (
      notificationData.type === 'VEHICLE_SUBMITTED' &&
      notificationData.vehicleId
    ) {
      return '/admin/vehicles'
    }

    // Also check notification.type for vehicle-related notifications
    if (notification.type === 'RENTAL_REQUEST' && notificationData.vehicleId) {
      return '/admin/vehicles'
    }

    // Owner application notification
    // Identified by notification.type === 'SYSTEM_ANNOUNCEMENT' with data.type containing 'OWNER_APPLICATION'
    if (
      (notificationData.type === 'OWNER_APPLICATION_SUBMITTED' ||
        notificationData.type === 'OWNER_APPLICATION_RESUBMITTED') &&
      notificationData.userId
    ) {
      return '/admin/owners'
    }

    // KYC submission notification (if exists)
    if (notificationData.type === 'KYC_SUBMITTED' && notificationData.userId) {
      return '/admin/kyc'
    }

    return null
  }

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    const route = getNotificationRoute(notification)

    // Mark as read if unread
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id)
    }

    // Navigate to appropriate route if available
    if (route) {
      setOpen(false)
      navigate({ to: route })
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount && unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-semibold bg-orange-600">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0" forceMount>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <h3 className="font-semibold">Thông báo</h3>
            {unreadCount && unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-2 text-xs">
                {unreadCount} mới
              </Badge>
            )}
          </div>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="h-8 px-2 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Đọc tất cả
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-sm text-gray-500">Không có thông báo</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const isUnread = !notification.isRead
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-muted/50 transition-colors cursor-pointer',
                      isUnread && 'bg-orange-50/50',
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4
                                className={cn(
                                  'text-sm font-semibold truncate',
                                  isUnread ? 'text-gray-900' : 'text-gray-700',
                                )}
                              >
                                {notification.title}
                              </h4>
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0"></span>
                              )}
                            </div>
                            <p
                              className={cn(
                                'text-sm mb-1 line-clamp-2',
                                isUnread ? 'text-gray-800' : 'text-gray-600',
                              )}
                            >
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleString(
                                'vi-VN',
                                {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isUnread && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsReadMutation.mutate(notification.id)
                                }}
                                title="Đánh dấu đã đọc"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteMutation.mutate(notification.id)
                              }}
                              title="Xóa"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            className="w-full justify-center text-sm"
            onClick={() => {
              setOpen(false)
              navigate({ to: '/admin/notifications' })
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Xem tất cả thông báo
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
