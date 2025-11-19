import { z } from "zod";

/**
 * Schema cho cập nhật profile
 */
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "Họ không được để trống").max(50, "Họ quá dài"),
  lastName: z.string().min(1, "Tên không được để trống").max(50, "Tên quá dài"),
  avatar: z.string().url("URL avatar không hợp lệ").optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  bio: z.string().max(500, "Giới thiệu quá dài").optional().or(z.literal("")),
  address: z.string().max(200, "Địa chỉ quá dài").optional().or(z.literal("")),
  cityId: z.string().optional().or(z.literal("")),
  zipCode: z.string().max(10, "Mã bưu điện quá dài").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Schema cho KYC submission
 */
export const kycSubmissionSchema = z.object({
  idNumber: z.string().max(20, "Số CMND/CCCD quá dài").optional().or(z.literal("")),
  idCardFrontUrl: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  idCardBackUrl: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  driverLicenseUrl: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  selfieUrl: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  notes: z.string().max(500, "Ghi chú quá dài").optional().or(z.literal("")),
});

export type KycSubmissionInput = z.infer<typeof kycSubmissionSchema>;

