import { useLocation, useNavigate } from '@tanstack/react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
// import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  FileCheck,
  Car,
  Users,
  Bell,
  Shield,
} from 'lucide-react'

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

interface AppSidebarProps {
  user: { email?: string } | null
}

export function AppSidebar({ user }: AppSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Sidebar variant="inset" className="border-r">
      <SidebarContent className="gap-2">
        {/* Logo/Brand Section */}
        <SidebarGroup className="px-3 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 shadow-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight">
                Admin Panel
              </span>
              <span className="text-xs text-muted-foreground">
                Quản lý hệ thống
              </span>
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
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-orange-500 text-white group-hover:bg-orange-600'
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
      {/* <SidebarGroup className="px-2 py-4 border-t">
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
                    <AvatarFallback className="bg-orange-500 text-white font-semibold">
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
      </SidebarGroup> */}
    </Sidebar>
  )
}
