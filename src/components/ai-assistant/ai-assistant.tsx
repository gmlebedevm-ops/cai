'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Send, 
  Bot, 
  User, 
  Settings, 
  History, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Search,
  FileWarning,
  Bell,
  Database,
  Server
} from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface AIAssistantProps {
  contractId?: string
  contractData?: any
  userId?: string
}

interface Scenario {
  id: string
  title: string
  description: string
  icon: any
  prompt: string
  category: string
}

const predefinedScenarios: Scenario[] = [
  {
    id: 'risk-analysis',
    title: 'Анализ рисков',
    description: 'Сравнение с эталоном и выявление рисков',
    icon: FileWarning,
    prompt: `Проанализируй предоставленный текст договора. Сравни его с нашими типовыми условиями. Выдели отклонения и оцени уровень риска по каждому пункту (высокий, средний, низкий). Предложи альтернативные формулировки для рискованных условий. Ответ представь в виде структурированной таблицы.`,
    category: 'analysis'
  },
  {
    id: 'contract-card',
    title: 'Создание карточки договора',
    description: 'Автоматическое извлечение данных и проверка',
    icon: FileText,
    prompt: `Проанализируй предоставленный текст договора. Выполни две задачи:

1. **Заполни карточку договора:** Извлеки следующую информацию. Если данные не найдены в тексте, явно укажи "НЕ НАЙДЕНО".
   - \`номер_договора\`
   - \`дата_подписания\`
   - \`сторона_1\` (полное наименование и ИНН, если есть)
   - \`сторона_2\` (полное наименование и ИНН, если есть)
   - \`предмет_договора\` (кратко, 1-2 предложения)
   - \`сумма\` (цифрой и валютой)
   - \`срок_действия\` (даты начала и окончания)
   - \`ответственный_менеджер\` (из нашего штата, если упомянут)
   - \`условия_расторжения\` (краткое описание)
   - \`периодичность_оплат\` (например, "ежемесячно", "по факту оказания услуг")

2. **Проведи базовый аудит на соответствие внутренним требованиям:** Проверь наличие следующих критически важных пунктов. По каждому пункту дай ответ "СООТВЕТСТВУЕТ", "НЕ СООТВЕТСТВУЕТ" или "НЕ НАЙДЕНО", а также краткий комментарий.
   - *Наличие реквизитов и подписей сторон*
   - *Четко описан предмет договора*
   - *Указан порядок расчетов и сроки оплаты*
   - *Определены сроки выполнения работ/оказания услуг*
   - *Прописаны условия о конфиденциальности*
   - *Прописаны условия о разрешении споров и подсудности*
   - *Указаны обстоятельства непреодолимой силы (Форс-мажор)*
   - *Определен порядок изменения и расторжения договора*

Ответ представь в виде JSON-объекта со следующей структурой:
{
  "card": {
    "номер_договора": "...",
    "дата_подписания": "...",
    ... // все поля из задачи 1
  },
  "compliance_check": [
    {"point": "Наличие реквизитов и подписей сторон", "status": "СООТВЕТСТВУЕТ", "comment": "Реквизиты сторон указаны в заключительной части договора"},
    {"point": "Четко описан предмет договора", "status": "НЕ СООТВЕТСТВУЕТ", "comment": "Предмет описан размыто, нет точного перечня оказываемых услуг"},
    ... // все пункты из задачи 2
  ]
}`,
    category: 'creation'
  },
  {
    id: 'qa',
    title: 'Вопрос о договоре',
    description: 'Ответы на вопросы по тексту договора',
    icon: Search,
    prompt: 'Используй исключительно предоставленный текст договора и информацию о нем в системе. Ответь на вопрос пользователя: [Вопрос пользователя]. Если информация в договоре отсутствует или противоречива, укажи на это. Не придумывай ответов.',
    category: 'qa'
  },
  {
    id: 'notification',
    title: 'Подготовка уведомления',
    description: 'Генерация официальных писем и уведомлений',
    icon: Bell,
    prompt: 'На основе условий договора [Номер договора] подготовь проект официального письма (уведомления) для контрагента. Тема: [Указать тему, напр. Уведомление о расторжении]. Укажи в тексте все обязательные реквизиты из раздела договора о порядке коммуникации. Сохрани официально-деловой стиль.',
    category: 'generation'
  },
  {
    id: 'analogs',
    title: 'Поиск аналогов',
    description: 'Поиск релевантных договоров и прецедентов',
    icon: Database,
    prompt: 'Проанализируй базу подписанных договоров и найди 5 наиболее релевантных договоров по теме [Тема пользователя]. Критерии: схожий предмет договора, контрагент из той же юрисдикции, аналогичная сумма. Представь результат в виде списка с номерами договоров и кратким обоснованием выбора.',
    category: 'search'
  }
]

