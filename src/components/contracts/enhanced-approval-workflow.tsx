'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar, 
  AlertTriangle,
  Settings,
  Users,
  Route,
  Timer,
  Bell,
  ArrowRight,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react'
import { Approval, Contract } from '@/types/contract'
import { format, addDays, isAfter, isBefore, differenceInDays } from 'date-fns'
import { ru } from 'date-fns/locale'

interface EnhancedApprovalWorkflowProps {
  contract: Contract
  currentUserId?: string
  onApprovalUpdate?: () => void
}

interface WorkflowRule {
  id: string
  name: string
  description: string
  conditions: {
    amount?: number
    contractType?: string
    department?: string
    riskLevel?: 'low' | 'medium' | 'high'
  }
  approvers: {
    role: string
    userId?: string
    duration: number
    required: boolean
  }[]
  parallel: boolean
  autoAssign: boolean
}

interface WorkflowStep {
  id: string
  title: string
  description: string
  role: string
  duration: number // в днях
  approvers: Approval[]
  isActive: boolean
  dueDate?: Date
  escalated: boolean
  delegatedTo?: string
}

interface DelegationRule {
  id: string
  fromUserId: string
  toUserId: string
  startDate: Date
  endDate: Date
  reason: string
  active: boolean
}

export function EnhancedApprovalWorkflow({ contract, currentUserId, onApprovalUpdate }: EnhancedApprovalWorkflowProps) {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([])
  const [delegationRules, setDelegationRules] = useState<DelegationRule[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true)
  const [escalationEnabled, setEscalationEnabled] = useState(true)

  useEffect(() => {
    fetchApprovals()
    fetchWorkflowRules()
    fetchDelegationRules()
    startDeadlineMonitoring()
  }, [contract.id])

  // Автоматическое назначение согласующих при загрузке, если их нет
  useEffect(() => {
    if (autoAssignEnabled && Array.isArray(approvals) && approvals.length === 0) {
      const timer = setTimeout(() => {
        autoAssignApprovers()
      }, 1000) // Небольшая задержка чтобы убедиться, что все данные загружены
      
      return () => clearTimeout(timer)
    }
  }, [approvals, autoAssignEnabled, contract.id])

  const fetchApprovals = async () => {
    try {
      const response = await fetch(`/api/approvals?contractId=${contract.id}`)
      if (response.ok) {
        const data = await response.json()
        setApprovals(data.approvals || data) // Handle both cases: with pagination and without
      }
    } catch (error) {
      console.error('Error fetching approvals:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkflowRules = async () => {
    try {
      const response = await fetch('/api/workflow-rules')
      if (response.ok) {
        const data = await response.json()
        setWorkflowRules(data)
      }
    } catch (error) {
      console.error('Error fetching workflow rules:', error)
    }
  }

  const fetchDelegationRules = async () => {
    try {
      const response = await fetch('/api/delegation-rules')
      if (response.ok) {
        const data = await response.json()
        setDelegationRules(data)
      }
    } catch (error) {
      console.error('Error fetching delegation rules:', error)
    }
  }

  const startDeadlineMonitoring = () => {
    // Проверяем сроки каждые 5 минут
    const interval = setInterval(() => {
      checkDeadlines()
    }, 300000)

    return () => clearInterval(interval)
  }

  const checkDeadlines = () => {
    const now = new Date()
    if (Array.isArray(approvals)) {
      approvals.forEach(approval => {
        if (approval.status === 'PENDING' && approval.dueDate) {
          const dueDate = new Date(approval.dueDate)
          const daysUntilDue = differenceInDays(dueDate, now)
          
          // Уведомление за 1 день до дедлайна
          if (daysUntilDue === 1) {
            sendDeadlineNotification(approval, 'approaching')
          }
          
          // Эскалация при просрочке
          if (daysUntilDue < 0 && escalationEnabled) {
            escalateApproval(approval)
          }
        }
      })
    }
  }

  const sendDeadlineNotification = async (approval: Approval, type: 'approaching' | 'overdue') => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type === 'approaching' ? 'DEADLINE_APPROACHING' : 'DEADLINE_OVERDUE',
          title: type === 'approaching' ? 'Срок согласования подходит' : 'Срок согласования просрочен',
          message: `По договору ${contract.number} требуется ваше согласование. Срок: ${new Date(approval.dueDate!).toLocaleDateString('ru-RU')}`,
          userId: approval.approverId,
          contractId: contract.id,
          actionUrl: `/contracts/${contract.id}`
        })
      })
    } catch (error) {
      console.error('Error sending deadline notification:', error)
    }
  }

  const escalateApproval = async (approval: Approval) => {
    try {
      // Автоматическое продление срока на 1 день
      const newDueDate = addDays(new Date(approval.dueDate!), 1)
      
      await fetch('/api/approvals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalId: approval.id,
          dueDate: newDueDate,
          escalated: true
        })
      })

      // Уведомление о эскалации
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'ESCALATION',
          title: 'Эскалация согласования',
          message: `Срок согласования по договору ${contract.number} был продлен до ${newDueDate.toLocaleDateString('ru-RU')}`,
          userId: approval.approverId,
          contractId: contract.id,
          actionUrl: `/contracts/${contract.id}`
        })
      })

      fetchApprovals()
    } catch (error) {
      console.error('Error escalating approval:', error)
    }
  }

  const autoAssignApprovers = async () => {
    if (!autoAssignEnabled) return

    try {
      // Определение правил маршрутизации на основе параметров договора
      const applicableRules = workflowRules.filter(rule => {
        if (rule.conditions.amount && contract.amount < rule.conditions.amount) return false
        if (rule.conditions.contractType && contract.type !== rule.conditions.contractType) return false
        return true
      })

      // Автоматическое назначение согласующих
      for (const rule of applicableRules) {
        for (const approverConfig of rule.approvers) {
          // Проверка на делегирование полномочий
          const delegation = delegationRules.find(d => 
            d.fromUserId === approverConfig.userId && 
            d.active && 
            isAfter(new Date(), d.startDate) && 
            isBefore(new Date(), d.endDate)
          )

          const finalApproverId = delegation?.toUserId || approverConfig.userId

          // Создание записи согласования
          await fetch('/api/approvals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contractId: contract.id,
              approverId: finalApproverId,
              workflowStep: rule.approvers.indexOf(approverConfig) + 1,
              dueDate: addDays(new Date(), approverConfig.duration),
              status: 'PENDING'
            })
          })

          // Уведомление назначенному согласующему
          await fetch('/api/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'APPROVAL_REQUESTED',
              title: 'Новое согласование',
              message: `Вам назначено согласование договора ${contract.number}`,
              userId: finalApproverId,
              contractId: contract.id,
              actionUrl: `/contracts/${contract.id}`
            })
          })
        }
      }

      fetchApprovals()
    } catch (error) {
      console.error('Error auto-assigning approvers:', error)
    }
  }

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'manager',
      title: 'Согласование с руководителем',
      description: 'Руководитель инициатора проверяет экономическую целесообразность',
      role: 'INITIATOR_MANAGER',
      duration: 2,
      approvers: Array.isArray(approvals) ? approvals.filter(a => a.workflowStep === 1) : [],
      isActive: true,
      dueDate: Array.isArray(approvals) && approvals.find(a => a.workflowStep === 1)?.dueDate ? new Date(approvals.find(a => a.workflowStep === 1)!.dueDate!) : undefined,
      escalated: Array.isArray(approvals) && approvals.find(a => a.workflowStep === 1)?.escalated || false
    },
    {
      id: 'finance',
      title: 'Финансовая экспертиза',
      description: 'Начальник ПЭО проверяет финансовые условия договора',
      role: 'DEPARTMENT_HEAD',
      duration: 3,
      approvers: Array.isArray(approvals) ? approvals.filter(a => a.workflowStep === 2) : [],
      isActive: Array.isArray(approvals) && approvals.filter(a => a.workflowStep === 1).every(a => a.status === 'APPROVED'),
      dueDate: Array.isArray(approvals) && approvals.find(a => a.workflowStep === 2)?.dueDate ? new Date(approvals.find(a => a.workflowStep === 2)!.dueDate!) : undefined,
      escalated: Array.isArray(approvals) && approvals.find(a => a.workflowStep === 2)?.escalated || false
    },
    {
      id: 'legal',
      title: 'Юридическая проверка',
      description: 'Начальник юридического отдела проверяет юридические аспекты',
      role: 'DEPARTMENT_HEAD',
      duration: 3,
      approvers: Array.isArray(approvals) ? approvals.filter(a => a.workflowStep === 3) : [],
      isActive: Array.isArray(approvals) && approvals.filter(a => a.workflowStep === 2).every(a => a.status === 'APPROVED'),
      dueDate: Array.isArray(approvals) && approvals.find(a => a.workflowStep === 3)?.dueDate ? new Date(approvals.find(a => a.workflowStep === 3)!.dueDate!) : undefined,
      escalated: Array.isArray(approvals) && approvals.find(a => a.workflowStep === 3)?.escalated || false
    },
    {
      id: 'chief_lawyer',
      title: 'Проверка главным юристом',
      description: 'Главный юрист финальная проверка и формирование ПСР при необходимости',
      role: 'CHIEF_LAWYER',
      duration: 2,
      approvers: Array.isArray(approvals) ? approvals.filter(a => a.workflowStep === 4) : [],
      isActive: Array.isArray(approvals) && approvals.filter(a => a.workflowStep === 3).every(a => a.status === 'APPROVED'),
      dueDate: Array.isArray(approvals) && approvals.find(a => a.workflowStep === 4)?.dueDate ? new Date(approvals.find(a => a.workflowStep === 4)!.dueDate!) : undefined,
      escalated: Array.isArray(approvals) && approvals.find(a => a.workflowStep === 4)?.escalated || false
    },
    {
      id: 'director',
      title: 'Согласование генеральным директором',
      description: 'Финальное согласование договора',
      role: 'GENERAL_DIRECTOR',
      duration: 1,
      approvers: Array.isArray(approvals) ? approvals.filter(a => a.workflowStep === 5) : [],
      isActive: Array.isArray(approvals) && approvals.filter(a => a.workflowStep === 4).every(a => a.status === 'APPROVED'),
      dueDate: Array.isArray(approvals) && approvals.find(a => a.workflowStep === 5)?.dueDate ? new Date(approvals.find(a => a.workflowStep === 5)!.dueDate!) : undefined,
      escalated: Array.isArray(approvals) && approvals.find(a => a.workflowStep === 5)?.escalated || false
    }
  ]

  const handleApproval = async (approvalId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch('/api/approvals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalId,
          status,
          comment: comment || undefined
        })
      })

      if (response.ok) {
        setComment('')
        setSelectedApproval(null)
        fetchApprovals()
        onApprovalUpdate?.()

        // Автоматическое назначение следующих согласующих
        if (status === 'APPROVED') {
          autoAssignApprovers()
        }
      }
    } catch (error) {
      console.error('Error updating approval:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500'
      case 'APPROVED': return 'bg-green-500'
      case 'REJECTED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />
      case 'REJECTED': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Ожидает'
      case 'APPROVED': return 'Согласовано'
      case 'REJECTED': return 'Отклонено'
      default: return 'Неизвестно'
    }
  }

  const getDeadlineStatus = (dueDate?: Date) => {
    if (!dueDate) return null
    
    const now = new Date()
    const daysUntilDue = differenceInDays(dueDate, now)
    
    if (daysUntilDue < 0) return { color: 'text-red-600', label: 'Просрочено', icon: AlertTriangle }
    if (daysUntilDue <= 1) return { color: 'text-orange-600', label: 'Скоро', icon: Clock }
    return { color: 'text-green-600', label: 'В срок', icon: CheckCircle }
  }

  const canUserApprove = (approval: Approval) => {
    return approval.status === 'PENDING' && approval.approverId === currentUserId
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка маршрута согласования...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Маршрут согласования</h3>
          <Badge variant={contract.status === 'IN_REVIEW' ? 'default' : 'secondary'}>
            {contract.status === 'IN_REVIEW' ? 'На согласовании' : 'Статус: ' + contract.status}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Настройки
          </Button>
          {approvals.length === 0 && (
            <Button
              size="sm"
              onClick={autoAssignApprovers}
            >
              <Users className="h-4 w-4 mr-2" />
              Назначить согласующих
            </Button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Настройки маршрута согласования
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Автоматическое назначение согласующих</Label>
                <p className="text-sm text-muted-foreground">
                  Автоматически назначать согласующих на основе правил маршрутизации
                </p>
              </div>
              <Switch
                checked={autoAssignEnabled}
                onCheckedChange={setAutoAssignEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Автоматическая эскалация</Label>
                <p className="text-sm text-muted-foreground">
                  Автоматически продлевать сроки и уведомлять при просрочке
                </p>
              </div>
              <Switch
                checked={escalationEnabled}
                onCheckedChange={setEscalationEnabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Правила маршрутизации</Label>
                <div className="space-y-2">
                  {workflowRules.slice(0, 3).map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{rule.name}</span>
                      <Button variant="ghost" size="sm">
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-3 w-3 mr-2" />
                    Добавить правило
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Делегирование полномочий</Label>
                <div className="space-y-2">
                  {delegationRules.slice(0, 3).map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">
                        {rule.fromUserId} → {rule.toUserId}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-3 w-3 mr-2" />
                    Добавить делегирование
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Steps */}
      <div className="space-y-4">
        {workflowSteps.map((step, index) => (
          <Card 
            key={step.id} 
            className={`transition-all ${
              step.isActive ? 'border-blue-200' : 'border-gray-200 opacity-60'
            } ${step.escalated ? 'border-orange-200' : ''}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    step.isActive ? 'bg-blue-500' : 'bg-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {step.title}
                      {step.escalated && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  {step.duration} дн.
                  {step.dueDate && (
                    <span className={`flex items-center gap-1 ${getDeadlineStatus(step.dueDate)?.color}`}>
                      {(() => {
                        const deadlineStatus = getDeadlineStatus(step.dueDate);
                        return deadlineStatus?.icon ? (
                          <deadlineStatus.icon className="h-3 w-3" />
                        ) : null;
                      })()}
                      {getDeadlineStatus(step.dueDate)?.label}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {step.approvers.length > 0 ? (
                <div className="space-y-3">
                  {step.approvers.map((approval) => (
                    <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {approval.approver?.name?.charAt(0) || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {approval.approver?.name || 'Неизвестный пользователь'}
                            {approval.delegatedTo && (
                              <Badge variant="outline" className="text-xs">
                                Делегировано
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{approval.approver?.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {approval.dueDate && (
                          <div className="text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {format(new Date(approval.dueDate), 'dd MMM yyyy', { locale: ru })}
                          </div>
                        )}
                        
                        <Badge className={`${getStatusColor(approval.status)} text-white flex items-center gap-1`}>
                          {getStatusIcon(approval.status)}
                          {getStatusLabel(approval.status)}
                        </Badge>

                        {canUserApprove(approval) && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedApproval(approval.id)}
                            >
                              Рассмотреть
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {step.isActive ? (
                    autoAssignEnabled ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span>Автоматическое назначение согласующих...</span>
                        </div>
                        <p className="text-xs">
                          Включено автоматическое назначение на основе правил маршрутизации
                        </p>
                      </div>
                    ) : (
                      'Ожидает назначения согласующих...'
                    )
                  ) : 'Этап еще не активен'}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Approval Dialog */}
      {selectedApproval && (
        <Card>
          <CardHeader>
            <CardTitle>Рассмотрение договора</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Введите комментарий (обязательно при отклонении)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
              />
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedApproval(null)
                    setComment('')
                  }}
                >
                  Отмена
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleApproval(selectedApproval, 'REJECTED')}
                  disabled={!comment.trim()}
                >
                  Отклонить
                </Button>
                <Button
                  onClick={() => handleApproval(selectedApproval, 'APPROVED')}
                >
                  Согласовать
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}