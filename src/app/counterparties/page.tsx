'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Search, 
  Filter, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Edit,
  Trash2,
  Eye,
  Copy,
  Download,
  Upload,
  FileText
} from 'lucide-react'
import { Reference, ReferenceType } from '@/types/index'

interface Counterparty extends Reference {
  contactInfo?: {
    phone?: string
    email?: string
    address?: string
    website?: string
  }
  contractCount?: number
  lastContractDate?: string
}

const statusColors = {
  true: 'bg-green-500',
  false: 'bg-gray-400',
}

const statusLabels = {
  true: 'Активен',
  false: 'Неактивен',
}

export default function CounterpartiesPage() {
  const [counterparties, setCounterparties] = useState<Counterparty[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingCounterparty, setEditingCounterparty] = useState<Counterparty | null>(null)

  // Форма создания/редактирования
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    contactInfo: {
      phone: '',
      email: '',
      address: '',
      website: ''
    },
    isActive: true,
    metadata: '{}'
  })

  const fetchCounterparties = async () => {
    try {
      const response = await fetch('/api/references?type=COUNTERPARTY')
      if (response.ok) {
        const data = await response.json()
        setCounterparties(data.references || [])
      }
    } catch (error) {
      console.error('Error fetching counterparties:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCounterparties()
  }, [])

  const filteredCounterparties = counterparties.filter(counterparty => {
    const matchesSearch = counterparty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         counterparty.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         counterparty.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || counterparty.isActive.toString() === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleCreateCounterparty = async () => {
    try {
      const response = await fetch('/api/references', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type: 'COUNTERPARTY',
          value: JSON.stringify(formData.contactInfo)
        }),
      })

      if (response.ok) {
        setCreateDialogOpen(false)
        resetForm()
        fetchCounterparties()
      }
    } catch (error) {
      console.error('Error creating counterparty:', error)
    }
  }

  const handleUpdateCounterparty = async () => {
    if (!editingCounterparty) return

    try {
      const response = await fetch(`/api/references/${editingCounterparty.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type: 'COUNTERPARTY',
          value: JSON.stringify(formData.contactInfo)
        }),
      })

      if (response.ok) {
        setEditingCounterparty(null)
        resetForm()
        fetchCounterparties()
      }
    } catch (error) {
      console.error('Error updating counterparty:', error)
    }
  }

  const handleDeleteCounterparty = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого контрагента?')) return

    try {
      const response = await fetch(`/api/references/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCounterparties()
      }
    } catch (error) {
      console.error('Error deleting counterparty:', error)
    }
  }

  const handleEditClick = (counterparty: Counterparty) => {
    const contactInfo = counterparty.value ? JSON.parse(counterparty.value) : {}
    setFormData({
      name: counterparty.name,
      code: counterparty.code,
      description: counterparty.description || '',
      contactInfo: {
        phone: contactInfo.phone || '',
        email: contactInfo.email || '',
        address: contactInfo.address || '',
        website: contactInfo.website || ''
      },
      isActive: counterparty.isActive,
      metadata: counterparty.metadata || '{}'
    })
    setEditingCounterparty(counterparty)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      contactInfo: {
        phone: '',
        email: '',
        address: '',
        website: ''
      },
      isActive: true,
      metadata: '{}'
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportCounterparties = () => {
    const data = counterparties.map(cp => ({
      Код: cp.code,
      Наименование: cp.name,
      Описание: cp.description || '',
      Статус: cp.isActive ? 'Активен' : 'Неактивен',
      Телефон: cp.value ? JSON.parse(cp.value).phone || '' : '',
      Email: cp.value ? JSON.parse(cp.value).email || '' : '',
      Адрес: cp.value ? JSON.parse(cp.value).address || '' : '',
      'Кол-во договоров': cp.contractCount || 0
    }))
    
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'контрагенты.csv'
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Контрагенты</h1>
          <p className="text-muted-foreground">
            Управление контрагентами и их контактной информацией
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={exportCounterparties}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Экспорт
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Новый контрагент
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Создание контрагента</DialogTitle>
                <DialogDescription>
                  Заполните информацию о новом контрагенте
                </DialogDescription>
              </DialogHeader>
              <CounterpartyForm 
                formData={formData} 
                setFormData={setFormData}
                onSubmit={handleCreateCounterparty}
                onCancel={() => {
                  setCreateDialogOpen(false)
                  resetForm()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего контрагентов</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counterparties.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {counterparties.filter(c => c.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Неактивные</CardTitle>
            <Building className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {counterparties.filter(c => !c.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">С договорами</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {counterparties.filter(c => c.contractCount && c.contractCount > 0).length}
            </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию, коду или описанию"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="true">Активные</SelectItem>
                <SelectItem value="false">Неактивные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Counterparties List */}
      <Card>
        <CardHeader>
          <CardTitle>Список контрагентов</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : (
            <div className="space-y-4">
              {filteredCounterparties.map((counterparty) => {
                const contactInfo = counterparty.value ? JSON.parse(counterparty.value) : {}
                return (
                  <Card key={counterparty.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{counterparty.name}</h3>
                            <Badge className={`${statusColors[counterparty.isActive]} text-white`}>
                              {statusLabels[counterparty.isActive]}
                            </Badge>
                            {counterparty.contractCount && counterparty.contractCount > 0 && (
                              <Badge variant="secondary">
                                {counterparty.contractCount} договоров
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono bg-muted px-2 py-1 rounded">
                              {counterparty.code}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(counterparty.code)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {counterparty.description && (
                            <p className="text-sm text-muted-foreground">
                              {counterparty.description}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                            {contactInfo.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{contactInfo.phone}</span>
                              </div>
                            )}
                            {contactInfo.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{contactInfo.email}</span>
                              </div>
                            )}
                            {contactInfo.address && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{contactInfo.address}</span>
                              </div>
                            )}
                            {contactInfo.website && (
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                <span className="truncate">{contactInfo.website}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(counterparty)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCounterparty(counterparty.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {filteredCounterparties.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Контрагенты не найдены
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCounterparty} onOpenChange={() => setEditingCounterparty(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактирование контрагента</DialogTitle>
            <DialogDescription>
              Измените информацию о контрагенте
            </DialogDescription>
          </DialogHeader>
          <CounterpartyForm 
            formData={formData} 
            setFormData={setFormData}
            onSubmit={handleUpdateCounterparty}
            onCancel={() => {
              setEditingCounterparty(null)
              resetForm()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface CounterpartyFormProps {
  formData: any
  setFormData: (data: any) => void
  onSubmit: () => void
  onCancel: () => void
}

function CounterpartyForm({ formData, setFormData, onSubmit, onCancel }: CounterpartyFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Наименование *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="ООО 'Ромашка'"
          />
        </div>
        <div>
          <Label htmlFor="code">Код *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({...formData, code: e.target.value})}
            placeholder="ROMASHKA001"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Описание деятельности контрагента"
          rows={3}
        />
      </div>
      
      <div className="space-y-4">
        <h4 className="font-medium">Контактная информация</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              value={formData.contactInfo.phone}
              onChange={(e) => setFormData({
                ...formData, 
                contactInfo: {...formData.contactInfo, phone: e.target.value}
              })}
              placeholder="+7 (999) 123-45-67"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={formData.contactInfo.email}
              onChange={(e) => setFormData({
                ...formData, 
                contactInfo: {...formData.contactInfo, email: e.target.value}
              })}
              placeholder="info@example.com"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="address">Адрес</Label>
            <Input
              id="address"
              value={formData.contactInfo.address}
              onChange={(e) => setFormData({
                ...formData, 
                contactInfo: {...formData.contactInfo, address: e.target.value}
              })}
              placeholder="г. Москва, ул. Примерная, д. 1"
            />
          </div>
          <div>
            <Label htmlFor="website">Веб-сайт</Label>
            <Input
              id="website"
              value={formData.contactInfo.website}
              onChange={(e) => setFormData({
                ...formData, 
                contactInfo: {...formData.contactInfo, website: e.target.value}
              })}
              placeholder="https://example.com"
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
        />
        <Label htmlFor="isActive">Активен</Label>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button onClick={onSubmit}>
          Сохранить
        </Button>
      </DialogFooter>
    </div>
  )
}