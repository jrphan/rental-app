import { apiClient } from "@/lib/api";
import API_ENDPOINTS from "./api.endpoints";

export type NotificationType =
  | "SYSTEM"
  | "PROMOTION"
  | "RENTAL_UPDATE"
  | "PAYMENT"
  | "KYC_UPDATE";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
}

export interface UnreadCountResponse {
  count: number;
}

export const apiNotification = {
  async getNotifications(options?: {
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<NotificationListResponse> {
    const params: Record<string, string> = {};
    if (options?.isRead !== undefined) {
      params.isRead = String(options.isRead);
    }
    if (options?.limit) {
      params.limit = String(options.limit);
    }
    if (options?.offset) {
      params.offset = String(options.offset);
    }

    const response = await apiClient.get<NotificationListResponse>(
      API_ENDPOINTS.USER.GET_NOTIFICATIONS,
      { params }
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy danh sách thông báo thất bại");
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<UnreadCountResponse>(
      API_ENDPOINTS.USER.GET_UNREAD_NOTIFICATION_COUNT
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(
      response.message || "Lấy số lượng thông báo chưa đọc thất bại"
    );
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await apiClient.post<Notification>(
      API_ENDPOINTS.USER.MARK_NOTIFICATION_AS_READ.replace(":id", id)
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Đánh dấu đã đọc thất bại");
  },

  async markAllAsRead(): Promise<{ count: number }> {
    const response = await apiClient.post<{ count: number }>(
      API_ENDPOINTS.USER.MARK_ALL_NOTIFICATIONS_AS_READ
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Đánh dấu tất cả đã đọc thất bại");
  },

  async registerDeviceToken(data: {
    token: string;
    platform: string;
    deviceId?: string;
  }): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.USER.REGISTER_DEVICE_TOKEN,
      data
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Đăng ký device token thất bại");
  },
};
