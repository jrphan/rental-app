import { Prisma } from '@prisma/client';

export const selectGetUserInfo: Prisma.UserSelect = {
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
      citizenId: true,
      fullNameInId: true,
      dob: true,
      addressInId: true,
      driverLicense: true,
      licenseType: true,
      idCardFront: true,
      idCardBack: true,
      licenseFront: true,
      licenseBack: true,
      selfieImg: true,
      status: true,
      rejectionReason: true,
      reviewedBy: true,
      reviewedAt: true,
    },
  },
};

export type GetUserInfoResponse = Prisma.UserGetPayload<{
  select: typeof selectGetUserInfo;
}>;

export type UpdateProfileResponse = GetUserInfoResponse;

export interface SubmitKycResponse {
  message: string;
}

export const selectAdminUser: Prisma.UserSelect = {
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
      rejectionReason: true,
      reviewedAt: true,
    },
  },
};

export type AdminUserItem = Prisma.UserGetPayload<{
  select: typeof selectAdminUser;
}>;

export interface AdminUserListResponse {
  items: AdminUserItem[];
  total: number;
  page: number;
  limit: number;
}

export const selectAdminKycUser = {
  id: true,
  phone: true,
  email: true,
  fullName: true,
} satisfies Prisma.UserSelect;

export const selectAdminKyc = {
  id: true,
  citizenId: true,
  fullNameInId: true,
  dob: true,
  addressInId: true,
  driverLicense: true,
  licenseType: true,
  idCardFront: true,
  idCardBack: true,
  licenseFront: true,
  licenseBack: true,
  selfieImg: true,
  status: true,
  rejectionReason: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: selectAdminKycUser,
  },
} satisfies Prisma.KycSelect;

export type AdminKycItem = Prisma.KycGetPayload<{
  select: typeof selectAdminKyc;
}>;

export interface AdminKycListResponse {
  items: AdminKycItem[];
  total: number;
  page: number;
  limit: number;
}

export type AdminKycDetailResponse = AdminKycItem;

export interface AdminKycActionResponse {
  message: string;
}
