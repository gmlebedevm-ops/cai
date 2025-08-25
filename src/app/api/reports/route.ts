import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '6months'
    const groupBy = searchParams.get('groupBy') || 'month'

    // Calculate date range based on timeRange
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case '3months':
        startDate.setMonth(now.getMonth() - 3)
        break
      case '6months':
        startDate.setMonth(now.getMonth() - 6)
        break
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 6)
    }

    // Fetch contracts with related data
    const contracts = await db.contract.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        approvals: {
          include: {
            approver: true
          }
        },
        initiator: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate overview statistics
    const overview = {
      totalContracts: contracts.length,
      inReview: contracts.filter(c => c.status === 'IN_REVIEW').length,
      approved: contracts.filter(c => c.status === 'APPROVED').length,
      rejected: contracts.filter(c => c.status === 'REJECTED').length,
      avgApprovalTime: calculateAvgApprovalTime(contracts),
      overdueApprovals: calculateOverdueApprovals(contracts),
      completionRate: calculateCompletionRate(contracts)
    }

    // Calculate department statistics
    const departmentStats = calculateDepartmentStats(contracts)

    // Calculate approver workload
    const approverWorkload = calculateApproverWorkload(contracts)

    // Calculate KPI data
    const kpiData = {
      avgApprovalByType: calculateAvgApprovalByType(contracts),
      overdueRate: calculateOverdueRate(contracts),
      efficiencyTrend: calculateEfficiencyTrend(contracts, timeRange)
    }

    return NextResponse.json({
      overview,
      departmentStats,
      approverWorkload,
      kpiData,
      contracts
    })

  } catch (error) {
    console.error('Error fetching reports data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports data' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateAvgApprovalTime(contracts: any[]): number {
  const approvedContracts = contracts.filter(c => c.status === 'APPROVED')
  if (approvedContracts.length === 0) return 0

  const totalTime = approvedContracts.reduce((sum, contract) => {
    const approvals = contract.approvals.filter((a: any) => a.status === 'APPROVED')
    if (approvals.length === 0) return sum

    const contractTime = approvals.reduce((contractSum: number, approval: any) => {
      const created = new Date(approval.createdAt)
      const updated = new Date(approval.updatedAt)
      return contractSum + (updated.getTime() - created.getTime())
    }, 0)

    return sum + (contractTime / approvals.length)
  }, 0)

  const avgTimeMs = totalTime / approvedContracts.length
  return Math.round(avgTimeMs / (1000 * 60 * 60 * 24) * 10) / 10 // Convert to days
}

function calculateOverdueApprovals(contracts: any[]): number {
  const now = new Date()
  return contracts.filter(contract => {
    const pendingApprovals = contract.approvals.filter((a: any) => 
      a.status === 'PENDING' && a.dueDate && new Date(a.dueDate) < now
    )
    return pendingApprovals.length > 0
  }).length
}

function calculateCompletionRate(contracts: any[]): number {
  const completedContracts = contracts.filter(c => 
    c.status === 'APPROVED' || c.status === 'SIGNED'
  )
  if (contracts.length === 0) return 0
  return Math.round((completedContracts.length / contracts.length) * 100)
}

function calculateDepartmentStats(contracts: any[]): any[] {
  const departments: { [key: string]: any } = {}

  contracts.forEach(contract => {
    const department = contract.initiator.role || 'Unknown'
    
    if (!departments[department]) {
      departments[department] = {
        name: department,
        total: 0,
        approved: 0,
        rejected: 0,
        avgTime: 0,
        totalTime: 0,
        completedContracts: 0
      }
    }

    departments[department].total++
    
    if (contract.status === 'APPROVED') {
      departments[department].approved++
      
      // Calculate approval time
      const approvals = contract.approvals.filter((a: any) => a.status === 'APPROVED')
      if (approvals.length > 0) {
        const contractTime = approvals.reduce((sum: number, approval: any) => {
          const created = new Date(approval.createdAt)
          const updated = new Date(approval.updatedAt)
          return sum + (updated.getTime() - created.getTime())
        }, 0)
        
        departments[department].totalTime += contractTime / approvals.length
        departments[department].completedContracts++
      }
    } else if (contract.status === 'REJECTED') {
      departments[department].rejected++
    }
  })

  return Object.values(departments).map((dept: any) => ({
    name: dept.name,
    total: dept.total,
    approved: dept.approved,
    rejected: dept.rejected,
    avgTime: dept.completedContracts > 0 
      ? Math.round((dept.totalTime / dept.completedContracts) / (1000 * 60 * 60 * 24) * 10) / 10
      : 0
  }))
}

function calculateApproverWorkload(contracts: any[]): any[] {
  const approvers: { [key: string]: any } = {}

  contracts.forEach(contract => {
    contract.approvals.forEach((approval: any) => {
      const approverId = approval.approver.id
      
      if (!approvers[approverId]) {
        approvers[approverId] = {
          name: approval.approver.name || 'Unknown',
          role: approval.approver.role || 'Unknown',
          pending: 0,
          completed: 0,
          totalTime: 0,
          completedApprovals: 0
        }
      }

      if (approval.status === 'PENDING') {
        approvers[approverId].pending++
      } else if (approval.status === 'APPROVED') {
        approvers[approverId].completed++
        
        const created = new Date(approval.createdAt)
        const updated = new Date(approval.updatedAt)
        approvers[approverId].totalTime += updated.getTime() - created.getTime()
        approvers[approverId].completedApprovals++
      }
    })
  })

  return Object.values(approvers).map((approver: any) => ({
    name: approver.name,
    role: approver.role,
    pending: approver.pending,
    completed: approver.completed,
    avgTime: approver.completedApprovals > 0
      ? Math.round((approver.totalTime / approver.completedApprovals) / (1000 * 60 * 60 * 24) * 10) / 10
      : 0
  }))
}

function calculateAvgApprovalByType(contracts: any[]): { [key: string]: number } {
  const types: { [key: string]: { total: number, totalTime: number, completed: number } } = {}

  contracts.forEach(contract => {
    const contractType = 'Поставщик' // This would come from contract data in a real implementation
    
    if (!types[contractType]) {
      types[contractType] = { total: 0, totalTime: 0, completed: 0 }
    }

    types[contractType].total++

    if (contract.status === 'APPROVED') {
      const approvals = contract.approvals.filter((a: any) => a.status === 'APPROVED')
      if (approvals.length > 0) {
        const contractTime = approvals.reduce((sum: number, approval: any) => {
          const created = new Date(approval.createdAt)
          const updated = new Date(approval.updatedAt)
          return sum + (updated.getTime() - created.getTime())
        }, 0)
        
        types[contractType].totalTime += contractTime / approvals.length
        types[contractType].completed++
      }
    }
  })

  const result: { [key: string]: number } = {}
  Object.entries(types).forEach(([type, data]) => {
    result[type] = data.completed > 0
      ? Math.round((data.totalTime / data.completed) / (1000 * 60 * 60 * 24) * 10) / 10
      : 0
  })

  return result
}

function calculateOverdueRate(contracts: any[]): number {
  const now = new Date()
  const totalApprovals = contracts.reduce((sum, contract) => 
    sum + contract.approvals.length, 0
  )
  
  if (totalApprovals === 0) return 0

  const overdueApprovals = contracts.reduce((sum, contract) => {
    const overdue = contract.approvals.filter((a: any) => 
      a.status === 'PENDING' && a.dueDate && new Date(a.dueDate) < now
    ).length
    return sum + overdue
  }, 0)

  return Math.round((overdueApprovals / totalApprovals) * 100 * 10) / 10
}

function calculateEfficiencyTrend(contracts: any[], timeRange: string): any[] {
  // This is a simplified version - in a real implementation, you would group by month
  // and calculate efficiency for each month
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн']
  const baseEfficiency = 82
  
  return months.map((month, index) => ({
    month,
    rate: Math.min(95, baseEfficiency + index * 1.5 + Math.random() * 2)
  }))
}