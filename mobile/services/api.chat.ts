import { apiClient } from "@/lib/api";
import API_ENDPOINTS from "./api.endpoints";

export interface ChatUser {
  id: string;
  fullName: string | null;
  avatar: string | null;
}

export interface ChatVehicle {
  id: string;
  brand: string;
  model: string;
  images: {
    id: string;
    url: string;
    isPrimary: boolean;
  }[];
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  sender: ChatUser;
}

export interface Chat {
  id: string;
  rentalId: string;
  otherUser: ChatUser;
  vehicle: ChatVehicle;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ChatDetail extends Chat {
  renter: ChatUser;
  owner: ChatUser;
  rental: {
    id: string;
    status: string;
    vehicle: ChatVehicle;
  };
}

export interface UnreadCountResponse {
  count: number;
}

export const apiChat = {
  async getMyChats(): Promise<Chat[]> {
    const response = await apiClient.get<Chat[]>(
      API_ENDPOINTS.CHAT.GET_MY_CHATS
    );
    if (response.success && response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    throw new Error(response.message || "Lấy danh sách chat thất bại");
  },

  async getChatDetail(chatId: string): Promise<ChatDetail> {
    const response = await apiClient.get<ChatDetail>(
      API_ENDPOINTS.CHAT.GET_CHAT_DETAIL.replace(":id", chatId)
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy chi tiết chat thất bại");
  },

  async getMessages(
    chatId: string,
    options?: { page?: number; limit?: number }
  ): Promise<ChatMessage[]> {
    const params: Record<string, string> = {};
    if (options?.page) {
      params.page = String(options.page);
    }
    if (options?.limit) {
      params.limit = String(options.limit);
    }

    const response = await apiClient.get<ChatMessage[]>(
      API_ENDPOINTS.CHAT.GET_MESSAGES.replace(":id", chatId),
      { params }
    );
    if (response.success && response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    throw new Error(response.message || "Lấy tin nhắn thất bại");
  },

  async sendMessage(chatId: string, content: string): Promise<ChatMessage> {
    const response = await apiClient.post<ChatMessage>(
      API_ENDPOINTS.CHAT.SEND_MESSAGE.replace(":id", chatId),
      { content }
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Gửi tin nhắn thất bại");
  },

  async markAsRead(chatId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(
      API_ENDPOINTS.CHAT.MARK_READ.replace(":id", chatId)
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Đánh dấu đã đọc thất bại");
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<UnreadCountResponse>(
      API_ENDPOINTS.CHAT.GET_UNREAD_COUNT
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy số tin nhắn chưa đọc thất bại");
  },
};
