'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Upload, 
  Download, 
  FileText, 
  Eye, 
  Trash2, 
  History,
  Plus,
  File
} from 'lucide-react'
import { Document, DocumentType, DocumentVersion } from '@/types/contract'

interface DocumentManagerProps {
  contractId: string
  currentUserId?: string
  onDocumentUpdate?: () => void
}

export function DocumentManager({ contractId, currentUserId, onDocumentUpdate }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('OTHER')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showVersions, setShowVersions] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [contractId])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('contractId', contractId)
      formData.append('documentType', selectedDocumentType)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        await fetchDocuments()
        onDocumentUpdate?.()
        event.target.value = '' // Reset file input
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка загрузки файла')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Ошибка загрузки файла')
    } finally {
      setUploading(false)
    }
  }

  const downloadDocument = async (document: Document) => {
    try {
      const response = await fetch(document.filePath)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = document.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Ошибка скачивания файла')
    }
  }

  const getDocumentTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'CONTRACT': return 'Договор'
      case 'TENDER_SHEET': return 'Тендерный лист'
      case 'COMMERCIAL_PROPOSAL': return 'Коммерческое предложение'
      case 'DISAGREEMENT_PROTOCOL': return 'Протокол разногласий'
      default: return 'Другое'
    }
  }

  const getDocumentTypeColor = (type: DocumentType) => {
    switch (type) {
      case 'CONTRACT': return 'bg-blue-100 text-blue-800'
      case 'TENDER_SHEET': return 'bg-green-100 text-green-800'
      case 'COMMERCIAL_PROPOSAL': return 'bg-purple-100 text-purple-800'
      case 'DISAGREEMENT_PROTOCOL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка документов...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Документы договора</h3>
        <div className="flex items-center gap-2">
          <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONTRACT">Договор</SelectItem>
              <SelectItem value="TENDER_SHEET">Тендерный лист</SelectItem>
              <SelectItem value="COMMERCIAL_PROPOSAL">КП</SelectItem>
              <SelectItem value="DISAGREEMENT_PROTOCOL">ПСР</SelectItem>
              <SelectItem value="OTHER">Другое</SelectItem>
            </SelectContent>
          </Select>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
              id="file-upload"
            />
            <Button
              asChild
              disabled={uploading}
              size="sm"
            >
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Загрузка...' : 'Загрузить'}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">Документы не загружены</p>
            <p className="text-sm text-muted-foreground mt-2">
              Загрузите документы, связанные с этим договором
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <File className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{document.filename}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getDocumentTypeColor(document.type)}>
                          {getDocumentTypeLabel(document.type)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(document.fileSize)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(document.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(document)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Скачать
                    </Button>
                    
                    {document.versions && document.versions.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(document)
                          setShowVersions(true)
                        }}
                      >
                        <History className="h-4 w-4 mr-1" />
                        Версии ({document.versions.length})
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Модальное окно с историей версий */}
      {showVersions && selectedDocument && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>История версий - {selectedDocument.filename}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowVersions(false)
                  setSelectedDocument(null)
                }}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedDocument.versions?.map((version) => (
                <div key={version.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Версия {version.version}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(version.createdAt).toLocaleDateString('ru-RU')} в{' '}
                      {new Date(version.createdAt).toLocaleTimeString('ru-RU')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadDocument(selectedDocument)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Скачать
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}