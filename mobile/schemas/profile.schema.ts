import { z } from "zod";
/**
 * Schema đơn giản cho màn Edit Profile (avatar, fullName, email)
 */
export const editProfileSchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ và tên"),
  email: z
    .string()
    .email("Email không hợp lệ")
    .or(z.literal("")) // cho phép ""
    .optional(),
  avatar: z
    .string()
    .url("URL avatar không hợp lệ")
    .or(z.literal("")) // cho phép ""
    .optional(),
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;
/**
 * Schema cho form KYC cơ bản (frontend)
 * Map đơn giản vào các field quan trọng của model Kyc
 */
export const kycFormSchema = z.object({
  citizenId: z
    .string()
    .min(1, "Số CMND/CCCD không được để trống")
    .max(20, "Số CMND/CCCD quá dài"),
  fullNameInId: z
    .string()
    .min(1, "Họ tên theo CMND/CCCD không được để trống")
    .max(100, "Họ tên theo CMND/CCCD quá dài"),
  dob: z.string().min(1, "Ngày sinh không được để trống"),
  addressInId: z
    .string()
    .min(1, "Địa chỉ trong CMND/CCCD không được để trống")
    .max(200, "Địa chỉ trong CMND/CCCD quá dài"),
  driverLicense: z
    .string()
    .max(50, "Số GPLX quá dài")
    .optional()
    .or(z.literal("")),
  licenseType: z.enum(["A1", "A2", "A3", "A4"]).optional().or(z.literal("")),
  idCardFront: z.string().url("URL không hợp lệ"),
  idCardBack: z.string().url("URL không hợp lệ"),
  licenseFront: z.string().url("URL không hợp lệ"),
  licenseBack: z.string().url("URL không hợp lệ"),
  selfieImg: z.string().url("URL không hợp lệ"),
});

export type KycFormInput = z.infer<typeof kycFormSchema>;
