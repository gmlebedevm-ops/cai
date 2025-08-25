'use client'

import { useState } from 'react'

export default function TestScrollPage() {
  const [messages] = useState([
    { id: 1, content: 'Сообщение 1' },
    { id: 2, content: 'Сообщение 2' },
    { id: 3, content: 'Сообщение 3' },
    { id: 4, content: 'Сообщение 4' },
    { id: 5, content: 'Сообщение 5' },
    { id: 6, content: 'Сообщение 6' },
    { id: 7, content: 'Сообщение 7' },
    { id: 8, content: 'Сообщение 8' },
    { id: 9, content: 'Сообщение 9' },
    { id: 10, content: 'Сообщение 10' },
    { id: 11, content: 'Сообщение 11' },
    { id: 12, content: 'Сообщение 12' },
    { id: 13, content: 'Сообщение 13' },
    { id: 14, content: 'Сообщение 14' },
    { id: 15, content: 'Сообщение 15' },
    { id: 16, content: 'Сообщение 16' },
    { id: 17, content: 'Сообщение 17' },
    { id: 18, content: 'Сообщение 18' },
    { id: 19, content: 'Сообщение 19' },
    { id: 20, content: 'Сообщение 20' },
    { id: 21, content: 'Сообщение 21' },
    { id: 22, content: 'Сообщение 22' },
    { id: 23, content: 'Сообщение 23' },
    { id: 24, content: 'Сообщение 24' },
    { id: 25, content: 'Сообщение 25' },
  ])

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Фиксированный заголовок */}
      <div className="p-4 border-b bg-card flex-shrink-0">
        <h1 className="text-xl font-bold">Тест скроллинга</h1>
      </div>
      
      {/* Скроллируемая область */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 w-full px-2 py-2">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium mb-2">
                  Начните диалог
                </h3>
                <p className="text-muted-foreground">
                  Тестовое сообщение
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="flex gap-3 justify-start"
                >
                  <div className="max-w-[80%] bg-muted rounded-lg p-3">
                    <div>{message.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="border-t bg-card p-2 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Введите сообщение..."
              className="flex-1 px-3 py-2 border rounded"
            />
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded">
              Отправить
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}