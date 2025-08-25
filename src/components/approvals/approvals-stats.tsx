'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Eye,
  Calendar,
  User
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface ApprovalStats {
  total: number
  pending: number
  approved: number
  rejected: number
  overdue: number
  dueSoon: number
  recentActivity: Array<{
    id: string
    status: string
    updatedAt: string
    approver: {
      id: string
      name?: string
      email: string
    }
    contract: {
      id: string
      number: string
      counterparty: string
    }
  }>
}

export default function ApprovalsStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ApprovalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchStats()
    }
  }, [user?.id])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/approvals/stats?approverId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setError('Ошибка загрузки статистики')
      }
    } catch (err) {
      console.error('Error fetching approval stats:', err)
      setError('Ошибка загрузки статистики')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {error || 'Нет данных о согласованиях'}
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-500', label: 'Ожидает' },
      'APPROVED': { color: 'bg-green-500', label: 'Согласовано' },
      'REJECTED': { color: 'bg-red-500', label: 'Отклонено' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-500', label: status }
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего согласований</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Назначено вам
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ожидают решения</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Требуют вашего внимания
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просрочено</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Требуют срочного внимания
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Срок истекает</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.dueSoon}</div>
            <p className="text-xs text-muted-foreground">
              В ближайшие 3 дня
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Последняя активность
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {getStatusBadge(activity.status)}
                    </div>
                    <div>
                      <div className="font-medium">
                        Договор {activity.contract.number}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {activity.contract.counterparty}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(activity.updatedAt).toLocaleDateString('ru-RU')}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {activity.approver.name || activity.approver.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {stats.recentActivity.length > 5 && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/approvals/my'}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Показать все ({stats.recentActivity.length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.pending > 0 && (
          <Button 
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => window.location.href = '/approvals/my'}
          >
            <Clock className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">Мои согласования</div>
              <div className="text-xs opacity-70">{stats.pending} ожидают решения</div>
            </div>
          </Button>
        )}
        
        {stats.overdue > 0 && (
          <Button 
            variant="destructive"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => window.location.href = '/approvals/my'}
          >
            <AlertTriangle className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">Срочные согласования</div>
              <div className="text-xs opacity-70">{stats.overdue} просрочено</div>
            </div>
          </Button>
        )}
        
        <Button 
          variant="outline"
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={() => window.location.href = '/approvals/queue'}
        >
          <TrendingUp className="h-8 w-8" />
          <div className="text-center">
            <div className="font-medium">Очередь согласований</div>
            <div className="text-xs opacity-70">Все ожидающие</div>
          </div>
        </Button>
      </div>
    </div>
  )
}