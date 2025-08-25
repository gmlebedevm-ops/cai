import { NextRequest, NextResponse } from 'next/server'

interface AISettings {
  id: string
  provider: 'lm-studio' | 'z-ai' | 'openai' | 'anthropic'
  lmStudioUrl: string
  apiKey: string
  defaultModel: string
  temperature: number
  maxTokens: number
  topP: number
  isActive: boolean
  updatedAt: string
}

// Временное хранилище настроек (в реальном приложении нужно использовать базу данных)
let aiSettings: AISettings = {
  id: 'default',
  provider: 'lm-studio',
  lmStudioUrl: 'http://192.168.2.5:11234',
  apiKey: 'lm-studio',
  defaultModel: 'TheBloke/Mistral-7B-Instruct-v0.2-GGUF', // Модель по умолчанию
  temperature: 0.2,
  maxTokens: 2000,
  topP: 0.9,
  isActive: true,
  updatedAt: new Date().toISOString()
}

// Конфигурация URL для разных провайдеров
const PROVIDER_URLS = {
  'lm-studio': '', // Пользовательский URL
  'z-ai': '', // Будет использоваться SDK
  'openai': 'https://api.openai.com/v1',
  'anthropic': 'https://api.anthropic.com/v1'
}

// Кэш для моделей с временем жизни
interface ModelCache {
  models: any[]
  timestamp: number
  ttl: number // время жизни в миллисекундах (5 минут)
}

let modelCache: ModelCache | null = null

// Простая статистика производительности
interface PerformanceStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  totalResponseTime: number
  requestsLast24h: number
  lastRequestTime: number | null
  modelUsage: Record<string, number>
}

let performanceStats: PerformanceStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  requestsLast24h: 0,
  lastRequestTime: null,
  modelUsage: {}
}

