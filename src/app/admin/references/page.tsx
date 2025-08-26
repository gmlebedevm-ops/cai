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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  FolderOpen, 
  Building2,
  FileText,
  Users,
  Tag,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Copy,
  Info
} from 'lucide-react'
import { Reference, ReferenceType, CreateReferenceInput, UpdateReferenceInput } from '@/types/workflow'
import { useAuth } from '@/hooks/use-auth'

const referenceTypeLabels = {
  [ReferenceType.COUNTERPARTY]: 'Контрагенты',
  [ReferenceType.CONTRACT_TYPE]: 'Типы договоров',
  [ReferenceType.DEPARTMENT]: 'Отделы',
  [ReferenceType.POSITION]: 'Должности',
  [ReferenceType.DOCUMENT_CATEGORY]: 'Категории документов',
  [ReferenceType.APPROVAL_REASON]: 'Причины согласования',
  [ReferenceType.REJECTION_REASON]: 'Причины отказа',
}

const referenceTypeIcons = {
  [ReferenceType.COUNTERPARTY]: Building2,
  [ReferenceType.CONTRACT_TYPE]: FileText,
  [ReferenceType.DEPARTMENT]: Users,
  [ReferenceType.POSITION]: Users,
  [ReferenceType.DOCUMENT_CATEGORY]: FolderOpen,
  [ReferenceType.APPROVAL_REASON]: CheckCircle,
  [ReferenceType.REJECTION_REASON]: XCircle,
}

