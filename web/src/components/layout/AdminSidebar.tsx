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
import { Home, ShieldCheck, MonitorCheck } from 'lucide-react'
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
    title: 'Duyệt KYC',
    icon: ShieldCheck,
    href: ROUTES.KYC,
  },
]

export function AdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Sidebar className="border-r border-gray-200 bg-linear-to-b from-gray-50/70 to-white">
      <SidebarHeader className="border-b border-gray-200 bg-white/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
            <MonitorCheck className="h-6 w-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <h2 className="text-base font-semibold tracking-tight text-gray-900">
              Rental App
            </h2>
            <p className="text-xs text-gray-500">Hệ thống quản trị</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Menu chính
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5 px-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href

                return (
                  <SidebarMenuItem key={item.href} className="cursor-pointer">
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate({ to: item.href })}
                      className={cn(
                        'w-full justify-start gap-4 rounded-xl px-4 py-4 transition-all duration-200',
                        'hover:bg-gray-100 hover:text-gray-900',
                        isActive
                          ? 'bg-orange-500 text-white shadow-lg ring-1 ring-orange-400 hover:bg-orange-600 hover:text-white'
                          : 'text-gray-700',
                      )}
                    >
                      <Icon
                        className={cn('h-5 w-5', isActive && 'text-orange-500')}
                      />
                      <span className="text-sm font-semibold tracking-tight">
                        {item.title}
                      </span>
                      {isActive && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-500" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-200 bg-white/80 px-4 py-3">
        <div className="rounded-lg flex items-center justify-center gap-2 bg-linear-to-r from-orange-50 to-orange-100 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-900">
            Phiên bản
          </p>
          <p className="text-xs text-orange-700">v1.0.0</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
