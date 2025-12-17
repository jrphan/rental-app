import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuthStore } from '@/store/auth'
import ROUTES from '@/constants/routes'

export function LoginPage() {
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)

  // Wait for store to be hydrated before checking auth
  useEffect(() => {
    // Small delay to ensure Zustand persist has rehydrated
    const timer = setTimeout(() => {
      const authState = useAuthStore.getState()
      console.log('LoginPage - authState after hydration:', authState)

      if (authState.isAuthenticated && authState.user) {
        const role = authState.user.role
        console.log('User is authenticated with role:', role)
        if (role === 'ADMIN' || role === 'SUPPORT') {
          console.log('Redirecting to home...')
          navigate({ to: ROUTES.HOME, replace: true })
          return
        }
      }
      setIsChecking(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [navigate])

  // Show nothing while checking (prevents flash of login page)
  if (isChecking) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-100 via-white to-orange-100 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập</h1>
          <p className="text-gray-600">Hệ thống quản trị cho thuê xe máy</p>
          <p className="text-sm text-gray-500 mt-2">
            Chỉ dành cho quản trị viên và nhân viên hỗ trợ
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />
      </div>
    </div>
  )
}
