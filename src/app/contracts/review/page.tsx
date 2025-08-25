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
  Calendar
} from 'lucide-react'
import { Contract, ContractStatus } from '@/types/contract'
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

interface ReviewStats {
  total: number
  urgent: number
  todayDue: number
  thisWeekDue: number
  myApprovals: number
}

export default function ContractsReviewPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [counterpartyFilter, setCounterpartyFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  })
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    total: 0,
    urgent: 0,
    todayDue: 0,
    thisWeekDue: 0,
    myApprovals: 0
  })

  // Загрузка договоров на согласовании
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
  }, [searchTerm, counterpartyFilter])

  const fetchContracts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        status: ContractStatus.IN_REVIEW, // Только договоры на согласовании
        ...(searchTerm && { search: searchTerm }),
        ...(counterpartyFilter !== 'all' && { counterparty: counterpartyFilter })
      })

      const response = await fetch(`/api/contracts?${params}`)
      
      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setContracts(data.contracts || [])
      setPagination(data.pagination || pagination)
      
      // Расчет статистики
      const contractsData = data.contracts || []
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const weekEnd = new Date(today)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const stats: ReviewStats = {
        total: contractsData.length,
        urgent: contractsData.filter(c => {
          if (!c.dueDate) return false
          const dueDate = new Date(c.dueDate)
          return dueDate <= tomorrow
        }).length,
        todayDue: contractsData.filter(c => {
          if (!c.dueDate) return false
          const dueDate = new Date(c.dueDate)
          return dueDate.toDateString() === today.toDateString()
        }).length,
        thisWeekDue: contractsData.filter(c => {
          if (!c.dueDate) return false
          const dueDate = new Date(c.dueDate)
          return dueDate <= weekEnd && dueDate > today
        }).length,
        myApprovals: contractsData.filter(c => {
          return c.approvals?.some(a => a.approverId === user?.id && a.status === 'PENDING')
        }).length
      }
      
      setReviewStats(stats)
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
    const matchesStatus = contract.status === ContractStatus.IN_REVIEW
    
    return matchesSearch && matchesCounterparty && matchesStatus
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

  const getDueDateBadge = (dueDate?: Date) => {
    if (!dueDate) return null
    
    const today = new Date()
    const due = new Date(dueDate)
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    let variant: "default" | "secondary" | "destructive" | "outline" = "default"
    let text = ""
    
    if (diffDays < 0) {
      variant = "destructive"
      text = `Просрочено на ${Math.abs(diffDays)} дн.`
    } else if (diffDays === 0) {
      variant = "destructive"
      text = "Срок сегодня"
    } else if (diffDays === 1) {
      variant = "destructive"
      text = "Завтра"
    } else if (diffDays <= 3) {
      variant = "secondary"
      text = `Через ${diffDays} дн.`
    } else {
      variant = "outline"
      text = `Через ${diffDays} дн.`
    }
    
    return (
      <Badge variant={variant} className="text-xs">
        {text}
      </Badge>
    )
  }

  const getMyApprovalStatus = (contract: Contract) => {
    if (!user || !contract.approvals) return null
    
    const myApproval = contract.approvals.find(a => a.approverId === user.id)
    if (!myApproval) return null
    
    if (myApproval.status === 'PENDING') {
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          Требуется согласование
        </Badge>
      )
    } else if (myApproval.status === 'APPROVED') {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          Согласовано мной
        </Badge>
      )
    } else if (myApproval.status === 'REJECTED') {
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          Отклонено мной
        </Badge>
      )
    }
    
    return null
  }

  if (loading && contracts.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Загрузка договоров на согласовании...</p>
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
              <Clock className="h-8 w-8 text-blue-500" />
              На согласовании
            </h1>
            <p className="text-muted-foreground">
              Договоры, требующие согласования • Всего: {pagination.total}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего на согласовании</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Срочные</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{reviewStats.urgent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Срок сегодня</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{reviewStats.todayDue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">На этой неделе</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{reviewStats.thisWeekDue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Мои согласования</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{reviewStats.myApprovals}</div>
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
              onClick={() => router.push('/approvals/my')}
            >
              <Users className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Мои согласования</div>
                <div className="text-xs opacity-70">{reviewStats.myApprovals} требуется</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => router.push('/approvals/queue')}
            >
              <Clock className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Очередь согласований</div>
                <div className="text-xs opacity-70">{reviewStats.total} в работе</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => router.push('/approvals')}
            >
              <CheckCircle className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Все согласования</div>
                <div className="text-xs opacity-70">Полный список</div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-')
              setSortBy(field)
              setSortOrder(order as 'asc' | 'desc')
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt-desc">По дате изменения (новые)</SelectItem>
                <SelectItem value="updatedAt-asc">По дате изменения (старые)</SelectItem>
                <SelectItem value="dueDate-desc">По сроку (ближайшие)</SelectItem>
                <SelectItem value="dueDate-asc">По сроку (дальние)</SelectItem>
                <SelectItem value="amount-desc">По сумме (убыв.)</SelectItem>
                <SelectItem value="amount-asc">По сумме (возр.)</SelectItem>
                <SelectItem value="number-asc">По номеру (А-Я)</SelectItem>
                <SelectItem value="number-desc">По номеру (Я-А)</SelectItem>
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
                  className="hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
                  onClick={() => handleContractClick(contract.id)}
                >
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{contract.number}</CardTitle>
                          {getStatusBadge(contract.status)}
                          {getDueDateBadge(contract.dueDate)}
                          {getMyApprovalStatus(contract)}
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
                    
                    {/* Срок согласования */}
                    {contract.dueDate && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Срок согласования:</span>
                          <div className="flex items-center gap-2">
                            {getDueDateBadge(contract.dueDate)}
                            <span className="text-muted-foreground">
                              {new Date(contract.dueDate).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
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
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {contracts.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Нет договоров на согласовании</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || counterpartyFilter !== 'all' 
                      ? 'Попробуйте изменить параметры фильтрации'
                      : 'В настоящее время нет договоров, требующих согласования'
                    }
                  </p>
                  {(!searchTerm && counterpartyFilter === 'all') && (
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