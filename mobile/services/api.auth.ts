import { apiClient } from "@/lib/api";
import {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
} from "@/schemas/auth.schema";
import API_ENDPOINTS from "./api.endpoints";

/**
 * Auth API response types
 */
export interface AuthResponse {
  user: {
    id: string;
    phone: string;
    email?: string | null;
    fullName?: string | null;
    role: string;
    isActive: boolean;
    isPhoneVerified: boolean;
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
      API_ENDPOINTS.AUTH.REGISTER,
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
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      {
        userId,
        otpCode,
      }
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Xác thực OTP thất bại");
  },

  /**
   * Gửi lại OTP
   */
  async resendOTP(userId: string): Promise<void> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_OTP, {
      userId,
    });
    if (!response.success) {
      throw new Error(response.message || "Gửi lại OTP thất bại");
    }
  },

  /**
   * Đăng nhập
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      data
    );
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
  async changePassword(
    data: Omit<ChangePasswordInput, "confirmPassword">
  ): Promise<void> {
    const response = await apiClient.post(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      data
    );
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
  async forgotPassword(
    data: ForgotPasswordInput
  ): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      data
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
    phone: string,
    otpCode: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.VERIFY_RESET_PASSWORD,
      {
        phone,
        otpCode,
        password: newPassword,
      }
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Đặt lại mật khẩu thất bại");
  },

  /**
   * Gửi OTP qua SMS để xác minh số điện thoại
   */
  async sendPhoneOTP(phone: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      "/auth/phone/send-otp",
      { phone }
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Gửi OTP thất bại");
  },

  /**
   * Xác minh OTP từ SMS
   */
  async verifyPhoneOTP(
    phone: string,
    otpCode: string
  ): Promise<{ message: string; isPhoneVerified: boolean }> {
    const response = await apiClient.post<{
      message: string;
      isPhoneVerified: boolean;
    }>("/auth/phone/verify-otp", {
      phone,
      otpCode,
    });
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Xác minh OTP thất bại");
  },

  /**
   * Gửi lại OTP qua SMS
   */
  async resendPhoneOTP(phone: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      "/auth/phone/resend-otp",
      { phone }
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Gửi lại OTP thất bại");
  },
};
