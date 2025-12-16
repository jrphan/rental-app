import { Prisma } from '@prisma/client';

export const selectUserFile: Prisma.UserFileSelect = {
  id: true,
  userId: true,
  key: true,
  url: true,
  size: true,
  contentType: true,
  folder: true,
  createdAt: true,
};

export type UserFileResponse = Prisma.UserFileGetPayload<{
  select: typeof selectUserFile;
}>;
