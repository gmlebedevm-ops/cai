import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {}
    
    if (type && type !== 'all') {
      whereClause.type = type
    }
    
    if (search) {
      whereClause.OR = [
        {
          filename: {
            contains: search,
            mode: 'insensitive'
          }
        },
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
        }
      ]
    }

    // Get total count for pagination
    const total = await db.document.count({ where: whereClause })

    // Get documents with pagination
    const documents = await db.document.findMany({
      where: whereClause,
      include: {
        versions: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        contract: {
          select: {
            id: true,
            number: true,
            counterparty: true
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
      documents,
      pagination
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}