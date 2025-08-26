import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AIProvider } from '@prisma/client'

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

// Функция для преобразования строкового значения провайдера в enum
function stringToProvider(provider: string): AIProvider {
  switch (provider.toLowerCase()) {
    case 'lm-studio':
      return AIProvider.LM_STUDIO
    case 'z-ai':
      return AIProvider.Z_AI
    case 'openai':
      return AIProvider.OPENAI
    case 'anthropic':
      return AIProvider.ANTHROPIC
    default:
      return AIProvider.LM_STUDIO // значение по умолчанию
  }
}

// Функция для получения или создания настроек AI
async function getOrCreateAISettings() {
  try {
    // Сначала пытаемся получить существующие настройки
    let settings = await db.aISettings.findFirst()
    
    if (!settings) {
      // Если настроек нет, создаем их с значениями по умолчанию из .env
      settings = await db.aISettings.create({
        data: {
          provider: AIProvider.LM_STUDIO,
          lmStudioUrl: process.env.LM_STUDIO_URL || 'http://localhost:1234',
          apiKey: process.env.LM_STUDIO_API_KEY || 'lm-studio',
          defaultModel: process.env.LM_STUDIO_DEFAULT_MODEL || 'TheBloke/Mistral-7B-Instruct-v0.2-GGUF',
          temperature: 0.2,
          maxTokens: 2000,
          topP: 0.9,
          isActive: true
        }
      })
    }
    
    return settings
  } catch (error) {
    console.error('Error getting/creating AI settings:', error)
    throw error
  }
}

// Функция для преобразования настроек из базы данных в формат API
function formatAISettings(dbSettings: any): AISettings {
  // Преобразуем провайдер из формата БД в формат API
  let provider: 'lm-studio' | 'z-ai' | 'openai' | 'anthropic'
  switch (dbSettings.provider) {
    case 'LM_STUDIO':
      provider = 'lm-studio'
      break
    case 'Z_AI':
      provider = 'z-ai'
      break
    case 'OPENAI':
      provider = 'openai'
      break
    case 'ANTHROPIC':
      provider = 'anthropic'
      break
    default:
      provider = 'lm-studio' // значение по умолчанию
  }
  
  return {
    id: dbSettings.id,
    provider,
    lmStudioUrl: dbSettings.lmStudioUrl,
    apiKey: dbSettings.apiKey,
    defaultModel: dbSettings.defaultModel,
    temperature: dbSettings.temperature,
    maxTokens: dbSettings.maxTokens,
    topP: dbSettings.topP,
    isActive: dbSettings.isActive,
    updatedAt: dbSettings.updatedAt.toISOString()
  }
}

