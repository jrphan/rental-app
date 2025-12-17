import { z } from 'zod'

const passwordRules = z
  .string()
  .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
  )

const phoneRules = z
  .string()
  .min(1, 'Vui lòng nhập số điện thoại')
  .regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ')

export const registerSchema = z.object({
  phone: phoneRules,
  password: passwordRules,
})

export const loginSchema = z.object({
  phone: phoneRules,
  password: passwordRules,
})

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu cũ'),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
      ),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  phone: phoneRules,
})

export const resetPasswordSchema = z
  .object({
    phone: phoneRules,
    otpCode: z.string().length(6, 'Mã OTP phải có 6 chữ số'),
    newPassword: passwordRules,
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

