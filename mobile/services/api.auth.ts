import {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
} from "@/schemas/auth.schema";
import API_ENDPOINTS from "./api.endpoints";
import { apiClient } from "@/lib/api";
import {
  RegisterResponse,
  ForgotPasswordResponse,
  VerifyOtpResponse,
  LoginResponse,
  VerifyResetPasswordResponse,
} from "@/types/auth.types";

export const authApi = {
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

  async verifyOTP(userId: string, otpCode: string): Promise<VerifyOtpResponse> {
    const response = await apiClient.post<VerifyOtpResponse>(
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

  async resendOTP(userId: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.RESEND_OTP,
      {
        userId,
      }
    );

    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Gửi lại OTP thất bại");
  },

  async login(data: LoginInput): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      data
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Đăng nhập thất bại");
  },

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

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.REFRESH,
      {
        refreshToken,
      }
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Refresh token thất bại");
  },

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

  async resetPassword(
    phone: string,
    otpCode: string,
    newPassword: string
  ): Promise<VerifyResetPasswordResponse> {
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

  async updateProfile(
    data: Partial<Pick<LoginResponse["user"], "fullName" | "email" | "avatar">>
  ): Promise<LoginResponse["user"]> {
    const response = await apiClient.put<LoginResponse["user"]>(
      API_ENDPOINTS.USER.UPDATE_PROFILE,
      data
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Cập nhật hồ sơ thất bại");
  },

  async submitKyc(data: any): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.USER.SUBMIT_KYC,
      data
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Gửi KYC thất bại");
  },

  async logout(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.LOGOUT
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Đăng xuất thất bại");
  },
};
