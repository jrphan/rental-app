import API_ENDPOINTS from './api.endpoints'
import { apiClient } from '@/lib/api'

export type NotificationType =
  | 'SYSTEM'
  | 'PROMOTION'
  | 'RENTAL_UPDATE'
  | 'PAYMENT'
  | 'KYC_UPDATE'

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  data?: Record<string, any>
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface NotificationListResponse {
  items: Notification[]
  total: number
}

export interface UnreadCountResponse {
  count: number
}

export const apiNotification = {
  async getNotifications(options?: {
    isRead?: boolean
    limit?: number
    offset?: number
  }): Promise<NotificationListResponse> {
    const params: Record<string, string> = {}
    if (options?.isRead !== undefined) {
      params.isRead = String(options.isRead)
    }
    if (options?.limit) {
      params.limit = String(options.limit)
    }
    if (options?.offset) {
      params.offset = String(options.offset)
    }

    const response = await apiClient.get<NotificationListResponse>(
      API_ENDPOINTS.USER.GET_NOTIFICATIONS,
      { params },
    )
    return response.data
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<UnreadCountResponse>(
      API_ENDPOINTS.USER.GET_UNREAD_NOTIFICATION_COUNT,
    )
    return response.data
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await apiClient.post<Notification>(
      API_ENDPOINTS.USER.MARK_NOTIFICATION_AS_READ(id),
    )
    return response.data
  },

  async markAllAsRead(): Promise<{ count: number }> {
    const response = await apiClient.post<{ count: number }>(
      API_ENDPOINTS.USER.MARK_ALL_NOTIFICATIONS_AS_READ,
    )
    return response.data
  },
}
