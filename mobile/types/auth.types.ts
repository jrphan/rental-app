export type UserRole = "USER" | "ADMIN" | "SUPPORT";
export type KycStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_UPDATE";

export interface Kyc {
  id: string;
  citizenId: string | null;
  fullNameInId: string | null;
  dob: string | null;
  addressInId: string | null;
  driverLicense: string | null;
  licenseType: string | null;
  idCardFront: string | null;
  idCardBack: string | null;
  licenseFront: string | null;
  licenseBack: string | null;
  selfieImg: string | null;
  status: KycStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface User {
  id: string;
  phone: string;
  email: string | null;
  fullName: string | null;
  avatar: string | null;
  isActive: boolean;
  isPhoneVerified: boolean;
  role: UserRole;
  isVendor: boolean;
  stripeAccountId: string | null;
  stripeStatus: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  kyc: Kyc | null;
}

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
