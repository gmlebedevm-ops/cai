import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('includeHistory') === 'true'

    // Get approvals for the contract
    const approvals = await db.approval.findMany({
      where: { contractId },
      include: {
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
        workflowStep: 'asc',
        createdAt: 'desc'
      }
    })

    let contractHistory = []
    if (includeHistory) {
      contractHistory = await db.contractHistory.findMany({
        where: { contractId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      })
    }

    return NextResponse.json({
      approvals,
      contractHistory: includeHistory ? contractHistory : undefined
    })
  } catch (error) {
    console.error('Error fetching contract approvals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract approvals' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id
    const body = await request.json()
    const {
      approverId,
      dueDate,
      workflowStep,
      comment
    } = body

    if (!approverId) {
      return NextResponse.json(
        { error: 'Missing required field: approverId' },
        { status: 400 }
      )
    }

    // Check if contract exists
    const contract = await db.contract.findUnique({
      where: { id: contractId }
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    // Check if approval already exists for this contract and approver
    const existingApproval = await db.approval.findFirst({
      where: {
        contractId,
        approverId
      }
    })

    if (existingApproval) {
      return NextResponse.json(
        { error: 'Approval already exists for this contract and approver' },
        { status: 400 }
      )
    }

    // Create the approval
    const approval = await db.approval.create({
      data: {
        contractId,
        approverId,
        status: 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : null,
        workflowStep: workflowStep || 1,
        comment: comment || null
      },
      include: {
        approver: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        },
        contract: {
          select: {
            id: true,
            number: true,
            counterparty: true,
            status: true
          }
        }
      }
    })

    // Create contract history entry
    await db.contractHistory.create({
      data: {
        action: 'APPROVAL_REQUESTED',
        details: JSON.stringify({
          approvalId: approval.id,
          approverId,
          workflowStep,
          dueDate,
          comment
        }),
        contractId,
        userId: approverId
      }
    })

    // Update contract status to IN_REVIEW if it's not already
    if (contract.status !== 'IN_REVIEW' && contract.status !== 'APPROVED' && contract.status !== 'REJECTED') {
      await db.contract.update({
        where: { id: contractId },
        data: { status: 'IN_REVIEW' }
      })
    }

    return NextResponse.json(approval, { status: 201 })
  } catch (error) {
    console.error('Error creating contract approval:', error)
    return NextResponse.json(
      { error: 'Failed to create contract approval' },
      { status: 500 }
    )
  }
}