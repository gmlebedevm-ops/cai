'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bell, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  User,
  Settings,
  Archive,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'
import { Notification, NotificationType } from '@/types/notification'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface NotificationCenterProps {
  userId: string
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])

  useEffect(() => {
    fetchNotifications()
  }, [userId])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}&unreadOnly=false`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId, read: true })
      })
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAsUnread = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId, read: false })
      })
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: false, readAt: undefined } : n)
      )
    } catch (error) {
      console.error('Error marking notification as unread:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications?notificationId=${notificationId}`, {
        method: 'DELETE'
      })
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const markSelectedAsRead = async () => {
    await Promise.all(selectedNotifications.map(id => markAsRead(id)))
    setSelectedNotifications([])
  }

  const markSelectedAsUnread = async () => {
    await Promise.all(selectedNotifications.map(id => markAsUnread(id)))
    setSelectedNotifications([])
  }

  const deleteSelected = async () => {
    await Promise.all(selectedNotifications.map(id => deleteNotification(id)))
    setSelectedNotifications([])
  }

  const toggleSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    )
  }

  const selectAllVisible = () => {
    const visibleIds = filteredNotifications.map(n => n.id)
    const allSelected = visibleIds.every(id => selectedNotifications.includes(id))
    
    if (allSelected) {
      setSelectedNotifications(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      setSelectedNotifications(prev => [...new Set([...prev, ...visibleIds])])
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'CONTRACT_CREATED':
      case 'CONTRACT_UPDATED':
        return <FileText className="h-4 w-4" />
      case 'APPROVAL_REQUESTED':
        return <Clock className="h-4 w-4" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'COMMENT_ADDED':
        return <User className="h-4 w-4" />
      case 'DOCUMENT_UPLOADED':
        return <FileText className="h-4 w-4" />
      case 'DEADLINE_APPROACHING':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'CONTRACT_SIGNED':
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'APPROVED':
      case 'CONTRACT_SIGNED':
        return 'border-green-200 bg-green-50'
      case 'REJECTED':
        return 'border-red-200 bg-red-50'
      case 'DEADLINE_APPROACHING':
        return 'border-orange-200 bg-orange-50'
      case 'APPROVAL_REQUESTED':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || notification.type === typeFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'unread' && !notification.read) ||
                         (statusFilter === 'read' && notification.read)
    
    return matchesSearch && matchesType && matchesStatus
  })

  const unreadNotifications = notifications.filter(n => !n.read)
  const readNotifications = notifications.filter(n => n.read)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Уведомления</h1>
            <p className="text-muted-foreground">Центр уведомлений системы</p>
          </div>
        </div>
        <div className="text-center py-8">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Уведомления</h1>
          <p className="text-muted-foreground">Центр уведомлений системы</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedNotifications.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={markSelectedAsRead}>
                <Eye className="h-4 w-4 mr-2" />
                Прочитать
              </Button>
              <Button variant="outline" size="sm" onClick={markSelectedAsUnread}>
                <EyeOff className="h-4 w-4 mr-2" />
                Непрочитанное
              </Button>
              <Button variant="outline" size="sm" onClick={deleteSelected}>
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего уведомлений</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Непрочитанные</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Прочитанные</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readNotifications.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по заголовку или сообщению"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Тип уведомления" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="CONTRACT_CREATED">Создание договора</SelectItem>
                <SelectItem value="CONTRACT_UPDATED">Обновление договора</SelectItem>
                <SelectItem value="APPROVAL_REQUESTED">Запрос согласования</SelectItem>
                <SelectItem value="APPROVED">Согласовано</SelectItem>
                <SelectItem value="REJECTED">Отклонено</SelectItem>
                <SelectItem value="COMMENT_ADDED">Комментарий</SelectItem>
                <SelectItem value="DOCUMENT_UPLOADED">Документ загружен</SelectItem>
                <SelectItem value="DEADLINE_APPROACHING">Срок подходит</SelectItem>
                <SelectItem value="CONTRACT_SIGNED">Договор подписан</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="unread">Непрочитанные</SelectItem>
                <SelectItem value="read">Прочитанные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">Все уведомления</TabsTrigger>
            <TabsTrigger value="unread">Непрочитанные</TabsTrigger>
            <TabsTrigger value="read">Прочитанные</TabsTrigger>
          </TabsList>
          
          {filteredNotifications.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filteredNotifications.every(n => selectedNotifications.includes(n.id))}
                onChange={selectAllVisible}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-muted-foreground">
                Выбрать все ({filteredNotifications.length})
              </span>
            </div>
          )}
        </div>
        
        <TabsContent value="all" className="space-y-4">
          <NotificationList 
            notifications={filteredNotifications}
            selectedNotifications={selectedNotifications}
            onToggleSelection={toggleSelection}
            onMarkAsRead={markAsRead}
            onMarkAsUnread={markAsUnread}
            onDelete={deleteNotification}
            getNotificationIcon={getNotificationIcon}
            getNotificationColor={getNotificationColor}
          />
        </TabsContent>
        
        <TabsContent value="unread" className="space-y-4">
          <NotificationList 
            notifications={filteredNotifications.filter(n => !n.read)}
            selectedNotifications={selectedNotifications}
            onToggleSelection={toggleSelection}
            onMarkAsRead={markAsRead}
            onMarkAsUnread={markAsUnread}
            onDelete={deleteNotification}
            getNotificationIcon={getNotificationIcon}
            getNotificationColor={getNotificationColor}
          />
        </TabsContent>
        
        <TabsContent value="read" className="space-y-4">
          <NotificationList 
            notifications={filteredNotifications.filter(n => n.read)}
            selectedNotifications={selectedNotifications}
            onToggleSelection={toggleSelection}
            onMarkAsRead={markAsRead}
            onMarkAsUnread={markAsUnread}
            onDelete={deleteNotification}
            getNotificationIcon={getNotificationIcon}
            getNotificationColor={getNotificationColor}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface NotificationListProps {
  notifications: Notification[]
  selectedNotifications: string[]
  onToggleSelection: (id: string) => void
  onMarkAsRead: (id: string) => void
  onMarkAsUnread: (id: string) => void
  onDelete: (id: string) => void
  getNotificationIcon: (type: NotificationType) => React.ReactNode
  getNotificationColor: (type: NotificationType) => string
}

function NotificationList({
  notifications,
  selectedNotifications,
  onToggleSelection,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  getNotificationIcon,
  getNotificationColor
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Уведомления не найдены
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`transition-colors hover:shadow-md ${
            getNotificationColor(notification.type)
          } ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedNotifications.includes(notification.id)}
                  onChange={() => onToggleSelection(notification.id)}
                  className="rounded border-gray-300"
                />
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <h3 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(notification.createdAt), 'dd MMM yyyy HH:mm', { locale: ru })}
                    </span>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {notification.message}
                </p>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {notification.type.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                    {notification.contractId && (
                      <Badge variant="secondary" className="text-xs">
                        Договор #{notification.contractId.slice(-8)}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!notification.read ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkAsRead(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkAsUnread(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    )}
                    {notification.actionUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(notification.actionUrl, '_blank')}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(notification.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}