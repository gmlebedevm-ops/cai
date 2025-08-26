'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Play, 
  Pause, 
  Settings, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  MoveUp,
  MoveDown,
  X,
  GripVertical,
  Eye,
  Save,
  FileText,
  ArrowRight,
  Info,
  HelpCircle,
  Sparkles,
  Users2
} from 'lucide-react'
import { Workflow, WorkflowStep, WorkflowStatus, WorkflowStepType, CreateWorkflowInput } from '@/types/workflow'
import { UserRole } from '@/types/contract'

// Интерфейс для роли из API
interface Role {
  id: string
  name: string
  description?: string
  isActive: boolean
  _count?: {
    users: number
  }
}

const statusColors = {
  [WorkflowStatus.ACTIVE]: 'bg-green-500',
  [WorkflowStatus.INACTIVE]: 'bg-gray-500',
  [WorkflowStatus.DRAFT]: 'bg-blue-500',
}

const statusLabels = {
  [WorkflowStatus.ACTIVE]: 'Активен',
  [WorkflowStatus.INACTIVE]: 'Неактивен',
  [WorkflowStatus.DRAFT]: 'Черновик',
}

const stepTypeLabels = {
  [WorkflowStepType.APPROVAL]: 'Согласование',
  [WorkflowStepType.REVIEW]: 'Проверка',
  [WorkflowStepType.NOTIFICATION]: 'Уведомление',
  [WorkflowStepType.CONDITION]: 'Условие',
}

const stepTypeIcons = {
  [WorkflowStepType.APPROVAL]: CheckCircle,
  [WorkflowStepType.REVIEW]: Users,
  [WorkflowStepType.NOTIFICATION]: AlertCircle,
  [WorkflowStepType.CONDITION]: Settings,
}

const stepTypeColors = {
  [WorkflowStepType.APPROVAL]: 'bg-blue-100 text-blue-700 border-blue-200',
  [WorkflowStepType.REVIEW]: 'bg-green-100 text-green-700 border-green-200',
  [WorkflowStepType.NOTIFICATION]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  [WorkflowStepType.CONDITION]: 'bg-purple-100 text-purple-700 border-purple-200',
}

const roleLabels = {
  [UserRole.INITIATOR]: 'Инициатор',
  [UserRole.INITIATOR_MANAGER]: 'Менеджер инициатора',
  [UserRole.DEPARTMENT_HEAD]: 'Руководитель отдела',
  [UserRole.CHIEF_LAWYER]: 'Главный юрист',
  [UserRole.GENERAL_DIRECTOR]: 'Генеральный директор',
  [UserRole.OFFICE_MANAGER]: 'Офис-менеджер',
  [UserRole.ADMINISTRATOR]: 'Администратор',
}

// Шаблоны маршрутов
const workflowTemplates = [
  {
    name: 'Стандартный маршрут',
    description: 'Базовый маршрут согласования для большинства договоров',
    steps: [
      { type: WorkflowStepType.APPROVAL, name: 'Согласование с руководителем', role: UserRole.DEPARTMENT_HEAD, dueDays: 3, isRequired: true },
      { type: WorkflowStepType.REVIEW, name: 'Юридическая проверка', role: UserRole.CHIEF_LAWYER, dueDays: 2, isRequired: true },
      { type: WorkflowStepType.APPROVAL, name: 'Согласование с директором', role: UserRole.GENERAL_DIRECTOR, dueDays: 1, isRequired: true },
    ]
  },
  {
    name: 'Упрощенный маршрут',
    description: 'Для небольших договоров до 300 тыс. ₽',
    steps: [
      { type: WorkflowStepType.APPROVAL, name: 'Согласование с менеджером', role: UserRole.INITIATOR_MANAGER, dueDays: 1, isRequired: true },
    ]
  },
  {
    name: 'Расширенный маршрут',
    description: 'Для крупных договоров с множественным согласованием',
    steps: [
      { type: WorkflowStepType.APPROVAL, name: 'Согласование с руководителем', role: UserRole.DEPARTMENT_HEAD, dueDays: 3, isRequired: true },
      { type: WorkflowStepType.REVIEW, name: 'Финансовая проверка', role: UserRole.DEPARTMENT_HEAD, dueDays: 2, isRequired: true },
      { type: WorkflowStepType.REVIEW, name: 'Юридическая проверка', role: UserRole.CHIEF_LAWYER, dueDays: 3, isRequired: true },
      { type: WorkflowStepType.CONDITION, name: 'Проверка условий', dueDays: 1, isRequired: false },
      { type: WorkflowStepType.APPROVAL, name: 'Согласование с директором', role: UserRole.GENERAL_DIRECTOR, dueDays: 2, isRequired: true },
      { type: WorkflowStepType.NOTIFICATION, name: 'Уведомление офис-менеджера', role: UserRole.OFFICE_MANAGER, dueDays: 1, isRequired: false },
    ]
  }
]

