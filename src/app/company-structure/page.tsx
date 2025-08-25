'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building2, 
  Upload, 
  Trash2, 
  Download, 
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users
} from 'lucide-react'
import OrganizationChart from '@/components/company/organization-chart'
import { CompanyStructure } from '@/types/company'

const defaultCompanyStructure: CompanyStructure = {
  root_node: "Генеральный директор",
  children: [
    {
      department: "Секретарь офиса",
      parent: "Генеральный директор",
      children: []
    },
    {
      department: "Департамент стратегического управления и развития",
      parent: "Генеральный директор",
      children: [
        {
          department: "Управление персоналом",
          parent: "Департамент стратегического управления и развития",
          children: []
        },
        {
          department: "Отдел по социальной политике",
          parent: "Департамент стратегического управления и развития",
          children: []
        },
        {
          department: "Управление качеством",
          parent: "Департамент стратегического управления и развития",
          children: []
        }
      ]
    },
    {
      department: "Управление экономикой и финансами",
      parent: "Генеральный директор",
      children: [
        {
          department: "Планово-экономический отдел",
          parent: "Управление экономикой и финансами",
          children: []
        },
        {
          department: "Финансовый отдел",
          parent: "Управление экономикой и финансами",
          children: []
        },
        {
          department: "Бухгалтерия",
          parent: "Управление экономикой и финансами",
          children: []
        }
      ]
    },
    {
      department: "Коммерческий департамент",
      parent: "Генеральный директор",
      children: [
        {
          department: "Отдел маркетинга",
          parent: "Коммерческий департамент",
          children: []
        },
        {
          department: "Отдел логистики",
          parent: "Коммерческий департамент",
          children: []
        },
        {
          department: "Управление закупками",
          parent: "Коммерческий департамент",
          children: [
            {
              department: "Отдел закупок",
              parent: "Управление закупками",
              children: []
            },
            {
              department: "Отдел снабжения",
              parent: "Управление закупками",
              children: []
            }
          ]
        },
        {
          department: "Управление продажами",
          parent: "Коммерческий департамент",
          children: []
        }
      ]
    },
    {
      department: "Правовой департамент",
      parent: "Генеральный директор",
      children: [
        {
          department: "Юридический отдел",
          parent: "Правовой департамент",
          children: []
        },
        {
          department: "Отдел по земельным отношениям",
          parent: "Правовой департамент",
          children: []
        }
      ]
    },
    {
      department: "Технический департамент",
      parent: "Генеральный директор",
      children: [
        {
          department: "Отдел промышленных технологий",
          parent: "Технический департамент",
          children: []
        },
        {
          department: "Строительный отдел",
          parent: "Технический департамент",
          children: []
        },
        {
          department: "Отдел экологии",
          parent: "Технический департамент",
          children: []
        },
        {
          department: "Отдел охраны труда и пожбезопасности",
          parent: "Технический департамент",
          children: []
        }
      ]
    },
    {
      department: "Департамент сельского хозяйства",
      parent: "Генеральный директор",
      children: [
        {
          department: "Отдел сельхозтехнологий",
          parent: "Департамент сельского хозяйства",
          children: []
        }
      ]
    },
    {
      department: "Департамент информационных технологий",
      parent: "Генеральный директор",
      children: [
        {
          department: "Отдел сопровождения ИТ-инфраструктуры",
          parent: "Департамент информационных технологий",
          children: []
        },
        {
          department: "Отдел информационной безопасности",
          parent: "Департамент информационных технологий",
          children: []
        }
      ]
    },
    {
      department: "Департамент по безопасности",
      parent: "Генеральный директор",
      children: []
    },
    {
      department: "Департамент операционного управления",
      parent: "Генеральный директор",
      children: []
    }
  ]
}

