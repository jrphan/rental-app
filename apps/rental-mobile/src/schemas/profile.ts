import { z } from "zod";

export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "Tên không được để trống"),
  lastName: z.string().min(1, "Họ không được để trống"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional().refine(
    (val) => !val || /^\d{9,11}$/.test(val.replace(/\D/g, "")),
    "Số điện thoại phải có 9-11 chữ số"
  ),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, "Vui lòng nhập tên"),
  lastName: z.string().min(1, "Vui lòng nhập họ"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string(),
  phone: z.string().min(10, "Số điện thoại phải có ít nhất 10 số"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
