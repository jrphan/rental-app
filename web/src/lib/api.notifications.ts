import { apiClient } from './api'

export type NotificationType =
  | 'RENTAL_REQUEST'
  | 'RENTAL_CONFIRMED'
  | 'RENTAL_CANCELLED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'REVIEW_RECEIVED'
  | 'MESSAGE_RECEIVED'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'DISPUTE_CREATED'
  | 'DISPUTE_RESOLVED'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: any
  isRead: boolean
  createdAt: string
}

export interface NotificationListResponse {
  data: Notification[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export const notificationsApi = {
  async getMyNotifications(
    page = 1,
    limit = 20,
    isRead?: boolean,
  ): Promise<NotificationListResponse> {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    if (isRead !== undefined) params.set('isRead', String(isRead))

    const res = await apiClient.get<Notification[]>(
      `/notifications?${params.toString()}`,
    )
    if (res.success && res.data && (res as any).pagination) {
      const pagination = (res as any).pagination
      return {
        data: res.data,
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
      }
    }
    throw new Error(res.message || 'Lấy danh sách thông báo thất bại')
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<{ count: number }>(
      '/notifications/unread-count',
    )
    if (res.success && res.data) {
      return res.data.count
    }
    throw new Error(res.message || 'Lấy số lượng thông báo chưa đọc thất bại')
  },

  async markAsRead(notificationId: string) {
    const res = await apiClient.post(`/notifications/${notificationId}/read`)
    if (res.success) return
    throw new Error(res.message || 'Đánh dấu đã đọc thất bại')
  },

  async markAllAsRead() {
    const res = await apiClient.post('/notifications/read-all')
    if (res.success) return
    throw new Error(res.message || 'Đánh dấu tất cả đã đọc thất bại')
  },

  async delete(notificationId: string) {
    const res = await apiClient.delete(`/notifications/${notificationId}`)
    if (res.success) return
    throw new Error(res.message || 'Xóa thông báo thất bại')
  },
}