export async function GET() {
  try {
    return NextResponse.json(aiSettings)
  } catch (error) {
    console.error('Error fetching AI settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      provider,
      lmStudioUrl,
      apiKey,
      defaultModel,
      temperature,
      maxTokens,
      topP,
      isActive
    } = body

    // Валидация входных данных
    if (!provider || !lmStudioUrl || !apiKey) {
      return NextResponse.json(
        { error: 'provider, lmStudioUrl, and apiKey are required' },
        { status: 400 }
      )
    }

    // Валидация параметров
    if (temperature < 0 || temperature > 1) {
      return NextResponse.json(
        { error: 'temperature must be between 0 and 1' },
        { status: 400 }
      )
    }

    if (maxTokens < 100 || maxTokens > 4000) {
      return NextResponse.json(
        { error: 'maxTokens must be between 100 and 4000' },
        { status: 400 }
      )
    }

    if (topP < 0 || topP > 1) {
      return NextResponse.json(
        { error: 'topP must be between 0 and 1' },
        { status: 400 }
      )
    }

    // Обновление настроек
    aiSettings = {
      ...aiSettings,
      provider,
      lmStudioUrl: provider === 'lm-studio' ? lmStudioUrl : (PROVIDER_URLS[provider] || lmStudioUrl),
      apiKey,
      defaultModel,
      temperature,
      maxTokens,
      topP,
      isActive: isActive !== undefined ? isActive : aiSettings.isActive,
      updatedAt: new Date().toISOString()
    }

    console.log('AI settings updated:', aiSettings)

    return NextResponse.json(aiSettings)
  } catch (error) {
    console.error('Error updating AI settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // Обработка сохранения настроек через POST (для совместимости с фронтендом)
    if (action === 'save_settings') {
      const {
        provider,
        lmStudioUrl,
        apiKey,
        defaultModel,
        temperature,
        maxTokens,
        topP,
        isActive
      } = body

      // Валидация входных данных
      if (!provider || !lmStudioUrl || !apiKey || !defaultModel) {
        return NextResponse.json(
          { error: 'provider, lmStudioUrl, apiKey, and defaultModel are required' },
          { status: 400 }
        )
      }

      // Валидация параметров
      if (temperature < 0 || temperature > 1) {
        return NextResponse.json(
          { error: 'temperature must be between 0 and 1' },
          { status: 400 }
        )
      }

      if (maxTokens < 100 || maxTokens > 4000) {
        return NextResponse.json(
          { error: 'maxTokens must be between 100 and 4000' },
          { status: 400 }
        )
      }

      if (topP < 0 || topP > 1) {
        return NextResponse.json(
          { error: 'topP must be between 0 and 1' },
          { status: 400 }
        )
      }

      // Обновление настроек
      aiSettings = {
        ...aiSettings,
        provider,
        lmStudioUrl,
        apiKey,
        defaultModel,
        temperature,
        maxTokens,
        topP,
        isActive: isActive !== undefined ? isActive : aiSettings.isActive,
        updatedAt: new Date().toISOString()
      }

      console.log('AI settings updated via POST:', aiSettings)

      return NextResponse.json(aiSettings)
    }

    if (action === 'test_connection') {
      return await testConnection()
    }

    if (action === 'get_models') {
      return await getAvailableModels()
    }

    if (action === 'test_model') {
      const { modelId, testPrompt } = body
      return await testModel(modelId, testPrompt)
    }

    if (action === 'clear_cache') {
      clearCache()
      return NextResponse.json({
        success: true,
        message: 'Кэш моделей очищен'
      })
    }

    if (action === 'get_performance_stats') {
      return await getPerformanceStats()
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in AI settings POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Функция для тестирования подключения к AI провайдеру
async function testConnection() {
  try {
    console.log('Testing connection to provider:', aiSettings.provider)
    
    // Для Z.AI используем специальный SDK
    if (aiSettings.provider === 'z-ai') {
      try {
        // Динамический импорт SDK (только при необходимости)
        const ZAI = await import('z-ai-web-dev-sdk')
        const zai = await ZAI.default.create()
        
        // Простая проверка доступности SDK
        const testResult = await zai.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: 'test'
            }
          ],
          max_tokens: 1
        })
        
        console.log('Z.AI SDK connection successful')
        return NextResponse.json({
          success: true,
          message: 'Подключение к Z.AI успешно установлено через SDK',
          provider: 'z-ai',
          models: [], // SDK может не предоставлять список моделей стандартным образом
          modelCount: 0
        })
      } catch (sdkError: any) {
        console.error('Z.AI SDK connection error:', sdkError)
        return NextResponse.json({
          success: false,
          message: 'Не удалось подключиться к Z.AI через SDK',
          error: sdkError.message || 'Z.AI SDK error'
        }, { status: 400 })
      }
    }
    
    // Проверяем, что URL настроен для других провайдеров
    if (!aiSettings.lmStudioUrl && aiSettings.provider !== 'z-ai') {
      return NextResponse.json({
        success: false,
        message: 'URL провайдера не настроен',
        error: 'Provider URL is not configured'
      }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 секунд

    try {
      let testUrl: string
      let headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Настраиваем URL и заголовки в зависимости от провайдера
      switch (aiSettings.provider) {
        case 'lm-studio':
          testUrl = `${aiSettings.lmStudioUrl}/v1/models`
          headers['Authorization'] = `Bearer ${aiSettings.apiKey}`
          break
        case 'z-ai':
          testUrl = `${aiSettings.lmStudioUrl}/v1/models`
          headers['Authorization'] = `Bearer ${aiSettings.apiKey}`
          break
        case 'openai':
          testUrl = 'https://api.openai.com/v1/models'
          headers['Authorization'] = `Bearer ${aiSettings.apiKey}`
          break
        case 'anthropic':
          testUrl = 'https://api.anthropic.com/v1/messages'
          headers['x-api-key'] = aiSettings.apiKey
          headers['anthropic-version'] = '2023-06-01'
          break
        default:
          return NextResponse.json({
            success: false,
            message: 'Неизвестный провайдер',
            error: `Unknown provider: ${aiSettings.provider}`
          }, { status: 400 })
      }

      // Для LM Studio также проверяем доступность чата
      if (aiSettings.provider === 'lm-studio') {
        try {
          const chatTestUrl = `${aiSettings.lmStudioUrl}/v1/chat/completions`
          const chatResponse = await fetch(chatTestUrl, {
            method: 'POST',
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: aiSettings.defaultModel,
              messages: [{ role: 'user', content: 'test' }],
              max_tokens: 1
            }),
            signal: controller.signal
          })
          
          if (!chatResponse.ok) {
            return NextResponse.json({
              success: false,
              message: 'LM Studio доступен, но endpoint чата не работает',
              error: `Chat endpoint returned ${chatResponse.status}`
            }, { status: 400 })
          }
        } catch (chatError: any) {
          return NextResponse.json({
            success: false,
            message: 'LM Studio доступен, но endpoint чата не работает',
            error: chatError.message || 'Chat endpoint error'
          }, { status: 400 })
        }
      }

      const response = await fetch(testUrl, {
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        console.log('Connection successful, provider:', aiSettings.provider)
        return NextResponse.json({
          success: true,
          message: `Подключение к ${getProviderName(aiSettings.provider)} успешно установлено`,
          provider: aiSettings.provider,
          models: data.data || [],
          modelCount: data.data?.length || 0
        })
      } else {
        const errorText = await response.text()
        console.error('Connection failed:', response.status, response.statusText, errorText)
        return NextResponse.json({
          success: false,
          message: `Ошибка подключения: ${response.status} ${response.statusText}`,
          error: errorText
        }, { status: 400 })
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      console.error('Connection fetch error:', fetchError)
      
      // Обрабатываем конкретные ошибки подключения
      if (fetchError.code === 'ECONNREFUSED') {
        return NextResponse.json({
          success: false,
          message: `Не удалось подключиться к ${getProviderName(aiSettings.provider)}: соединение отклонено`,
          error: `Сервер ${aiSettings.lmStudioUrl} недоступен`
        }, { status: 400 })
      } else if (fetchError.code === 'ENOTFOUND') {
        return NextResponse.json({
          success: false,
          message: `Не удалось подключиться к ${getProviderName(aiSettings.provider)}: хост не найден`,
          error: `Хост ${new URL(aiSettings.lmStudioUrl).hostname} не найден`
        }, { status: 400 })
      } else if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          message: `Не удалось подключиться к ${getProviderName(aiSettings.provider)}: таймаут подключения`,
          error: 'Превышено время ожидания ответа от сервера'
        }, { status: 400 })
      } else {
        return NextResponse.json({
          success: false,
          message: `Не удалось подключиться к ${getProviderName(aiSettings.provider)}`,
          error: fetchError.message || 'Unknown connection error'
        }, { status: 400 })
      }
    }
  } catch (error: any) {
    console.error('Unexpected connection error:', error)
    return NextResponse.json({
      success: false,
      message: 'Не удалось подключиться к провайдеру',
      error: error.message || 'Unknown error'
    }, { status: 400 })
  }
}

