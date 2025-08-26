import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const counterpartyId = searchParams.get('counterpartyId')
    const approverId = searchParams.get('approverId')
    const status = searchParams.get('status')

    let whereClause: any = {}

    if (counterpartyId) {
      whereClause.counterpartyId = counterpartyId
    }

    if (approverId) {
      whereClause.approverId = approverId
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    const approvals = await db.counterpartyApproval.findMany({
      where: whereClause,
      include: {
        counterparty: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true
          }
        },
        approver: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ approvals })
  } catch (error) {
    console.error('Error fetching counterparty approvals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch counterparty approvals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      counterpartyId,
      approverId,
      dueDate,
      comment
    } = body

    if (!counterpartyId || !approverId) {
      return NextResponse.json(
        { error: 'Missing required fields: counterpartyId and approverId' },
        { status: 400 }
      )
    }

    // Check if approval already exists
    const existingApproval = await db.counterpartyApproval.findFirst({
      where: {
        counterpartyId,
        approverId
      }
    })

    if (existingApproval) {
      return NextResponse.json(
        { error: 'Approval already exists for this counterparty and approver' },
        { status: 400 }
      )
    }

    // Update counterparty status to PENDING_APPROVAL
    await db.reference.update({
      where: { id: counterpartyId },
      data: { counterpartyStatus: 'PENDING_APPROVAL' }
    })

    const approval = await db.counterpartyApproval.create({
      data: {
        counterpartyId,
        approverId,
        status: 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : null,
        comment
      },
      include: {
        counterparty: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true
          }
        },
        approver: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    })

    // Create notification for approver
    await db.notification.create({
      data: {
        type: 'APPROVAL_REQUESTED',
        title: 'Новый контрагент на согласовании',
        message: `Контрагент ${approval.counterparty.name} требует вашего согласования`,
        userId: approverId,
        actionUrl: `/counterparties/${counterpartyId}`
      }
    })

    return NextResponse.json(approval, { status: 201 })
  } catch (error) {
    console.error('Error creating counterparty approval:', error)
    return NextResponse.json(
      { error: 'Failed to create counterparty approval' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      approvalId,
      status,
      comment
    } = body

    if (!approvalId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const approval = await db.counterpartyApproval.update({
      where: { id: approvalId },
      data: {
        status,
        comment
      },
      include: {
        counterparty: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true
          }
        },
        approver: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    })

    // Update counterparty status based on approval
    let newCounterpartyStatus = approval.counterparty.counterpartyStatus
    if (status === 'APPROVED') {
      newCounterpartyStatus = 'APPROVED'
    } else if (status === 'REJECTED') {
      newCounterpartyStatus = 'REJECTED'
    }

    await db.reference.update({
      where: { id: approval.counterpartyId },
      data: { counterpartyStatus: newCounterpartyStatus }
    })

    // Create notification for counterparty creator (if we can determine who it was)
    await db.notification.create({
      data: {
        type: status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        title: status === 'APPROVED' ? 'Контрагент согласован' : 'Контрагент отклонен',
        message: `Контрагент ${approval.counterparty.name} был ${status === 'APPROVED' ? 'согласован' : 'отклонен'}`,
        userId: approval.approverId, // В реальном приложении здесь должен быть ID создателя
        actionUrl: `/counterparties/${approval.counterpartyId}`
      }
    })

    return NextResponse.json(approval)
  } catch (error) {
    console.error('Error updating counterparty approval:', error)
    return NextResponse.json(
      { error: 'Failed to update counterparty approval' },
      { status: 500 }
    )
  }
}