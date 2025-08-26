'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  BarChart3, 
  Bell, 
  Archive,
  Clock,
  CheckSquare,
  AlertTriangle,
  FolderOpen,
  Building2,
  Contact,
  UserCheck,
  FileUser,
  BookText,
  Waypoints,
  Blocks,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Bot,
  LayoutPanelTop,
  Columns3Cog
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const navigation = [
  {
    name: 'Главная',
    href: '/',
    icon: Home,
    description: 'Обзор и статистика'
  },
  {
    name: 'AI-ассистент',
    href: '/ai-chat',
    icon: Bot,
    description: 'Чат с искусственным интеллектом'
  },
  {
    name: 'Уведомления',
    href: '/notifications',
    icon: Bell,
    description: 'Центр уведомлений'
  },
  {
    name: 'Контрагенты',
    href: '/counterparties',
    icon: Contact,
    description: 'Управление контрагентами'
  },
  {
    name: 'Договоры',
    href: '/contracts',
    icon: FileText,
    description: 'Все договоры',
    children: [
      { name: 'Все договоры', href: '/contracts', icon: FileText },
      { name: 'Мои договоры', href: '/contracts/my', icon: FileUser },
      { name: 'На согласовании', href: '/contracts/review', icon: Clock },
      { name: 'Требуют внимания', href: '/contracts/pending', icon: AlertTriangle },
      { name: 'Архив', href: '/contracts/archive', icon: Archive },
    ]
  },
  {
    name: 'Согласование',
    href: '/approvals',
    icon: CheckSquare,
    description: 'Процессы согласования',
    children: [
      { name: 'Все согласования', href: '/approvals', icon: CheckSquare },
      { name: 'Мои согласования', href: '/approvals/my', icon: UserCheck },
      { name: 'Очередь', href: '/approvals/queue', icon: Clock },
      { name: 'История', href: '/approvals/history', icon: Archive },
    ]
  },
  {
    name: 'Документы',
    href: '/documents',
    icon: FolderOpen,
    description: 'Управление документами',
    children: [
      { name: 'Все документы', href: '/documents', icon: FolderOpen },
      { name: 'Шаблоны', href: '/documents/templates', icon: FileText },
      { name: 'Архив', href: '/documents/archive', icon: Archive },
    ]
  },
  {
    name: 'Отчеты',
    href: '/reports',
    icon: BarChart3,
    description: 'Аналитика и отчеты',
    children: [
      { name: 'Дашборд', href: '/reports/dashboard', icon: BarChart3 },
      { name: 'Сроки согласования', href: '/reports/timelines', icon: Clock },
      { name: 'Статистика', href: '/reports/statistics', icon: BarChart3 },
    ]
  },
  {
    name: 'Пользователи',
    href: '/users',
    icon: Users,
    description: 'Управление пользователями',
    children: [
      { name: 'Все пользователи', href: '/users', icon: Users },
      { name: 'Роли и права', href: '/users/roles', icon: UserCheck },
      { name: 'Компания', href: '/users/company', icon: Building2 },
    ]
  },
  {
    name: 'Настройки',
    href: '/settings',
    icon: Settings,
    description: 'Персональные настройки'
  },
  {
    name: 'Администрирование',
    href: '/admin',
    icon: Columns3Cog,
    description: 'Администрирование системы',
    children: [
      { name: 'Настройки AI', href: '/admin/ai-settings', icon: Bot },
      { name: 'Маршруты согласования', href: '/admin/workflows', icon: Waypoints },
      { name: 'Справочники', href: '/admin/references', icon: BookText },
      { name: 'Структура компании', href: '/company-structure', icon: LayoutPanelTop },
      { name: 'Интеграции', href: '/admin/integrations', icon: Blocks },
    ]
  },
]

interface SidebarNavProps {
  className?: string
}

export function SidebarNav({ className }: SidebarNavProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Загрузка состояния из localStorage при монтировании
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar-expanded')
      let initialExpanded: string[] = []
      if (saved) {
        initialExpanded = JSON.parse(saved)
      }
      
      // Проверяем, есть ли активные дочерние элементы, и разворачиваем их родительские разделы
      navigation.forEach(item => {
        if (item.children) {
          const isChildActive = item.children.some(child => {
            return pathname === child.href || pathname.startsWith(child.href + '/')
          })
          if (isChildActive && !initialExpanded.includes(item.name)) {
            initialExpanded.push(item.name)
          }
        }
      })
      
      setExpandedItems(initialExpanded)
    } catch (error) {
      console.error('Error loading sidebar state:', error)
    }
  }, [pathname])

  // Сохранение состояния в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem('sidebar-expanded', JSON.stringify(expandedItems))
    } catch (error) {
      console.error('Error saving sidebar state:', error)
    }
  }, [expandedItems])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    )
  }

  const isItemExpanded = (itemName: string) => expandedItems.includes(itemName)

  return (
    <div className="space-y-4">
      <nav className={cn('space-y-1', className)}>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          if (item.children) {
            const isChildActive = item.children.some(child => {
              return pathname === child.href || pathname.startsWith(child.href + '/')
            })

            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => toggleExpanded(item.name)}
                  className={cn(
                    'flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors group',
                    isChildActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.name}</span>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    {isItemExpanded(item.name) ? (
                      <ChevronDown className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </button>
                
                {isItemExpanded(item.name) && (
                  <div className="ml-4 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href
                      const ChildIcon = child.icon
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group',
                            isChildActive
                              ? 'bg-primary/10 text-primary border-l-2 border-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          )}
                        >
                          <ChildIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                          <span className="flex-1">{child.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <Badge variant="destructive" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}