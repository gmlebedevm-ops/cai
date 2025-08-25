'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
  Timer,
  UserCheck
} from 'lucide-react'
import { Contract, ContractStatus } from '@/types/contract'
import { Approval, ApprovalStatus } from '@/types/approval'
import { CreateContractDialog } from '@/components/contracts/create-contract-dialog'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'

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

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface PendingStats {
  total: number
  overdue: number
  urgent: number
  myApprovals: number
  rejected: number
  draft: number
}

interface PendingContract extends Contract {
  requiresAttention: boolean
  attentionType: 'overdue' | 'urgent' | 'my_approval' | 'rejected' | 'draft'
  daysUntilDue?: number
  myApprovalStatus?: ApprovalStatus
}

export default function ContractsPendingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [contracts, setContracts] = useState<PendingContract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [counterpartyFilter, setCounterpartyFilter] = useState<string>('all')
  const [attentionTypeFilter, setAttentionTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('attentionPriority')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  })
  const [pendingStats, setPendingStats] = useState<PendingStats>({
    total: 0,
    overdue: 0,
    urgent: 0,
    myApprovals: 0,
    rejected: 0,
    draft: 0
  })

  // Загрузка договоров, требующих внимания
  useEffect(() => {
    fetchContracts()
  }, [pagination.page, pagination.limit, sortBy, sortOrder])

  // Применение фильтров
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }))
      fetchContracts()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, counterpartyFilter, attentionTypeFilter])

  const fetchContracts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Загружаем все договоры для анализа
      const params = new URLSearchParams({
        page: '1',
        limit: '1000', // Загружаем много для анализа
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        ...(searchTerm && { search: searchTerm }),
        ...(counterpartyFilter !== 'all' && { counterparty: counterpartyFilter })
      })

      const response = await fetch(`/api/contracts?${params}`)
      
      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const allContracts = data.contracts || []
      
      // Анализируем договоры и определяем, какие требуют внимания
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const weekEnd = new Date(today)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const pendingContracts: PendingContract[] = allContracts.map(contract => {
        const dueDate = contract.dueDate ? new Date(contract.dueDate) : null
        const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
        
        let requiresAttention = false
        let attentionType: 'overdue' | 'urgent' | 'my_approval' | 'rejected' | 'draft' = 'draft'
        let myApprovalStatus: ApprovalStatus | undefined

        // Проверяем, требует ли договор внимания
        if (contract.status === ContractStatus.REJECTED) {
          requiresAttention = true
          attentionType = 'rejected'
        } else if (contract.status === ContractStatus.DRAFT) {
          requiresAttention = true
          attentionType = 'draft'
        } else if (contract.status === ContractStatus.IN_REVIEW) {
          if (dueDate && daysUntilDue !== null) {
            if (daysUntilDue < 0) {
              requiresAttention = true
              attentionType = 'overdue'
            } else if (daysUntilDue <= 3) {
              requiresAttention = true
              attentionType = 'urgent'
            }
          }
          
          // Проверяем, требует ли договор моего согласования
          if (user && contract.approvals) {
            const myApproval = contract.approvals.find(a => a.approverId === user.id)
            if (myApproval && myApproval.status === ApprovalStatus.PENDING) {
              requiresAttention = true
              attentionType = 'my_approval'
              myApprovalStatus = myApproval.status
            }
          }
        }

        return {
          ...contract,
          requiresAttention,
          attentionType,
          daysUntilDue: daysUntilDue !== null ? daysUntilDue : undefined,
          myApprovalStatus
        }
      }).filter(contract => contract.requiresAttention)

      // Применяем фильтр по типу внимания
      let filteredContracts = pendingContracts
      if (attentionTypeFilter !== 'all') {
        filteredContracts = pendingContracts.filter(c => c.attentionType === attentionTypeFilter)
      }

      // Сортируем по приоритету внимания
      const attentionPriority = {
        'overdue': 5,
        'urgent': 4,
        'my_approval': 3,
        'rejected': 2,
        'draft': 1
      }

      filteredContracts.sort((a, b) => {
        if (sortBy === 'attentionPriority') {
          const priorityA = attentionPriority[a.attentionType]
          const priorityB = attentionPriority[b.attentionType]
          return sortOrder === 'desc' ? priorityB - priorityA : priorityA - priorityB
        }
        
        // Другие критерии сортировки
        let valueA: any, valueB: any
        switch (sortBy) {
          case 'dueDate':
            valueA = a.dueDate ? new Date(a.dueDate).getTime() : 0
            valueB = b.dueDate ? new Date(b.dueDate).getTime() : 0
            break
          case 'amount':
            valueA = a.amount
            valueB = b.amount
            break
          case 'updatedAt':
          default:
            valueA = new Date(a.updatedAt).getTime()
            valueB = new Date(b.updatedAt).getTime()
        }
        
        if (sortOrder === 'desc') {
          return valueB > valueA ? 1 : valueB < valueA ? -1 : 0
        } else {
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0
        }
      })

      // Применяем пагинацию
      const startIndex = (pagination.page - 1) * pagination.limit
      const endIndex = startIndex + pagination.limit
      const paginatedContracts = filteredContracts.slice(startIndex, endIndex)

      setContracts(paginatedContracts)
      setPagination({
        total: filteredContracts.length,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(filteredContracts.length / pagination.limit)
      })

      // Расчет статистики
      const stats: PendingStats = {
        total: filteredContracts.length,
        overdue: filteredContracts.filter(c => c.attentionType === 'overdue').length,
        urgent: filteredContracts.filter(c => c.attentionType === 'urgent').length,
        myApprovals: filteredContracts.filter(c => c.attentionType === 'my_approval').length,
        rejected: filteredContracts.filter(c => c.attentionType === 'rejected').length,
        draft: filteredContracts.filter(c => c.attentionType === 'draft').length
      }
      
      setPendingStats(stats)
    } catch (err) {
      console.error('Error fetching contracts:', err)
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке договоров')
    } finally {
      setLoading(false)
    }
  }

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.counterparty.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCounterparty = counterpartyFilter === 'all' || contract.counterparty === counterpartyFilter
    const matchesAttentionType = attentionTypeFilter === 'all' || contract.attentionType === attentionTypeFilter
    
    return matchesSearch && matchesCounterparty && matchesAttentionType
  })

  const uniqueCounterparties = Array.from(new Set(contracts.map(c => c.counterparty)))

  const handleContractCreated = () => {
    fetchContracts()
  }

  const handleContractClick = (contractId: string) => {
    router.push(`/contracts/${contractId}`)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getStatusBadge = (status: ContractStatus) => {
    return (
      <Badge className={`${statusColors[status]} text-white`}>
        {statusLabels[status]}
      </Badge>
    )
  }

  const getAttentionBadge = (contract: PendingContract) => {
    const { attentionType, daysUntilDue } = contract
    
    switch (attentionType) {
      case 'overdue':
        return (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Просрочено
          </Badge>
        )
      case 'urgent':
        return (
          <Badge variant="destructive" className="text-xs">
            <Timer className="h-3 w-3 mr-1" />
            Срочно
          </Badge>
        )
      case 'my_approval':
        return (
          <Badge variant="default" className="text-xs bg-yellow-500">
            <UserCheck className="h-3 w-3 mr-1" />
            Требует согласования
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="text-xs text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Отклонен
          </Badge>
        )
      case 'draft':
        return (
          <Badge variant="outline" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Черновик
          </Badge>
        )
      default:
        return null
    }
  }

  const getDueDateBadge = (dueDate?: Date, daysUntilDue?: number) => {
    if (!dueDate || daysUntilDue === undefined) return null
    
    let variant: "default" | "secondary" | "destructive" | "outline" = "default"
    let text = ""
    
    if (daysUntilDue < 0) {
      variant = "destructive"
      text = `Просрочено на ${Math.abs(daysUntilDue)} дн.`
    } else if (daysUntilDue === 0) {
      variant = "destructive"
      text = "Срок сегодня"
    } else if (daysUntilDue === 1) {
      variant = "destructive"
      text = "Завтра"
    } else if (daysUntilDue <= 3) {
      variant = "secondary"
      text = `Через ${daysUntilDue} дн.`
    } else {
      variant = "outline"
      text = `Через ${daysUntilDue} дн.`
    }
    
    return (
      <Badge variant={variant} className="text-xs">
        {text}
      </Badge>
    )
  }

  if (loading && contracts.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Загрузка договоров, требующих внимания...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ошибка загрузки</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchContracts} variant="outline">
              Попробовать снова
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/contracts">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              К договорам
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              Требуют внимания
            </h1>
            <p className="text-muted-foreground">
              Договоры, требующие вашего внимания • Всего: {pagination.total}
            </p>
          </div>
        </div>
        <Button 
          className="flex items-center gap-2 w-full sm:w-auto"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Новый договор
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просроченные</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{pendingStats.overdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Срочные</CardTitle>
            <Timer className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingStats.urgent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Мои согласования</CardTitle>
            <UserCheck className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingStats.myApprovals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Отклоненные</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{pendingStats.rejected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Черновики</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{pendingStats.draft}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Быстрая навигация
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => router.push('/contracts/my')}
            >
              <FileText className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Мои договоры</div>
                <div className="text-xs opacity-70">Личные договоры</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => router.push('/contracts/review')}
            >
              <Clock className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">На согласовании</div>
                <div className="text-xs opacity-70">В процессе</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => router.push('/approvals/my')}
            >
              <UserCheck className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Мои согласования</div>
                <div className="text-xs opacity-70">Требуют действий</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры и сортировка
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по номеру или контрагенту"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
            <Select value={attentionTypeFilter} onValueChange={setAttentionTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Тип внимания" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="overdue">Просроченные</SelectItem>
                <SelectItem value="urgent">Срочные</SelectItem>
                <SelectItem value="my_approval">Мои согласования</SelectItem>
                <SelectItem value="rejected">Отклоненные</SelectItem>
                <SelectItem value="draft">Черновики</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-')
              setSortBy(field)
              setSortOrder(order as 'asc' | 'desc')
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attentionPriority-desc">По приоритету (высокий)</SelectItem>
                <SelectItem value="attentionPriority-asc">По приоритету (низкий)</SelectItem>
                <SelectItem value="dueDate-desc">По сроку (ближайшие)</SelectItem>
                <SelectItem value="dueDate-asc">По сроку (дальние)</SelectItem>
                <SelectItem value="amount-desc">По сумме (убыв.)</SelectItem>
                <SelectItem value="amount-asc">По сумме (возр.)</SelectItem>
                <SelectItem value="updatedAt-desc">По обновлению (новые)</SelectItem>
                <SelectItem value="updatedAt-asc">По обновлению (старые)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchContracts} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Применить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Обновление данных...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {contracts.map((contract) => (
                <Card 
                  key={contract.id} 
                  className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
                    contract.attentionType === 'overdue' ? 'border-l-4 border-l-red-500' :
                    contract.attentionType === 'urgent' ? 'border-l-4 border-l-orange-500' :
                    contract.attentionType === 'my_approval' ? 'border-l-4 border-l-yellow-500' :
                    contract.attentionType === 'rejected' ? 'border-l-4 border-l-red-500' :
                    'border-l-4 border-l-gray-500'
                  }`}
                  onClick={() => handleContractClick(contract.id)}
                >
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{contract.number}</CardTitle>
                          {getStatusBadge(contract.status)}
                          {getAttentionBadge(contract)}
                          {getDueDateBadge(contract.dueDate, contract.daysUntilDue)}
                        </div>
                        <p className="text-muted-foreground">{contract.counterparty}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleContractClick(contract.id)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Просмотр
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            // TODO: Реализовать редактирование
                            console.log('Редактировать договор:', contract.id)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Изменить
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Сумма:</span>
                        <div className="text-lg font-semibold">{contract.amount.toLocaleString('ru-RU')} ₽</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Начало:</span>
                        <div>{new Date(contract.startDate).toLocaleDateString('ru-RU')}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Окончание:</span>
                        <div>{new Date(contract.endDate).toLocaleDateString('ru-RU')}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Инициатор:</span>
                        <div>{contract.initiator?.name || 'Неизвестно'}</div>
                      </div>
                    </div>
                    
                    {/* Информация о внимании */}
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium mb-2">Требует внимания:</div>
                      <div className="flex flex-wrap gap-2">
                        {getAttentionBadge(contract)}
                        {contract.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            Срок: {new Date(contract.dueDate).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                        {contract.attentionType === 'my_approval' && (
                          <span className="text-xs text-muted-foreground">
                            Требуется ваше согласование
                          </span>
                        )}
                        {contract.attentionType === 'rejected' && (
                          <span className="text-xs text-muted-foreground">
                            Требуется доработка
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Прогресс согласований */}
                    {contract.approvals && contract.approvals.length > 0 && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-2">Прогресс согласований:</div>
                        <div className="flex flex-wrap gap-2">
                          {contract.approvals.map((approval) => (
                            <Badge 
                              key={approval.id} 
                              variant={approval.approverId === user?.id ? "default" : "outline"}
                              className={`text-xs ${
                                approval.status === 'APPROVED' ? 'bg-green-100 text-green-800 border-green-300' :
                                approval.status === 'REJECTED' ? 'bg-red-100 text-red-800 border-red-300' :
                                approval.approverId === user?.id ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : ''
                              }`}
                            >
                              {approval.approver?.name}: {
                                approval.status === 'APPROVED' ? '✓' :
                                approval.status === 'REJECTED' ? '✗' :
                                approval.approverId === user?.id ? '!' : '⏳'
                              }
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Статус доставки */}
                    {contract.shippingStatus && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Статус доставки:</span>
                          <Badge variant="outline">{contract.shippingStatus}</Badge>
                        </div>
                        {contract.trackingNumber && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Трек-номер: {contract.trackingNumber}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {contracts.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Нет договоров, требующих внимания</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || counterpartyFilter !== 'all' || attentionTypeFilter !== 'all' 
                      ? 'Попробуйте изменить параметры фильтрации'
                      : 'Отлично! Все договоры в порядке'
                    }
                  </p>
                  {(!searchTerm && counterpartyFilter === 'all' && attentionTypeFilter === 'all') && (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Создать договор
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Показано {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Назад
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else {
                      if (pagination.page <= 3) {
                        pageNum = i + 1
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = pagination.page - 2 + i
                      }
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages || loading}
                >
                  Вперед
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Contract Dialog */}
      <CreateContractDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onContractCreated={handleContractCreated}
      />
    </div>
  )
}