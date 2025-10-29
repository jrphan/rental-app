import { apiClient } from "./api";
import { LoginInput, RegisterInput } from "@/schemas/auth.schema";

/**
 * Auth API response types
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    phone?: string;
    role: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  message: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

/**
 * Auth API service
 */
export const authApi = {
  /**
   * Đăng ký tài khoản mới (không tự động đăng nhập)
   */
  async register(data: RegisterInput): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      "/auth/register",
      data
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Đăng ký thất bại");
  },

  /**
   * Xác thực OTP
   */
  async verifyOTP(userId: string, otpCode: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/verify-otp", {
      userId,
      otpCode,
    });
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Xác thực OTP thất bại");
  },

  /**
   * Gửi lại OTP
   */
  async resendOTP(userId: string): Promise<void> {
    const response = await apiClient.post("/auth/resend-otp", { userId });
    if (!response.success) {
      throw new Error(response.message || "Gửi lại OTP thất bại");
    }
  },

  /**
   * Đăng nhập
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", data);
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Đăng nhập thất bại");
  },

  /**
   * Lấy thông tin user hiện tại
   */
  async getMe(): Promise<AuthResponse["user"]> {
    const response = await apiClient.get<AuthResponse["user"]>("/auth/me");
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy thông tin thất bại");
  },

  /**
   * Đổi mật khẩu
   */
  async changePassword(data: {
    oldPassword: string;
    newPassword: string;
  }): Promise<void> {
    const response = await apiClient.put("/auth/change-password", data);
    if (!response.success) {
      throw new Error(response.message || "Đổi mật khẩu thất bại");
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>(
      "/auth/refresh",
      {
        refreshToken,
      }
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Refresh token thất bại");
  },

  /**
   * Quên mật khẩu - gửi OTP
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      { email }
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Gửi OTP thất bại");
  },

  /**
   * Đặt lại mật khẩu bằng OTP
   */
  async resetPassword(
    email: string,
    otpCode: string,
    newPassword: string
  ): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/auth/reset-password",
      {
        email,
        otpCode,
        newPassword,
      }
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Đặt lại mật khẩu thất bại");
  },
};
