import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')
    const approverId = searchParams.get('approverId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {}
    
    if (contractId) {
      whereClause.contractId = contractId
    }
    
    if (approverId) {
      whereClause.approverId = approverId
    }
    
    if (status && status !== 'all') {
      // Handle multiple statuses (comma-separated)
      if (status.includes(',')) {
        const statuses = status.split(',').map(s => s.trim())
        whereClause.status = { in: statuses }
      } else {
        whereClause.status = status
      }
    }
    
    if (search) {
      whereClause.OR = [
        {
          contract: {
            number: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          contract: {
            counterparty: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          approver: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          approver: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // Get total count for pagination
    const total = await db.approval.count({ where: whereClause })

    // Get approvals with pagination
    const approvals = await db.approval.findMany({
      where: whereClause,
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
            status: true,
            amount: true,
            startDate: true,
            endDate: true,
            initiator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    })

    const pagination = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }

    return NextResponse.json({
      approvals,
      pagination
    })
  } catch (error) {
    console.error('Error fetching approvals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      contractId,
      approverId,
      dueDate,
      workflowStep
    } = body

    if (!contractId || !approverId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if approval already exists
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

    const approval = await db.approval.create({
      data: {
        contractId,
        approverId,
        status: 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : null,
        workflowStep: workflowStep || 1
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
          dueDate
        }),
        contractId
      }
    })

    return NextResponse.json(approval, { status: 201 })
  } catch (error) {
    console.error('Error creating approval:', error)
    return NextResponse.json(
      { error: 'Failed to create approval' },
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

    const approval = await db.approval.update({
      where: { id: approvalId },
      data: {
        status,
        comment
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
            status: true,
            initiatorId: true
          }
        }
      }
    })

    // Update contract status based on approval
    let contractStatus = approval.contract.status
    if (status === 'APPROVED') {
      // Check if all approvals are completed
      const allApprovals = await db.approval.findMany({
        where: { contractId: approval.contractId }
      })
      
      const allApproved = allApprovals.every(a => a.status === 'APPROVED')
      const hasRejected = allApprovals.some(a => a.status === 'REJECTED')
      
      if (hasRejected) {
        contractStatus = 'REJECTED'
      } else if (allApproved) {
        contractStatus = 'APPROVED'
      } else {
        contractStatus = 'IN_REVIEW'
      }
    } else if (status === 'REJECTED') {
      contractStatus = 'REJECTED'
    }

    await db.contract.update({
      where: { id: approval.contractId },
      data: { status: contractStatus }
    })

    // Create contract history entry
    await db.contractHistory.create({
      data: {
        action: `APPROVAL_${status}`,
        details: JSON.stringify({
          approvalId,
          approverId: approval.approverId,
          comment,
          newContractStatus: contractStatus
        }),
        contractId: approval.contractId
      }
    })

    return NextResponse.json(approval)
  } catch (error) {
    console.error('Error updating approval:', error)
    return NextResponse.json(
      { error: 'Failed to update approval' },
      { status: 500 }
    )
  }
}