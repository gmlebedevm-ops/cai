'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, FileText, Users, MessageSquare, History, CheckCircle, XCircle, Truck, Bot } from 'lucide-react'
import { Contract, ContractStatus } from '@/types/contract'
import { EnhancedApprovalWorkflow } from '@/components/contracts/enhanced-approval-workflow'
import { DocumentManager } from '@/components/contracts/document-manager'
import { ShippingManager } from '@/components/contracts/shipping-manager'
import { CommentManager } from '@/components/contracts/comment-manager'
import { NotificationSystem } from '@/components/notifications/notification-system'
import AIAssistant from '@/components/ai-assistant/ai-assistant'

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string
  
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [contractContext, setContractContext] = useState<any>(null)

  useEffect(() => {
    if (contractId) {
      fetchContract()
      fetchContractContext()
    }
  }, [contractId])

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}`)
      if (response.ok) {
        const data = await response.json()
        setContract(data)
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchContractContext = async () => {
    try {
      const response = await fetch(`/api/ai-assistant/context?contractId=${contractId}`)
      if (response.ok) {
        const data = await response.json()
        setContractContext(data)
      }
    } catch (error) {
      console.error('Error fetching contract context:', error)
    }
  }

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-500'
      case 'IN_REVIEW': return 'bg-blue-500'
      case 'APPROVED': return 'bg-green-500'
      case 'SIGNED': return 'bg-purple-500'
      case 'ARCHIVED': return 'bg-gray-400'
      case 'REJECTED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: ContractStatus) => {
    switch (status) {
      case 'DRAFT': return 'Черновик'
      case 'IN_REVIEW': return 'На согласовании'
      case 'APPROVED': return 'Согласован'
      case 'SIGNED': return 'Подписан'
      case 'ARCHIVED': return 'Архив'
      case 'REJECTED': return 'Отклонен'
      default: return 'Неизвестно'
    }
  }

  const handleContractUpdate = () => {
    fetchContract()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Загрузка договора...</div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Договор не найден</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{contract.number}</h1>
            <p className="text-muted-foreground">{contract.counterparty}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className={`${getStatusColor(contract.status)} text-white`}>
            {getStatusLabel(contract.status)}
          </Badge>
          
          <Button
            variant="outline"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            Уведомления
          </Button>
          
          {contract.status === 'APPROVED' && (
            <Button className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Подписать
            </Button>
          )}
          
          {contract.status === 'IN_REVIEW' && (
            <Button variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Вернуть на доработку
            </Button>
          )}
        </div>
      </div>

      {/* Contract Info */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о договоре</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Номер договора</p>
              <p className="text-lg">{contract.number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Контрагент</p>
              <p className="text-lg">{contract.counterparty}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Сумма</p>
              <p className="text-lg">{contract.amount.toLocaleString('ru-RU')} ₽</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Статус</p>
              <Badge className={`${getStatusColor(contract.status)} text-white`}>
                {getStatusLabel(contract.status)}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Дата начала</p>
              <p className="text-lg">{new Date(contract.startDate).toLocaleDateString('ru-RU')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Дата окончания</p>
              <p className="text-lg">{new Date(contract.endDate).toLocaleDateString('ru-RU')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Создан</p>
              <p className="text-lg">{new Date(contract.createdAt).toLocaleDateString('ru-RU')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Инициатор</p>
              <p className="text-lg">{contract.initiator?.name || 'Неизвестно'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed top-4 right-4 z-50">
          <NotificationSystem
            userId="cmeqycf4k0000ozebvt1u5lov" // Используем реальный ID пользователя
            onNotificationClick={(notification) => {
              if (notification.actionUrl) {
                router.push(notification.actionUrl)
              }
            }}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Документы
          </TabsTrigger>
          <TabsTrigger value="approval" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Согласование
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Доставка
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Комментарии
          </TabsTrigger>
          <TabsTrigger value="ai-assistant" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI-ассистент
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            История
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <DocumentManager
            contractId={contractId}
            currentUserId="cmeqycf4k0000ozebvt1u5lov" // Используем реальный ID пользователя
            onDocumentUpdate={handleContractUpdate}
          />
        </TabsContent>

        <TabsContent value="approval" className="space-y-4">
          <EnhancedApprovalWorkflow
            contract={contract}
            currentUserId="cmeqycf4k0000ozebvt1u5lov" // Используем реальный ID пользователя
            onApprovalUpdate={handleContractUpdate}
          />
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <ShippingManager
            contract={contract}
            currentUserId="cmeqycf4k0000ozebvt1u5lov" // Используем реальный ID пользователя
            onShippingUpdate={handleContractUpdate}
          />
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <CommentManager
            contractId={contractId}
            currentUserId="cmeqycf4k0000ozebvt1u5lov" // Используем реальный ID пользователя
            currentUserName="Иван Иванов"
            currentUserRole="Инициатор"
          />
        </TabsContent>

        <TabsContent value="ai-assistant" className="space-y-4">
          <AIAssistant
            contractId={contractId}
            contractData={contractContext}
            userId="cmeqycf4k0000ozebvt1u5lov" // Используем реальный ID пользователя
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardContent className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">История изменений в разработке</p>
              <p className="text-sm text-muted-foreground mt-2">
                Здесь будет отображаться полная история изменений договора
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}