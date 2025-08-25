'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Minimize2, Maximize2 } from 'lucide-react'
import AIChatDialog from './ai-chat-dialog'
import AIAssistantNotification from './ai-assistant-notification'

interface AIAssistantFloatingButtonProps {
  userId?: string
  contractId?: string
  contractData?: any
}

export default function AIAssistantFloatingButton({ 
  userId, 
  contractId, 
  contractData 
}: AIAssistantFloatingButtonProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const handleOpenChat = () => {
    setIsChatOpen(true)
    setIsMinimized(false)
    setUnreadCount(0) // Сбрасываем счетчик при открытии чата
  }

  const handleCloseChat = () => {
    setIsChatOpen(false)
    setIsMinimized(false)
  }

  const handleNewMessage = () => {
    if (!isChatOpen) {
      setUnreadCount(prev => prev + 1)
    }
  }

  return (
    <>
      {/* Плавающая кнопка */}
      {!isChatOpen && (
        <div className="relative">
          <Button
            size="lg"
            className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={handleOpenChat}
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
          
          {/* Индикатор непрочитанных сообщений */}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="fixed bottom-12 right-12 z-50 min-w-5 h-5 flex items-center justify-center text-xs p-0 animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      )}

      {/* Уведомление о новых сообщениях */}
      <AIAssistantNotification 
        onOpenChat={handleOpenChat}
        unreadCount={unreadCount}
      />

      {/* Диалоговое окно чата */}
      <AIChatDialog
        open={isChatOpen}
        onOpenChange={setIsChatOpen}
        userId={userId}
        contractId={contractId}
        contractData={contractData}
      />
    </>
  )
}