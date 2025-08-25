'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Lock, Building2 } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface LoginFormProps {
  onLogin: (user: User) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Для демонстрации используем простую проверку
      // В реальном приложении здесь будет API вызов
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const user = await response.json()
        onLogin(user)
        
        // Сохраняем пользователя в localStorage
        localStorage.setItem('user', JSON.stringify(user))
      } else {
        setError('Неверный email или пароль')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Произошла ошибка при входе')
    } finally {
      setLoading(false)
    }
  }

  // Демо-пользователи для быстрого входа
  const demoUsers = [
    { email: 'admin@test.com', name: 'Администратор Системы', role: 'Администратор' },
    { email: 'initiator@test.com', name: 'Иван Иванов', role: 'Инициатор' },
    { email: 'manager@test.com', name: 'Петр Петров', role: 'Менеджер' },
    { email: 'head@test.com', name: 'Сергей Сергеев', role: 'Руководитель отдела' },
    { email: 'lawyer@test.com', name: 'Анна Андреева', role: 'Главный юрист' },
    { email: 'director@test.com', name: 'Мария Мария', role: 'Генеральный директор' },
    { email: 'office@test.com', name: 'Елена Еленова', role: 'Офис-менеджер' },
  ]

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    // Для администратора используем специальный пароль
    setPassword(demoEmail === 'admin@test.com' ? 'password123' : 'demo123')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Логотип и название */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Contract.Ai
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Управление договорами
          </p>
        </div>

        {/* Форма входа */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Вход в систему</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Вход...' : 'Войти'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Демо-пользователи */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-sm">Демо-доступ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-3">
                Нажмите на пользователя для быстрого входа
              </p>
              {demoUsers.map((user) => (
                <Button
                  key={user.email}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => handleDemoLogin(user.email)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-gray-500">{user.role}</span>
                  </div>
                </Button>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Демо-пароль:</strong> demo123<br/>
                <strong>Пароль администратора:</strong> password123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}