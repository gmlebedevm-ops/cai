import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')

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
        counterparty: true,
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
            type: 'CONTRACT_TEXT'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })

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

    // Получение политик компании
    const policies = await db.reference.findMany({
      where: {
        type: 'COMPANY_POLICY',
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    // Формирование контекста
    const context: ContractContext = {
      metadata: {
        id: contract.id,
        number: contract.number,
        title: contract.counterparty,
        counterparty: contract.counterparty?.name || '',
        startDate: contract.startDate?.toISOString().split('T')[0] || '',
        endDate: contract.endDate?.toISOString().split('T')[0] || '',
        status: contract.status,
        responsible: contract.initiator?.name || ''
      },
      text: contract.documents[0]?.filePath || '', // В реальности здесь должен быть текст документа
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
        name: contract.counterparty?.name || '',
        inn: contract.counterparty?.inn || '',
        status: contract.counterparty?.status || '',
        cooperationHistory: contract.counterparty?.metadata?.cooperationHistory || ''
      },
      policies: policies.map(policy => ({
        title: policy.name,
        description: policy.description || ''
      }))
    }

    return NextResponse.json(context)
  } catch (error) {
    console.error('Error fetching contract context:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}