export default function AIAssistant({ contractId, contractData, userId }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'checking'>('checking')
  const [selectedScenario, setSelectedScenario] = useState<string>('')
  const [activeTab, setActiveTab] = useState('chat')
  const [globalSettings, setGlobalSettings] = useState({
    model: 'TheBloke/Mistral-7B-Instruct-v0.2-GGUF',
    temperature: 0.2,
    maxTokens: 2000,
    topP: 0.9,
    lmStudioUrl: 'http://localhost:1234',
    apiKey: 'your-api-key',
    isActive: true
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Проверка подключения к LM Studio
  useEffect(() => {
    checkConnection()
    loadGlobalSettings()
  }, [])

  // Загрузка истории диалогов
  useEffect(() => {
    if (contractId && userId) {
      loadChatHistory()
    }
  }, [contractId, userId])

  // Автопрокрутка к новым сообщениям
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadGlobalSettings = async () => {
    try {
      const response = await fetch('/api/ai-settings')
      const data = await response.json()
      
      if (data) {
        setGlobalSettings({
          model: data.defaultModel,
          temperature: data.temperature,
          maxTokens: data.maxTokens,
          topP: data.topP,
          lmStudioUrl: data.lmStudioUrl,
          apiKey: data.apiKey,
          isActive: data.isActive
        })
      }
    } catch (error) {
      console.error('Failed to load global AI settings:', error)
    }
  }

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/ai-assistant')
      const data = await response.json()
      
      if (data.status === 'connected') {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error('Connection check failed:', error)
      setConnectionStatus('error')
    }
  }

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/ai-assistant/history?contractId=${contractId}&userId=${userId}`)
      const data = await response.json()
      
      if (data.messages) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const saveMessage = async (message: string, role: 'user' | 'assistant') => {
    if (!contractId || !userId) return

    try {
      await fetch('/api/ai-assistant/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          userId,
          message,
          role
        })
      })
    } catch (error) {
      console.error('Failed to save message:', error)
    }
  }

  const clearChatHistory = async () => {
    if (!contractId || !userId) return

    try {
      await fetch(`/api/ai-assistant/history?contractId=${contractId}&userId=${userId}`, {
        method: 'DELETE'
      })
      setMessages([])
    } catch (error) {
      console.error('Failed to clear chat history:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Сохраняем сообщение пользователя
    await saveMessage(input, 'user')

    try {
      // Подготовка контекста
      const context = {
        contractMetadata: contractData?.metadata || {},
        contractText: contractData?.text || '',
        templates: contractData?.templates || [],
        history: contractData?.history || [],
        counterparty: contractData?.counterparty || {},
        companyPolicies: contractData?.policies || []
      }

      // Формирование запроса
      const requestBody = {
        messages: [{ role: 'user', content: input }],
        context,
        model: globalSettings.model,
        temperature: globalSettings.temperature,
        max_tokens: globalSettings.maxTokens,
        top_p: globalSettings.topP
      }

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.message.content,
          timestamp: new Date().toISOString()
        }

        setMessages(prev => [...prev, assistantMessage])
        await saveMessage(data.message.content, 'assistant')
      } else {
        throw new Error(data.error || 'Failed to get response from AI')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Извините, произошла ошибка при обработке вашего запроса. ${error instanceof Error ? error.message : ''}`,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleScenarioSelect = (scenarioId: string) => {
    const scenario = predefinedScenarios.find(s => s.id === scenarioId)
    if (scenario) {
      setSelectedScenario(scenarioId)
      setInput(scenario.prompt)
      setActiveTab('chat')
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* Статус подключения */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">LM Studio подключен</span>
            </>
          ) : connectionStatus === 'error' ? (
            <>
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">Ошибка подключения к LM Studio</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-blue-600">Проверка подключения...</span>
            </>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={checkConnection}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Проверить
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Чат</TabsTrigger>
          <TabsTrigger value="scenarios">Сценарии</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        {/* Вкладка чата */}
        <TabsContent value="chat" className="space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI-ассистент
                {contractId && (
                  <Badge variant="outline" className="text-xs">
                    Договор {contractId.slice(-8)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* История сообщений */}
              <ScrollArea className="flex-1 px-4 py-3">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Начните диалог с AI-ассистентом. Выберите сценарий или задайте вопрос.
                      </p>
                    </div>
                  )}
                  
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </div>
                        <div
                          className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}
                        >
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-3">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            AI-ассистент думает...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Ввод сообщения */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Введите ваш вопрос или выберите сценарий..."
                    className="min-h-[80px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!input.trim() || isLoading || connectionStatus !== 'connected'}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {messages.length > 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearChatHistory}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Очистить историю
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {messages.length} сообщений
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Вкладка сценариев */}
        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid gap-3">
            {predefinedScenarios.map((scenario) => {
              const Icon = scenario.icon
              return (
                <Card 
                  key={scenario.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedScenario === scenario.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleScenarioSelect(scenario.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{scenario.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {scenario.description}
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {scenario.category === 'analysis' && 'Анализ'}
                          {scenario.category === 'creation' && 'Создание'}
                          {scenario.category === 'qa' && 'Вопросы'}
                          {scenario.category === 'generation' && 'Генерация'}
                          {scenario.category === 'search' && 'Поиск'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Вкладка настроек */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Текущие настройки модели
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Модель</label>
                  <Input
                    value={globalSettings.model}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Модель управляется в настройках администрирования
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Temperature ({globalSettings.temperature})</label>
                    <Input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={globalSettings.temperature}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Tokens</label>
                    <Input
                      type="number"
                      min="100"
                      max="4000"
                      value={globalSettings.maxTokens}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Top P ({globalSettings.topP})</label>
                  <Input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={globalSettings.topP}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Статус системы</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    {globalSettings.isActive ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">AI-ассистент активен</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-600">AI-ассистент отключен</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-500" />
                    <span>{globalSettings.lmStudioUrl}</span>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  Для изменения параметров модели перейдите в раздел "Администрирование" → "Настройки AI". 
                  Там вы можете настроить подключение к LM Studio, выбрать модель и параметры генерации.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}