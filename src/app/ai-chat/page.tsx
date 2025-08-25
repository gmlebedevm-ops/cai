'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Settings,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  FileText,
  Database,
  PanelRightOpen,
  PanelRightClose,
  Edit2,
  Save,
  X,
  FileWarning,
  Search,
  Bell,
  History,
  MessageSquare,
  Sparkles,
  Zap,
  FileEdit,
  SquarePen
} from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
  error?: string
}

interface ChatSession {
  id: string
  title: string
  createdAt: Date
  lastMessage: Date
  messages: ChatMessage[]
}

interface Contract {
  id: string
  number: string
  counterparty: string
  status: string
  createdAt: string
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: any
  prompt: string
  category: string
}

const quickActions: QuickAction[] = [
  {
    id: 'risk-analysis',
    title: 'Анализ рисков',
    description: 'Проверка договора на рисковые положения',
    icon: FileWarning,
    prompt: 'Проанализируй договор на наличие рисковых положений и предложи рекомендации по их улучшению.',
    category: 'analysis'
  },
  {
    id: 'contract-card',
    title: 'Карточка договора',
    description: 'Автоматическое извлечение ключевых данных',
    icon: FileText,
    prompt: 'Извлеки из текста договора ключевую информацию: номер, стороны, сумму, сроки, предмет договора.',
    category: 'extraction'
  },
  {
    id: 'clause-check',
    title: 'Проверка условий',
    description: 'Анализ соответствия стандартным условиям',
    icon: CheckCircle,
    prompt: 'Проверь соответствие условий договора стандартным требованиям компании.',
    category: 'verification'
  },
  {
    id: 'document-gen',
    title: 'Генерация документов',
    description: 'Создание сопроводительных документов',
    icon: Sparkles,
    prompt: 'Сгенерируй служебную записку на основе предоставленной информации.',
    category: 'generation'
  }
]

