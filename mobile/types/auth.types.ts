import { User } from "@/store/auth";

export interface RegisterResponse {
  userId: string;
  message: string;
}

export interface VerifyOtpResponse {
  message: string;
}

export interface ResendOtpResponse {
  message: string;
}

export interface LoginResponse {
  message?: string;
  userId?: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginWithNoVerifyPhoneResponse {
  message?: string;
  userId?: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface VerifyResetPasswordResponse {
  message: string;
}

export interface ChangePasswordResponse {
  message: string;
}
