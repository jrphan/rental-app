import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, User, Settings } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import ROUTES from '@/constants/routes'

export function AdminHeader() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate({ to: ROUTES.LOGIN, replace: true })
  }

  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.phone?.slice(-2).toUpperCase() || 'AD'
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center justify-end gap-2">
        {/* User Info */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex flex-col items-end">
            <p className="text-sm font-semibold text-gray-900">
              {user?.fullName || 'Người dùng'}
            </p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Avatar className="h-10 w-10 ring-2 ring-orange-500/20 hover:ring-orange-500/40 transition-all">
                <AvatarImage
                  src={user?.avatar || undefined}
                  alt={user?.fullName || user?.phone || ''}
                />
                <AvatarFallback className="bg-orange-500 text-white font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={user?.avatar || undefined}
                    alt={user?.fullName || user?.phone || ''}
                  />
                  <AvatarFallback className="bg-orange-500 text-white font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">
                    {user?.fullName || 'Người dùng'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.phone}
                  </p>
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 mt-1 w-fit">
                    {user?.role}
                  </span>
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
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
