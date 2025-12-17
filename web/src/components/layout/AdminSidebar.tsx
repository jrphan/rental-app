import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar'
import {
  Home,
  ClipboardList,
  Users,
  Settings,
  FileText,
  Bike,
  ShieldCheck,
} from 'lucide-react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import ROUTES from '@/constants/routes'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    title: 'Trang chủ',
    icon: Home,
    href: ROUTES.HOME,
  },
  {
    title: 'Đặt xe',
    icon: ClipboardList,
    href: ROUTES.BOOKINGS,
  },
  {
    title: 'Duyệt KYC',
    icon: ShieldCheck,
    href: '/admin/kyc',
  },
  {
    title: 'Người dùng',
    icon: Users,
    href: '/admin/users',
  },
  {
    title: 'Báo cáo',
    icon: FileText,
    href: '/admin/reports',
  },
  {
    title: 'Cài đặt',
    icon: Settings,
    href: ROUTES.SETTINGS,
  },
]

export function AdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Sidebar className="border-r border-gray-200 bg-linear-to-b from-gray-50/50 to-white">
      <SidebarHeader className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white shadow-lg">
            <Bike className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-gray-900">Rental App</h2>
            <p className="text-xs text-gray-500">Hệ thống quản trị</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Menu chính
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate({ to: item.href })}
                      className={cn(
                        'w-full justify-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                        'hover:bg-gray-100 hover:text-gray-900',
                        isActive
                          ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600 hover:text-white'
                          : 'text-gray-700',
                      )}
                    >
                      <Icon
                        className={cn('h-5 w-5', isActive && 'text-white')}
                      />
                      <span className="font-medium">{item.title}</span>
                      {isActive && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-200 p-4">
        <div className="rounded-lg bg-linear-to-r from-orange-50 to-orange-100 p-3">
          <p className="text-xs font-semibold text-orange-900">Phiên bản</p>
          <p className="text-xs text-orange-700">v1.0.0</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
