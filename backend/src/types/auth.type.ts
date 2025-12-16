import { Prisma } from '@prisma/client';

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

export const selectLoginUser: Prisma.UserSelect = {
  id: true,
  phone: true,
  email: true,
  fullName: true,
  avatar: true,
  isActive: true,
  isPhoneVerified: true,
  role: true,
  isVendor: true,
  stripeAccountId: true,
  stripeStatus: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  kyc: {
    select: {
      id: true,
      status: true,
      reviewedBy: true,
      reviewedAt: true,
    },
  },
};

export type LoginUserResponse = Prisma.UserGetPayload<{
  select: typeof selectLoginUser;
}>;

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: LoginUserResponse;
}

// Dùng riêng cho endpoint refresh token để tránh nhầm lẫn với login
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: LoginUserResponse;
}

export interface LoginWithNoVerifyPhoneResponse {
  message: string;
  userId: string;
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
