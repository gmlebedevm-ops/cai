import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contract = await db.contract.findUnique({
      where: { id: params.id },
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
              include: {
                author: {
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
            createdAt: 'desc'
          }
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
            createdAt: 'asc'
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            replies: {
              include: {
                author: {
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
            createdAt: 'desc'
          }
        },
        history: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, number, counterparty, amount, startDate, endDate } = body

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (number !== undefined) updateData.number = number
    if (counterparty !== undefined) updateData.counterparty = counterparty
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = new Date(endDate)

    const contract = await db.contract.update({
      where: { id: params.id },
      data: updateData,
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
        action: 'CONTRACT_UPDATED',
        details: JSON.stringify(updateData),
        contractId: params.id
      }
    })

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error updating contract:', error)
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    )
  }
}