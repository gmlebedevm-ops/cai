import { NextRequest, NextResponse } from 'next/server'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatHistory {
  id: string
  contractId: string
  userId: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

// Временное хранилище истории диалогов (в реальном приложении нужно использовать базу данных)
const chatHistoryStorage = new Map<string, ChatHistory>()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')
    const userId = searchParams.get('userId')

    if (!contractId || !userId) {
      return NextResponse.json(
        { error: 'contractId and userId are required' },
        { status: 400 }
      )
    }

    const historyId = `${contractId}_${userId}`
    const history = chatHistoryStorage.get(historyId)

    if (!history) {
      return NextResponse.json({
        id: historyId,
        contractId,
        userId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractId, userId, message, role } = body

    if (!contractId || !userId || !message || !role) {
      return NextResponse.json(
        { error: 'contractId, userId, message, and role are required' },
        { status: 400 }
      )
    }

    if (!['user', 'assistant'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be either "user" or "assistant"' },
        { status: 400 }
      )
    }

    const historyId = `${contractId}_${userId}`
    let history = chatHistoryStorage.get(historyId)

    const newMessage: ChatMessage = {
      role,
      content: message,
      timestamp: new Date().toISOString()
    }

    if (!history) {
      // Создаем новую историю диалога
      history = {
        id: historyId,
        contractId,
        userId,
        messages: [newMessage],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    } else {
      // Добавляем сообщение к существующей истории
      history.messages.push(newMessage)
      history.updatedAt = new Date().toISOString()
    }

    chatHistoryStorage.set(historyId, history)

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error saving chat message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')
    const userId = searchParams.get('userId')

    if (!contractId || !userId) {
      return NextResponse.json(
        { error: 'contractId and userId are required' },
        { status: 400 }
      )
    }

    const historyId = `${contractId}_${userId}`
    const deleted = chatHistoryStorage.delete(historyId)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Chat history not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Chat history cleared successfully' 
    })
  } catch (error) {
    console.error('Error clearing chat history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}