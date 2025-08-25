'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, MessageSquare, X } from 'lucide-react'

interface AIAssistantNotificationProps {
  onOpenChat: () => void
  unreadCount?: number
}

export default function AIAssistantNotification({ 
  onOpenChat, 
  unreadCount = 0 
}: AIAssistantNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Показываем уведомление, если есть непрочитанные сообщения
    if (unreadCount > 0 && !isDismissed) {
      setIsVisible(true)
      
      // Автоматически скрываем через 10 секунд
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [unreadCount, isDismissed])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
  }

  const handleOpenChat = () => {
    setIsVisible(false)
    setIsDismissed(true)
    onOpenChat()
  }

  if (!isVisible || isDismissed) {
    return null
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-background border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">AI-ассистент</h4>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {unreadCount === 1 
                ? 'У вас новое сообщение от AI-ассистента' 
                : `У вас ${unreadCount} новых сообщений от AI-ассистента`
              }
            </p>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleOpenChat}
                className="flex items-center gap-1"
              >
                <MessageSquare className="h-3 w-3" />
                Открыть чат
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={handleDismiss}
                className="p-1 h-auto"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}