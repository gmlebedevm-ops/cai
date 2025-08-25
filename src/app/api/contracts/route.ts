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
      description
    } = body

    // Validate required fields
    if (!number || !counterparty || !amount || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get or create demo user
    const user = await getOrCreateDemoUser()

    const contract = await db.contract.create({
      data: {
        number,
        counterparty,
        amount: parseFloat(amount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        initiatorId: user.id,
        status: 'DRAFT'
      },
      include: {
        initiator: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    })

    // Create contract history entry
    await db.contractHistory.create({
      data: {
        action: 'CREATED',
        details: JSON.stringify({
          number,
          counterparty,
          amount,
          startDate,
          endDate,
          description
        }),
        contractId: contract.id
      }
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error('Error creating contract:', error)
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    )
  }
}