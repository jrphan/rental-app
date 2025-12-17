import { useEffect, useState, ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth'
import ROUTES from '@/constants/routes'
import { AdminHeader } from './AdminHeader'
import { AdminSidebar } from './AdminSidebar'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

interface ProtectedLayoutProps {
  children: ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Client-side auth check (runs after store hydration)
  useEffect(() => {
    const checkAuth = () => {
      const authState = useAuthStore.getState()

      if (!authState.isAuthenticated || !authState.user) {
        console.log('Not authenticated, redirecting to login...')
        navigate({ to: ROUTES.LOGIN, replace: true })
        return
      }

      const role = authState.user.role
      if (role !== 'ADMIN' && role !== 'SUPPORT') {
        console.log('Invalid role, redirecting to login...')
        navigate({ to: ROUTES.LOGIN, replace: true })
        return
      }

      setIsAuthorized(true)
      setIsChecking(false)
    }

    // Small delay to ensure Zustand persist has rehydrated
    const timer = setTimeout(checkAuth, 50)
    return () => clearTimeout(timer)
  }, [navigate])

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  // Show nothing if not authorized (will redirect)
  if (!isAuthorized || !user) {
    return null
  }

  // Check role
  if (user.role !== 'ADMIN' && user.role !== 'SUPPORT') {
    return null
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <Separator />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

