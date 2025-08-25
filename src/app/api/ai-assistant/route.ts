import { NextRequest, NextResponse } from 'next/server'

interface LMStudioMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface LMStudioRequest {
  model: string
  messages: LMStudioMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  stream?: boolean
}

interface LMStudioResponse {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: 'assistant'
      content: string
    }
    finish_reason: 'stop' | 'length'
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Конфигурация AI провайдеров (можно вынести в .env или базу данных)
const AI_PROVIDERS = {
  'lm-studio': {
    baseUrl: process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234',
    apiKey: process.env.LM_STUDIO_API_KEY || 'your-api-key',
    defaultModel: process.env.LM_STUDIO_DEFAULT_MODEL || 'TheBloke/Mistral-7B-Instruct-v0.2-GGUF',
    defaultParams: {
      temperature: 0.2,
      max_tokens: 2000,
      top_p: 0.9,
      stream: false
    }
  },
  'z-ai': {
    baseUrl: process.env.Z_AI_BASE_URL || 'http://localhost:1234',
    apiKey: process.env.Z_AI_API_KEY || 'your-api-key',
    defaultModel: process.env.Z_AI_DEFAULT_MODEL || 'gpt-3.5-turbo',
    defaultParams: {
      temperature: 0.2,
      max_tokens: 2000,
      top_p: 0.9,
      stream: false
    }
  },
  'openai': {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-key',
    defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-3.5-turbo',
    defaultParams: {
      temperature: 0.2,
      max_tokens: 2000,
      top_p: 0.9,
      stream: false
    }
  },
  'anthropic': {
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: process.env.ANTHROPIC_API_KEY || 'your-anthropic-key',
    defaultModel: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-sonnet-20240229',
    defaultParams: {
      temperature: 0.2,
      max_tokens: 2000,
      top_p: 0.9,
      stream: false
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      messages,
      model,
      temperature = 0.2,
      max_tokens = 2000,
      top_p = 0.9,
      context = null,
      provider = 'lm-studio'
    } = body

    // Валидация входных данных
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      )
    }

    // Для Z.AI используем специальный SDK
    if (provider === 'z-ai') {
      try {
        const ZAI = await import('z-ai-web-dev-sdk')
        const zai = await ZAI.default.create()
        
        // Подготовка сообщений с учетом контекста
        const processedMessages: any[] = []
        
        // Добавляем системный промпт с контекстом, если он предоставлен
        if (context) {
          const systemPrompt = buildSystemPrompt(context)
          processedMessages.push({
            role: 'system',
            content: systemPrompt
          })
        }

        // Добавляем пользовательские сообщения
        processedMessages.push(...messages)

        console.log('Sending request to Z.AI SDK:', {
          messageCount: processedMessages.length,
          temperature,
          max_tokens
        })

        const completion = await zai.chat.completions.create({
          messages: processedMessages,
          temperature,
          max_tokens: max_tokens,
          top_p: top_p
        })

        console.log('Z.AI SDK response:', {
          id: completion.id,
          model: completion.model,
          choices: completion.choices.length,
          usage: completion.usage
        })

        return NextResponse.json({
          id: completion.id,
          model: completion.model || 'z-ai-default',
          message: completion.choices[0]?.message || { role: 'assistant', content: '' },
          usage: completion.usage,
          finishReason: completion.choices[0]?.finish_reason,
          provider: 'z-ai'
        })
      } catch (sdkError: any) {
        console.error('Z.AI SDK error:', sdkError)
        return NextResponse.json(
          { 
            error: `Z.AI SDK error: ${sdkError.message}`,
            provider: 'z-ai'
          },
          { status: 500 }
        )
      }
    }

    // Для других провайдеров используем существующую логику
    const providerConfig = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]
    if (!providerConfig) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      )
    }

    // Получаем актуальные настройки для провайдера
    let actualBaseUrl = providerConfig.baseUrl
    let actualApiKey = providerConfig.apiKey
    if (provider === 'lm-studio' || provider === 'z-ai') {
      try {
        const settingsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai-settings`)
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json()
          actualBaseUrl = settings.lmStudioUrl || providerConfig.baseUrl
          actualApiKey = settings.apiKey || providerConfig.apiKey
        }
      } catch (error) {
        console.warn('Failed to fetch AI settings, using defaults:', error)
      }
    }

    // Подготовка сообщений с учетом контекста
    const processedMessages: LMStudioMessage[] = []
    
    // Добавляем системный промпт с контекстом, если он предоставлен
    if (context) {
      const systemPrompt = buildSystemPrompt(context)
      processedMessages.push({
        role: 'system',
        content: systemPrompt
      })
    }

    // Добавляем пользовательские сообщения
    processedMessages.push(...messages)

    // Формирование запроса к AI провайдеру
    const requestBody = {
      model: model || providerConfig.defaultModel,
      messages: processedMessages,
      temperature,
      max_tokens,
      top_p,
      stream: false
    }

    // Определяем URL для запроса
    const requestUrl = provider === 'lm-studio' 
      ? `${actualBaseUrl}/v1/chat/completions`
      : `${actualBaseUrl}/chat/completions`

    console.log('Sending request to AI provider:', {
      provider,
      url: requestUrl,
      model: requestBody.model,
      messageCount: processedMessages.length
    })

    // Отправка запроса к AI провайдеру
    let response: Response
    let headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Настраиваем заголовки в зависимости от провайдера
    switch (provider) {
      case 'lm-studio':
      case 'z-ai':
        headers['Authorization'] = `Bearer ${actualApiKey}`
        break
      case 'openai':
        headers['Authorization'] = `Bearer ${actualApiKey}`
        break
      case 'anthropic':
        headers['x-api-key'] = actualApiKey
        headers['anthropic-version'] = '2023-06-01'
        break
    }

    try {
      response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })
    } catch (fetchError) {
      console.error('Network error:', fetchError)
      return NextResponse.json(
        { 
          error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown network error'}`,
          provider
        },
        { status: 500 }
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI provider API error:', {
        provider,
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      
      return NextResponse.json(
        { 
          error: `AI provider API error: ${response.status} ${response.statusText}`,
          details: errorText,
          provider
        },
        { status: 500 }
      )
    }

    const data: LMStudioResponse = await response.json()
    
    console.log('Raw AI provider response:', JSON.stringify(data, null, 2))
    
    // Проверяем структуру ответа
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('Invalid AI provider response structure:', data)
      return NextResponse.json(
        { 
          error: 'Invalid response structure from AI provider',
          details: 'Response missing choices array or choices is empty',
          provider
        },
        { status: 500 }
      )
    }

    console.log('AI provider response:', {
      provider,
      id: data.id,
      model: data.model,
      choices: data.choices.length,
      usage: data.usage
    })

    // Возврат ответа в формате, совместимом с интерфейсом
    return NextResponse.json({
      id: data.id,
      model: data.model,
      message: data.choices[0]?.message || { role: 'assistant', content: '' },
      usage: data.usage,
      finishReason: data.choices[0]?.finish_reason,
      provider
    })

  } catch (error) {
    console.error('Error in AI assistant API:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Функция для построения системного промпта с контекстом
function buildSystemPrompt(context: any): string {
  const {
    contractMetadata,
    contractText,
    templates,
    history,
    counterparty,
    companyPolicies
  } = context

  let prompt = `Ты - AI-ассистент для работы с договорами в юридической системе. Твоя задача - помогать пользователям анализировать, создавать и управлять договорами.

ИНСТРУКЦИИ:
1. Отвечай точно и по существу, основываясь только на предоставленной информации
2. Если информации недостаточно, укажи на это
3. Для юридических вопросов будь особенно точен и осторожен
4. Сохраняй конфиденциальность предоставленных данных
5. Используй формальный, профессиональный стиль общения
`

  if (contractMetadata) {
    prompt += `\n\nМЕТАДАННЫЕ ДОГОВОРА:
- Номер: ${contractMetadata.number || 'не указан'}
- Название: ${contractMetadata.title || 'не указано'}
- Контрагент: ${contractMetadata.counterparty || 'не указан'}
- Дата начала: ${contractMetadata.startDate || 'не указана'}
- Дата окончания: ${contractMetadata.endDate || 'не указана'}
- Статус: ${contractMetadata.status || 'не указан'}
- Ответственный: ${contractMetadata.responsible || 'не указан'}`
  }

  if (counterparty) {
    prompt += `\n\nИНФОРМАЦИЯ О КОНТРАГЕНТЕ:
- Наименование: ${counterparty.name || 'не указано'}
- ИНН: ${counterparty.inn || 'не указан'}
- Статус: ${counterparty.status || 'не указан'}
- История сотрудничества: ${counterparty.cooperationHistory || 'не указана'}`
  }

  if (companyPolicies && companyPolicies.length > 0) {
    prompt += `\n\nВНУТРЕННИЕ РЕГЛАМЕНТЫ КОМПАНИИ:`
    companyPolicies.forEach((policy: any, index: number) => {
      prompt += `\n${index + 1}. ${policy.title}: ${policy.description}`
    })
  }

  if (templates && templates.length > 0) {
    prompt += `\n\nТИПОВЫЕ ШАБЛОНЫ И УСЛОВИЯ:`
    templates.forEach((template: any, index: number) => {
      prompt += `\n${index + 1}. ${template.name}: ${template.content}`
    })
  }

  if (contractText) {
    prompt += `\n\nТЕКСТ ДОГОВОРА:
${contractText}`
  }

  if (history && history.length > 0) {
    prompt += `\n\nИСТОРИЯ СОГЛАСОВАНИЙ И КОММЕНТАРИИ:`
    history.forEach((item: any, index: number) => {
      prompt += `\n${index + 1}. ${item.author} (${item.date}): ${item.comment}`
    })
  }

  prompt += `\n\nОтвечай на вопросы пользователя, учитывая весь предоставленный контекст. Если какая-то информация отсутствует, вежливо укажи на это.`

  return prompt
}

// GET endpoint для проверки доступности AI провайдера
export async function GET() {
  try {
    // Сначала получаем текущие настройки
    const settingsResponse = await fetch('/api/ai-settings')
    if (!settingsResponse.ok) {
      return NextResponse.json({
        status: 'error',
        error: 'Failed to fetch AI settings'
      }, { status: 503 })
    }
    
    const settings = await settingsResponse.json()
    
    // Для Z.AI используем специальную проверку через SDK
    if (settings.provider === 'z-ai') {
      try {
        const ZAI = await import('z-ai-web-dev-sdk')
        const zai = await ZAI.default.create()
        
        // Простая проверка доступности SDK
        await zai.chat.completions.create({
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
        
        return NextResponse.json({
          status: 'connected',
          provider: 'z-ai',
          models: [{
            id: 'z-ai-default',
            object: 'model',
            created: Date.now(),
            owned_by: 'Z.AI'
          }],
          config: {
            provider: 'z-ai',
            baseUrl: 'Z.AI SDK',
            defaultModel: 'z-ai-default',
            defaultParams: {
              temperature: 0.2,
              max_tokens: 2000,
              top_p: 0.9,
              stream: false
            }
          }
        })
      } catch (sdkError: any) {
        return NextResponse.json({
          status: 'error',
          error: `Z.AI SDK not accessible: ${sdkError.message}`
        }, { status: 503 })
      }
    }
    
    // Для других провайдеров используем существующую логику
    const providerConfig = AI_PROVIDERS[settings.provider as keyof typeof AI_PROVIDERS]
    if (!providerConfig) {
      return NextResponse.json({
        status: 'error',
        error: `Unsupported provider: ${settings.provider}`
      }, { status: 503 })
    }

    let testUrl: string
    let headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Настраиваем URL и заголовки в зависимости от провайдера
    switch (settings.provider) {
      case 'lm-studio':
        testUrl = `${settings.lmStudioUrl}/v1/models`
        headers['Authorization'] = `Bearer ${settings.apiKey}`
        break
      case 'z-ai':
        testUrl = `${settings.lmStudioUrl}/v1/models`
        headers['Authorization'] = `Bearer ${settings.apiKey}`
        break
      case 'openai':
        testUrl = 'https://api.openai.com/v1/models'
        headers['Authorization'] = `Bearer ${settings.apiKey}`
        break
      case 'anthropic':
        testUrl = 'https://api.anthropic.com/v1/messages'
        headers['x-api-key'] = settings.apiKey
        headers['anthropic-version'] = '2023-06-01'
        break
      default:
        return NextResponse.json({
          status: 'error',
          error: `Unknown provider: ${settings.provider}`
        }, { status: 503 })
    }

    const response = await fetch(testUrl, {
      headers
    })

    if (response.ok) {
      const models = await response.json()
      return NextResponse.json({
        status: 'connected',
        provider: settings.provider,
        models: models.data || [],
        config: {
          provider: settings.provider,
          baseUrl: settings.lmStudioUrl,
          defaultModel: settings.defaultModel,
          defaultParams: providerConfig.defaultParams
        }
      })
    } else {
      return NextResponse.json({
        status: 'error',
        error: `${settings.provider} not accessible: ${response.status} ${response.statusText}`
      }, { status: 503 })
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Failed to connect to AI provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}