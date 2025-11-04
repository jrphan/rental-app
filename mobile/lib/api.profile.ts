import { apiClient } from "./api";

/**
 * Profile types
 */
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  bio?: string | null;
  address?: string | null;
  cityId?: string | null;
  zipCode?: string | null;
}

export interface UserWithProfile {
  id: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile | null;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  bio?: string;
  address?: string;
  cityId?: string;
  zipCode?: string;
  phone?: string;
}

export interface KycSubmissionInput {
  idNumber?: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  passportUrl?: string;
  driverLicenseUrl?: string;
  selfieUrl?: string;
  notes?: string;
}

/**
 * Profile API service
 */
export const profileApi = {
  /**
   * Lấy thông tin profile đầy đủ (User + UserProfile)
   */
  async getProfile(): Promise<UserWithProfile> {
    const response = await apiClient.get<UserWithProfile>("/auth/profile");
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy thông tin profile thất bại");
  },

  /**
   * Cập nhật thông tin profile
   */
  async updateProfile(data: UpdateProfileInput): Promise<UserWithProfile> {
    const response = await apiClient.put<UserWithProfile>(
      "/auth/profile",
      data
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Cập nhật profile thất bại");
  },

  /**
   * Gửi thông tin KYC để xác thực danh tính
   */
  async submitKYC(data: KycSubmissionInput): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      "/auth/profile/kyc",
      data
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Gửi KYC thất bại");
  },

  /**
   * Gửi yêu cầu đăng ký làm chủ xe
   */
  async submitOwnerApplication(notes?: string): Promise<{ id: string; status: string; notes?: string } | { message: string }> {
    const response = await apiClient.post<
      { id: string; status: string; notes?: string } | { message: string }
    >("/users/owner-application", { notes });
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Gửi yêu cầu thất bại");
  },

  /**
   * Lấy trạng thái yêu cầu làm chủ xe của tôi
   */
  async getMyOwnerApplication(): Promise<{ id: string; status: string; notes?: string } | null> {
    const response = await apiClient.get<
      { id: string; status: string; notes?: string } | null
    >("/users/owner-application/me");
    if (response.success) {
      return (response.data as any) ?? null;
    }
    throw new Error(response.message || "Lấy trạng thái yêu cầu thất bại");
  },
};