// Вспомогательная функция для получения названия провайдера
function getProviderName(provider: string): string {
  switch (provider) {
    case 'lm-studio':
      return 'LM Studio'
    case 'z-ai':
      return 'Z.AI'
    case 'openai':
      return 'OpenAI'
    case 'anthropic':
      return 'Anthropic'
    default:
      return 'Неизвестный провайдер'
  }
}

// Вспомогательные функции для работы с кэшем
function isCacheValid(): boolean {
  if (!modelCache) return false
  const now = Date.now()
  return (now - modelCache.timestamp) < modelCache.ttl
}

function setCache(models: any[]): void {
  modelCache = {
    models,
    timestamp: Date.now(),
    ttl: 5 * 60 * 1000 // 5 минут
  }
}

function getCache(): any[] | null {
  if (!isCacheValid()) return null
  return modelCache.models
}

function clearCache(): void {
  modelCache = null
}

// Функция для получения доступных моделей
async function getAvailableModels() {
  try {
    console.log('Fetching available models for provider:', aiSettings.provider)
    
    // Для Z.AI возвращаем пустой список, так как SDK работает иначе
    if (aiSettings.provider === 'z-ai') {
      return NextResponse.json({
        success: true,
        models: [{
          id: 'z-ai-default',
          object: 'model',
          created: Date.now(),
          owned_by: 'Z.AI',
          description: 'Z.AI модель через SDK'
        }],
        cached: false
      })
    }
    
    // Проверяем, что URL настроен для других провайдеров
    if (!aiSettings.lmStudioUrl) {
      return NextResponse.json({
        success: false,
        message: 'URL провайдера не настроен',
        error: 'Provider URL is not configured'
      }, { status: 400 })
    }

    // Проверяем кэш
    const cachedModels = getCache()
    if (cachedModels) {
      console.log('Returning cached models:', cachedModels.length)
      return NextResponse.json({
        success: true,
        models: cachedModels,
        cached: true
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 секунд

    try {
      const response = await fetch(`${aiSettings.lmStudioUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${aiSettings.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        console.log('Models fetched successfully:', data.data?.length || 0)
        
        // Обогащаем модели дополнительной информацией
        const enrichedModels = (data.data || []).map((model: any) => ({
          ...model,
          size: estimateModelSize(model.id),
          format: getModelFormat(model.id),
          family: getModelFamily(model.id),
          quantization: getQuantizationLevel(model.id),
          description: generateModelDescription(model.id),
          is_favorite: false,
          is_tested: false
        }))
        
        // Сохраняем в кэш
        setCache(enrichedModels)
        
        return NextResponse.json({
          success: true,
          models: enrichedModels,
          cached: false
        })
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch models:', response.status, response.statusText, errorText)
        return NextResponse.json({
          success: false,
          message: 'Не удалось получить список моделей',
          error: `${response.status} ${response.statusText}`
        }, { status: 400 })
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      console.error('Fetch models error:', fetchError)
      
      // Обрабатываем конкретные ошибки подключения
      if (fetchError.code === 'ECONNREFUSED') {
        return NextResponse.json({
          success: false,
          message: 'Не удалось получить модели: соединение отклонено',
          error: `Сервер ${aiSettings.lmStudioUrl} недоступен`
        }, { status: 400 })
      } else if (fetchError.code === 'ENOTFOUND') {
        return NextResponse.json({
          success: false,
          message: 'Не удалось получить модели: хост не найден',
          error: `Хост ${new URL(aiSettings.lmStudioUrl).hostname} не найден`
        }, { status: 400 })
      } else if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          message: 'Не удалось получить модели: таймаут подключения',
          error: 'Превышено время ожидания ответа от сервера'
        }, { status: 400 })
      } else {
        return NextResponse.json({
          success: false,
          message: 'Не удалось получить модели',
          error: fetchError.message || 'Unknown connection error'
        }, { status: 400 })
      }
    }
  } catch (error: any) {
    console.error('Error fetching models:', error)
    return NextResponse.json({
      success: false,
      message: 'Ошибка при получении моделей',
      error: error.message || 'Unknown error'
    }, { status: 400 })
  }
}

// Функция для тестирования конкретной модели
async function testModel(modelId: string, testPrompt: string) {
  try {
    console.log('Testing model:', modelId, 'Provider:', aiSettings.provider)
    
    // Для Z.AI используем SDK
    if (aiSettings.provider === 'z-ai') {
      try {
        const ZAI = await import('z-ai-web-dev-sdk')
        const zai = await ZAI.default.create()
        
        const startTime = Date.now()
        
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: testPrompt || 'Привет! Пожалуйста, представься кратко.'
            }
          ],
          max_tokens: 100,
          temperature: 0.7
        })
        
        const responseTime = Date.now() - startTime
        const messageContent = completion.choices[0]?.message?.content || ''
        
        console.log('Z.AI model test successful:', { responseTime, contentLength: messageContent.length })
        
        return NextResponse.json({
          success: true,
          message: 'Тест модели Z.AI пройден успешно',
          response_time: responseTime,
          quality_score: messageContent.length > 10 ? 0.8 : 0.5, // Простая оценка качества
          content: messageContent
        })
      } catch (sdkError: any) {
        console.error('Z.AI model test error:', sdkError)
        return NextResponse.json({
          success: false,
          message: 'Тест модели Z.AI не удался',
          error: sdkError.message || 'Z.AI SDK error'
        }, { status: 400 })
      }
    }
    
    // Проверяем, что URL настроен для других провайдеров
    if (!aiSettings.lmStudioUrl) {
      return NextResponse.json({
        success: false,
        message: 'URL провайдера не настроен',
        error: 'Provider URL is not configured'
      }, { status: 400 })
    }

    const startTime = Date.now()
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 секунд для теста модели

    try {
      const response = await fetch(`${aiSettings.lmStudioUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiSettings.apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: 'user',
              content: testPrompt || 'Привет! Пожалуйста, представься кратко.'
            }
          ],
          temperature: 0.7,
          max_tokens: 100,
          stream: false
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      if (response.ok) {
        const data = await response.json()
        const responseText = data.choices[0]?.message?.content || ''
        console.log('Model test successful:', modelId, 'Response time:', responseTime + 'ms')
        
        // Оцениваем качество ответа
        const qualityScore = assessResponseQuality(responseText)
        
        // Обновляем статистику производительности
        updatePerformanceStats(modelId, responseTime, true)
        
        return NextResponse.json({
          success: true,
          message: 'Тест модели успешно выполнен',
          response_time: responseTime,
          quality_score: qualityScore,
          response_text: responseText
        })
      } else {
        const errorText = await response.text()
        console.error('Model test failed:', modelId, 'Status:', response.status, 'Error:', errorText)
        
        // Обновляем статистику производительности (неудачный запрос)
        updatePerformanceStats(modelId, responseTime, false)
        
        return NextResponse.json({
          success: false,
          message: `Ошибка тестирования модели: ${response.status} ${response.statusText}`,
          response_time: responseTime,
          quality_score: 0,
          error: errorText
        }, { status: 400 })
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      console.error('Model test fetch error:', modelId, fetchError)
      
      // Обновляем статистику производительности (неудачный запрос)
      updatePerformanceStats(modelId, responseTime, false)
      
      // Обрабатываем конкретные ошибки подключения
      if (fetchError.code === 'ECONNREFUSED') {
        return NextResponse.json({
          success: false,
          message: 'Не удалось протестировать модель: соединение отклонено',
          response_time: responseTime,
          quality_score: 0,
          error: `Сервер ${aiSettings.lmStudioUrl} недоступен`
        }, { status: 400 })
      } else if (fetchError.code === 'ENOTFOUND') {
        return NextResponse.json({
          success: false,
          message: 'Не удалось протестировать модель: хост не найден',
          response_time: responseTime,
          quality_score: 0,
          error: `Хост ${new URL(aiSettings.lmStudioUrl).hostname} не найден`
        }, { status: 400 })
      } else if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          message: 'Не удалось протестировать модель: таймаут подключения',
          response_time: responseTime,
          quality_score: 0,
          error: 'Превышено время ожидания ответа от сервера'
        }, { status: 400 })
      } else {
        return NextResponse.json({
          success: false,
          message: 'Не удалось протестировать модель',
          response_time: responseTime,
          quality_score: 0,
          error: fetchError.message || 'Unknown connection error'
        }, { status: 400 })
      }
    }
  } catch (error: any) {
    console.error('Error testing model:', modelId, error)
    return NextResponse.json({
      success: false,
      message: 'Не удалось протестировать модель',
      response_time: 0,
      quality_score: 0,
      error: error.message || 'Unknown error'
    }, { status: 400 })
  }
}

// Вспомогательные функции для анализа моделей
function estimateModelSize(modelId: string): string {
  if (modelId.includes('7B')) return '7B'
  if (modelId.includes('13B')) return '13B'
  if (modelId.includes('34B')) return '34B'
  if (modelId.includes('70B')) return '70B'
  return 'Unknown'
}

function getModelFormat(modelId: string): string {
  if (modelId.includes('GGUF')) return 'GGUF'
  if (modelId.includes('GGML')) return 'GGML'
  if (modelId.includes('GPTQ')) return 'GPTQ'
  return 'Unknown'
}

function getModelFamily(modelId: string): string {
  if (modelId.includes('Mistral')) return 'Mistral'
  if (modelId.includes('Llama')) return 'Llama'
  if (modelId.includes('Vicuna')) return 'Vicuna'
  if (modelId.includes('Alpaca')) return 'Alpaca'
  return 'Unknown'
}

function getQuantizationLevel(modelId: string): string {
  if (modelId.includes('Q4')) return 'Q4'
  if (modelId.includes('Q5')) return 'Q5'
  if (modelId.includes('Q8')) return 'Q8'
  return 'Unknown'
}

function generateModelDescription(modelId: string): string {
  if (modelId.includes('Instruct')) return 'Инструкционная модель, оптимизированная для следования командам'
  if (modelId.includes('Chat')) return 'Чат-модель, оптимизированная для диалогов'
  if (modelId.includes('Code')) return 'Модель, специализированная на генерации кода'
  return 'Универсальная языковая модель'
}

function assessResponseQuality(response: string): number {
  // Простая оценка качества на основе длины и содержательности ответа
  if (!response || response.length < 10) return 1
  if (response.length < 50) return 3
  if (response.includes('Привет') || response.includes('Здравствуйте')) return 7
  if (response.length > 100) return 8
  return 5
}

// Функции для отслеживания производительности
function updatePerformanceStats(modelId: string, responseTime: number, success: boolean): void {
  performanceStats.totalRequests++
  performanceStats.totalResponseTime += responseTime
  
  if (success) {
    performanceStats.successfulRequests++
  } else {
    performanceStats.failedRequests++
  }
  
  performanceStats.lastRequestTime = Date.now()
  
  // Обновляем статистику по моделям
  performanceStats.modelUsage[modelId] = (performanceStats.modelUsage[modelId] || 0) + 1
  
  // Очищаем старые запросы (старше 24 часов)
  cleanupOldRequests()
}

function cleanupOldRequests(): void {
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
  // В реальном приложении здесь нужно хранить историю запросов с временными метками
  // Для простоты просто уменьшаем счетчик
  if (performanceStats.lastRequestTime && performanceStats.lastRequestTime < twentyFourHoursAgo) {
    performanceStats.requestsLast24h = Math.max(0, performanceStats.requestsLast24h - 1)
  }
}

async function getPerformanceStats(): Promise<NextResponse> {
  try {
    const avgResponseTime = performanceStats.totalRequests > 0 
      ? Math.round(performanceStats.totalResponseTime / performanceStats.totalRequests)
      : 0
    
    const successRate = performanceStats.totalRequests > 0
      ? Math.round((performanceStats.successfulRequests / performanceStats.totalRequests) * 100)
      : 100

    // Сортируем модели по использованию
    const topModels = Object.entries(performanceStats.modelUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([modelId, usage]) => ({ modelId, usage }))

    return NextResponse.json({
      success: true,
      stats: {
        totalRequests: performanceStats.totalRequests,
        avgResponseTime,
        successRate,
        requestsLast24h: performanceStats.requestsLast24h,
        topModels,
        lastRequestTime: performanceStats.lastRequestTime
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Ошибка при получении статистики',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}