import { useEffect, useState } from 'react'
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth'
import ROUTES from '@/constants/routes'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_protect')({
  component: ProtectedLayoutComponent,
})

function ProtectedLayoutComponent() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for Zustand persist to hydrate from localStorage
  useEffect(() => {
    // Only check on client-side
    if (typeof window === 'undefined') {
      return
    }

    // Check if store has been hydrated by checking localStorage
    const checkHydration = () => {
      try {
        const stored = localStorage.getItem('auth-storage')
        if (stored) {
          // Nếu trong localStorage đã có state (sau khi login),
          // chủ động nạp lại vào Zustand để tránh case F5 bị mất phiên.
          try {
            const parsed = JSON.parse(stored)
            const state = parsed?.state
            if (state?.user && state?.token) {
              // Dùng login để đồng bộ đầy đủ cache + isAuthenticated
              useAuthStore.getState().login(state.user, {
                accessToken: state.token,
                refreshToken: state.refreshToken ?? undefined,
                expiresAt: state.expiresAt ?? undefined,
              })
            }
          } catch {
            // ignore parse error
          }

          // Store has data, wait a bit for Zustand to hydrate it
          setTimeout(() => {
            setIsHydrated(true)
          }, 0)
        } else {
          // No stored data, consider it hydrated (no auth state)
          setIsHydrated(true)
        }
      } catch {
        // localStorage not available, consider hydrated
        setIsHydrated(true)
      }
    }

    checkHydration()
    // Fallback: always set hydrated after a short delay
    const timer = setTimeout(() => setIsHydrated(true), 200)
    return () => clearTimeout(timer)
  }, [])

  // Check auth after hydration
  useEffect(() => {
    if (!isHydrated) return

    if (!isAuthenticated || !user) {
      navigate({ to: ROUTES.LOGIN, replace: true })
      return
    }

    const role = user.role
    if (role !== 'ADMIN' && role !== 'SUPPORT') {
      navigate({ to: ROUTES.LOGIN, replace: true })
      return
    }
  }, [isHydrated, isAuthenticated, user, navigate])

  // Show loading state while waiting for store hydration - prevents 404 flash on F5
  // Always render something so router knows route exists
  if (!isHydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  // Check role - show loading if invalid (will redirect)
  if (user.role !== 'ADMIN' && user.role !== 'SUPPORT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <Separator />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
