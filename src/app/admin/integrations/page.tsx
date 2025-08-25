'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Link, 
  Unlink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Key,
  Database,
  Mail,
  Calendar,
  FileText
} from 'lucide-react'

interface Integration {
  id: string
  name: string
  type: 'api' | 'webhook' | 'email' | 'database' | 'calendar' | 'document'
  description: string
  status: 'active' | 'inactive' | 'error'
  url?: string
  apiKey?: string
  config: Record<string, any>
  lastSync?: string
  createdAt: string
  updatedAt: string
}

const integrationTypeLabels = {
  api: 'API интеграция',
  webhook: 'Webhook',
  email: 'Email',
  database: 'База данных',
  calendar: 'Календарь',
  document: 'Документы'
}

const integrationTypeIcons = {
  api: Link,
  webhook: ExternalLink,
  email: Mail,
  database: Database,
  calendar: Calendar,
  document: FileText
}

const statusColors = {
  active: 'bg-green-500',
  inactive: 'bg-gray-500',
  error: 'bg-red-500'
}

const statusLabels = {
  active: 'Активна',
  inactive: 'Неактивна',
  error: 'Ошибка'
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  // Форма создания/редактирования
  const [formData, setFormData] = useState({
    name: '',
    type: 'api' as Integration['type'],
    description: '',
    url: '',
    apiKey: '',
    config: {}
  })

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    setLoading(true)
    try {
      // Имитация загрузки данных
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Временные данные для демонстрации
      setIntegrations([
        {
          id: '1',
          name: '1С:Предприятие',
          type: 'api',
          description: 'Интеграция с системой 1С для обмена данными о контрагентах',
          status: 'active',
          url: 'https://1c.company.ru/api',
          apiKey: '•••••••••••••••••••••',
          config: { timeout: 30000, retryCount: 3 },
          lastSync: '2025-06-18T10:30:00Z',
          createdAt: '2025-01-15T00:00:00Z',
          updatedAt: '2025-06-18T10:30:00Z'
        },
        {
          id: '2',
          name: 'Email уведомления',
          type: 'email',
          description: 'Отправка email-уведомлений о статусах договоров',
          status: 'active',
          config: { 
            smtp: { host: 'smtp.company.com', port: 587, secure: true },
            from: 'noreply@company.com'
          },
          lastSync: '2025-06-18T09:15:00Z',
          createdAt: '2025-01-10T00:00:00Z',
          updatedAt: '2025-06-18T09:15:00Z'
        },
        {
          id: '3',
          name: 'Google Calendar',
          type: 'calendar',
          description: 'Синхронизация сроков договоров с Google Calendar',
          status: 'error',
          config: { calendarId: 'company@company.com' },
          lastSync: '2025-06-17T14:20:00Z',
          createdAt: '2025-02-01T00:00:00Z',
          updatedAt: '2025-06-17T14:20:00Z'
        }
      ])
    } catch (error) {
      console.error('Error fetching integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIntegration = async () => {
    try {
      // Имитация создания
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCreateDialogOpen(false)
      setFormData({
        name: '',
        type: 'api',
        description: '',
        url: '',
        apiKey: '',
        config: {}
      })
      fetchIntegrations()
    } catch (error) {
      console.error('Error creating integration:', error)
    }
  }

  const handleUpdateIntegration = async () => {
    if (!selectedIntegration) return

    try {
      // Имитация обновления
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setEditDialogOpen(false)
      setSelectedIntegration(null)
      setFormData({
        name: '',
        type: 'api',
        description: '',
        url: '',
        apiKey: '',
        config: {}
      })
      fetchIntegrations()
    } catch (error) {
      console.error('Error updating integration:', error)
    }
  }

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту интеграцию?')) return

    try {
      // Имитация удаления
      await new Promise(resolve => setTimeout(resolve, 500))
      fetchIntegrations()
    } catch (error) {
      console.error('Error deleting integration:', error)
    }
  }

  const handleToggleStatus = async (integrationId: string, currentStatus: Integration['status']) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      // Имитация переключения статуса
      await new Promise(resolve => setTimeout(resolve, 500))
      fetchIntegrations()
    } catch (error) {
      console.error('Error toggling integration status:', error)
    }
  }

  const handleTestConnection = async (integrationId: string) => {
    setTestingId(integrationId)
    try {
      // Имитация тестирования соединения
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Соединение успешно проверено!')
    } catch (error) {
      alert('Ошибка при проверке соединения')
    } finally {
      setTestingId(null)
    }
  }

  const openEditDialog = (integration: Integration) => {
    setSelectedIntegration(integration)
    setFormData({
      name: integration.name,
      type: integration.type,
      description: integration.description,
      url: integration.url || '',
      apiKey: '',
      config: integration.config
    })
    setEditDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка интеграций...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Интеграции</h1>
          <p className="text-muted-foreground">
            Управление интеграциями с внешними системами
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Создать интеграцию
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Создание интеграции</DialogTitle>
              <DialogDescription>
                Настройте новую интеграцию с внешней системой
              </DialogDescription>
            </DialogHeader>
            <IntegrationForm
              formData={formData}
              setFormData={setFormData}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreateIntegration}>
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Integrations List */}
      <div className="grid gap-4">
        {integrations.map((integration) => {
          const TypeIcon = integrationTypeIcons[integration.type]
          
          return (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <TypeIcon className="h-5 w-5" />
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <Badge className={`${statusColors[integration.status]} text-white`}>
                        {statusLabels[integration.status]}
                      </Badge>
                      <Badge variant="outline">
                        {integrationTypeLabels[integration.type]}
                      </Badge>
                    </div>
                    {integration.description && (
                      <p className="text-muted-foreground text-sm mb-2">{integration.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {integration.url && (
                        <span className="flex items-center gap-1">
                          <Link className="h-3 w-3" />
                          {integration.url}
                        </span>
                      )}
                      {integration.lastSync && (
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Последняя синхронизация: {formatDate(integration.lastSync)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(integration.id)}
                      disabled={testingId === integration.id}
                    >
                      {testingId === integration.id ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      )}
                      Проверить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(integration.id, integration.status)}
                    >
                      {integration.status === 'active' ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Отключить
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Включить
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(integration)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Изменить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteIntegration(integration.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Удалить
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )
        })}
        
        {integrations.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Нет созданных интеграций
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактирование интеграции</DialogTitle>
            <DialogDescription>
              Измените настройки интеграции
            </DialogDescription>
          </DialogHeader>
          <IntegrationForm
            formData={formData}
            setFormData={setFormData}
            isEdit
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdateIntegration}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface IntegrationFormProps {
  formData: any
  setFormData: (data: any) => void
  isEdit?: boolean
}

function IntegrationForm({ formData, setFormData, isEdit = false }: IntegrationFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Название интеграции *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Название"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Тип интеграции *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите тип" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(integrationTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Описание интеграции"
          rows={3}
        />
      </div>

      {(formData.type === 'api' || formData.type === 'webhook') && (
        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://api.example.com"
          />
        </div>
      )}

      {formData.type === 'api' && !isEdit && (
        <div className="space-y-2">
          <Label htmlFor="apiKey">API ключ</Label>
          <Input
            id="apiKey"
            type="password"
            value={formData.apiKey}
            onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
            placeholder="Введите API ключ"
          />
        </div>
      )}

      {/* Дополнительные настройки в зависимости от типа */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Дополнительные настройки</h4>
        
        {formData.type === 'api' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeout">Таймаут (мс)</Label>
              <Input
                id="timeout"
                type="number"
                value={formData.config.timeout || 30000}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  config: { ...prev.config, timeout: parseInt(e.target.value) } 
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retryCount">Количество попыток</Label>
              <Input
                id="retryCount"
                type="number"
                value={formData.config.retryCount || 3}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  config: { ...prev.config, retryCount: parseInt(e.target.value) } 
                }))}
              />
            </div>
          </div>
        )}

        {formData.type === 'email' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP сервер</Label>
              <Input
                id="smtpHost"
                value={formData.config.smtp?.host || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  config: { 
                    ...prev.config, 
                    smtp: { ...prev.config.smtp, host: e.target.value } 
                  } 
                }))}
                placeholder="smtp.company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">Порт</Label>
              <Input
                id="smtpPort"
                type="number"
                value={formData.config.smtp?.port || 587}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  config: { 
                    ...prev.config, 
                    smtp: { ...prev.config.smtp, port: parseInt(e.target.value) } 
                  } 
                }))}
              />
            </div>
          </div>
        )}

        {formData.type === 'calendar' && (
          <div className="space-y-2">
            <Label htmlFor="calendarId">ID календаря</Label>
            <Input
              id="calendarId"
              value={formData.config.calendarId || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                config: { ...prev.config, calendarId: e.target.value } 
              }))}
              placeholder="calendar@company.com"
            />
          </div>
        )}
      </div>
    </div>
  )
}