export async function GET() {
  try {
    const dbSettings = await getOrCreateAISettings()
    const settings = formatAISettings(dbSettings)
    
    return NextResponse.json(settings)
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

    // Получаем текущие настройки
    const currentSettings = await getOrCreateAISettings()
    
    // Обновляем настройки в базе данных
    const updatedSettings = await db.aISettings.update({
      where: { id: currentSettings.id },
      data: {
        provider: stringToProvider(provider),
        lmStudioUrl: provider === 'lm-studio' ? lmStudioUrl : (PROVIDER_URLS[provider] || lmStudioUrl),
        apiKey,
        defaultModel,
        temperature,
        maxTokens,
        topP,
        isActive: isActive !== undefined ? isActive : currentSettings.isActive,
        updatedAt: new Date()
      }
    })

    console.log('AI settings updated in database:', updatedSettings)

    return NextResponse.json(formatAISettings(updatedSettings))
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

      // Получаем текущие настройки
      const currentSettings = await getOrCreateAISettings()
      
      // Обновляем настройки в базе данных
      const updatedSettings = await db.aISettings.update({
        where: { id: currentSettings.id },
        data: {
          provider: stringToProvider(provider),
          lmStudioUrl,
          apiKey,
          defaultModel,
          temperature,
          maxTokens,
          topP,
          isActive: isActive !== undefined ? isActive : currentSettings.isActive,
          updatedAt: new Date()
        }
      })

      console.log('AI settings updated via POST in database:', updatedSettings)

      return NextResponse.json(formatAISettings(updatedSettings))
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
    const settings = await getOrCreateAISettings()
    console.log('Testing connection to provider:', settings.provider)
    
    // Для Z.AI используем специальный SDK
    if (settings.provider === 'Z_AI') {
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
    if (!settings.lmStudioUrl && settings.provider !== 'Z_AI') {
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
      switch (settings.provider) {
        case 'LM_STUDIO':
          testUrl = `${settings.lmStudioUrl}/v1/models`
          headers['Authorization'] = `Bearer ${settings.apiKey}`
          break
        case 'Z_AI':
          testUrl = `${settings.lmStudioUrl}/v1/models`
          headers['Authorization'] = `Bearer ${settings.apiKey}`
          break
        case 'OPENAI':
          testUrl = 'https://api.openai.com/v1/models'
          headers['Authorization'] = `Bearer ${settings.apiKey}`
          break
        case 'ANTHROPIC':
          testUrl = 'https://api.anthropic.com/v1/messages'
          headers['x-api-key'] = settings.apiKey
          headers['anthropic-version'] = '2023-06-01'
          break
        default:
          return NextResponse.json({
            success: false,
            message: 'Неизвестный провайдер',
            error: `Unknown provider: ${settings.provider}`
          }, { status: 400 })
      }

      // Для LM Studio также проверяем доступность чата
      if (settings.provider === 'LM_STUDIO') {
        try {
          // Пробуем разные варианты endpoint для чата в зависимости от версии LM Studio
          const chatEndpoints = [
            `${settings.lmStudioUrl}/v1/chat/completions`,
            `${settings.lmStudioUrl}/chat/completions`,
            `${settings.lmStudioUrl}/v1/completions`,
            `${settings.lmStudioUrl}/completions`
          ]
          
          let chatSuccess = false
          let lastError = null
          let workingEndpoint = null
          
          // Сначала проверяем базовый URL на доступность
          try {
            const baseUrl = new URL(settings.lmStudioUrl)
            console.log(`Testing base URL: ${baseUrl.origin}`)
            
            const baseResponse = await fetch(`${baseUrl.origin}/`, {
              method: 'GET',
              signal: controller.signal,
              timeout: 5000
            })
            
            if (baseResponse.ok) {
              console.log('LM Studio base URL is accessible')
            }
          } catch (baseError) {
            console.warn('LM Studio base URL not accessible:', baseError)
          }
          
          // Проверяем каждый endpoint чата
          for (const chatEndpoint of chatEndpoints) {
            try {
              console.log(`Testing LM Studio chat endpoint: ${chatEndpoint}`)
              
              const chatResponse = await fetch(chatEndpoint, {
                method: 'POST',
                headers: {
                  ...headers,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: settings.defaultModel,
                  messages: [{ role: 'user', content: 'test' }],
                  max_tokens: 1,
                  temperature: 0.1
                }),
                signal: controller.signal
              })
              
              if (chatResponse.ok) {
                chatSuccess = true
                workingEndpoint = chatEndpoint
                console.log(`LM Studio chat endpoint working: ${chatEndpoint}`)
                break
              } else {
                const errorText = await chatResponse.text()
                lastError = `Chat endpoint ${chatEndpoint} returned ${chatResponse.status}: ${errorText}`
                console.warn(`LM Studio chat endpoint failed: ${chatEndpoint} - ${chatResponse.status}`)
                
                // Если 404, пробуем получить список моделей чтобы понять структуру API
                if (chatResponse.status === 404) {
                  try {
                    const modelsResponse = await fetch(`${settings.lmStudioUrl}/v1/models`, {
                      headers,
                      signal: controller.signal
                    })
                    
                    if (modelsResponse.ok) {
                      const modelsData = await modelsResponse.json()
                      console.log('Available models:', modelsData)
                      lastError += ` | Available models: ${modelsData.data?.length || 0} found`
                    }
                  } catch (modelsError) {
                    console.warn('Could not fetch models:', modelsError)
                  }
                }
              }
            } catch (endpointError: any) {
              lastError = `Chat endpoint ${chatEndpoint} error: ${endpointError.message}`
              console.warn(`LM Studio chat endpoint error: ${chatEndpoint} - ${endpointError.message}`)
            }
          }
          
          if (!chatSuccess) {
            return NextResponse.json({
              success: false,
              message: 'LM Studio доступен, но endpoint чата не работает',
              error: lastError || 'All chat endpoints failed',
              suggestion: 'Проверьте, что LM Studio запущен, модель загружена и правильность URL',
              testedEndpoints: chatEndpoints,
              troubleshooting: [
                'Убедитесь, что LM Studio запущен',
                'Проверьте, что модель загружена в LM Studio',
                'Проверьте правильность URL и порта',
                'Попробуйте разные варианты URL: /v1/chat/completions, /chat/completions',
                'Проверьте, что в LM Studio включен API сервер'
              ]
            }, { status: 400 })
          } else {
            console.log(`LM Studio chat endpoint verified: ${workingEndpoint}`)
          }
        } catch (chatError: any) {
          return NextResponse.json({
            success: false,
            message: 'LM Studio доступен, но endpoint чата не работает',
            error: chatError.message || 'Chat endpoint test failed',
            suggestion: 'Проверьте настройки LM Studio и сетевое подключение'
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
        console.log('Connection successful, provider:', settings.provider)
        return NextResponse.json({
          success: true,
          message: `Подключение к ${getProviderName(settings.provider)} успешно установлено`,
          provider: settings.provider.toLowerCase(),
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
          message: `Не удалось подключиться к ${getProviderName(settings.provider)}: соединение отклонено`,
          error: `Сервер ${settings.lmStudioUrl} недоступен`
        }, { status: 400 })
      } else if (fetchError.code === 'ENOTFOUND') {
        return NextResponse.json({
          success: false,
          message: `Не удалось подключиться к ${getProviderName(settings.provider)}: хост не найден`,
          error: `Хост ${new URL(settings.lmStudioUrl).hostname} не найден`
        }, { status: 400 })
      } else if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          message: `Не удалось подключиться к ${getProviderName(settings.provider)}: превышено время ожидания`,
          error: 'Connection timeout'
        }, { status: 400 })
      } else {
        return NextResponse.json({
          success: false,
          message: `Не удалось подключиться к ${getProviderName(settings.provider)}: ошибка сети`,
          error: fetchError.message || 'Network error'
        }, { status: 400 })
      }
    }
  } catch (error: any) {
    console.error('Error in testConnection:', error)
    return NextResponse.json({
      success: false,
      message: 'Ошибка при тестировании подключения',
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

// Функция для получения доступных моделей
async function getAvailableModels() {
  try {
    const settings = await getOrCreateAISettings()
    
    // Проверяем кэш
    if (modelCache && Date.now() - modelCache.timestamp < modelCache.ttl) {
      console.log('Returning cached models')
      return NextResponse.json({
        success: true,
        models: modelCache.models,
        cached: true
      })
    }

    // Для Z.AI возвращаем пустой список (SDK не предоставляет стандартный API для моделей)
    if (settings.provider === 'Z_AI') {
      return NextResponse.json({
        success: true,
        models: [],
        message: 'Z.AI SDK не предоставляет список моделей стандартным образом'
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      let modelsUrl: string
      let headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      switch (settings.provider) {
        case 'LM_STUDIO':
          modelsUrl = `${settings.lmStudioUrl}/v1/models`
          headers['Authorization'] = `Bearer ${settings.apiKey}`
          break
        case 'OPENAI':
          modelsUrl = 'https://api.openai.com/v1/models'
          headers['Authorization'] = `Bearer ${settings.apiKey}`
          break
        case 'ANTHROPIC':
          // Для Anthropic используем специальный endpoint
          modelsUrl = 'https://api.anthropic.com/v1/messages'
          headers['x-api-key'] = settings.apiKey
          headers['anthropic-version'] = '2023-06-01'
          break
        default:
          return NextResponse.json({
            success: false,
            message: 'Неизвестный провайдер для получения моделей',
            error: `Unknown provider: ${settings.provider}`
          }, { status: 400 })
      }

      const response = await fetch(modelsUrl, {
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        
        // Кэшируем результат
        modelCache = {
          models: data.data || [],
          timestamp: Date.now(),
          ttl: 5 * 60 * 1000 // 5 минут
        }

        console.log('Models fetched successfully:', data.data?.length || 0, 'models')
        return NextResponse.json({
          success: true,
          models: data.data || [],
          cached: false
        })
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch models:', response.status, errorText)
        return NextResponse.json({
          success: false,
          message: 'Не удалось получить список моделей',
          error: errorText
        }, { status: 400 })
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      console.error('Error fetching models:', fetchError)
      return NextResponse.json({
        success: false,
        message: 'Ошибка при получении списка моделей',
        error: fetchError.message || 'Network error'
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error in getAvailableModels:', error)
    return NextResponse.json({
      success: false,
      message: 'Ошибка при получении списка моделей',
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

// Функция для тестирования конкретной модели
async function testModel(modelId: string, testPrompt?: string) {
  try {
    const settings = await getOrCreateAISettings()
    
    // Для Z.AI используем SDK
    if (settings.provider === 'Z_AI') {
      try {
        const ZAI = await import('z-ai-web-dev-sdk')
        const zai = await ZAI.default.create()
        
        const startTime = Date.now()
        const result = await zai.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: testPrompt || 'Привет! Пожалуйста, представься кратко.'
            }
          ],
          max_tokens: 100,
          temperature: settings.temperature
        })
        
        const responseTime = Date.now() - startTime
        
        return NextResponse.json({
          success: true,
          message: 'Модель Z.AI успешно протестирована',
          response: result.choices[0]?.message?.content || '',
          response_time: responseTime,
          model: modelId
        })
      } catch (sdkError: any) {
        console.error('Z.AI model test error:', sdkError)
        return NextResponse.json({
          success: false,
          message: 'Не удалось протестировать модель Z.AI',
          error: sdkError.message || 'Z.AI SDK error'
        }, { status: 400 })
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 секунд для теста модели

    try {
      let chatUrl: string
      let headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      switch (settings.provider) {
        case 'LM_STUDIO':
          chatUrl = `${settings.lmStudioUrl}/v1/chat/completions`
          headers['Authorization'] = `Bearer ${settings.apiKey}`
          break
        case 'OPENAI':
          chatUrl = 'https://api.openai.com/v1/chat/completions'
          headers['Authorization'] = `Bearer ${settings.apiKey}`
          break
        case 'ANTHROPIC':
          chatUrl = 'https://api.anthropic.com/v1/messages'
          headers['x-api-key'] = settings.apiKey
          headers['anthropic-version'] = '2023-06-01'
          break
        default:
          return NextResponse.json({
            success: false,
            message: 'Неизвестный провайдер для теста модели',
            error: `Unknown provider: ${settings.provider}`
          }, { status: 400 })
      }

      const startTime = Date.now()
      
      let body: any
      if (settings.provider === 'ANTHROPIC') {
        body = {
          model: modelId,
          max_tokens: 100,
          temperature: settings.temperature,
          messages: [
            {
              role: 'user',
              content: testPrompt || 'Привет! Пожалуйста, представься кратко.'
            }
          ]
        }
      } else {
        body = {
          model: modelId,
          messages: [
            {
              role: 'user',
              content: testPrompt || 'Привет! Пожалуйста, представься кратко.'
            }
          ],
          max_tokens: 100,
          temperature: settings.temperature
        }
      }

      const response = await fetch(chatUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      if (response.ok) {
        const data = await response.json()
        const responseText = settings.provider === 'ANTHROPIC' 
          ? data.content[0]?.text || ''
          : data.choices[0]?.message?.content || ''

        console.log('Model test successful:', modelId, responseTime + 'ms')
        return NextResponse.json({
          success: true,
          message: 'Модель успешно протестирована',
          response: responseText,
          response_time: responseTime,
          model: modelId
        })
      } else {
        const errorText = await response.text()
        console.error('Model test failed:', response.status, errorText)
        return NextResponse.json({
          success: false,
          message: 'Не удалось протестировать модель',
          error: errorText
        }, { status: 400 })
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      console.error('Error testing model:', fetchError)
      return NextResponse.json({
        success: false,
        message: 'Ошибка при тестировании модели',
        error: fetchError.message || 'Network error'
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error in testModel:', error)
    return NextResponse.json({
      success: false,
      message: 'Ошибка при тестировании модели',
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

// Функция для очистки кэша
function clearCache() {
  modelCache = null
  console.log('Model cache cleared')
}

// Функция для получения статистики производительности
async function getPerformanceStats() {
  try {
    // В реальном приложении здесь может быть более сложная логика
    // Например, получение статистики из базы данных или Redis
    
    return NextResponse.json({
      success: true,
      stats: {
        totalRequests: performanceStats.totalRequests,
        successfulRequests: performanceStats.successfulRequests,
        failedRequests: performanceStats.failedRequests,
        avgResponseTime: performanceStats.totalRequests > 0 
          ? Math.round(performanceStats.totalResponseTime / performanceStats.totalRequests) 
          : 0,
        successRate: performanceStats.totalRequests > 0 
          ? Math.round((performanceStats.successfulRequests / performanceStats.totalRequests) * 100) 
          : 100,
        requestsLast24h: performanceStats.requestsLast24h,
        modelUsage: performanceStats.modelUsage
      }
    })
  } catch (error: any) {
    console.error('Error getting performance stats:', error)
    return NextResponse.json({
      success: false,
      message: 'Ошибка при получении статистики производительности',
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

// Вспомогательная функция для получения названия провайдера
function getProviderName(provider: string): string {
  switch (provider) {
    case 'LM_STUDIO':
      return 'LM Studio'
    case 'Z_AI':
      return 'Z.AI'
    case 'OPENAI':
      return 'OpenAI'
    case 'ANTHROPIC':
      return 'Anthropic'
    default:
      return 'AI-провайдер'
  }
}