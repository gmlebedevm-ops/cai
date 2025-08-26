import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getOrCreateDemoUser() {
  const demoEmail = 'demo@contractflow.local'
  
  let user = await db.user.findUnique({
    where: { email: demoEmail }
  })
  
  if (!user) {
    user = await db.user.create({
      data: {
        email: demoEmail,
        name: 'Demo User',
        role: 'INITIATOR'
      }
    })
  }
  
  return user
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    
    // Filter parameters
    const status = searchParams.get('status')
    const counterparty = searchParams.get('counterparty')
    const search = searchParams.get('search')
    const initiatorId = searchParams.get('initiatorId')
    
    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let whereClause: any = {}
    
    // Status filter
    if (status && status !== 'all') {
      whereClause.status = status
    }
    
    // Counterparty filter
    if (counterparty && counterparty !== 'all') {
      whereClause.counterparty = counterparty
    }
    
    // Initiator filter (for "My Contracts" page)
    if (initiatorId) {
      whereClause.initiatorId = initiatorId
    }
    
    // Search filter (by number or counterparty)
    if (search) {
      whereClause.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { counterparty: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count for pagination
    const total = await db.contract.count({ where: whereClause })
    const totalPages = Math.ceil(total / limit)

    // Build sort object
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const contracts = await db.contract.findMany({
      where: whereClause,
      include: {
        initiator: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        },
        documents: {
          include: {
            versions: {
              orderBy: {
                version: 'desc'
              },
              take: 1 // Get only latest version
            }
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: 1 // Get only latest document
        },
        approvals: {
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
            createdAt: 'desc'
          }
        }
      },
      orderBy,
      skip: offset,
      take: limit
    })

    const pagination = {
      total,
      page,
      limit,
      totalPages
    }

    return NextResponse.json({
      contracts,
      pagination
    })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      number,
      counterparty,
      amount,
      startDate,
      endDate,
      description,
      status = 'DRAFT',
      workflowId,
      initiatorId
    } = body

    // Validate required fields
    if (!number || !counterparty || !amount || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate and parse dates
    let parsedStartDate, parsedEndDate
    try {
      parsedStartDate = new Date(startDate)
      parsedEndDate = new Date(endDate)
      
      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Get or create demo user if initiatorId not provided
    let user
    if (initiatorId) {
      user = await db.user.findUnique({
        where: { id: initiatorId }
      })
    } else {
      user = await getOrCreateDemoUser()
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const contract = await db.contract.create({
      data: {
        number,
        counterparty,
        amount: parseFloat(amount),
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        initiatorId: user.id,
        status,
        workflowId
      },
      include: {
        initiator: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        },
        workflow: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    // Create contract history entry
    await db.contractHistory.create({
      data: {
        action: status === 'DRAFT' ? 'CREATED_DRAFT' : 'CREATED_AND_SUBMITTED',
        details: JSON.stringify({
          number,
          counterparty,
          amount,
          startDate: parsedStartDate.toISOString(),
          endDate: parsedEndDate.toISOString(),
          description,
          status,
          workflowId
        }),
        contractId: contract.id
      }
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error('Error creating contract:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    )
  }
}