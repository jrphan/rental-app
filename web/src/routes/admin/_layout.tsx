import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { authStore } from '@/store/auth'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Header } from '@/components/admin/header'
import { AppSidebar } from '@/components/admin/sidebar'
import { PageContainer } from '@/components/admin/page-container'

export const Route = createFileRoute('/admin/_layout')({
  beforeLoad: () => {
    const authState = authStore.state
    // Wait for auth verification to complete
    if (authState.isLoading) {
      return
    }
    // If not authenticated, redirect to login
    if (!authState.isAuthenticated) {
      throw redirect({
        to: '/admin/login',
      })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const authState = useStore(authStore)
  const user = authState.user

  // Show loading while verifying auth
  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-muted-foreground">Đang xác thực...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar user={user} />
        <main className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
      </div>
    </SidebarProvider>
  )
}
