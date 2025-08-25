'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SidebarNav } from './sidebar-nav'
import { Bell, Menu, User, Settings, Search, Moon, Sun, FileText, Bot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { NotificationSystem } from '@/components/notifications/notification-system'
import { useTheme } from 'next-themes'
import { useAuth } from '@/hooks/use-auth'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()

  const handleOpenNotificationCenter = () => {
    router.push('/notifications')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/?search=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  // Если пользователь не авторизован, не показываем layout
  if (!user) {
    return <>{children}</>
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isAIChatPage = pathname?.includes('/ai-chat') || pathname === '/ai-chat'
  console.log('Current pathname:', pathname, 'Is AI Chat Page:', isAIChatPage)

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-card border-r">
          <div className="flex items-center h-16 px-4 border-b shadow-sm">
            <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600 mr-2" />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold">Contract.Ai</h1>
              <p className="text-xs text-muted-foreground">Управление договорами</p>
            </div>
          </div>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
            <SidebarNav className="px-3" />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex items-center h-16 px-4 border-b shadow-sm">
            <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600 mr-2" />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold">Contract.Ai</h1>
              <p className="text-xs text-muted-foreground">Управление договорами</p>
            </div>
          </div>
          </div>
          <div className="py-4">
            <SidebarNav className="px-3" />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 items-center justify-between gap-x-4">
            {/* Search Field - Left Side */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Поиск договоров..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
            </form>
            
            {/* Right Side Controls */}
            <div className="flex items-center gap-x-2 lg:gap-x-4">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="h-9 w-9"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Переключить тему</span>
              </Button>

              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5" />
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      3
                    </Badge>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <NotificationSystem 
                    userId={user.id}
                    onNotificationClick={(notification) => {
                      if (notification.actionUrl) {
                        window.open(notification.actionUrl, '_blank')
                      }
                    }}
                    onOpenNotificationCenter={handleOpenNotificationCenter}
                  />
                </PopoverContent>
              </Popover>

              {/* User Menu */}
              <div className="flex items-center gap-x-2">
                {/* User Name Display */}
                <div className="hidden sm:block text-sm">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/avatars/user.png" alt={user.name} />
                        <AvatarFallback>{user.name ? getInitials(user.name) : 'П'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.role}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Профиль</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Настройки</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <span>Выйти</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Separate Logout Button for Mobile */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="sm:hidden h-9 w-9"
                  onClick={handleLogout}
                  title="Выйти"
                >
                  <span className="sr-only">Выйти</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </Button>
                
                {/* Logout Button for Desktop */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hidden sm:flex h-9 w-9"
                  onClick={handleLogout}
                  title="Выйти"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="sr-only">Выйти</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className={isAIChatPage ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto"}>
          <div className={isAIChatPage ? "h-full" : "px-4 py-6 sm:px-6 lg:px-8"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}