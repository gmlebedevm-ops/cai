import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const approverId = searchParams.get('approverId')

    // Build base where clause
    const baseWhere: any = {}
    if (approverId) {
      baseWhere.approverId = approverId
    }

    // Get counts for different statuses
    const [total, pending, approved, rejected] = await Promise.all([
      db.approval.count({ where: baseWhere }),
      db.approval.count({ 
        where: { 
          ...baseWhere,
          status: 'PENDING' 
        } 
      }),
      db.approval.count({ 
        where: { 
          ...baseWhere,
          status: 'APPROVED' 
        } 
      }),
      db.approval.count({ 
        where: { 
          ...baseWhere,
          status: 'REJECTED' 
        } 
      })
    ])

    // Get overdue approvals (pending approvals past their due date)
    const overdueWhere = {
      ...baseWhere,
      status: 'PENDING',
      dueDate: {
        lt: new Date()
      }
    }
    const overdue = await db.approval.count({ where: overdueWhere })

    // Get approvals due soon (within next 3 days)
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    
    const dueSoonWhere = {
      ...baseWhere,
      status: 'PENDING',
      dueDate: {
        gte: new Date(),
        lte: threeDaysFromNow
      }
    }
    const dueSoon = await db.approval.count({ where: dueSoonWhere })

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentActivity = await db.approval.findMany({
      where: {
        ...baseWhere,
        updatedAt: {
          gte: sevenDaysAgo
        }
      },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            email: true
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
        updatedAt: 'desc'
      },
      take: 10
    })

    const stats = {
      total,
      pending,
      approved,
      rejected,
      overdue,
      dueSoon,
      recentActivity
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching approval stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch approval statistics' },
      { status: 500 }
    )
  }
}