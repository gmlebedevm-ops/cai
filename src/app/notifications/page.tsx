'use client'

import { NotificationCenter } from '@/components/notifications/notification-center'

export default function NotificationsPage() {
  // В реальном приложении здесь будет получение ID пользователя из контекста аутентификации
  const userId = 'demo-user-id'

  return <NotificationCenter userId={userId} />
}