interface EnhancedWorkflowFormProps {
  formData: CreateWorkflowInput
  setFormData: (data: CreateWorkflowInput) => void
  addStep: () => void
  updateStep: (index: number, field: string, value: any) => void
  removeStep: (index: number) => void
  moveStep: (index: number, direction: 'up' | 'down') => void
  mode?: 'create' | 'edit'
  onSave?: () => void
  onCancel?: () => void
  initialSelectedTemplate?: string
}

export default function EnhancedWorkflowForm({
  formData,
  setFormData,
  addStep,
  updateStep,
  removeStep,
  moveStep,
  mode = 'create',
  onSave,
  onCancel,
  initialSelectedTemplate
}: EnhancedWorkflowFormProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [previewMode, setPreviewMode] = useState(mode === 'edit' ? false : false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>(initialSelectedTemplate || (mode === 'edit' ? 'custom' : ''))
  const [activeTab, setActiveTab] = useState(mode === 'edit' ? 'basic' : 'basic')
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)

  // Загрузка ролей из API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/roles-management?includePermissions=false')
        if (response.ok) {
          const data = await response.json()
          setRoles(data.roles || [])
        }
      } catch (error) {
        console.error('Error fetching roles:', error)
      } finally {
        setLoadingRoles(false)
      }
    }

    fetchRoles()
  }, [])

  // Эффект для инициализации полей параллельного согласования при загрузке данных
  useEffect(() => {
    if (formData.steps && formData.steps.length > 0) {
      const updatedSteps = formData.steps.map(step => ({
        ...step,
        isParallel: step.parallelRoles && step.parallelRoles.length > 0,
        parallelRoleIds: step.parallelRoles?.map(pr => pr.roleId) || []
      }))
      
      // Проверяем, нужно ли обновить состояние
      const needsUpdate = updatedSteps.some((step, index) => {
        const originalStep = formData.steps[index]
        return step.isParallel !== originalStep.isParallel || 
               JSON.stringify(step.parallelRoleIds) !== JSON.stringify(originalStep.parallelRoleIds)
      })
      
      if (needsUpdate) {
        setFormData(prev => ({
          ...prev,
          steps: updatedSteps
        }))
      }
    }
  }, [formData.steps])

  // Эффект для автоматического переключения на вкладку предпросмотра
  useEffect(() => {
    if (previewMode) {
      setActiveTab('preview')
    } else if (activeTab === 'preview') {
      setActiveTab('basic')
    }
  }, [previewMode, activeTab])

  const applyTemplate = (templateIndex: number) => {
    const template = workflowTemplates[templateIndex]
    setFormData({
      ...formData,
      name: formData.name || template.name,
      description: formData.description || template.description,
      steps: template.steps.map((step, index) => ({
        name: step.name,
        type: step.type,
        description: '',
        conditions: '',
        isRequired: step.isRequired,
        dueDays: step.dueDays,
        role: step.role,
        userId: undefined
      }))
    })
    setSelectedTemplate(template.name)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return

    const steps = [...(formData.steps || [])]
    const [draggedStep] = steps.splice(draggedIndex, 1)
    steps.splice(targetIndex, 0, draggedStep)

    setFormData({ ...formData, steps })
    setDraggedIndex(null)
  }

  const validateForm = () => {
    if (!formData.name.trim()) return false
    if (!formData.steps || formData.steps.length === 0) return false
    
    return formData.steps.every(step => 
      step.name.trim() && 
      step.type && 
      (step.type !== WorkflowStepType.APPROVAL || 
        step.roleId || 
        (step.isParallel && step.parallelRoleIds && step.parallelRoleIds.length > 0))
    )
  }

  const getStepValidationErrors = (step: any, index: number) => {
    const errors: string[] = []
    
    if (!step.name.trim()) {
      errors.push('Название шага обязательно')
    }
    
    if (!step.type) {
      errors.push('Тип шага обязателен')
    }
    
    if (step.type === WorkflowStepType.APPROVAL) {
      if (!step.roleId && (!step.isParallel || !step.parallelRoleIds || step.parallelRoleIds.length === 0)) {
        errors.push('Для согласования необходимо указать хотя бы одну роль')
      }
    }
    
    return errors
  }

  return (
    <div className="space-y-6">
      {/* Шапка с действиями */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-semibold">
            {mode === 'create' ? 'Создание маршрута согласования' : 'Редактирование маршрута'}
            {previewMode && (
              <Badge variant="secondary" className="ml-2">
                <Eye className="h-3 w-3 mr-1" />
                Режим предпросмотра
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            {previewMode 
              ? 'Вы просматриваете маршрут в режиме предпросмотра. Нажмите "Редактировать" для внесения изменений.'
              : mode === 'create' 
                ? 'Настройте новый маршрут для согласования договоров' 
                : 'Измените настройки маршрута'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (previewMode) {
                setPreviewMode(false)
                setActiveTab('basic')
              } else {
                setPreviewMode(true)
                setActiveTab('preview')
              }
            }}
            className="flex-1 sm:flex-none"
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Редактировать' : 'Предпросмотр'}
          </Button>
          
          {onSave && (
            <Button
              onClick={onSave}
              disabled={!validateForm()}
              className="flex-1 sm:flex-none"
            >
              <Save className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
          )}
        </div>
      </div>

      {/* Индикатор заполнения */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Заполнение формы</span>
            <span className="text-sm text-muted-foreground">
              {validateForm() ? '100%' : 'Не завершено'}
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                validateForm() ? 'bg-green-500 w-full' : 'bg-yellow-500 w-2/3'
              }`}
            />
          </div>
          {!validateForm() && (
            <p className="text-xs text-muted-foreground mt-2">
              Заполните обязательные поля: название маршрута и добавьте хотя бы один шаг
            </p>
          )}
        </CardContent>
      </Card>

      {/* Выбор шаблона */}
      {!selectedTemplate && mode === 'create' && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <FileText className="h-5 w-5" />
              Шаблоны маршрутов
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Выберите шаблон для быстрого создания маршрута или начните с нуля
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {workflowTemplates.map((template, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-primary/50 hover:scale-[1.02]"
                  onClick={() => applyTemplate(index)}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm sm:text-base">{template.name}</h4>
                        <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{template.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {template.steps.slice(0, 3).map((step, i) => {
                          const StepIcon = stepTypeIcons[step.type]
                          return (
                            <Badge key={i} variant="secondary" className="text-xs">
                              <StepIcon className="h-3 w-3 mr-1" />
                              {stepTypeLabels[step.type]}
                            </Badge>
                          )
                        })}
                        {template.steps.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.steps.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => setSelectedTemplate('custom')} className="w-full sm:w-auto">
                Начать с нуля
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(selectedTemplate || mode === 'edit') && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-muted rounded-lg">
            <TabsTrigger value="basic" className="text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm" disabled={previewMode}>
              Основные
            </TabsTrigger>
            <TabsTrigger value="steps" className="text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm" disabled={previewMode}>
              Шаги
            </TabsTrigger>
            <TabsTrigger value="conditions" className="text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm" disabled={previewMode}>
              Условия
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Предпросмотр
            </TabsTrigger>
          </TabsList>

          {/* Основные настройки */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  Название маршрута *
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Например: Стандартный маршрут согласования"
                  className={!formData.name.trim() ? 'border-red-200' : ''}
                />
                {!formData.name.trim() && (
                  <p className="text-xs text-red-500">Название маршрута обязательно</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Статус</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value as WorkflowStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${statusColors[key as WorkflowStatus]}`} />
                          {label}
                        </div>
                      </SelectItem>
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
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Опишите назначение и особенности этого маршрута согласования"
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Шаги согласования */}
          <TabsContent value="steps" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium">Шаги согласования</h3>
                <p className="text-sm text-muted-foreground">
                  Добавьте и настройте шаги маршрута. Перетаскивайте шаги для изменения порядка.
                </p>
              </div>
              <Button type="button" onClick={addStep} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Добавить шаг
              </Button>
            </div>
            
            <div className="space-y-4">
              {formData.steps?.map((step, index) => {
                const StepIcon = stepTypeIcons[step.type]
                const errors = getStepValidationErrors(step, index)
                
                return (
                  <Card 
                    key={index}
                    className={`transition-all duration-200 ${errors.length > 0 ? 'border-red-200 bg-red-50' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="cursor-grab active:cursor-grabbing flex-shrink-0">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <StepIcon className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium truncate">Шаг {index + 1}</span>
                            <Badge className={`${stepTypeColors[step.type]} flex-shrink-0`}>
                              {stepTypeLabels[step.type]}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveStep(index, 'up')}
                            disabled={index === 0}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveStep(index, 'down')}
                            disabled={index === (formData.steps?.length || 0) - 1}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {errors.length > 0 && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded">
                          <p className="text-xs text-red-700">
                            {errors.join(', ')}
                          </p>
                        </div>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Название шага *</Label>
                          <Input
                            value={step.name}
                            onChange={(e) => updateStep(index, 'name', e.target.value)}
                            placeholder="Название шага"
                            className={!step.name.trim() ? 'border-red-200' : ''}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Тип шага *</Label>
                          <Select 
                            value={step.type} 
                            onValueChange={(value) => updateStep(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(stepTypeLabels).map(([key, label]) => {
                                const IconComponent = stepTypeIcons[key as WorkflowStepType]
                                return (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      {IconComponent && (
                                        <IconComponent className="h-4 w-4" />
                                      )}
                                      {label}
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Дней на выполнение</Label>
                          <Input
                            type="number"
                            min="1"
                            max="30"
                            value={step.dueDays || ''}
                            onChange={(e) => updateStep(index, 'dueDays', parseInt(e.target.value) || undefined)}
                            placeholder="3"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Обязательный шаг</Label>
                            <Switch
                              checked={step.isRequired}
                              onCheckedChange={(checked) => updateStep(index, 'isRequired', checked)}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Если шаг не обязателен, процесс может продолжиться без его выполнения
                          </p>
                        </div>
                      </div>
                      
                      {step.type === WorkflowStepType.APPROVAL && (
                        <div className="space-y-4 border-t pt-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-base font-medium">Настройки согласования</Label>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`parallel-${index}`}
                                  checked={step.isParallel || false}
                                  onCheckedChange={(checked) => {
                                    // При переключении режима очищаем соответствующие поля
                                    if (checked) {
                                      // Включаем параллельное согласование - очищаем roleId
                                      updateStep(index, 'roleId', undefined)
                                    } else {
                                      // Отключаем параллельное согласование - очищаем parallelRoleIds
                                      updateStep(index, 'parallelRoleIds', [])
                                    }
                                    updateStep(index, 'isParallel', checked)
                                  }}
                                />
                                <Label htmlFor={`parallel-${index}`} className="text-sm font-normal">
                                  Параллельное согласование
                                </Label>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Роль согласующего *</Label>
                              
                              {loadingRoles ? (
                                <div className="flex items-center justify-center h-10 border rounded-md">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                </div>
                              ) : step.isParallel ? (
                                // Параллельное согласование - выбор нескольких ролей
                                <div className="space-y-2">
                                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto bg-muted/30">
                                    <div className="space-y-2">
                                      {roles.filter(role => role.isActive).map((role) => (
                                        <div key={role.id} className="flex items-center space-x-2 py-1 hover:bg-muted/50 rounded px-1">
                                          <Checkbox
                                            id={`role-${index}-${role.id}`}
                                            checked={step.parallelRoleIds?.includes(role.id) || false}
                                            onCheckedChange={(checked) => {
                                              const currentIds = step.parallelRoleIds || []
                                              const newIds = checked 
                                                ? [...currentIds, role.id]
                                                : currentIds.filter(id => id !== role.id)
                                              updateStep(index, 'parallelRoleIds', newIds)
                                            }}
                                          />
                                          <div className="flex-1">
                                            <Label htmlFor={`role-${index}-${role.id}`} className="text-sm cursor-pointer font-medium">
                                              {role.name}
                                            </Label>
                                            {role.description && (
                                              <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  {(step.parallelRoleIds?.length || 0) === 0 && (
                                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-md">
                                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                      <p className="text-xs">Выберите хотя бы одну роль для согласования</p>
                                    </div>
                                  )}
                                  {(step.parallelRoleIds?.length || 0) > 0 && (
                                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-md">
                                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                      <p className="text-xs">
                                        Выбрано ролей: {step.parallelRoleIds?.length}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                // Одиночное согласование - выбор одной роли
                                <Select 
                                  value={step.roleId || ''} 
                                  onValueChange={(value) => updateStep(index, 'roleId', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите роль для согласования" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {roles.filter(role => role.isActive).map((role) => (
                                      <SelectItem key={role.id} value={role.id}>
                                        <div className="py-1">
                                          <div className="font-medium">{role.name}</div>
                                          {role.description && (
                                            <div className="text-xs text-muted-foreground mt-0.5">{role.description}</div>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label>Описание шага</Label>
                          <Textarea
                            value={step.description}
                            onChange={(e) => updateStep(index, 'description', e.target.value)}
                            placeholder="Опишите, что нужно сделать на этом шаге"
                            rows={2}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {(!formData.steps || formData.steps.length === 0) && (
                <Card className="border-dashed">
                  <CardContent className="text-center py-12">
                    <div className="space-y-3">
                      <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-muted-foreground">Нет добавленных шагов согласования</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Нажмите "Добавить шаг" чтобы начать создавать маршрут
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Условия применения */}
          <TabsContent value="conditions" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Условия применения маршрута</h3>
                <p className="text-sm text-muted-foreground">
                  Настройте автоматические условия для применения этого маршрута
                </p>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="conditions">JSON-условия</Label>
                      <Textarea
                        id="conditions"
                        value={formData.conditions}
                        onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                        placeholder='{
  "amount": { "min": 300000, "max": 1000000 },
  "contractType": "SERVICE",
  "department": "IT"
}'
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>
                    
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Примеры условий
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <code className="bg-background px-2 py-1 rounded text-xs">
                            {`{"amount": {"min": 300000}}`}
                          </code>
                          <span className="text-muted-foreground ml-2">- для договоров от 300 тыс. ₽</span>
                        </div>
                        <div>
                          <code className="bg-background px-2 py-1 rounded text-xs">
                            {`{"contractType": "SERVICE"}`}
                          </code>
                          <span className="text-muted-foreground ml-2">- для договоров услуг</span>
                        </div>
                        <div>
                          <code className="bg-background px-2 py-1 rounded text-xs">
                            {`{"department": "IT"}`}
                          </code>
                          <span className="text-muted-foreground ml-2">- для IT отдела</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Предпросмотр */}
          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Предпросмотр маршрута</h3>
                <p className="text-sm text-muted-foreground">
                  Визуальное представление созданного маршрута согласования
                </p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${statusColors[formData.status || WorkflowStatus.DRAFT]}`} />
                    {formData.name || 'Новый маршрут'}
                  </CardTitle>
                  {formData.description && (
                    <p className="text-muted-foreground">{formData.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formData.steps && formData.steps.length > 0 ? (
                      <div className="space-y-4">
                        {formData.steps.map((step, index) => {
                          const StepIcon = stepTypeIcons[step.type]
                          return (
                            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                              <div className="flex flex-col items-center flex-shrink-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stepTypeColors[step.type]}`}>
                                  <StepIcon className="h-5 w-5" />
                                </div>
                                {index < formData.steps.length - 1 && (
                                  <div className="w-0.5 h-8 bg-border mt-2 hidden sm:block" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                  <span className="font-medium truncate">{step.name}</span>
                                  <div className="flex flex-wrap gap-1">
                                    <Badge variant="outline" className="text-xs">
                                      {stepTypeLabels[step.type]}
                                    </Badge>
                                    {step.role && (
                                      <Badge variant="secondary" className="text-xs">
                                        {roleLabels[step.role]}
                                      </Badge>
                                    )}
                                    {step.dueDays && (
                                      <Badge variant="outline" className="text-xs">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {step.dueDays} дн.
                                      </Badge>
                                    )}
                                    {!step.isRequired && (
                                      <Badge variant="outline" className="text-xs text-muted-foreground">
                                        Необязательно
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {step.description && (
                                  <p className="text-sm text-muted-foreground break-words">{step.description}</p>
                                )}
                              </div>
                              
                              {index < formData.steps.length - 1 && (
                                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 hidden sm:block mt-6" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Шаги не добавлены
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}