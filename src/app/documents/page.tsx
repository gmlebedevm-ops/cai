'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Eye, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  User,
  HardDrive,
  File,
  Loader2,
  Plus
} from 'lucide-react'
import { Document, DocumentType } from '@/types/contract'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

const documentTypeLabels = {
  [DocumentType.CONTRACT]: 'Договор',
  [DocumentType.TENDER_SHEET]: 'Лот тендера',
  [DocumentType.COMMERCIAL_PROPOSAL]: 'Коммерческое предложение',
  [DocumentType.DISAGREEMENT_PROTOCOL]: 'Протокол разногласий',
  [DocumentType.OTHER]: 'Другое'
}

const documentTypeColors = {
  [DocumentType.CONTRACT]: 'bg-blue-500',
  [DocumentType.TENDER_SHEET]: 'bg-green-500',
  [DocumentType.COMMERCIAL_PROPOSAL]: 'bg-purple-500',
  [DocumentType.DISAGREEMENT_PROTOCOL]: 'bg-orange-500',
  [DocumentType.OTHER]: 'bg-gray-500'
}

interface DocumentWithDetails extends Document {
  contract: {
    id: string
    number: string
    counterparty: string
  }
  versions: Array<{
    id: string
    version: number
    filePath: string
    changes: string
    createdAt: Date
    author: {
      id: string
      name?: string
      email: string
    }
  }>
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function DocumentsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  })
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadContractId, setUploadContractId] = useState('')
  const [uploadDocumentType, setUploadDocumentType] = useState<DocumentType>(DocumentType.OTHER)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [contracts, setContracts] = useState<any[]>([])

  // Загрузка документов
  useEffect(() => {
    fetchDocuments()
  }, [pagination.page, pagination.limit, sortBy, sortOrder])

  // Загрузка договоров для формы загрузки
  useEffect(() => {
    fetchContracts()
  }, [])

  // Применение фильтров
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }))
      fetchDocuments()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, typeFilter])

  const fetchDocuments = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/documents?${params}`)
      
      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setDocuments(data.documents || [])
      setPagination(data.pagination || pagination)
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке документов')
    } finally {
      setLoading(false)
    }
  }

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts')
      if (response.ok) {
        const data = await response.json()
        setContracts(data.contracts || [])
      }
    } catch (err) {
      console.error('Error fetching contracts:', err)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !uploadContractId) {
      toast({
        title: 'Ошибка',
        description: 'Выберите файл и договор',
        variant: 'destructive',
      })
      return
    }

    setUploadLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('contractId', uploadContractId)
      formData.append('documentType', uploadDocumentType)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка загрузки файла')
      }

      const result = await response.json()
      
      toast({
        title: 'Успешно',
        description: `Документ "${result.document.filename}" успешно загружен`,
      })
      
      setUploadDialogOpen(false)
      setSelectedFile(null)
      setUploadContractId('')
      setUploadDocumentType(DocumentType.OTHER)
      fetchDocuments()
    } catch (err) {
      console.error('Error uploading file:', err)
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Произошла ошибка при загрузке файла',
        variant: 'destructive',
      })
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDownload = async (document: DocumentWithDetails, versionPath?: string) => {
    try {
      const filePath = versionPath || document.filePath
      const response = await fetch(filePath)
      
      if (!response.ok) {
        throw new Error('Ошибка скачивания файла')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = document.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Успешно',
        description: `Документ "${document.filename}" успешно скачан`,
      })
    } catch (err) {
      console.error('Error downloading file:', err)
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при скачивании файла',
        variant: 'destructive',
      })
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

  const getDocumentTypeBadge = (type: DocumentType) => {
    return (
      <Badge className={`${documentTypeColors[type]} text-white`}>
        {documentTypeLabels[type]}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.contract?.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.contract?.counterparty.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || document.type === typeFilter
    
    return matchesSearch && matchesType
  })

  if (loading && documents.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Загрузка документов...</p>
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
            <Button onClick={fetchDocuments} variant="outline">
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
          <h1 className="text-2xl sm:text-3xl font-bold">Документы</h1>
          <p className="text-muted-foreground">
            Управление документами договоров • Всего: {pagination.total}
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Загрузить документ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Загрузка документа</DialogTitle>
              <DialogDescription>
                Выберите файл и договор для загрузки документа
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Файл</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contract">Договор</Label>
                <Select value={uploadContractId} onValueChange={setUploadContractId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите договор" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.number} - {contract.counterparty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Тип документа</Label>
                <Select value={uploadDocumentType} onValueChange={(value) => setUploadDocumentType(value as DocumentType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(documentTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleFileUpload} disabled={uploadLoading || !selectedFile || !uploadContractId}>
                {uploadLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Загрузить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего документов</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Договоры</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.type === DocumentType.CONTRACT).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Коммерческие предложения</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.type === DocumentType.COMMERCIAL_PROPOSAL).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общий размер</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(documents.reduce((total, doc) => total + doc.fileSize, 0))}
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
                placeholder="Поиск по названию или договору"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Тип документа" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {Object.entries(documentTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
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
                <SelectItem value="createdAt-desc">По дате загрузки (новые)</SelectItem>
                <SelectItem value="createdAt-asc">По дате загрузки (старые)</SelectItem>
                <SelectItem value="filename-asc">По названию (А-Я)</SelectItem>
                <SelectItem value="filename-desc">По названию (Я-А)</SelectItem>
                <SelectItem value="fileSize-desc">По размеру (убыв.)</SelectItem>
                <SelectItem value="fileSize-asc">По размеру (возр.)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchDocuments} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Применить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Обновление данных...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {filteredDocuments.map((document) => (
                <Card key={document.id} className="hover:shadow-md transition-all duration-200">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <File className="h-5 w-5" />
                            {document.filename}
                          </CardTitle>
                          {getDocumentTypeBadge(document.type)}
                        </div>
                        <p className="text-muted-foreground">
                          Договор: {document.contract?.number} ({document.contract?.counterparty})
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleContractClick(document.contractId)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Просмотр договора
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Скачать
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Размер:</span>
                        <div>{formatFileSize(document.fileSize)}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Тип:</span>
                        <div>{document.mimeType}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Загружен:</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(document.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Версий:</span>
                        <div>{document.versions?.length || 1}</div>
                      </div>
                    </div>
                    
                    {/* Versions */}
                    {document.versions && document.versions.length > 1 && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <Clock className="h-4 w-4" />
                          Версии документа:
                        </div>
                        <div className="space-y-2">
                          {document.versions.map((version) => (
                            <div key={version.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">v{version.version}</Badge>
                                <span>{version.author?.name || version.author?.email}</span>
                                <span>•</span>
                                <span>{new Date(version.createdAt).toLocaleDateString('ru-RU')}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(document, version.filePath)}
                                className="h-6 w-6 p-0"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredDocuments.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Документы не найдены</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || typeFilter !== 'all' 
                      ? 'Попробуйте изменить параметры фильтрации'
                      : 'Начните с загрузки первого документа'
                    }
                  </p>
                  {(!searchTerm && typeFilter === 'all') && (
                    <Button onClick={() => setUploadDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Загрузить документ
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
                  Назад
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = pagination.page - 2 + i
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
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}