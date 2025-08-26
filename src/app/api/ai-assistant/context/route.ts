import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface ContractContext {
  metadata: {
    id: string
    number: string
    title: string
    counterparty: string
    startDate: string
    endDate: string
    status: string
    responsible?: string
  }
  text: string
  templates: Array<{
    name: string
    content: string
  }>
  history: Array<{
    author: string
    date: string
    comment: string
  }>
  counterparty: {
    name: string
    inn?: string
    status?: string
    cooperationHistory?: string
  }
  policies: Array<{
    title: string
    description: string
  }>
}

// Функция для извлечения текста из документа
async function extractTextFromDocument(filePath: string, mimeType: string): Promise<string> {
  try {
    // Для демо-файла используем прямой путь
    if (filePath === '/demo-contract.txt') {
      const demoFilePath = join(process.cwd(), 'demo-contract.txt')
      const text = await readFile(demoFilePath, 'utf-8')
      return text
    }

    // Для других файлов проверяем, существует ли они
    const fullPath = join(process.cwd(), filePath.startsWith('/') ? filePath.slice(1) : filePath)
    
    try {
      if (mimeType === 'text/plain') {
        return await readFile(fullPath, 'utf-8')
      }
      
      // Для PDF и DOC файлов в реальном приложении нужно использовать специальные библиотеки
      // Пока возвращаем заглушку
      return '[Текст документа не может быть извлечен автоматически. Требуется ручная обработка.]'
      
    } catch (error) {
      console.warn('File not found or cannot be read:', fullPath)
      return '[Файл документа не найден]'
    }
  } catch (error) {
    console.error('Error extracting text from document:', error)
    return '[Ошибка при извлечении текста документа]'
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')

    console.log('Contract context request:', { contractId })

    if (!contractId) {
      return NextResponse.json(
        { error: 'contractId is required' },
        { status: 400 }
      )
    }

    // Получение данных договора
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        initiator: true,
        approvals: {
          include: {
            approver: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        documents: {
          where: {
            type: 'CONTRACT'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })

    console.log('Contract found:', contract ? 'Yes' : 'No')

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    // Получение типовых шаблонов
    const templates = await db.reference.findMany({
      where: {
        type: 'CONTRACT_TYPE',
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    console.log('Templates found:', templates.length)

    // Получение политик компании (используем APPROVAL_REASON как аналог политик)
    const policies = await db.reference.findMany({
      where: {
        type: 'APPROVAL_REASON',
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    console.log('Policies found:', policies.length)

    // Извлечение текста из документа
    let contractText = ''
    if (contract.documents && contract.documents.length > 0) {
      const mainDocument = contract.documents[0]
      console.log('Extracting text from document:', mainDocument.filename)
      contractText = await extractTextFromDocument(mainDocument.filePath, mainDocument.mimeType)
      console.log('Text extracted, length:', contractText.length)
    }

    // Формирование контекста
    const context: ContractContext = {
      metadata: {
        id: contract.id,
        number: contract.number,
        title: `Договор ${contract.number}`,
        counterparty: contract.counterparty,
        startDate: contract.startDate?.toISOString().split('T')[0] || '',
        endDate: contract.endDate?.toISOString().split('T')[0] || '',
        status: contract.status,
        responsible: contract.initiator?.name || ''
      },
      text: contractText,
      templates: templates.map(template => ({
        name: template.name,
        content: template.value || template.description || ''
      })),
      history: contract.approvals.map(approval => ({
        author: approval.approver?.name || 'Система',
        date: approval.createdAt.toISOString(),
        comment: approval.comment || ''
      })),
      counterparty: {
        name: contract.counterparty,
        inn: '', // В текущей модели нет отдельной сущности контрагента
        status: '',
        cooperationHistory: ''
      },
      policies: policies.map(policy => ({
        title: policy.name,
        description: policy.description || ''
      }))
    }

    console.log('Context created successfully')

    return NextResponse.json(context)
  } catch (error) {
    console.error('Error fetching contract context:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}