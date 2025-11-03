import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  // registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  LoginInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  // RegisterInput,
} from '@/schemas/auth.schema'

/**
 * Hook cho form đăng ký
 */
// export function useRegisterForm() {
//   const form = useForm<RegisterInput>({
//     resolver: zodResolver(registerSchema),
//     defaultValues: {
//       email: '',
//       password: '',
//       phone: '',
//       role: 'RENTER',
//     },
//     mode: 'onChange',
//   })

//   return form
// }

/**
 * Hook cho form đăng nhập
 */
export function useLoginForm() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  })

  return form
}

/**
 * Hook cho form đổi mật khẩu
 */
export function useChangePasswordForm() {
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  })

  return form
}

/**
 * Hook cho form quên mật khẩu
 */
export function useForgotPasswordForm() {
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
  })

  return form
}

/**
 * Hook cho form đặt lại mật khẩu
 */
export function useResetPasswordForm() {
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      otpCode: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  })

  return form
}
