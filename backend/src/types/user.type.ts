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
      status: true,
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
