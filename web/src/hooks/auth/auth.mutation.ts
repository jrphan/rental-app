import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/services/api.auth'
import { useAuthStore } from '@/store/auth'
import type { LoginInput } from '@/schemas/auth.schema'
import type {
  LoginResponse,
  LoginWithNoVerifyPhoneResponse,
} from '@/types/auth.types'
import type { ErrorResponse } from '@/types/response.types'

type ApiError = ErrorResponse

export function useLogin() {
  const login = useAuthStore((state) => state.login)

  return useMutation<
    LoginResponse | LoginWithNoVerifyPhoneResponse,
    ApiError,
    LoginInput
  >({
    mutationFn: async (data: LoginInput) => {
      const response = await authApi.login(data)

      // Check if response has userId (needs OTP verification)
      if ('userId' in response && response.userId) {
        const error: ApiError = {
          success: false,
          message:
            'Tài khoản chưa được xác thực. Vui lòng xác thực số điện thoại trước.',
          error: 'Phone verification required',
          timestamp: new Date().toISOString(),
          path: '/auth/login',
          statusCode: 403,
        }
        throw error
      }

      // Response should be LoginResponse with user data
      const userData = response as LoginResponse

      // Validate role - only ADMIN and SUPPORT can login to web
      if (userData.user.role !== 'ADMIN' && userData.user.role !== 'SUPPORT') {
        const error: ApiError = {
          success: false,
          message:
            'Chỉ quản trị viên và nhân viên hỗ trợ mới có thể đăng nhập vào hệ thống quản trị.',
          error: 'Invalid user role',
          timestamp: new Date().toISOString(),
          path: '/auth/login',
          statusCode: 403,
        }
        throw error
      }

      return response
    },
    onSuccess: (data) => {
      const userData = data as LoginResponse

      login(userData.user, {
        accessToken: userData.accessToken,
        refreshToken: userData.refreshToken,
      })
    },
    onError: (error: ApiError) => {
      // Error handling is done by the component
      console.error('Login error:', error)
    },
  })
}
