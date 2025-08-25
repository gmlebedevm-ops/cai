'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  FileText, 
  AlertTriangle,
  Download,
  Calendar,
  Target,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { exportToExcel, exportToPDF, prepareExportData } from '@/lib/export'

interface ReportData {
  overview: {
    totalContracts: number
    inReview: number
    approved: number
    rejected: number
    avgApprovalTime: number
    overdueApprovals: number
    completionRate: number
  }
  departmentStats: Array<{
    name: string
    total: number
    approved: number
    rejected: number
    avgTime: number
  }>
  approverWorkload: Array<{
    name: string
    role: string
    pending: number
    completed: number
    avgTime: number
  }>
  kpiData: {
    avgApprovalByType: Record<string, number>
    overdueRate: number
    efficiencyTrend: Array<{ month: string; rate: number }>
  }
}

export default function ReportsDashboard() {
  const [timeRange, setTimeRange] = useState('6months')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ReportData | null>(null)

  useEffect(() => {
    fetchReportData()
  }, [timeRange])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports?timeRange=${timeRange}`)
      if (response.ok) {
        const reportData = await response.json()
        setData(reportData)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!data) return
    
    setLoading(true)
    try {
      const exportData = prepareExportData(data, 'dashboard')
      
      if (format === 'excel') {
        exportToExcel(exportData)
      } else {
        exportToPDF(exportData)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-muted-foreground">
          <p>Не удалось загрузить данные</p>
          <Button onClick={fetchReportData} className="mt-4">
            Попробовать снова
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Аналитическая панель</h1>
          <p className="text-muted-foreground">Отчеты и аналитика по согласованию договоров</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Последний месяц</SelectItem>
              <SelectItem value="3months">Последние 3 месяца</SelectItem>
              <SelectItem value="6months">Последние 6 месяцев</SelectItem>
              <SelectItem value="1year">Последний год</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('excel')}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Среднее время согласования</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.avgApprovalTime} дней</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-12%</span> по сравнению с прошлым периодом
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Процент просроченных</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpiData.overdueRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">+2.3%</span> по сравнению с прошлым периодом
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Эффективность согласования</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> по сравнению с прошлым периодом
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные согласующие</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.approverWorkload.length}</div>
            <p className="text-xs text-muted-foreground">
              {data.approverWorkload.reduce((sum, a) => sum + a.pending, 0)} на согласовании
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="timelines">Сроки</TabsTrigger>
          <TabsTrigger value="departments">Отделы</TabsTrigger>
          <TabsTrigger value="workload">Нагрузка</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overview Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Динамика эффективности согласования
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto mb-2" />
                    <p>График эффективности согласования</p>
                    <p className="text-sm">Тренд за последние 6 месяцев</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Распределение по типам договоров
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Круговая диаграмма</p>
                    <p className="text-sm">Распределение договоров по типам</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contract Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Обзор статусов договоров
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{data.overview.inReview}</div>
                  <div className="text-sm text-muted-foreground">На согласовании</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{data.overview.approved}</div>
                  <div className="text-sm text-muted-foreground">Согласовано</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{data.overview.rejected}</div>
                  <div className="text-sm text-muted-foreground">Отклонено</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{data.overview.overdueApprovals}</div>
                  <div className="text-sm text-muted-foreground">Просрочено</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timelines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Среднее время согласования по месяцам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>График сроков согласования</p>
                  <p className="text-sm">Динамика среднего времени согласования</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Среднее время по типам договоров
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.kpiData.avgApprovalByType).map(([type, days]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="font-medium">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(days / 6) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono">{days} дней</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Статистика по отделам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Отдел</th>
                      <th className="text-center p-2">Всего</th>
                      <th className="text-center p-2">Согласовано</th>
                      <th className="text-center p-2">Отклонено</th>
                      <th className="text-center p-2">Среднее время</th>
                      <th className="text-center p-2">Эффективность</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.departmentStats.map((dept, index) => {
                      const efficiency = ((dept.approved / dept.total) * 100).toFixed(1)
                      return (
                        <tr key={index} className="border-b">
                          <td className="p-2 font-medium">{dept.name}</td>
                          <td className="text-center p-2">{dept.total}</td>
                          <td className="text-center p-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {dept.approved}
                            </Badge>
                          </td>
                          <td className="text-center p-2">
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              {dept.rejected}
                            </Badge>
                          </td>
                          <td className="text-center p-2">{dept.avgTime} дней</td>
                          <td className="text-center p-2">
                            <Badge variant={parseFloat(efficiency) > 85 ? "default" : "destructive"}>
                              {efficiency}%
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Нагрузка на согласующих
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.approverWorkload.map((approver, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{approver.name}</div>
                      <div className="text-sm text-muted-foreground">{approver.role}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">{approver.pending}</div>
                        <div className="text-xs text-muted-foreground">На согласовании</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{approver.completed}</div>
                        <div className="text-xs text-muted-foreground">Завершено</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{approver.avgTime}</div>
                        <div className="text-xs text-muted-foreground">Среднее время</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}