import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email")
    .email("Email không hợp lệ"),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu cũ"),
    newPassword: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu mới")
      .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmPassword: z
      .string()
      .min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Xác nhận mật khẩu không khớp",
    path: ["confirmPassword"],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "Mật khẩu mới không được trùng mật khẩu cũ",
    path: ["newPassword"],
  });

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Vui lòng nhập email")
      .email("Email không hợp lệ"),
    password: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu")
      .min(6, "Ít nhất 6 ký tự"),
    confirmPassword: z
      .string()
      .min(1, "Vui lòng nhập lại mật khẩu"),
    firstName: z
      .string()
      .min(1, "Vui lòng nhập tên"),
    lastName: z
      .string()
      .min(1, "Vui lòng nhập họ"),
    phone: z
      .string()
      .min(1, "Vui lòng nhập số điện thoại")
      .regex(/^[0-9+\-\s()]+$/, "Số điện thoại không hợp lệ"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
