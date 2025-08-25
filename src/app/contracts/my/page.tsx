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
  FileUser,
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft
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

export default function MyContractsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
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

  // Загрузка договоров
  useEffect(() => {
    if (user) {
      fetchContracts()
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, user])

  // Применение фильтров
  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        setPagination(prev => ({ ...prev, page: 1 }))
        fetchContracts()
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, statusFilter, counterpartyFilter, user])

  const fetchContracts = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        initiatorId: user.id, // Фильтр по текущему пользователю
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(counterpartyFilter !== 'all' && { counterparty: counterpartyFilter })
      })

      const response = await fetch(`/api/contracts?${params}`)
      
      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setContracts(data.contracts || [])
      setPagination(data.pagination || pagination)
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
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
    const matchesCounterparty = counterpartyFilter === 'all' || contract.counterparty === counterpartyFilter
    const matchesInitiator = user && contract.initiatorId === user.id
    
    return matchesSearch && matchesStatus && matchesCounterparty && matchesInitiator
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

  if (loading && contracts.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Загрузка моих договоров...</p>
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
              <FileUser className="h-8 w-8 text-primary" />
              Мои договоры
            </h1>
            <p className="text-muted-foreground">
              Управление моими договорами • Всего: {pagination.total}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего договоров</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
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
                  className="hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => handleContractClick(contract.id)}
                >
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{contract.number}</CardTitle>
                          {getStatusBadge(contract.status)}
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
                  <FileUser className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">У вас еще нет договоров</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' || counterpartyFilter !== 'all' 
                      ? 'Попробуйте изменить параметры фильтрации'
                      : 'Начните с создания вашего первого договора'
                    }
                  </p>
                  {(!searchTerm && statusFilter === 'all' && counterpartyFilter === 'all') && (
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