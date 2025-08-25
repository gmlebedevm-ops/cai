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
  X
} from 'lucide-react'
import { Workflow, WorkflowStep, WorkflowStatus, WorkflowStepType, CreateWorkflowInput } from '@/types/workflow'
import { useAuth } from '@/hooks/use-auth'
import EnhancedWorkflowForm from '@/components/workflows/enhanced-workflow-form'

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

export default function WorkflowsPage() {
  const { user } = useAuth()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)

  // Форма создания/редактирования
  const [formData, setFormData] = useState<CreateWorkflowInput>({
    name: '',
    description: '',
    status: WorkflowStatus.DRAFT,
    conditions: '',
    steps: []
  })

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter })
      })
      
      const response = await fetch(`/api/workflows?${params}`)
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data)
      }
    } catch (error) {
      console.error('Error fetching workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateWorkflow = async () => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setCreateDialogOpen(false)
        setFormData({
          name: '',
          description: '',
          status: WorkflowStatus.DRAFT,
          conditions: '',
          steps: []
        })
        fetchWorkflows()
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
    }
  }

  const handleUpdateWorkflow = async () => {
    if (!selectedWorkflow) return

    try {
      const response = await fetch(`/api/workflows/${selectedWorkflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setEditDialogOpen(false)
        setSelectedWorkflow(null)
        setFormData({
          name: '',
          description: '',
          status: WorkflowStatus.DRAFT,
          conditions: '',
          steps: []
        })
        fetchWorkflows()
      }
    } catch (error) {
      console.error('Error updating workflow:', error)
    }
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот маршрут согласования?')) return

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchWorkflows()
      }
    } catch (error) {
      console.error('Error deleting workflow:', error)
    }
  }

  const handleToggleStatus = async (workflowId: string, currentStatus: WorkflowStatus) => {
    const newStatus = currentStatus === WorkflowStatus.ACTIVE ? WorkflowStatus.INACTIVE : WorkflowStatus.ACTIVE
    
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchWorkflows()
      }
    } catch (error) {
      console.error('Error toggling workflow status:', error)
    }
  }

  const handleSetDefault = async (workflowId: string) => {
    try {
      // Сначала снимаем флаг по умолчанию со всех маршрутов
      await Promise.all(
        workflows
          .filter(w => w.isDefault && w.id !== workflowId)
          .map(w => 
            fetch(`/api/workflows/${w.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isDefault: false })
            })
          )
      )

      // Устанавливаем новый маршрут по умолчанию
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true })
      })

      if (response.ok) {
        fetchWorkflows()
      }
    } catch (error) {
      console.error('Error setting default workflow:', error)
    }
  }

  const openEditDialog = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      status: workflow.status,
      conditions: workflow.conditions || '',
      steps: workflow.steps || []
    })
    setEditDialogOpen(true)
  }

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [
        ...(prev.steps || []),
        {
          name: '',
          type: WorkflowStepType.APPROVAL,
          description: '',
          conditions: '',
          isRequired: true,
          dueDays: 3,
          role: undefined,
          userId: undefined
        }
      ]
    }))
  }

  const updateStep = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      ) || []
    }))
  }

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.filter((_, i) => i !== index) || []
    }))
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const steps = [...(formData.steps || [])]
    if (direction === 'up' && index > 0) {
      [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]]
    } else if (direction === 'down' && index < steps.length - 1) {
      [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]]
    }
    setFormData(prev => ({ ...prev, steps }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка маршрутов согласования...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Маршруты согласования</h1>
          <p className="text-muted-foreground">
            Управление маршрутами согласования договоров
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Создать маршрут
            </Button>
          </DialogTrigger>
          <DialogContent className="adaptive-dialog max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4 border-b">
              <DialogTitle className="text-xl">Создание маршрута согласования</DialogTitle>
              <DialogDescription className="text-base">
                Настройте новый маршрут согласования договоров
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-shrink-0 overflow-y-auto max-h-[calc(90vh-200px)]">
              <EnhancedWorkflowForm
                formData={formData}
                setFormData={setFormData}
                addStep={addStep}
                updateStep={updateStep}
                removeStep={removeStep}
                moveStep={moveStep}
                mode="create"
                onSave={handleCreateWorkflow}
                onCancel={() => setCreateDialogOpen(false)}
              />
            </div>
            
            <DialogFooter className="flex-shrink-0 pt-4 border-t flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="w-full sm:w-auto">
                Отмена
              </Button>
              <Button onClick={handleCreateWorkflow} className="w-full sm:w-auto">
                Создать маршрут
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              placeholder="Поиск по названию или описанию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Workflows List */}
      <div className="grid gap-4">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <Badge className={`${statusColors[workflow.status]} text-white`}>
                      {statusLabels[workflow.status]}
                    </Badge>
                    {workflow.isDefault && (
                      <Badge variant="secondary">По умолчанию</Badge>
                    )}
                  </div>
                  {workflow.description && (
                    <p className="text-muted-foreground text-sm">{workflow.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Шагов: {workflow.steps?.length || 0}</span>
                    <span>Договоров: {workflow.contracts?.length || 0}</span>
                    <span>Версия: {workflow.version}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(workflow.id, workflow.status)}
                  >
                    {workflow.status === WorkflowStatus.ACTIVE ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Отключить
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Включить
                      </>
                    )}
                  </Button>
                  {!workflow.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(workflow.id)}
                    >
                      По умолчанию
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(workflow)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Изменить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Удалить
                  </Button>
                </div>
              </div>
            </CardHeader>
            {workflow.steps && workflow.steps.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Шаги согласования:</h4>
                  <div className="flex flex-wrap gap-2">
                    {workflow.steps.map((step, index) => {
                      const StepIcon = stepTypeIcons[step.type]
                      return (
                        <div
                          key={step.id}
                          className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md text-sm"
                        >
                          <StepIcon className="h-4 w-4" />
                          <span>{index + 1}. {step.name}</span>
                          <span className="text-muted-foreground">
                            ({stepTypeLabels[step.type]})
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
        
        {filteredWorkflows.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Маршруты не найдены' 
                  : 'Нет созданных маршрутов согласования'
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
            <DialogTitle className="text-xl">Редактирование маршрута согласования</DialogTitle>
            <DialogDescription className="text-base">
              Измените настройки маршрута согласования
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-shrink-0 overflow-y-auto max-h-[calc(90vh-200px)]">
              <EnhancedWorkflowForm
                formData={formData}
                setFormData={setFormData}
                addStep={addStep}
                updateStep={updateStep}
                removeStep={removeStep}
                moveStep={moveStep}
                mode="edit"
                onSave={handleUpdateWorkflow}
                onCancel={() => setEditDialogOpen(false)}
              />
            </div>
          
          <DialogFooter className="flex-shrink-0 pt-4 border-t flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="w-full sm:w-auto">
              Отмена
            </Button>
            <Button onClick={handleUpdateWorkflow} className="w-full sm:w-auto">
              Сохранить изменения
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}