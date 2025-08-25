'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  User, 
  Bell, 
  Monitor, 
  Moon, 
  Sun,
  Save,
  RefreshCw,
  CheckCircle
} from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Состояние настроек профиля
  const [profileSettings, setProfileSettings] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: ''
  })

  // Состояние настроек уведомлений
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    contractCreated: true,
    contractUpdated: true,
    contractApproved: true,
    contractRejected: true,
    deadlineReminder: true,
    weeklyDigest: false
  })

  // Состояние настроек интерфейса
  const [interfaceSettings, setInterfaceSettings] = useState({
    theme: 'light',
    language: 'ru',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    compactMode: false,
    sidebarCollapsed: false
  })

  useEffect(() => {
    // Загрузка настроек пользователя
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // Здесь будет загрузка настроек с API
      // const response = await fetch('/api/settings')
      // const data = await response.json()
      
      // Временные данные для демонстрации
      setProfileSettings({
        name: 'Иван Иванов',
        email: 'ivan.ivanov@company.com',
        phone: '+7 (999) 123-45-67',
        position: 'Менеджер по договорам',
        department: 'Отдел продаж'
      })
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveProfileSettings = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Здесь будет сохранение настроек через API
      // await fetch('/api/settings/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(profileSettings)
      // })

      // Имитация сохранения
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess('Профиль успешно обновлен')
    } catch (error) {
      setError('Ошибка при сохранении профиля')
    } finally {
      setLoading(false)
    }
  }

  const saveNotificationSettings = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Здесь будет сохранение настроек через API
      // await fetch('/api/settings/notifications', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(notificationSettings)
      // })

      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess('Настройки уведомлений успешно обновлены')
    } catch (error) {
      setError('Ошибка при сохранении настроек уведомлений')
    } finally {
      setLoading(false)
    }
  }

  const saveInterfaceSettings = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Здесь будет сохранение настроек через API
      // await fetch('/api/settings/interface', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(interfaceSettings)
      // })

      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess('Настройки интерфейса успешно обновлены')
    } catch (error) {
      setError('Ошибка при сохранении настроек интерфейса')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Настройки</h1>
          <p className="text-muted-foreground">
            Управление персональными настройками и предпочтениями
          </p>
        </div>
        <Button variant="outline" onClick={loadSettings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Профиль
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Уведомления
          </TabsTrigger>
          <TabsTrigger value="interface" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Интерфейс
          </TabsTrigger>
        </TabsList>

        {/* Настройки профиля */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Профиль пользователя
              </CardTitle>
              <CardDescription>
                Управление основной информацией о вашем профиле
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Полное имя</Label>
                  <Input
                    id="name"
                    value={profileSettings.name}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Иван Иванов"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileSettings.email}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    value={profileSettings.phone}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Должность</Label>
                  <Input
                    id="position"
                    value={profileSettings.position}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Менеджер"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="department">Отдел</Label>
                  <Input
                    id="department"
                    value={profileSettings.department}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Отдел продаж"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveProfileSettings} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить профиль
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Настройки уведомлений */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Настройки уведомлений
              </CardTitle>
              <CardDescription>
                Управление способами получения и типами уведомлений
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Способы уведомлений</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email-уведомления</Label>
                      <p className="text-sm text-muted-foreground">Получать уведомления на почту</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push-уведомления</Label>
                      <p className="text-sm text-muted-foreground">Получать уведомления в браузере</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Типы уведомлений</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Создание договора</Label>
                      <p className="text-sm text-muted-foreground">Новые договоры в системе</p>
                    </div>
                    <Switch
                      checked={notificationSettings.contractCreated}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, contractCreated: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Обновление договора</Label>
                      <p className="text-sm text-muted-foreground">Изменения в договорах</p>
                    </div>
                    <Switch
                      checked={notificationSettings.contractUpdated}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, contractUpdated: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Согласование договора</Label>
                      <p className="text-sm text-muted-foreground">Договоры согласованы</p>
                    </div>
                    <Switch
                      checked={notificationSettings.contractApproved}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, contractApproved: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Отклонение договора</Label>
                      <p className="text-sm text-muted-foreground">Договоры отклонены</p>
                    </div>
                    <Switch
                      checked={notificationSettings.contractRejected}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, contractRejected: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Напоминания о сроках</Label>
                      <p className="text-sm text-muted-foreground">Уведомления о приближающихся сроках</p>
                    </div>
                    <Switch
                      checked={notificationSettings.deadlineReminder}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, deadlineReminder: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Еженедельный дайджест</Label>
                      <p className="text-sm text-muted-foreground">Сводка за неделю</p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyDigest}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, weeklyDigest: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveNotificationSettings} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить уведомления
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Настройки интерфейса */}
        <TabsContent value="interface">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Настройки интерфейса
              </CardTitle>
              <CardDescription>
                Персонализация внешнего вида и поведения системы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Тема оформления</Label>
                  <Select value={interfaceSettings.theme} onValueChange={(value) => 
                    setInterfaceSettings(prev => ({ ...prev, theme: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тему" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Светлая</SelectItem>
                      <SelectItem value="dark">Темная</SelectItem>
                      <SelectItem value="system">Системная</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Язык интерфейса</Label>
                  <Select value={interfaceSettings.language} onValueChange={(value) => 
                    setInterfaceSettings(prev => ({ ...prev, language: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите язык" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Формат даты</Label>
                  <Select value={interfaceSettings.dateFormat} onValueChange={(value) => 
                    setInterfaceSettings(prev => ({ ...prev, dateFormat: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите формат" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD.MM.YYYY">ДД.ММ.ГГГГ</SelectItem>
                      <SelectItem value="MM/DD/YYYY">ММ/ДД/ГГГГ</SelectItem>
                      <SelectItem value="YYYY-MM-DD">ГГГГ-ММ-ДД</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Формат времени</Label>
                  <Select value={interfaceSettings.timeFormat} onValueChange={(value) => 
                    setInterfaceSettings(prev => ({ ...prev, timeFormat: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите формат" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 часа</SelectItem>
                      <SelectItem value="12h">12 часов</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Дополнительные настройки</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Компактный режим</Label>
                      <p className="text-sm text-muted-foreground">Уменьшить отступы и размеры элементов</p>
                    </div>
                    <Switch
                      checked={interfaceSettings.compactMode}
                      onCheckedChange={(checked) => 
                        setInterfaceSettings(prev => ({ ...prev, compactMode: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Свернутая боковая панель</Label>
                      <p className="text-sm text-muted-foreground">Скрывать боковую панель по умолчанию</p>
                    </div>
                    <Switch
                      checked={interfaceSettings.sidebarCollapsed}
                      onCheckedChange={(checked) => 
                        setInterfaceSettings(prev => ({ ...prev, sidebarCollapsed: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveInterfaceSettings} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить интерфейс
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}