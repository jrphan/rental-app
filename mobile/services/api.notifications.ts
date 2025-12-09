import { apiClient } from "@/lib/api";

export type NotificationType =
  | "RENTAL_REQUEST"
  | "RENTAL_CONFIRMED"
  | "RENTAL_CANCELLED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "REVIEW_RECEIVED"
  | "MESSAGE_RECEIVED"
  | "SYSTEM_ANNOUNCEMENT"
  | "DISPUTE_CREATED"
  | "DISPUTE_RESOLVED";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedNotifications {
  data: Notification[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const notificationsApi = {
  async getMyNotifications(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  }): Promise<PaginatedNotifications> {
    const s = new URLSearchParams();
    if (params?.page) s.set("page", String(params.page));
    if (params?.limit) s.set("limit", String(params.limit));
    if (params?.isRead !== undefined) s.set("isRead", String(params.isRead));

    const res = await apiClient.get<Notification[]>(
      `/notifications${s.toString() ? `?${s.toString()}` : ""}`
    );
    if (res.success && res.data && (res as any).pagination) {
      const pagination = (res as any).pagination;
      // Ensure data is an array and flatten if nested
      let notifications: Notification[] = [];
      const responseData = res.data as any;
      if (Array.isArray(responseData)) {
        // Check if it's a nested array
        if (responseData.length > 0 && Array.isArray(responseData[0])) {
          notifications = responseData.flat() as Notification[];
        } else {
          notifications = responseData as Notification[];
        }
      }
      return {
        data: notifications,
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
      };
    }
    throw new Error(res.message || "Lấy danh sách thông báo thất bại");
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<{ count: number }>(
      "/notifications/unread-count"
    );
    if (res.success && res.data) {
      // Handle both single object and array response
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      return data?.count || 0;
    }
    throw new Error(res.message || "Lấy số lượng thông báo chưa đọc thất bại");
  },

  async markAsRead(notificationId: string) {
    const res = await apiClient.post(`/notifications/${notificationId}/read`);
    if (res.success) return;
    throw new Error(res.message || "Đánh dấu đã đọc thất bại");
  },

  async markAllAsRead() {
    const res = await apiClient.post("/notifications/read-all");
    if (res.success) return;
    throw new Error(res.message || "Đánh dấu tất cả đã đọc thất bại");
  },

  async delete(notificationId: string) {
    const res = await apiClient.delete(`/notifications/${notificationId}`);
    if (res.success) return;
    throw new Error(res.message || "Xóa thông báo thất bại");
  },
};