export default function ReferencesPage() {
  const { user } = useAuth()
  const [references, setReferences] = useState<Reference[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedReference, setSelectedReference] = useState<Reference | null>(null)
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

  // Форма создания/редактирования
  const [formData, setFormData] = useState<CreateReferenceInput>({
    type: ReferenceType.COUNTERPARTY,
    code: '',
    name: '',
    description: '',
    value: '',
    isActive: true,
    sortOrder: 0,
    metadata: '',
    parentCode: ''
  })

  useEffect(() => {
    fetchReferences()
  }, [])

  const fetchReferences = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(activeFilter !== 'all' && { isActive: activeFilter })
      })
      
      const response = await fetch(`/api/references?${params}`)
      if (response.ok) {
        const data = await response.json()
        const referencesData = data.references || data
        setReferences(referencesData)
        
        // Автоматически разворачиваем типы с элементами
        const typesWithItems = new Set(
          referencesData
            .filter((ref: Reference) => ref.children && ref.children.length > 0)
            .map((ref: Reference) => ref.type)
        )
        setExpandedTypes(typesWithItems)
      }
    } catch (error) {
      console.error('Error fetching references:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReferences = references.filter(reference =>
    reference.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reference.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reference.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateReference = async () => {
    try {
      const response = await fetch('/api/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setCreateDialogOpen(false)
        setFormData({
          type: ReferenceType.COUNTERPARTY,
          code: '',
          name: '',
          description: '',
          value: '',
          isActive: true,
          sortOrder: 0,
          metadata: '',
          parentCode: ''
        })
        fetchReferences()
      }
    } catch (error) {
      console.error('Error creating reference:', error)
    }
  }

  const handleUpdateReference = async () => {
    if (!selectedReference) return

    try {
      const response = await fetch(`/api/references/${selectedReference.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setEditDialogOpen(false)
        setSelectedReference(null)
        setFormData({
          type: ReferenceType.COUNTERPARTY,
          code: '',
          name: '',
          description: '',
          value: '',
          isActive: true,
          sortOrder: 0,
          metadata: '',
          parentCode: ''
        })
        fetchReferences()
      }
    } catch (error) {
      console.error('Error updating reference:', error)
    }
  }

  const handleDeleteReference = async (referenceId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот справочник?')) return

    try {
      const response = await fetch(`/api/references/${referenceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchReferences()
      }
    } catch (error) {
      console.error('Error deleting reference:', error)
    }
  }

  const handleToggleActive = async (referenceId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/references/${referenceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      })

      if (response.ok) {
        fetchReferences()
      }
    } catch (error) {
      console.error('Error toggling reference active status:', error)
    }
  }

  const openEditDialog = (reference: Reference) => {
    setSelectedReference(reference)
    setFormData({
      type: reference.type,
      code: reference.code,
      name: reference.name,
      description: reference.description || '',
      value: reference.value || '',
      isActive: reference.isActive,
      sortOrder: reference.sortOrder,
      metadata: reference.metadata || '',
      parentCode: reference.parentCode || ''
    })
    setEditDialogOpen(true)
  }

  const toggleTypeExpanded = (type: string) => {
    setExpandedTypes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }

  const getReferencesByType = (type: string) => {
    return filteredReferences.filter(ref => ref.type === type && !ref.parentCode)
  }

  const getChildReferences = (parentCode: string) => {
    return filteredReferences.filter(ref => ref.parentCode === parentCode)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка справочников...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Справочники</h1>
          <p className="text-muted-foreground">
            Управление справочниками системы
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Создать справочник
            </Button>
          </DialogTrigger>
          <DialogContent className="adaptive-dialog max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4 border-b">
              <DialogTitle>Создание справочника</DialogTitle>
              <DialogDescription>
                Создайте новый элемент справочника
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4">
              <ReferenceForm
                formData={formData}
                setFormData={setFormData}
                references={references}
              />
            </div>
            <DialogFooter className="flex-shrink-0 pt-4 border-t">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreateReference}>
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              placeholder="Поиск по названию, коду или описанию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Тип справочника" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {Object.entries(referenceTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
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

      {/* References List */}
      <div className="space-y-4">
        {Object.entries(referenceTypeLabels).map(([type, label]) => {
          const typeReferences = getReferencesByType(type)
          const isExpanded = expandedTypes.has(type)
          const TypeIcon = referenceTypeIcons[type as ReferenceType]

          if (typeFilter !== 'all' && typeFilter !== type) {
            return null
          }

          return (
            <Card key={type}>
              <CardHeader>
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleTypeExpanded(type)}>
                  <div className="flex items-center gap-3">
                    <TypeIcon className="h-5 w-5" />
                    <CardTitle className="text-lg">{label}</CardTitle>
                    <Badge variant="secondary">{typeReferences.length}</Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent>
                  <div className="space-y-2">
                    {typeReferences.map((reference) => (
                      <ReferenceItem
                        key={reference.id}
                        reference={reference}
                        onEdit={openEditDialog}
                        onDelete={handleDeleteReference}
                        onToggleActive={handleToggleActive}
                        onCopy={copyToClipboard}
                        getChildReferences={getChildReferences}
                        level={0}
                      />
                    ))}
                    
                    {typeReferences.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        Элементы справочника не найдены
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
        
        {filteredReferences.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || activeFilter !== 'all' 
                  ? 'Справочники не найдены' 
                  : 'Нет созданных справочников'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="adaptive-dialog max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle>Редактирование справочника</DialogTitle>
            <DialogDescription>
              Измените данные справочника
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <ReferenceForm
              formData={formData}
              setFormData={setFormData}
              references={references}
              isEdit
            />
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdateReference}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ReferenceItemProps {
  reference: Reference
  onEdit: (reference: Reference) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, active: boolean) => void
  onCopy: (text: string) => void
  getChildReferences: (parentCode: string) => Reference[]
  level: number
}

function ReferenceItem({ 
  reference, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onCopy, 
  getChildReferences,
  level 
}: ReferenceItemProps) {
  const [expanded, setExpanded] = useState(false)
  const childReferences = getChildReferences(reference.code)

  const hasChildren = childReferences.length > 0

  return (
    <div className="space-y-2">
      <div 
        className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
          !reference.isActive ? 'opacity-60' : ''
        }`}
        style={{ marginLeft: `${level * 20}px` }}
      >
        <div className="flex items-center gap-3 flex-1">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-6 w-6 p-0"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{reference.name}</span>
              {!reference.isActive && (
                <Badge variant="secondary">Неактивен</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span>Код: {reference.code}</span>
              {reference.value && <span>Значение: {reference.value}</span>}
              {reference.description && <span>{reference.description}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(reference.code)}
            title="Копировать код"
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          <Switch
            checked={reference.isActive}
            onCheckedChange={(checked) => onToggleActive(reference.id, reference.isActive)}
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(reference)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(reference.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {expanded && hasChildren && (
        <div className="space-y-2">
          {childReferences.map((child) => (
            <ReferenceItem
              key={child.id}
              reference={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
              onCopy={onCopy}
              getChildReferences={getChildReferences}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ReferenceFormProps {
  formData: CreateReferenceInput | UpdateReferenceInput
  setFormData: (data: CreateReferenceInput | UpdateReferenceInput) => void
  references: Reference[]
  isEdit?: boolean
}

function ReferenceForm({ formData, setFormData, references, isEdit = false }: ReferenceFormProps) {
  const parentOptions = references.filter(ref => 
    ref.type === formData.type && ref.isActive && ref.id !== (formData as any).id
  )

  const validateForm = () => {
    const errors: string[] = []
    
    if (!formData.type) {
      errors.push('Тип справочника обязателен')
    }
    
    if (!formData.code?.trim()) {
      errors.push('Код обязателен')
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      errors.push('Код должен содержать только заглавные буквы, цифры и подчеркивание')
    }
    
    if (!formData.name?.trim()) {
      errors.push('Название обязательно')
    }
    
    if (formData.sortOrder !== undefined && formData.sortOrder < 0) {
      errors.push('Порядок сортировки не может быть отрицательным')
    }
    
    // Валидация JSON для метаданных
    if (formData.metadata?.trim()) {
      try {
        JSON.parse(formData.metadata)
      } catch {
        errors.push('Метаданные должны быть валидным JSON')
      }
    }
    
    return errors
  }

  const formErrors = validateForm()

  return (
    <div className="space-y-4">
      {formErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <XCircle className="h-4 w-4" />
            <span className="font-medium text-sm">Ошибки заполнения:</span>
          </div>
          <ul className="text-sm text-red-600 space-y-1">
            {formErrors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Тип справочника *</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData({ ...formData, type: value as ReferenceType, parentCode: '' })}
            disabled={isEdit}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(referenceTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!formData.type && (
            <p className="text-xs text-red-500">Тип справочника обязателен</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="code">Код *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="Уникальный код (A-Z, 0-9, _)"
            disabled={isEdit}
            className={!formData.code?.trim() || !/^[A-Z0-9_]+$/.test(formData.code) ? 'border-red-200' : ''}
          />
          {!formData.code?.trim() && (
            <p className="text-xs text-red-500">Код обязателен</p>
          )}
          {formData.code && !/^[A-Z0-9_]+$/.test(formData.code) && (
            <p className="text-xs text-red-500">Только заглавные буквы, цифры и подчеркивание</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name">Название *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Название элемента"
          className={!formData.name?.trim() ? 'border-red-200' : ''}
        />
        {!formData.name?.trim() && (
          <p className="text-xs text-red-500">Название обязательно</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Описание элемента"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="value">Значение</Label>
          <Input
            id="value"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder="Дополнительное значение"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Порядок сортировки</Label>
          <Input
            id="sortOrder"
            type="number"
            min="0"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
            placeholder="0"
            className={formData.sortOrder < 0 ? 'border-red-200' : ''}
          />
          {formData.sortOrder < 0 && (
            <p className="text-xs text-red-500">Порядок сортировки не может быть отрицательным</p>
          )}
        </div>
      </div>
      
      {parentOptions.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="parentCode">Родительский элемент</Label>
          <Select 
            value={formData.parentCode || 'no-parent'} 
            onValueChange={(value) => setFormData({ ...formData, parentCode: value === 'no-parent' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите родительский элемент" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-parent">Без родителя</SelectItem>
              {parentOptions.map((ref) => (
                <SelectItem key={ref.id} value={ref.code}>
                  {ref.name} ({ref.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="metadata">Метаданные (JSON)</Label>
        <Textarea
          id="metadata"
          value={formData.metadata}
          onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
          placeholder='{"key": "value"}'
          rows={3}
          className={formData.metadata && !isValidJSON(formData.metadata) ? 'border-red-200' : ''}
        />
        {formData.metadata && !isValidJSON(formData.metadata) && (
          <p className="text-xs text-red-500">Метаданные должны быть валидным JSON</p>
        )}
        <div className="bg-muted/50 p-3 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Примеры метаданных
          </h4>
          <div className="space-y-1 text-sm">
            <div>
              <code className="bg-background px-2 py-1 rounded text-xs">
                {`{"email": "contact@company.com"}`}
              </code>
            </div>
            <div>
              <code className="bg-background px-2 py-1 rounded text-xs">
                {`{"phone": "+7 (999) 123-45-67"}`}
              </code>
            </div>
            <div>
              <code className="bg-background px-2 py-1 rounded text-xs">
                {`{"address": "г. Москва, ул. Примерная, 1"}`}
              </code>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Активен</Label>
      </div>
    </div>
  )
}

// Вспомогательная функция для валидации JSON
function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}