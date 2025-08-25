'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Calendar,
  FileText,
  MessageSquare,
  List
} from 'lucide-react'
import { Approval, ApprovalStatus, PaginationInfo } from '@/types/approval'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

const statusColors = {
  [ApprovalStatus.PENDING]: 'bg-yellow-500',
  [ApprovalStatus.APPROVED]: 'bg-green-500',
  [ApprovalStatus.REJECTED]: 'bg-red-500',
}

const statusLabels = {
  [ApprovalStatus.PENDING]: 'Ожидает',
  [ApprovalStatus.APPROVED]: 'Согласовано',
  [ApprovalStatus.REJECTED]: 'Отклонено',
}

export default function QueueApprovalsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<string>('dueDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  })
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: 'approve' | 'reject' | null }>({ open: false, type: null })
  const [actionComment, setActionComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Загрузка согласований
  useEffect(() => {
    fetchApprovals()
  }, [pagination.page, pagination.limit, sortBy, sortOrder])

  // Применение фильтров
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }))
      fetchApprovals()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const fetchApprovals = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        status: ApprovalStatus.PENDING, // Только ожидающие согласования
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/approvals?${params}`)
      
      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setApprovals(data.approvals || [])
      setPagination(data.pagination || pagination)
    } catch (err) {
      console.error('Error fetching approvals:', err)
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке очереди согласований')
    } finally {
      setLoading(false)
    }
  }

  const handleApprovalAction = async (approvalId: string, action: 'approve' | 'reject', comment?: string) => {
    setActionLoading(true)
    
    try {
      const response = await fetch('/api/approvals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalId,
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          comment: comment || ''
        })
      })

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`)
      }
      
      toast({
        title: action === 'approve' ? 'Согласовано' : 'Отклонено',
        description: `Заявка на согласование успешно ${action === 'approve' ? 'согласована' : 'отклонена'}`,
      })
      
      fetchApprovals()
      setActionDialog({ open: false, type: null })
      setActionComment('')
      setSelectedApproval(null)
    } catch (err) {
      console.error('Error updating approval:', err)
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Произошла ошибка при обновлении согласования',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleContractClick = (contractId: string) => {
    router.push(`/contracts/${contractId}`)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const getStatusBadge = (status: ApprovalStatus) => {
    return (
      <Badge className={`${statusColors[status]} text-white`}>
        {statusLabels[status]}
      </Badge>
    )
  }

  const openActionDialog = (approval: Approval, action: 'approve' | 'reject') => {
    setSelectedApproval(approval)
    setActionDialog({ open: true, type: action })
    setActionComment('')
  }

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.contract?.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.contract?.counterparty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.approver?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays >= 0
  }

  if (loading && approvals.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Загрузка очереди согласований...</p>
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
            <Button onClick={fetchApprovals} variant="outline">
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Очередь согласований</h1>
          <p className="text-muted-foreground">
            Все ожидающие согласования в системе • Всего: {pagination.total}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего в очереди</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просрочено</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {approvals.filter(a => isOverdue(a.dueDate)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Срок истекает</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {approvals.filter(a => isDueSoon(a.dueDate)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Мои в очереди</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvals.filter(a => a.approverId === user?.id).length}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по договору или согласующему"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-')
              setSortBy(field)
              setSortOrder(order as 'asc' | 'desc')
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate-asc">По сроку (ближайшие)</SelectItem>
                <SelectItem value="dueDate-desc">По сроку (дальние)</SelectItem>
                <SelectItem value="createdAt-desc">По дате создания (новые)</SelectItem>
                <SelectItem value="createdAt-asc">По дате создания (старые)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchApprovals} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Применить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Approvals List */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Очередь пуста</h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'Нет согласований, соответствующих поисковому запросу'
                    : 'Нет согласований, ожидающих рассмотрения'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredApprovals.map((approval) => (
            <Card 
              key={approval.id} 
              className={`hover:shadow-md transition-shadow ${
                isOverdue(approval.dueDate) ? 'border-red-200 bg-red-50' : 
                isDueSoon(approval.dueDate) ? 'border-orange-200 bg-orange-50' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        Договор {approval.contract?.number}
                      </h3>
                      {getStatusBadge(approval.status)}
                      {isOverdue(approval.dueDate) && (
                        <Badge variant="destructive" className="text-white">
                          Просрочено
                        </Badge>
                      )}
                      {isDueSoon(approval.dueDate) && !isOverdue(approval.dueDate) && (
                        <Badge variant="outline" className="border-orange-500 text-orange-700">
                          Скоро срок
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Контрагент:</span>
                        <span className="font-medium">{approval.contract?.counterparty}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Создан:</span>
                        <span className="font-medium">
                          {new Date(approval.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Срок:</span>
                        <span className={`font-medium ${
                          isOverdue(approval.dueDate) ? 'text-red-600' :
                          isDueSoon(approval.dueDate) ? 'text-orange-600' : ''
                        }`}>
                          {new Date(approval.dueDate).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Согласующий:</span>
                      <span className="font-medium">
                        {approval.approver?.name || approval.approver?.email || 'Не назначен'}
                      </span>
                    </div>
                    {approval.comment && (
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">Комментарий:</span>
                          <p className="mt-1">{approval.comment}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContractClick(approval.contractId)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Договор
                    </Button>
                    
                    {approval.approverId === user?.id && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => openActionDialog(approval, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Согласовать
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openActionDialog(approval, 'reject')}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Отклонить
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="text-sm text-muted-foreground">
              Страница {pagination.page} из {pagination.totalPages} • Всего {pagination.total} записей
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Вперед
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'approve' ? 'Согласовать заявку' : 'Отклонить заявку'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.type === 'approve' 
                ? 'Вы уверены, что хотите согласовать эту заявку на согласование?'
                : 'Вы уверены, что хотите отклонить эту заявку на согласование?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Добавьте комментарий (необязательно)"
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedApproval && handleApprovalAction(selectedApproval.id, actionDialog.type!, actionComment)}
              disabled={actionLoading}
              className={actionDialog.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {actionDialog.type === 'approve' ? 'Согласовать' : 'Отклонить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}