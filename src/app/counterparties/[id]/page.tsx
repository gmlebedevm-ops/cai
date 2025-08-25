'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Contact, 
  Phone, 
  Mail, 
  MapPin, 
  Globe,
  FileText,
  Calendar,
  DollarSign,
  Users,
  Search,
  Filter,
  Edit,
  Eye,
  Download
} from 'lucide-react'
import { Contract, ContractStatus } from '@/types/contract'

interface Counterparty {
  id: string
  name: string
  code: string
  description?: string
  isActive: boolean
  value?: string
  contractCount?: number
  lastContractDate?: string
  createdAt: string
  updatedAt: string
}

interface ContractWithDetails extends Contract {
  initiatorName?: string
  documentCount?: number
}

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

export default function CounterpartyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const counterpartyId = params.id as string
  
  const [counterparty, setCounterparty] = useState<Counterparty | null>(null)
  const [contracts, setContracts] = useState<ContractWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [contractsLoading, setContractsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchCounterparty()
    fetchContracts()
  }, [counterpartyId])

  const fetchCounterparty = async () => {
    try {
      const response = await fetch(`/api/references/${counterpartyId}`)
      if (response.ok) {
        const data = await response.json()
        setCounterparty(data)
      }
    } catch (error) {
      console.error('Error fetching counterparty:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchContracts = async () => {
    setContractsLoading(true)
    try {
      // Сначала получаем информацию о контрагенте, чтобы узнать его имя
      const counterpartyResponse = await fetch(`/api/references/${counterpartyId}`)
      if (!counterpartyResponse.ok) {
        throw new Error('Failed to fetch counterparty')
      }
      
      const counterpartyData = await counterpartyResponse.json()
      const counterpartyName = counterpartyData.name
      
      // Теперь получаем договоры, фильтруя по имени контрагента
      const response = await fetch(`/api/contracts?counterparty=${encodeURIComponent(counterpartyName)}`)
      if (response.ok) {
        const data = await response.json()
        setContracts(data.contracts || [])
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setContractsLoading(false)
    }
  }

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getContactInfo = () => {
    if (!counterparty?.value) return {}
    try {
      return JSON.parse(counterparty.value)
    } catch {
      return {}
    }
  }

  const contactInfo = getContactInfo()

  const handleContractClick = (contractId: string) => {
    router.push(`/contracts/${contractId}`)
  }

  const handleEditCounterparty = () => {
    router.push('/counterparties')
  }

  const exportContracts = () => {
    const data = filteredContracts.map(contract => ({
      'Номер договора': contract.number,
      'Сумма': contract.amount,
      'Статус': statusLabels[contract.status],
      'Дата начала': new Date(contract.startDate).toLocaleDateString('ru-RU'),
      'Дата окончания': new Date(contract.endDate).toLocaleDateString('ru-RU'),
      'Дата создания': new Date(contract.createdAt).toLocaleDateString('ru-RU')
    }))
    
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `договоры_${counterparty?.name || 'контрагент'}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка информации о контрагенте...</p>
        </div>
      </div>
    )
  }

  if (!counterparty) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Contact className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Контрагент не найден</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/counterparties')}>
          <ArrowLeft className="h-4 w-4" />
          Назад к контрагентам
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">{counterparty.name}</h1>
          <p className="text-muted-foreground">
            Информация о контрагенте и связанные договоры
          </p>
        </div>
        <Button onClick={handleEditCounterparty}>
          <Edit className="h-4 w-4 mr-2" />
          Редактировать
        </Button>
      </div>

      {/* Counterparty Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Contact className="h-5 w-5" />
            Общая информация
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Наименование</label>
                <p className="text-lg font-semibold">{counterparty.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Код</label>
                <div className="flex items-center gap-2">
                  <p className="font-mono bg-muted px-2 py-1 rounded">{counterparty.code}</p>
                  <Badge variant={counterparty.isActive ? "default" : "secondary"}>
                    {counterparty.isActive ? 'Активен' : 'Неактивен'}
                  </Badge>
                </div>
              </div>

              {counterparty.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Описание</label>
                  <p className="text-sm">{counterparty.description}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {contactInfo.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Телефон</label>
                    <p className="text-sm">{contactInfo.phone}</p>
                  </div>
                </div>
              )}

              {contactInfo.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm">{contactInfo.email}</p>
                  </div>
                </div>
              )}

              {contactInfo.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Адрес</label>
                    <p className="text-sm">{contactInfo.address}</p>
                  </div>
                </div>
              )}

              {contactInfo.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Веб-сайт</label>
                    <p className="text-sm">{contactInfo.website}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{counterparty.contractCount || 0}</div>
                <div className="text-sm text-muted-foreground">Всего договоров</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {contracts.filter(c => c.status === ContractStatus.SIGNED).length}
                </div>
                <div className="text-sm text-muted-foreground">Подписано</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {contracts.filter(c => c.status === ContractStatus.IN_REVIEW).length}
                </div>
                <div className="text-sm text-muted-foreground">На согласовании</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Договоры контрагента
              <Badge variant="secondary">{filteredContracts.length}</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportContracts}>
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по номеру договора..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Статус договора" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contracts List */}
          {contractsLoading ? (
            <div className="text-center py-8">Загрузка договоров...</div>
          ) : (
            <div className="space-y-4">
              {filteredContracts.map((contract) => (
                <Card 
                  key={contract.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleContractClick(contract.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{contract.number}</h3>
                          <Badge className={`${statusColors[contract.status]} text-white`}>
                            {statusLabels[contract.status]}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>{contract.amount.toLocaleString('ru-RU')} ₽</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>с {new Date(contract.startDate).toLocaleDateString('ru-RU')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>по {new Date(contract.endDate).toLocaleDateString('ru-RU')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Подробнее
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredContracts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Договоры не найдены' 
                    : 'У этого контрагента еще нет договоров'
                  }
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}