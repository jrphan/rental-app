import { apiNotification, type Notification } from '@/services/api.notification'
import { CheckCircle, Info, AlertCircle, CreditCard, Bell } from 'lucide-react'

interface NotificationListProps {
  notifications: Notification[]
  isLoading: boolean
  onMarkAsRead: (id: string) => void
  formatTime: (dateString: string) => string
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'KYC_UPDATE':
      return CheckCircle
    case 'PAYMENT':
      return CreditCard
    case 'RENTAL_UPDATE':
      return Bell
    case 'SYSTEM':
      return Info
    case 'PROMOTION':
      return AlertCircle
    default:
      return Bell
  }
}

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'KYC_UPDATE':
      return 'text-green-600 bg-green-50'
    case 'PAYMENT':
      return 'text-blue-600 bg-blue-50'
    case 'RENTAL_UPDATE':
      return 'text-purple-600 bg-purple-50'
    case 'SYSTEM':
      return 'text-gray-600 bg-gray-50'
    case 'PROMOTION':
      return 'text-orange-600 bg-orange-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  formatTime,
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Bell className="w-12 h-12 mb-4 text-gray-400" />
        <p>Không có thông báo nào</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => {
        const Icon = getNotificationIcon(notification.type)
        const colorClass = getNotificationColor(notification.type)

        return (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border transition-colors ${
              notification.isRead
                ? 'bg-white border-gray-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3
                      className={`text-sm font-semibold mb-1 ${
                        notification.isRead
                          ? 'text-gray-900'
                          : 'text-gray-900 font-bold'
                      }`}
                    >
                      {notification.title}
                    </h3>
                    <p
                      className={`text-sm mb-2 ${
                        notification.isRead ? 'text-gray-600' : 'text-gray-700'
                      }`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>

                  {!notification.isRead && (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className="flex-shrink-0 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}

                  {!notification.isRead && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-1" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

