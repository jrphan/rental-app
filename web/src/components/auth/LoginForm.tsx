import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { loginSchema, type LoginInput } from '@/schemas/auth.schema'
import { useLogin } from '@/hooks/auth/auth.mutation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import ROUTES from '@/constants/routes'

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
    mode: 'onSubmit',
  })
  const loginMutation = useLogin()

  const onSubmit = async (data: LoginInput) => {
    setError(null)
    try {
      await loginMutation.mutateAsync(data)
      // Wait a bit to ensure Zustand store state is fully updated before navigation
      // Use TanStack Router navigate instead of window.location to avoid full page reload
      setTimeout(() => {
        navigate({ to: ROUTES.HOME, replace: true })
      }, 100)
      onSuccess?.()
    } catch (err: any) {
      // Extract error message from ApiError or Error object
      const errorMessage =
        err?.message ||
        err?.error ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      setError(errorMessage)
      form.resetField('password') // Clear password on error
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Phone Input */}
        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại</Label>
          <Controller
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  autoComplete="tel"
                  aria-invalid={!!fieldState.error}
                  {...field}
                />
                {fieldState.error && (
                  <p className="mt-1 text-sm text-destructive" role="alert">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <PasswordInput
                id="password"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Đang đăng nhập...
            </span>
          ) : (
            'Đăng nhập'
          )}
        </Button>
      </form>
    </div>
  )
}
