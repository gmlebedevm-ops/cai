# Настройка AI при смене IP адреса сервера

## Обзор
При смене IP адреса сервера необходимо обновить настройки AI в нескольких местах. Этот процесс был автоматизирован через использование переменных окружения.

## Файлы конфигурации

### 1. Основной файл настроек AI
**Файл:** `/src/app/api/ai-settings/route.ts`

Теперь использует переменные окружения вместо жестко заданного IP адреса:
```typescript
let aiSettings: AISettings = {
  id: 'default',
  provider: 'lm-studio',
  lmStudioUrl: process.env.LM_STUDIO_URL || 'http://localhost:1234',
  apiKey: process.env.LM_STUDIO_API_KEY || 'lm-studio',
  defaultModel: process.env.LM_STUDIO_DEFAULT_MODEL || 'TheBloke/Mistral-7B-Instruct-v0.2-GGUF',
  // ... остальные настройки
}
```

### 2. Файл переменных окружения
**Файл:** `.env`

Содержит все необходимые переменные для настройки AI:

```bash
# AI Configuration
# LM Studio Configuration
LM_STUDIO_URL="http://localhost:1234"
LM_STUDIO_API_KEY="lm-studio"
LM_STUDIO_DEFAULT_MODEL="TheBloke/Mistral-7B-Instruct-v0.2-GGUF"
LM_STUDIO_BASE_URL="http://localhost:1234"

# Z.AI Configuration
Z_AI_BASE_URL="http://localhost:1234"
Z_AI_API_KEY="z-ai-key"
Z_AI_DEFAULT_MODEL="gpt-3.5-turbo"

# OpenAI Configuration
OPENAI_API_KEY="your-openai-api-key"
OPENAI_DEFAULT_MODEL="gpt-3.5-turbo"
OPENAI_BASE_URL="https://api.openai.com/v1"

# Anthropic Configuration
ANTHROPIC_API_KEY="your-anthropic-api-key"
ANTHROPIC_DEFAULT_MODEL="claude-3-sonnet-20240229"
ANTHROPIC_BASE_URL="https://api.anthropic.com/v1"
```

### 3. AI Assistant API
**Файл:** `/src/app/api/ai-assistant/route.ts`

Использует переменные окружения для конфигурации провайдеров:
```typescript
const AI_PROVIDERS = {
  'lm-studio': {
    baseUrl: process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234',
    apiKey: process.env.LM_STUDIO_API_KEY || 'your-api-key',
    defaultModel: process.env.LM_STUDIO_DEFAULT_MODEL || 'TheBloke/Mistral-7B-Instruct-v0.2-GGUF',
    // ...
  },
  'z-ai': {
    baseUrl: process.env.Z_AI_BASE_URL || 'http://localhost:1234',
    // ...
  },
  // ...
}
```

## Инструкция по смене IP адреса сервера

### Шаг 1: Определите новый IP адрес и порт
Получите новый IP адрес сервера и порт, на котором работает AI сервис.

### Шаг 2: Обновите файл .env
Измените соответствующие переменные в файле `.env`:

```bash
# Для LM Studio
LM_STUDIO_URL="http://НОВЫЙ_IP:ПОРТ"
LM_STUDIO_BASE_URL="http://НОВЫЙ_IP:ПОРТ"

# Для Z.AI (если используется)
Z_AI_BASE_URL="http://НОВЫЙ_IP:ПОРТ"
```

**Пример:**
```bash
# Было:
LM_STUDIO_URL="http://localhost:1234"
LM_STUDIO_BASE_URL="http://localhost:1234"

# Стало (если сервер доступен по IP 192.168.1.100:5000):
LM_STUDIO_URL="http://192.168.1.100:5000"
LM_STUDIO_BASE_URL="http://192.168.1.100:5000"
```

### Шаг 3: Перезапустите приложение
После изменения файла `.env` необходимо перезапустить приложение:

```bash
# Остановите текущий процесс (Ctrl+C)
# Затем запустите снова:
npm run dev
```

Или используйте автоматический перезапуск (nodemon должен перезапустить приложение автоматически).

### Шаг 4: Проверьте настройки через веб-интерфейс
1. Перейдите в раздел "Настройки AI" в административной панели
2. Убедитесь, что URL сервера обновился
3. Протестируйте подключение к AI сервису

### Шаг 5: Проверьте работу AI ассистента
1. Откройте чат с AI ассистентом
2. Отправьте тестовое сообщение
3. Убедитесь, что ответ приходит корректно

## Дополнительные настройки

### Настройка через административную панель
Вы также можете изменить настройки AI через веб-интерфейс:

1. Перейдите в раздел "Администрирование" → "Настройки AI"
2. Измените URL сервера в соответствующем поле
3. Сохраните настройки
4. Протестируйте подключение

### Поддерживаемые провайдеры
Система поддерживает следующих AI провайдеров:

1. **LM Studio** - Локальный AI сервер
2. **Z.AI** - Встроенный AI сервис
3. **OpenAI** - Облачный AI сервис
4. **Anthropic** - Облачный AI сервис

## Устранение неполадок

### Проблема: Подключение не устанавливается
**Решение:**
1. Проверьте, что AI сервер запущен и доступен по указанному IP и порту
2. Убедитесь, что порт не заблокирован файрволом
3. Проверьте правильность URL в настройках

### Проблема: Настройки не сохраняются
**Решение:**
1. Убедитесь, что файл `.env` имеет правильные права доступа
2. Перезапустите приложение после изменений
3. Проверьте синтаксис файла `.env`

### Проблема: AI ассистент не отвечает
**Решение:**
1. Проверьте настройки в административной панели
2. Убедитесь, что выбран правильный провайдер
3. Протестируйте подключение через интерфейс настроек

## Примеры конфигурации

### Локальная разработка
```bash
LM_STUDIO_URL="http://localhost:1234"
LM_STUDIO_BASE_URL="http://localhost:1234"
```

### Сервер в локальной сети
```bash
LM_STUDIO_URL="http://192.168.1.100:1234"
LM_STUDIO_BASE_URL="http://192.168.1.100:1234"
```

### Удаленный сервер
```bash
LM_STUDIO_URL="http://ai-server.example.com:1234"
LM_STUDIO_BASE_URL="http://ai-server.example.com:1234"
```

### HTTPS подключение
```bash
LM_STUDIO_URL="https://ai-server.example.com:443"
LM_STUDIO_BASE_URL="https://ai-server.example.com:443"
```

## Важные замечания

1. **Безопасность:** Не храните реальные API ключи в системах контроля версий
2. **Перезапуск:** После изменения `.env` всегда перезапускайте приложение
3. **Тестирование:** Всегда тестируйте подключение после изменения настроек
4. **Резервное копирование:** Сохраняйте резервную копию файла `.env` перед изменениями

## Контактная информация

Если у вас возникли проблемы с настройкой AI, обратитесь к документации или администратору системы.