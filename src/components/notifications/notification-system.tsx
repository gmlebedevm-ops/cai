'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, X, ExternalLink, Clock, CheckCircle, Settings } from 'lucide-react'
import { Notification, NotificationType } from '@/types/notification'

interface NotificationSystemProps {
  userId: string
  onNotificationClick?: (notification: Notification) => void
  onOpenNotificationCenter?: () => void
}

export function NotificationSystem({ userId, onNotificationClick, onOpenNotificationCenter }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchNotifications()
    
    // Обновляем уведомления каждые 30 секунд
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [userId])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}&unreadOnly=false`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: Notification) => !n.read).length)
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
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read)
      await Promise.all(
        unreadNotifications.map(n => 
          fetch('/api/notifications', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notificationId: n.id, read: true })
          })
        )
      )
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true, readAt: new Date() }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'CONTRACT_CREATED':
      case 'CONTRACT_UPDATED':
        return <Clock className="h-4 w-4" />
      case 'APPROVAL_REQUESTED':
        return <Bell className="h-4 w-4" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED':
        return <X className="h-4 w-4 text-red-500" />
      case 'COMMENT_ADDED':
        return <ExternalLink className="h-4 w-4" />
      case 'DOCUMENT_UPLOADED':
        return <ExternalLink className="h-4 w-4" />
      case 'DEADLINE_APPROACHING':
        return <Clock className="h-4 w-4 text-orange-500" />
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

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'только что'
    if (minutes < 60) return `${minutes} мин. назад`
    if (hours < 24) return `${hours} ч. назад`
    return `${days} дн. назад`
  }

  const displayNotifications = showAll ? notifications : notifications.slice(0, 5)

  if (loading) {
    return (
      <Card className="w-80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Уведомления
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Загрузка...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Уведомления
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Прочитать все
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayNotifications.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Уведомлений нет
          </div>
        ) : (
          <>
            {displayNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-100 ${
                  getNotificationColor(notification.type)
                } ${!notification.read ? 'font-medium' : ''}`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id)
                  }
                  onNotificationClick?.(notification)
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-medium truncate">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {notification.actionUrl && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {notifications.length > 5 && !showAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(true)}
                className="w-full text-xs"
              >
                Показать все ({notifications.length})
              </Button>
            )}
            
            {showAll && notifications.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(false)}
                className="w-full text-xs"
              >
                Свернуть
              </Button>
            )}
            
            {/* Кнопка перехода в центр уведомлений */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenNotificationCenter}
              className="w-full text-xs"
            >
              <Settings className="h-3 w-3 mr-2" />
              Все уведомления
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}