export default function CompanyStructurePage() {
  const [companyStructure, setCompanyStructure] = useState<CompanyStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [jsonInput, setJsonInput] = useState<string>('')

  useEffect(() => {
    fetchCompanyStructure()
  }, [])

  const fetchCompanyStructure = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/company-structure/hierarchy')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.hierarchy) {
          setCompanyStructure(data.hierarchy)
        }
      }
    } catch (error) {
      console.error('Error fetching company structure:', error)
    } finally {
      setLoading(false)
    }
  }

  const uploadDefaultStructure = async () => {
    try {
      setUploading(true)
      setMessage(null)

      const response = await fetch('/api/company-structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_structure: defaultCompanyStructure
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Структура компании успешно загружена' })
        fetchCompanyStructure()
      } else {
        setMessage({ type: 'error', text: data.error || 'Ошибка при загрузке структуры' })
      }
    } catch (error) {
      console.error('Error uploading company structure:', error)
      setMessage({ type: 'error', text: 'Ошибка при загрузке структуры' })
    } finally {
      setUploading(false)
    }
  }

  const uploadCustomStructure = async () => {
    if (!jsonInput.trim()) {
      setMessage({ type: 'error', text: 'Пожалуйста, введите JSON структуру' })
      return
    }

    try {
      const parsedData = JSON.parse(jsonInput)
      
      if (!parsedData.company_structure) {
        setMessage({ type: 'error', text: 'JSON должен содержать поле company_structure' })
        return
      }

      setUploading(true)
      setMessage(null)

      const response = await fetch('/api/company-structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData)
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Структура компании успешно загружена' })
        setJsonInput('')
        fetchCompanyStructure()
      } else {
        setMessage({ type: 'error', text: data.error || 'Ошибка при загрузке структуры' })
      }
    } catch (error) {
      console.error('Error parsing JSON:', error)
      setMessage({ type: 'error', text: 'Ошибка в формате JSON' })
    } finally {
      setUploading(false)
    }
  }

  const clearStructure = async () => {
    if (!confirm('Вы уверены, что хотите удалить всю структуру компании?')) {
      return
    }

    try {
      setUploading(true)
      setMessage(null)

      const response = await fetch('/api/company-structure', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Структура компании успешно удалена' })
        setCompanyStructure(null)
      } else {
        setMessage({ type: 'error', text: data.error || 'Ошибка при удалении структуры' })
      }
    } catch (error) {
      console.error('Error clearing company structure:', error)
      setMessage({ type: 'error', text: 'Ошибка при удалении структуры' })
    } finally {
      setUploading(false)
    }
  }

  const exportStructure = () => {
    if (companyStructure) {
      const dataStr = JSON.stringify({ company_structure: companyStructure }, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'company-structure.json'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  const loadDefaultToInput = () => {
    setJsonInput(JSON.stringify({ company_structure: defaultCompanyStructure }, null, 2))
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Загрузка структуры компании...</p>
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
          <h1 className="text-2xl sm:text-3xl font-bold">Структура компании</h1>
          <p className="text-muted-foreground">
            Управление организационной структурой компании
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchCompanyStructure}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          {companyStructure && (
            <Button
              variant="outline"
              onClick={exportStructure}
            >
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          )}
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего подразделений</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companyStructure ? countDepartments(companyStructure) : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Уровней иерархии</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companyStructure ? getMaxDepth(companyStructure) : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Статус</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companyStructure ? (
                <Badge className="bg-green-500 text-white">Загружена</Badge>
              ) : (
                <Badge variant="outline">Не загружена</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Быстрые действия
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full justify-start"
              onClick={uploadDefaultStructure}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Загрузить структуру по умолчанию
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={loadDefaultToInput}
            >
              <FileText className="h-4 w-4 mr-2" />
              Загрузить шаблон в редактор
            </Button>

            {companyStructure && (
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={clearStructure}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Очистить структуру
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Custom JSON Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Загрузка из JSON
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Вставьте JSON структуру компании..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <Button
              className="w-full"
              onClick={uploadCustomStructure}
              disabled={uploading || !jsonInput.trim()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Загрузить структуру
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Organization Chart */}
      <OrganizationChart 
        data={companyStructure}
        className="w-full"
      />
    </div>
  )
}

// Helper functions
function countDepartments(structure: CompanyStructure): number {
  let count = 1 // root node
  
  const countChildren = (children: any[]) => {
    children.forEach(child => {
      count++
      if (child.children && child.children.length > 0) {
        countChildren(child.children)
      }
    })
  }
  
  countChildren(structure.children)
  return count
}

function getMaxDepth(structure: CompanyStructure): number {
  let maxDepth = 1
  
  const getDepth = (children: any[], currentDepth: number) => {
    children.forEach(child => {
      maxDepth = Math.max(maxDepth, currentDepth + 1)
      if (child.children && child.children.length > 0) {
        getDepth(child.children, currentDepth + 1)
      }
    })
  }
  
  getDepth(structure.children, 1)
  return maxDepth
}