'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Download,
  Target,
  Activity,
  PieChart,
  Filter,
  RefreshCw,
  Award,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

// Mock data for department statistics
const mockDepartmentStats = {
  overview: {
    totalDepartments: 5,
    totalContracts: 156,
    avgEfficiency: 84.2,
    bestPerformingDept: 'Закупки',
    worstPerformingDept: 'HR'
  },
  departmentDetails: [
    {
      name: 'Юридический',
      totalContracts: 45,
      approved: 38,
      rejected: 3,
      pending: 4,
      avgApprovalTime: 3.8,
      efficiency: 84.4,
      overdueRate: 6.7,
      workload: 'Высокая',
      trend: 'up',
      topUsers: ['Иванов И.И.', 'Петров А.А.'],
      contractTypes: ['Поставщик', 'Клиент', 'Партнер']
    },
    {
      name: 'Финансовый',
      totalContracts: 32,
      approved: 28,
      rejected: 2,
      pending: 2,
      avgApprovalTime: 4.2,
      efficiency: 87.5,
      overdueRate: 6.3,
      workload: 'Средняя',
      trend: 'stable',
      topUsers: ['Сидоров С.С.', 'Козлов К.К.'],
      contractTypes: ['Поставщик', 'Подрядчик']
    },
    {
      name: 'Закупки',
      totalContracts: 28,
      approved: 24,
      rejected: 1,
      pending: 3,
      avgApprovalTime: 3.5,
      efficiency: 85.7,
      overdueRate: 3.6,
      workload: 'Средняя',
      trend: 'up',
      topUsers: ['Михайлов М.М.', 'Федоров Ф.Ф.'],
      contractTypes: ['Поставщик', 'Подрядчик']
    },
    {
      name: 'IT',
      totalContracts: 21,
      approved: 18,
      rejected: 2,
      pending: 1,
      avgApprovalTime: 4.5,
      efficiency: 85.7,
      overdueRate: 9.5,
      workload: 'Низкая',
      trend: 'down',
      topUsers: ['Алексеев А.А.', 'Васильев В.В.'],
      contractTypes: ['Партнер', 'Прочее']
    },
    {
      name: 'HR',
      totalContracts: 30,
      approved: 26,
      rejected: 4,
      pending: 0,
      avgApprovalTime: 5.1,
      efficiency: 86.7,
      overdueRate: 13.3,
      workload: 'Средняя',
      trend: 'stable',
      topUsers: ['Николаев Н.Н.', 'Степанов С.С.'],
      contractTypes: ['Клиент', 'Прочее']
    }
  ],
  performanceMetrics: [
    { metric: 'Скорость согласования', department: 'Закупки', value: 3.5, unit: 'дней', trend: 'down' },
    { metric: 'Эффективность', department: 'Финансовый', value: 87.5, unit: '%', trend: 'up' },
    { metric: 'Минимум просрочек', department: 'Закупки', value: 3.6, unit: '%', trend: 'down' },
    { metric: 'Стабильность', department: 'HR', value: 86.7, unit: '%', trend: 'stable' }
  ],
  workloadDistribution: [
    { department: 'Юридический', current: 8, capacity: 10, utilization: 80 },
    { department: 'Финансовый', current: 5, capacity: 8, utilization: 63 },
    { department: 'Закупки', current: 3, capacity: 6, utilization: 50 },
    { department: 'IT', current: 6, capacity: 8, utilization: 75 },
    { department: 'HR', current: 4, capacity: 6, utilization: 67 }
  ]
}

export default function StatisticsReport() {
  const [timeRange, setTimeRange] = useState('6months')
  const [sortBy, setSortBy] = useState('efficiency')
  const [loading, setLoading] = useState(false)

  const handleExport = (format: 'excel' | 'pdf') => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  const getWorkloadColor = (workload: string) => {
    switch (workload) {
      case 'Высокая': return 'bg-red-100 text-red-800'
      case 'Средняя': return 'bg-yellow-100 text-yellow-800'
      case 'Низкая': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
      case 'stable': return <Activity className="h-4 w-4 text-blue-600" />
      default: return null
    }
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'bg-red-500'
    if (utilization >= 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const sortedDepartments = [...mockDepartmentStats.departmentDetails].sort((a, b) => {
    switch (sortBy) {
      case 'efficiency': return b.efficiency - a.efficiency
      case 'contracts': return b.totalContracts - a.totalContracts
      case 'time': return a.avgApprovalTime - b.avgApprovalTime
      case 'overdue': return a.overdueRate - b.overdueRate
      default: return 0
    }
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Статистика по отделам</h1>
          <p className="text-muted-foreground">Анализ производительности и эффективности отделов</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Период" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Месяц</SelectItem>
                <SelectItem value="3months">3 месяца</SelectItem>
                <SelectItem value="6months">6 месяцев</SelectItem>
                <SelectItem value="1year">Год</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efficiency">По эффективности</SelectItem>
                <SelectItem value="contracts">По кол-ву договоров</SelectItem>
                <SelectItem value="time">По времени</SelectItem>
                <SelectItem value="overdue">По просрочкам</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('excel')}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего отделов</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDepartmentStats.overview.totalDepartments}</div>
            <p className="text-xs text-muted-foreground">
              Активных участников
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средняя эффективность</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDepartmentStats.overview.avgEfficiency}%</div>
            <p className="text-xs text-muted-foreground">
              По всем отделам
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Лучший отдел</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mockDepartmentStats.overview.bestPerformingDept}</div>
            <p className="text-xs text-muted-foreground">
              По эффективности
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Требует внимания</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{mockDepartmentStats.overview.worstPerformingDept}</div>
            <p className="text-xs text-muted-foreground">
              Низкая эффективность
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Производительность отделов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedDepartments.map((dept, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{dept.name}</h3>
                    <Badge className={getWorkloadColor(dept.workload)}>
                      {dept.workload}
                    </Badge>
                    {getTrendIcon(dept.trend)}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{dept.efficiency}%</div>
                    <div className="text-sm text-muted-foreground">Эффективность</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold">{dept.totalContracts}</div>
                    <div className="text-sm text-muted-foreground">Всего договоров</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{dept.approved}</div>
                    <div className="text-sm text-muted-foreground">Согласовано</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{dept.avgApprovalTime} дн.</div>
                    <div className="text-sm text-muted-foreground">Среднее время</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{dept.overdueRate}%</div>
                    <div className="text-sm text-muted-foreground">Просрочено</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">Топ пользователи:</span>
                    <span className="text-muted-foreground ml-2">{dept.topUsers.join(', ')}</span>
                  </div>
                  <div>
                    <span className="font-medium">Типы договоров:</span>
                    <span className="text-muted-foreground ml-2">{dept.contractTypes.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Лучшие показатели
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDepartmentStats.performanceMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">{metric.metric}</div>
                      <div className="text-sm text-muted-foreground">{metric.department}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{metric.value} {metric.unit}</div>
                    {getTrendIcon(metric.trend)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Загрузка отделов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDepartmentStats.workloadDistribution.map((workload, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{workload.department}</span>
                    <span className="text-sm text-muted-foreground">
                      {workload.current} / {workload.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getUtilizationColor(workload.utilization)}`}
                      style={{ width: `${workload.utilization}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Загрузка: {workload.utilization}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}