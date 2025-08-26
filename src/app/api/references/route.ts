import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ReferenceType } from '@/types/workflow'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')
    const parentCode = searchParams.get('parentCode')
    const search = searchParams.get('search')

    let whereClause: any = {}

    if (type && type !== 'all') {
      whereClause.type = type
    }

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    if (parentCode !== null) {
      whereClause.parentCode = parentCode || null
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const references = await db.reference.findMany({
      where: whereClause,
      include: {
        children: {
          orderBy: {
            sortOrder: 'asc'
          }
        },
        parent: true
      },
      orderBy: [
        { type: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    // Если запрашиваем контрагентов, добавляем информацию о договорах и статусах
    let enhancedReferences = references
    if (type === 'COUNTERPARTY') {
      enhancedReferences = await Promise.all(references.map(async (ref) => {
        const contractCount = await db.contract.count({
          where: {
            counterparty: ref.name
          }
        })
        
        const lastContract = await db.contract.findFirst({
          where: {
            counterparty: ref.name
          },
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            createdAt: true
          }
        })

        const approvals = await db.counterpartyApproval.findMany({
          where: {
            counterpartyId: ref.id
          },
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        })

        return {
          ...ref,
          contractCount,
          lastContractDate: lastContract?.createdAt,
          counterpartyApprovals: approvals
        }
      }))
    }

    return NextResponse.json({ references: enhancedReferences })
  } catch (error) {
    console.error('Error fetching references:', error)
    return NextResponse.json(
      { error: 'Failed to fetch references' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      type, 
      code, 
      name, 
      description, 
      value, 
      isActive = true, 
      sortOrder = 0, 
      metadata, 
      parentCode,
      counterpartyStatus,
      sendForApproval = false
    } = body

    if (!type || !code || !name) {
      return NextResponse.json(
        { error: 'Type, code, and name are required' },
        { status: 400 }
      )
    }

    // Проверяем уникальность кода
    const existingReference = await db.reference.findUnique({
      where: { code }
    })

    if (existingReference) {
      return NextResponse.json(
        { error: 'Reference with this code already exists' },
        { status: 400 }
      )
    }

    // Если указан parentCode, проверяем его существование
    if (parentCode) {
      const parentReference = await db.reference.findUnique({
        where: { code: parentCode }
      })

      if (!parentReference) {
        return NextResponse.json(
          { error: 'Parent reference not found' },
          { status: 400 }
        )
      }
    }

    // Определяем статус для контрагента
    let finalCounterpartyStatus = counterpartyStatus || 'DRAFT'
    if (type === 'COUNTERPARTY' && sendForApproval) {
      finalCounterpartyStatus = 'PENDING_APPROVAL'
    }

    const reference = await db.reference.create({
      data: {
        type,
        code,
        name,
        description,
        value,
        isActive,
        sortOrder,
        metadata,
        parentCode,
        counterpartyStatus: type === 'COUNTERPARTY' ? finalCounterpartyStatus : null
      },
      include: {
        children: true,
        parent: true,
        counterpartyApprovals: true
      }
    })

    // Если это контрагент и нужно отправить на согласование
    if (type === 'COUNTERPARTY' && sendForApproval) {
      // Находим директора по безопасности (security@test.com)
      const securityDirector = await db.user.findFirst({
        where: { 
          AND: [
            { role: 'GENERAL_DIRECTOR' },
            { email: 'security@test.com' }
          ]
        }
      })

      if (securityDirector) {
        // Создаем согласование
        await db.counterpartyApproval.create({
          data: {
            counterpartyId: reference.id,
            approverId: securityDirector.id,
            status: 'PENDING',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 дня на согласование
          }
        })

        // Создаем уведомление для директора по безопасности
        await db.notification.create({
          data: {
            type: 'APPROVAL_REQUESTED',
            title: 'Новый контрагент на согласовании',
            message: `Контрагент ${name} требует вашего согласования`,
            userId: securityDirector.id,
            actionUrl: `/counterparties/${reference.id}`
          }
        })
      } else {
        // Если директор по безопасности не найден, используем любого генерального директора
        const anyDirector = await db.user.findFirst({
          where: { role: 'GENERAL_DIRECTOR' }
        })

        if (anyDirector) {
          await db.counterpartyApproval.create({
            data: {
              counterpartyId: reference.id,
              approverId: anyDirector.id,
              status: 'PENDING',
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            }
          })

          await db.notification.create({
            data: {
              type: 'APPROVAL_REQUESTED',
              title: 'Новый контрагент на согласовании',
              message: `Контрагент ${name} требует вашего согласования`,
              userId: anyDirector.id,
              actionUrl: `/counterparties/${reference.id}`
            }
          })
        }
      }
    }

    return NextResponse.json(reference, { status: 201 })
  } catch (error) {
    console.error('Error creating reference:', error)
    return NextResponse.json(
      { error: 'Failed to create reference' },
      { status: 500 }
    )
  }
}