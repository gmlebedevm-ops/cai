'use client'

import { useState, useEffect } from 'react'

export default function TestSimplePage() {
  const [message, setMessage] = useState('Начало загрузки...')
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setMessage('Тестируем подключение...')
      
      // Сначала проверим простой API
      const healthResponse = await fetch('/api/health')
      setMessage(`Health check: ${healthResponse.status}`)
      
      if (healthResponse.ok) {
        setMessage('Health check пройден, загружаем настройки...')
        
        const response = await fetch('/api/ai-settings')
        setMessage(`Получен ответ настроек: ${response.status}`)
        
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
          setMessage('Настройки загружены успешно!')
        } else {
          const errorData = await response.json()
          setMessage(`Ошибка API настроек: ${errorData.error || 'Unknown error'}`)
        }
      } else {
        setMessage('Health check не пройден')
      }
    } catch (err) {
      setMessage(`Ошибка сети: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div>
      <h1>Тест загрузки настроек AI</h1>
      <p>Статус: {message}</p>
      {settings && (
        <div>
          <h2>Настройки:</h2>
          <pre>{JSON.stringify(settings, null, 2)}</pre>
        </div>
      )}
      <button onClick={loadSettings}>Загрузить снова</button>
    </div>
  )
}