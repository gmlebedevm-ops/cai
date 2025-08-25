'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Clock, CheckCircle, XCircle, User, Calendar } from 'lucide-react'
import { Approval, Contract } from '@/types/contract'

interface ApprovalWorkflowProps {
  contract: Contract
  currentUserId?: string
  onApprovalUpdate?: () => void
}

interface WorkflowStep {
  id: string
  title: string
  description: string
  role: string
  duration: number // в днях
  approvers: Approval[]
}

export function ApprovalWorkflow({ contract, currentUserId, onApprovalUpdate }: ApprovalWorkflowProps) {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null)
  const [comment, setComment] = useState('')

  useEffect(() => {
    fetchApprovals()
  }, [contract.id])

  const fetchApprovals = async () => {
    try {
      const response = await fetch(`/api/approvals?contractId=${contract.id}`)
      if (response.ok) {
        const data = await response.json()
        setApprovals(data)
      }
    } catch (error) {
      console.error('Error fetching approvals:', error)
    } finally {
      setLoading(false)
    }
  }

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'manager',
      title: 'Согласование с руководителем',
      description: 'Руководитель инициатора проверяет экономическую целесообразность',
      role: 'INITIATOR_MANAGER',
      duration: 2,
      approvers: approvals.filter(a => a.workflowStep === 1)
    },
    {
      id: 'finance',
      title: 'Финансовая экспертиза',
      description: 'Начальник ПЭО проверяет финансовые условия договора',
      role: 'DEPARTMENT_HEAD',
      duration: 3,
      approvers: approvals.filter(a => a.workflowStep === 2)
    },
    {
      id: 'legal',
      title: 'Юридическая проверка',
      description: 'Начальник юридического отдела проверяет юридические аспекты',
      role: 'DEPARTMENT_HEAD',
      duration: 3,
      approvers: approvals.filter(a => a.workflowStep === 3)
    },
    {
      id: 'chief_lawyer',
      title: 'Проверка главным юристом',
      description: 'Главный юрист финальная проверка и формирование ПСР при необходимости',
      role: 'CHIEF_LAWYER',
      duration: 2,
      approvers: approvals.filter(a => a.workflowStep === 4)
    },
    {
      id: 'director',
      title: 'Согласование генеральным директором',
      description: 'Финальное согласование договора',
      role: 'GENERAL_DIRECTOR',
      duration: 1,
      approvers: approvals.filter(a => a.workflowStep === 5)
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

  const isStepActive = (stepIndex: number) => {
    if (stepIndex === 0) return true
    const previousStep = workflowSteps[stepIndex - 1]
    return previousStep.approvers.every(a => a.status === 'APPROVED')
  }

  const canUserApprove = (approval: Approval) => {
    return approval.status === 'PENDING' && approval.approverId === currentUserId
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка маршрута согласования...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Маршрут согласования</h3>
        <Badge variant={contract.status === 'IN_REVIEW' ? 'default' : 'secondary'}>
          {contract.status === 'IN_REVIEW' ? 'На согласовании' : 'Статус: ' + contract.status}
        </Badge>
      </div>

      <div className="space-y-4">
        {workflowSteps.map((step, index) => (
          <Card key={step.id} className={`transition-all ${isStepActive(index) ? 'border-blue-200' : 'border-gray-200 opacity-60'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    isStepActive(index) ? 'bg-blue-500' : 'bg-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-base">{step.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {step.duration} дн.
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
                          <p className="font-medium">{approval.approver?.name || 'Неизвестный пользователь'}</p>
                          <p className="text-sm text-muted-foreground">{approval.approver?.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {approval.dueDate && (
                          <div className="text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(approval.dueDate).toLocaleDateString('ru-RU')}
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
                  {isStepActive(index) ? 'Ожидает назначения согласующих...' : 'Этап еще не активен'}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Диалог для согласования/отклонения */}
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