import { apiClient } from "@/lib/api";

export type OwnerApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface OwnerApplication {
  id: string;
  userId: string;
  status: OwnerApplicationStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ownerApi = {
  /**
   * Submit owner application
   * Tự động submit khi có xe đầu tiên được duyệt, nhưng user có thể submit thủ công
   */
  async submitOwnerApplication(notes?: string) {
    const res = await apiClient.post<OwnerApplication>(
      "/users/owner-application",
      {
        notes,
      }
    );
    if (res.success && res.data && !Array.isArray(res.data)) return res.data;
    throw new Error(res.message || "Gửi đăng ký làm chủ xe thất bại");
  },

  /**
   * Get my owner application status
   */
  // async getMyOwnerApplication() {
  //   const res = await apiClient.get<OwnerApplication | null>(
  //     "/users/owner-application/me"
  //   );
  //   if (res.success) return res.data || null;
  //   throw new Error(res.message || "Lấy thông tin đăng ký làm chủ xe thất bại");
  // },
};
