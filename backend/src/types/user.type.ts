import { Prisma } from '@prisma/client';

export const selectGetUserInfo: Prisma.UserSelect = {
  id: true,
  phone: true,
  email: true,
  fullName: true,
  role: true,
  isPhoneVerified: true,
  avatar: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
};

export type GetUserInfoResponse = Prisma.UserGetPayload<{
  select: typeof selectGetUserInfo;
}>;
