import { apiClient } from "@/lib/api";

export type MessageType = "TEXT" | "IMAGE" | "LOCATION" | "SYSTEM";

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  rentalId?: string | null;
  content: string;
  type: MessageType;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string | null;
      lastName?: string | null;
      avatarUrl?: string | null;
    } | null;
  };
  receiver?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string | null;
      lastName?: string | null;
      avatarUrl?: string | null;
    } | null;
  };
}

export interface Conversation {
  userId: string;
  user: {
    id: string;
    email: string;
    profile?: {
      firstName?: string | null;
      lastName?: string | null;
      avatarUrl?: string | null;
    } | null;
  };
  lastMessage?: Message | null;
  unreadCount: number;
}

export interface PaginatedMessages {
  data: Message[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedConversations {
  data: Conversation[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const messagesApi = {
  async sendMessage(data: {
    receiverId: string;
    rentalId?: string;
    content: string;
    type?: MessageType;
  }): Promise<Message> {
    const res = await apiClient.post<Message>("/messages", data);
    if (res.success && res.data && !Array.isArray(res.data)) return res.data;
    throw new Error(res.message || "Gửi tin nhắn thất bại");
  },

  async getConversations(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedConversations> {
    const s = new URLSearchParams();
    if (params?.page) s.set("page", String(params.page));
    if (params?.limit) s.set("limit", String(params.limit));

    const res = await apiClient.get<Conversation[]>(
      `/messages/conversations${s.toString() ? `?${s.toString()}` : ""}`
    );
    if (res.success && res.data && (res as any).pagination) {
      const pagination = (res as any).pagination;
      return {
        data: res.data as Conversation[],
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
      };
    }
    throw new Error(res.message || "Lấy danh sách cuộc trò chuyện thất bại");
  },

  async getMessages(
    userId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedMessages> {
    const s = new URLSearchParams();
    if (params?.page) s.set("page", String(params.page));
    if (params?.limit) s.set("limit", String(params.limit));

    const res = await apiClient.get<Message[]>(
      `/messages/${userId}${s.toString() ? `?${s.toString()}` : ""}`
    );
    if (res.success && res.data && (res as any).pagination) {
      const pagination = (res as any).pagination;
      return {
        data: res.data as Message[],
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
      };
    }
    throw new Error(res.message || "Lấy danh sách tin nhắn thất bại");
  },

  async markAsRead(messageId: string) {
    const res = await apiClient.post(`/messages/${messageId}/read`);
    if (res.success) return;
    throw new Error(res.message || "Đánh dấu đã đọc thất bại");
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<{ count: number }>(
      "/messages/unread-count"
    );
    if (res.success && res.data) {
      return (res.data as { count: number }).count;
    }
    throw new Error(res.message || "Lấy số lượng tin nhắn chưa đọc thất bại");
  },
};
