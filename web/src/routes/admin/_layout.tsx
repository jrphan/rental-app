import { createFileRoute, Outlet, useNavigate, redirect, useLocation, Link } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { authStore, authActions } from '@/store/auth'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  FileCheck,
  LogOut,
  User,
  Car,
  Menu,
  Search,
  Bell,
  Settings,
  Shield,
  Users,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

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

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'Quản lý KYC',
    href: '/admin/kyc',
    icon: FileCheck,
    badge: null,
  },
  {
    name: 'Quản lý Chủ xe',
    href: '/admin/owners',
    icon: Users,
    badge: null,
  },
  {
    name: 'Quản lý Xe',
    href: '/admin/vehicles',
    icon: Car,
    badge: null,
  },
  {
    name: 'Thông báo',
    href: '/admin/notifications',
    icon: Bell,
    badge: null,
  },
]

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const authState = useStore(authStore)
  const user = authState.user

  const handleLogout = () => {
    authActions.logout()
    navigate({ to: '/admin/login' })
  }

  // Show loading while verifying auth
  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Đang xác thực...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar user={user} onLogout={handleLogout} />
        <main className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm..."
                  className="w-full pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                  3
                </Badge>
              </Button>

              {/* Settings */}
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Settings className="h-4 w-4" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 gap-2 px-2 hover:bg-muted"
                  >
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold">
                        {user?.email?.charAt(0).toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden flex-col items-start text-left md:flex">
                      <span className="text-sm font-medium leading-none">
                        {user?.email?.split('@')[0] || 'Admin'}
                      </span>
                      <span className="text-xs leading-none text-muted-foreground">
                        Admin
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-2 p-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold">
                            {user?.email?.charAt(0).toUpperCase() || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user?.email}
                          </p>
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs leading-none text-muted-foreground">
                              Quản trị viên
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Hồ sơ</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Cài đặt</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8 overflow-y-auto">
            <div className="animate-in fade-in-0 duration-200">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

function AppSidebar({
  user,
  onLogout,
}: {
  user: { email?: string } | null
  onLogout: () => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isMobile } = useSidebar()

  return (
    <Sidebar variant="inset" className="border-r">
      <SidebarContent className="gap-2">
        {/* Logo/Brand Section */}
        <SidebarGroup className="px-3 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight">Admin Panel</span>
              <span className="text-xs text-muted-foreground">Quản lý hệ thống</span>
            </div>
          </div>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup className="px-2 py-2">
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-1">
              {navigation.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  location.pathname.startsWith(item.href + '/')
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.name}
                      size="lg"
                      className="group relative rounded-lg transition-all hover:bg-sidebar-accent/50 data-[active=true]:bg-sidebar-accent data-[active=true]:shadow-sm w-full"
                      onClick={() => navigate({ to: item.href })}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{item.name}</span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="ml-auto h-5 px-2 text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Section */}
      <SidebarGroup className="px-2 py-4 border-t">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                className="rounded-lg hover:bg-sidebar-accent/50"
              >
                <div className="flex items-center gap-3 px-2 py-2">
                  <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold">
                      {user?.email?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {user?.email?.split('@')[0] || 'Admin'}
                    </p>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground truncate">
                        Quản trị viên
                      </p>
                    </div>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </Sidebar>
  )
}
