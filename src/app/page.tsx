'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Filter, FileText, Clock, CheckCircle, XCircle, BarChart3, TrendingUp, Users, AlertTriangle, MessageSquare, FileWarning, Bell } from 'lucide-react'
import { Contract, ContractStatus } from '@/types/contract'
import { CreateContractDialog } from '@/components/contracts/create-contract-dialog'
import { LoginForm } from '@/components/auth/login-form'
import { useAuth } from '@/hooks/use-auth'
import ApprovalsStats from '@/components/approvals/approvals-stats'

const statusColors = {
  [ContractStatus.DRAFT]: 'bg-gray-500',
  [ContractStatus.IN_REVIEW]: 'bg-blue-500',
  [ContractStatus.APPROVED]: 'bg-green-500',
  [ContractStatus.SIGNED]: 'bg-purple-500',
  [ContractStatus.ARCHIVED]: 'bg-gray-400',
  [ContractStatus.REJECTED]: 'bg-red-500',
}

const statusLabels = {
  [ContractStatus.DRAFT]: 'Черновик',
  [ContractStatus.IN_REVIEW]: 'На согласовании',
  [ContractStatus.APPROVED]: 'Согласован',
  [ContractStatus.SIGNED]: 'Подписан',
  [ContractStatus.ARCHIVED]: 'Архив',
  [ContractStatus.REJECTED]: 'Отклонен',
}

export default function Home() {
  const router = useRouter()
  const { user, login, loading: authLoading } = useAuth()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [totalContracts, setTotalContracts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [counterpartyFilter, setCounterpartyFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts')
      if (response.ok) {
        const data = await response.json()
        setContracts(data.contracts || [])
        setTotalContracts(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Обработка параметра поиска из URL
    const urlParams = new URLSearchParams(window.location.search)
    const searchParam = urlParams.get('search')
    if (searchParam) {
      setSearchTerm(searchParam)
    }
    fetchContracts()
  }, [])

  // Показываем форму входа, если пользователь не авторизован
  if (!authLoading && !user) {
    return <LoginForm onLogin={login} />
  }

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.counterparty.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
    const matchesCounterparty = counterpartyFilter === 'all' || contract.counterparty === counterpartyFilter
    
    return matchesSearch && matchesStatus && matchesCounterparty
  })

  const uniqueCounterparties = Array.from(new Set(contracts.map(c => c.counterparty)))

  const handleContractCreated = () => {
    fetchContracts()
  }

  const handleContractClick = (contractId: string) => {
    router.push(`/contracts/${contractId}`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Главная</h1>
          <p className="text-muted-foreground">
            Обзор и статистика договоров • {user?.name} ({user?.role})
          </p>
        </div>
        <Button 
          className="flex items-center gap-2 w-full sm:w-auto"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Новый договор
        </Button>
        <Button 
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto"
          onClick={() => router.push('/ai-chat')}
        >
          <MessageSquare className="h-4 w-4" />
          AI-ассистент
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего договоров</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContracts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">На согласовании</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contracts.filter(c => c.status === ContractStatus.IN_REVIEW).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Согласовано</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contracts.filter(c => c.status === ContractStatus.APPROVED).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Отклонено</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contracts.filter(c => c.status === ContractStatus.REJECTED).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approvals Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Мои согласования
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ApprovalsStats />
        </CardContent>
      </Card>

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Быстрый доступ к аналитике
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => router.push('/reports/dashboard')}
            >
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="text-center">
                <div className="font-medium">Аналитическая панель</div>
                <div className="text-xs text-muted-foreground">KPI и метрики</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => router.push('/reports/timelines')}
            >
              <Clock className="h-8 w-8 text-green-600" />
              <div className="text-center">
                <div className="font-medium">Сроки согласования</div>
                <div className="text-xs text-muted-foreground">Анализ времени</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => router.push('/reports/statistics')}
            >
              <Users className="h-8 w-8 text-purple-600" />
              <div className="text-center">
                <div className="font-medium">Статистика</div>
                <div className="text-xs text-muted-foreground">По отделам</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => router.push('/reports/dashboard')}
            >
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="text-center">
                <div className="font-medium">Эффективность</div>
                <div className="text-xs text-muted-foreground">Отчеты</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Assistant Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AI-ассистент
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => router.push('/ai-chat')}
            >
              <FileWarning className="h-8 w-8 text-red-600" />
              <div className="text-center">
                <div className="font-medium">Анализ рисков</div>
                <div className="text-xs text-muted-foreground">Проверка договора</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => router.push('/ai-chat')}
            >
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="text-center">
                <div className="font-medium">Карточка договора</div>
                <div className="text-xs text-muted-foreground">Авто-извлечение данных</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => router.push('/ai-chat')}
            >
              <Bell className="h-8 w-8 text-green-600" />
              <div className="text-center">
                <div className="font-medium">Уведомления</div>
                <div className="text-xs text-muted-foreground">Генерация писем</div>
              </div>
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>AI-ассистент поможет вам анализировать договоры, извлекать данные и готовить документы. Перейдите в раздел AI-ассистента, чтобы начать работу.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по номеру или контрагенту"
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
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={counterpartyFilter} onValueChange={setCounterpartyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Контрагент" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все контрагенты</SelectItem>
                {uniqueCounterparties.map(counterparty => (
                  <SelectItem key={counterparty} value={counterparty}>
                    {counterparty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Все договоры</TabsTrigger>
          <TabsTrigger value="my">Мои договоры</TabsTrigger>
          <TabsTrigger value="pending">Требуют внимания</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : (
            <div className="grid gap-4">
              {filteredContracts.map((contract) => (
                <Card 
                  key={contract.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleContractClick(contract.id)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{contract.number}</CardTitle>
                        <p className="text-muted-foreground">{contract.counterparty}</p>
                      </div>
                      <Badge className={`${statusColors[contract.status]} text-white`}>
                        {statusLabels[contract.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Сумма:</span> {contract.amount.toLocaleString('ru-RU')} ₽
                      </div>
                      <div>
                        <span className="font-medium">Начало:</span> {new Date(contract.startDate).toLocaleDateString('ru-RU')}
                      </div>
                      <div>
                        <span className="font-medium">Окончание:</span> {new Date(contract.endDate).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation()
                        handleContractClick(contract.id)
                      }}>
                        Подробнее
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation()
                        handleContractClick(contract.id)
                      }}>
                        Документы
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation()
                        handleContractClick(contract.id)
                      }}>
                        История
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredContracts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Договоры не найдены
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my">
          <div className="text-center py-8 text-muted-foreground">
            Мои договоры (в разработке)
          </div>
        </TabsContent>
        
        <TabsContent value="pending">
          <div className="text-center py-8 text-muted-foreground">
            Требуют внимания (в разработке)
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Contract Dialog */}
      <CreateContractDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleContractCreated}
      />
    </div>
  )
}