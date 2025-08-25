'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Calendar, 
  Download,
  Target,
  Activity,
  LineChart,
  Filter,
  RefreshCw
} from 'lucide-react'

// Mock data for timeline analysis
const mockTimelineData = {
  monthlyStats: [
    { month: 'Янв', avgDays: 5.2, minDays: 2, maxDays: 12, contracts: 12, overdue: 2 },
    { month: 'Фев', avgDays: 4.8, minDays: 1, maxDays: 11, contracts: 15, overdue: 1 },
    { month: 'Мар', avgDays: 4.1, minDays: 1, maxDays: 9, contracts: 18, overdue: 1 },
    { month: 'Апр', avgDays: 3.9, minDays: 1, maxDays: 8, contracts: 22, overdue: 0 },
    { month: 'Май', avgDays: 4.3, minDays: 2, maxDays: 10, contracts: 19, overdue: 2 },
    { month: 'Июн', avgDays: 4.0, minDays: 1, maxDays: 9, contracts: 25, overdue: 1 }
  ],
  byContractType: [
    { type: 'Поставщик', avgDays: 3.8, minDays: 1, maxDays: 7, count: 45, overdue: 3 },
    { type: 'Клиент', avgDays: 4.2, minDays: 2, maxDays: 8, count: 38, overdue: 4 },
    { type: 'Партнер', avgDays: 3.5, minDays: 1, maxDays: 6, count: 28, overdue: 1 },
    { type: 'Подрядчик', avgDays: 4.8, minDays: 2, maxDays: 12, count: 32, overdue: 5 },
    { type: 'Прочее', avgDays: 4.1, minDays: 1, maxDays: 9, count: 13, overdue: 1 }
  ],
  byDepartment: [
    { department: 'Юридический', avgDays: 3.8, count: 45, overdue: 2 },
    { department: 'Финансовый', avgDays: 4.2, count: 32, overdue: 3 },
    { department: 'Закупки', avgDays: 3.5, count: 28, overdue: 1 },
    { department: 'IT', avgDays: 4.5, count: 21, overdue: 2 },
    { department: 'HR', avgDays: 5.1, count: 30, overdue: 4 }
  ],
  bottlenecks: [
    { step: 'Юридическая проверка', avgDelay: 1.2, contracts: 45, severity: 'medium' },
    { step: 'Финансовое согласование', avgDelay: 0.8, contracts: 32, severity: 'low' },
    { step: 'Согласование с руководством', avgDelay: 2.1, contracts: 25, severity: 'high' },
    { step: 'Проверка безопасности', avgDelay: 1.5, contracts: 21, severity: 'medium' },
    { step: 'HR согласование', avgDelay: 0.9, contracts: 30, severity: 'low' }
  ]
}

export default function TimelinesReport() {
  const [timeRange, setTimeRange] = useState('6months')
  const [groupBy, setGroupBy] = useState('month')
  const [loading, setLoading] = useState(false)

  const handleExport = (format: 'excel' | 'pdf') => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return 'Высокая'
      case 'medium': return 'Средняя'
      case 'low': return 'Низкая'
      default: return 'Неизвестно'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Анализ сроков согласования</h1>
          <p className="text-muted-foreground">Детальный анализ времени согласования договоров</p>
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
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Группировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">По месяцам</SelectItem>
                <SelectItem value="type">По типам</SelectItem>
                <SelectItem value="department">По отделам</SelectItem>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Среднее время</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.1 дней</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-0.3 дней</span> за последний месяц
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Минимальное время</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 день</div>
            <p className="text-xs text-muted-foreground">
              Рекорд за все время
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Максимальное время</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 дней</div>
            <p className="text-xs text-muted-foreground">
              Требует внимания
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просрочено</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">14</div>
            <p className="text-xs text-muted-foreground">
              8.9% от общего числа
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Динамика сроков согласования
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTimelineData.monthlyStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-medium w-12">{stat.month}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{stat.contracts} дог.</span>
                      {stat.overdue > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {stat.overdue} проср.
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold">{stat.avgDays} дней</div>
                      <div className="text-xs text-muted-foreground">
                        {stat.minDays}-{stat.maxDays} дней
                      </div>
                    </div>
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(stat.avgDays / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Contract Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              По типам договоров
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTimelineData.byContractType.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-medium w-20">{item.type}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{item.count} дог.</span>
                      {item.overdue > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {item.overdue}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold">{item.avgDays} дней</div>
                      <div className="text-xs text-muted-foreground">
                        {item.minDays}-{item.maxDays} дней
                      </div>
                    </div>
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(item.avgDays / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Анализ по отделам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Отдел</th>
                  <th className="text-center p-3">Кол-во договоров</th>
                  <th className="text-center p-3">Среднее время</th>
                  <th className="text-center p-3">Просрочено</th>
                  <th className="text-center p-3">Процент просрочки</th>
                  <th className="text-center p-3">Тренд</th>
                </tr>
              </thead>
              <tbody>
                {mockTimelineData.byDepartment.map((dept, index) => {
                  const overduePercentage = ((dept.overdue / dept.count) * 100).toFixed(1)
                  return (
                    <tr key={index} className="border-b">
                      <td className="p-3 font-medium">{dept.department}</td>
                      <td className="text-center p-3">{dept.count}</td>
                      <td className="text-center p-3">
                        <span className="font-bold">{dept.avgDays} дней</span>
                      </td>
                      <td className="text-center p-3">
                        <Badge variant={dept.overdue > 0 ? "destructive" : "secondary"}>
                          {dept.overdue}
                        </Badge>
                      </td>
                      <td className="text-center p-3">
                        <Badge variant={parseFloat(overduePercentage) > 10 ? "destructive" : "secondary"}>
                          {overduePercentage}%
                        </Badge>
                      </td>
                      <td className="text-center p-3">
                        <div className="flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottlenecks Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Анализ узких мест
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockTimelineData.bottlenecks.map((bottleneck, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{bottleneck.step}</h4>
                  <Badge className={getSeverityColor(bottleneck.severity)}>
                    {getSeverityLabel(bottleneck.severity)}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Средняя задержка:</span>
                    <span className="font-medium">{bottleneck.avgDelay} дней</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Затронуто договоров:</span>
                    <span className="font-medium">{bottleneck.contracts}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}