export default function AIChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [aiSettings, setAiSettings] = useState({
    isActive: false,
    defaultModel: '',
    provider: 'lm-studio'
  })
  const [contracts, setContracts] = useState<Contract[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string>('')
  const [contractData, setContractData] = useState<any>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [copiedMessage, setCopiedMessage] = useState<string>('')
  const [showQuickActions, setShowQuickActions] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSessions()
    loadAISettings()
    loadContracts()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages])

  useEffect(() => {
    autoResizeTextarea()
  }, [inputMessage])

  useEffect(() => {
    if (selectedContractId) {
      loadContractData(selectedContractId)
    } else {
      setContractData(null)
    }
  }, [selectedContractId])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const autoResizeTextarea = () => {
    const textarea = inputRef.current
    if (textarea) {
      // Сбрасываем высоту до авто для правильного пересчета
      textarea.style.height = 'auto'
      // Устанавливаем новую высоту на основе контента
      textarea.style.height = `${textarea.scrollHeight}px`
      
      // Ограничиваем максимальную высоту
      const maxHeight = 200
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`
        textarea.style.overflowY = 'auto'
      } else {
        textarea.style.overflowY = 'hidden'
      }
    }
  }

  const loadSessions = async () => {
    setIsLoadingHistory(true)
    try {
      const contractId = selectedContractId || 'default'
      const userId = 'current-user'
      const response = await fetch(`/api/ai-assistant/history?contractId=${contractId}&userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.messages && data.messages.length > 0) {
          const session: ChatSession = {
            id: data.id,
            title: selectedContractId ? `Чат по договору ${contracts.find(c => c.id === selectedContractId)?.number || ''}` : 'Общий чат',
            createdAt: new Date(data.createdAt),
            lastMessage: new Date(data.updatedAt),
            messages: data.messages.map((msg: any) => ({
              id: `${msg.timestamp}_${msg.role}`,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp)
            }))
          }
          setSessions([session])
          setCurrentSession(session)
        } else {
          const newSession: ChatSession = {
            id: Date.now().toString(),
            title: selectedContractId ? `Чат по договору ${contracts.find(c => c.id === selectedContractId)?.number || ''}` : 'Новый чат',
            createdAt: new Date(),
            lastMessage: new Date(),
            messages: []
          }
          setSessions([newSession])
          setCurrentSession(newSession)
        }
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const loadAISettings = async () => {
    try {
      const response = await fetch('/api/ai-settings')
      if (response.ok) {
        const data = await response.json()
        setAiSettings({
          isActive: data.isActive || false,
          defaultModel: data.defaultModel || '',
          provider: data.provider || 'lm-studio'
        })
      }
    } catch (error) {
      console.error('Error loading AI settings:', error)
    }
  }

  const loadContracts = async () => {
    try {
      const response = await fetch('/api/contracts')
      if (response.ok) {
        const data = await response.json()
        setContracts(data.contracts || [])
      }
    } catch (error) {
      console.error('Error loading contracts:', error)
    }
  }

  const loadContractData = async (contractId: string) => {
    try {
      const contract = contracts.find(c => c.id === contractId)
      if (contract) {
        setContractData({
          metadata: {
            number: contract.number,
            counterparty: contract.counterparty,
            status: contract.status,
            createdAt: contract.createdAt
          },
          text: '',
          templates: [],
          history: [],
          counterparty: {
            name: contract.counterparty
          },
          policies: []
        })
        loadSessions()
      }
    } catch (error) {
      console.error('Error loading contract data:', error)
    }
  }

  const handleContractChange = (contractId: string) => {
    const actualContractId = contractId === 'no-contract' ? '' : contractId
    setSelectedContractId(actualContractId)
    setCurrentSession(null)
    setSessions([])
  }

  const startEditingTitle = () => {
    if (currentSession) {
      setEditedTitle(currentSession.title)
      setIsEditingTitle(true)
    }
  }

  const saveEditedTitle = () => {
    if (currentSession && editedTitle.trim()) {
      const updatedSession = {
        ...currentSession,
        title: editedTitle.trim()
      }
      setCurrentSession(updatedSession)
      setSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s))
      setIsEditingTitle(false)
    }
  }

  const cancelEditingTitle = () => {
    setIsEditingTitle(false)
    setEditedTitle('')
  }

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: selectedContractId ? `Чат по договору ${contracts.find(c => c.id === selectedContractId)?.number || ''}` : 'Новый чат',
      createdAt: new Date(),
      lastMessage: new Date(),
      messages: []
    }
    setSessions(prev => [newSession, ...prev])
    setCurrentSession(newSession)
    setShowQuickActions(true)
  }

  const deleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      const contractId = selectedContractId || 'default'
      const userId = 'current-user'
      await fetch(`/api/ai-assistant/history?contractId=${contractId}&userId=${userId}`, {
        method: 'DELETE'
      })
      
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (currentSession?.id === sessionId) {
        setCurrentSession(sessions.find(s => s.id !== sessionId) || null)
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  const handleQuickAction = (action: QuickAction) => {
    setInputMessage(action.prompt)
    setShowQuickActions(false)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !currentSession || isLoading || !aiSettings.isActive) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }

    const updatedSession = {
      ...currentSession,
      lastMessage: new Date(),
      messages: [...currentSession.messages, userMessage, assistantMessage]
    }

    setInputMessage('')
    setIsLoading(true)
    setCurrentSession(updatedSession)

    try {
      const messagesForAPI = updatedSession.messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }))

      const context = selectedContractId && contractData ? {
        contractMetadata: contractData.metadata || {},
        contractText: contractData.text || '',
        templates: contractData.templates || [],
        history: contractData.history || [],
        counterparty: contractData.counterparty || {},
        companyPolicies: contractData.policies || []
      } : {
        contractMetadata: {},
        contractText: '',
        templates: [],
        history: [],
        counterparty: {},
        companyPolicies: []
      }

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesForAPI,
          context,
          model: aiSettings.defaultModel,
          provider: aiSettings.provider,
          temperature: 0.2,
          max_tokens: 2000,
          top_p: 0.9
        })
      })

      const data = await response.json()

      if (response.ok) {
        const contractId = selectedContractId || 'default'
        const userId = 'current-user'
        
        // Сохраняем историю параллельно
        Promise.all([
          fetch('/api/ai-assistant/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractId,
              userId,
              message: inputMessage,
              role: 'user'
            })
          }),
          fetch('/api/ai-assistant/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractId,
              userId,
              message: data.message?.content || data.response || '',
              role: 'assistant'
            })
          })
        ]).catch(historyError => {
          console.error('Error saving chat history:', historyError)
        })

        const finalMessages = updatedSession.messages.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: data.message?.content || data.response || '', isLoading: false }
            : msg
        )

        const finalSession = {
          ...updatedSession,
          messages: finalMessages,
          title: updatedSession.title === 'Новый чат' && inputMessage.length > 0 
            ? inputMessage.slice(0, 50) + (inputMessage.length > 50 ? '...' : '')
            : updatedSession.title
        }

        setCurrentSession(finalSession)
        setSessions(prev => prev.map(s => 
          s.id === currentSession.id ? finalSession : s
        ))
      } else {
        const errorMessages = updatedSession.messages.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, isLoading: false, error: data.error || 'Произошла ошибка' }
            : msg
        )

        setCurrentSession({
          ...updatedSession,
          messages: errorMessages
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessages = updatedSession.messages.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, isLoading: false, error: 'Ошибка соединения с AI-ассистентом' }
          : msg
      )

      setCurrentSession({
        ...updatedSession,
        messages: errorMessages
      })
    } finally {
      setIsLoading(false)
    }
  }, [inputMessage, currentSession, isLoading, aiSettings.isActive, aiSettings.defaultModel, aiSettings.provider, selectedContractId, contractData])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMessage(text)
    setTimeout(() => setCopiedMessage(''), 2000)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера'
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit'
      })
    }
  }

  if (!aiSettings.isActive) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Bot className="h-6 w-6" />
              AI-ассистент
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <p className="text-lg font-medium">AI-ассистент отключен</p>
              <p className="text-sm text-muted-foreground">
                Для использования чата с AI-ассистентом необходимо активировать его в настройках
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = '/admin/ai-settings'}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Перейти к настройкам
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`flex h-full bg-background overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Боковая панель */}
      <div className={`${isSidebarCollapsed ? 'w-0 border-r-0' : 'w-80 border-r'} bg-card flex flex-col transition-all duration-300 overflow-hidden flex-shrink-0`}>
        <div className="p-3 border-b bg-card flex items-center justify-between">
          {!isSidebarCollapsed && (
            <h2 className="text-lg font-semibold">Чат с AI</h2>
          )}
          {!isSidebarCollapsed && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="ml-auto"
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        {!isSidebarCollapsed && (
          <>
            {/* Список сессий - скроллируемая область */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-2 space-y-1">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <p className="text-sm">Нет чатов</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        currentSession?.id === session.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setCurrentSession(session)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{session.title}</div>
                          <div className="text-xs opacity-70">
                            {formatDate(session.lastMessage)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                          onClick={(e) => deleteSession(session.id, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Выбор договора - зафиксирован внизу */}
            <div className="p-4 border-t bg-card flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">Договор для контекста</h3>
                <Button variant="ghost" size="sm">
                  <Database className="h-4 w-4" />
                </Button>
              </div>
              <select 
                value={selectedContractId || 'no-contract'} 
                onChange={(e) => handleContractChange(e.target.value)}
                className="w-full p-2 border rounded-md bg-background text-sm"
              >
                <option value="no-contract">Без договора</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.number} - {contract.counterparty}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Основная область чата */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentSession ? (
          <>
            {/* Заголовок чата */}
            <div className="p-3 border-b bg-card flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                {isSidebarCollapsed && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsSidebarCollapsed(false)}
                  >
                    <PanelRightOpen className="h-4 w-4" />
                  </Button>
                )}
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="h-8"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditedTitle()
                        if (e.key === 'Escape') cancelEditingTitle()
                      }}
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" onClick={saveEditedTitle}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEditingTitle}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{currentSession.title}</h2>
                    <Button size="sm" variant="ghost" onClick={startEditingTitle}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={createNewSession}>
                  <SquarePen className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Область сообщений */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
                <div className="p-4 space-y-4">
                  {currentSession.messages.length === 0 && showQuickActions && (
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          Чем я могу вам помочь?
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          Выберите действие или задайте свой вопрос
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {quickActions.map((action) => (
                          <Card 
                            key={action.id} 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleQuickAction(action)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  <action.icon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{action.title}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {action.description}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentSession.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      )}
                      
                      <div className={`max-w-[80%] ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      } rounded-lg p-3`}>
                        {message.isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">AI думает...</span>
                          </div>
                        ) : message.error ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-red-500">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Ошибка</span>
                            </div>
                            <p className="text-sm">{message.error}</p>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs opacity-70">
                            {formatTime(message.timestamp)}
                          </span>
                          {message.role === 'assistant' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => copyToClipboard(message.content)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Область ввода */}
              <div className="border-t bg-card p-4 flex-shrink-0">
                <div className="flex gap-2 items-start">
                  <Textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value)
                      autoResizeTextarea()
                    }}
                    onFocus={autoResizeTextarea}
                    onKeyDown={handleKeyPress}
                    placeholder="Введите сообщение..."
                    disabled={isLoading || !aiSettings.isActive}
                    className="flex-1 resize-none min-h-[60px] max-h-[200px] overflow-hidden"
                    rows={2}
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim() || !aiSettings.isActive}
                    size="sm"
                    className="mt-[36px]"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-muted-foreground">
                    Нажмите Enter для отправки, Shift+Enter для новой строки
                  </div>
                  {copiedMessage && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Скопировано</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-medium">Выберите или создайте чат</h3>
                <p className="text-muted-foreground">Начните новый диалог или выберите существующий</p>
              </div>
              <Button onClick={createNewSession}>
                <SquarePen className="h-4 w-4 mr-2" />
                Новый чат
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}