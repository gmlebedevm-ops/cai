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

    // Calculate timeline data based on grouping
    let timelineData
    switch (groupBy) {
      case 'month':
        timelineData = calculateMonthlyTimelineData(contracts)
        break
      case 'type':
        timelineData = calculateTypeTimelineData(contracts)
        break
      case 'department':
        timelineData = calculateDepartmentTimelineData(contracts)
        break
      default:
        timelineData = calculateMonthlyTimelineData(contracts)
    }

    // Calculate bottlenecks
    const bottlenecks = calculateBottlenecks(contracts)

    return NextResponse.json({
      timelineData,
      bottlenecks,
      summary: {
        totalContracts: contracts.length,
        avgApprovalTime: calculateAvgApprovalTime(contracts),
        minApprovalTime: calculateMinApprovalTime(contracts),
        maxApprovalTime: calculateMaxApprovalTime(contracts),
        overdueCount: calculateOverdueCount(contracts)
      }
    })

  } catch (error) {
    console.error('Error fetching timeline data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline data' },
      { status: 500 }
    )
  }
}

function calculateMonthlyTimelineData(contracts: any[]): any[] {
  const monthlyData: { [key: string]: any } = {}

  contracts.forEach(contract => {
    const month = new Date(contract.createdAt).toLocaleDateString('ru-RU', { month: 'short' })
    
    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        avgDays: 0,
        minDays: Infinity,
        maxDays: 0,
        contracts: 0,
        overdue: 0,
        totalTime: 0,
        completedContracts: 0
      }
    }

    monthlyData[month].contracts++

    if (contract.status === 'APPROVED') {
      const approvalTime = calculateContractApprovalTime(contract)
      if (approvalTime > 0) {
        monthlyData[month].totalTime += approvalTime
        monthlyData[month].completedContracts++
        monthlyData[month].minDays = Math.min(monthlyData[month].minDays, approvalTime)
        monthlyData[month].maxDays = Math.max(monthlyData[month].maxDays, approvalTime)
      }
    }

    // Check for overdue approvals
    const now = new Date()
    const hasOverdue = contract.approvals.some((a: any) => 
      a.status === 'PENDING' && a.dueDate && new Date(a.dueDate) < now
    )
    if (hasOverdue) {
      monthlyData[month].overdue++
    }
  })

  return Object.values(monthlyData).map((data: any) => ({
    month: data.month,
    avgDays: data.completedContracts > 0 ? Math.round((data.totalTime / data.completedContracts) * 10) / 10 : 0,
    minDays: data.minDays === Infinity ? 0 : data.minDays,
    maxDays: data.maxDays,
    contracts: data.contracts,
    overdue: data.overdue
  }))
}

function calculateTypeTimelineData(contracts: any[]): any[] {
  const typeData: { [key: string]: any } = {}

  contracts.forEach(contract => {
    // In a real implementation, contract type would be stored in the database
    const type = 'Поставщик' // Default type for demo
    
    if (!typeData[type]) {
      typeData[type] = {
        type,
        avgDays: 0,
        minDays: Infinity,
        maxDays: 0,
        count: 0,
        overdue: 0,
        totalTime: 0,
        completedContracts: 0
      }
    }

    typeData[type].count++

    if (contract.status === 'APPROVED') {
      const approvalTime = calculateContractApprovalTime(contract)
      if (approvalTime > 0) {
        typeData[type].totalTime += approvalTime
        typeData[type].completedContracts++
        typeData[type].minDays = Math.min(typeData[type].minDays, approvalTime)
        typeData[type].maxDays = Math.max(typeData[type].maxDays, approvalTime)
      }
    }

    // Check for overdue approvals
    const now = new Date()
    const hasOverdue = contract.approvals.some((a: any) => 
      a.status === 'PENDING' && a.dueDate && new Date(a.dueDate) < now
    )
    if (hasOverdue) {
      typeData[type].overdue++
    }
  })

  return Object.values(typeData).map((data: any) => ({
    type: data.type,
    avgDays: data.completedContracts > 0 ? Math.round((data.totalTime / data.completedContracts) * 10) / 10 : 0,
    minDays: data.minDays === Infinity ? 0 : data.minDays,
    maxDays: data.maxDays,
    count: data.count,
    overdue: data.overdue
  }))
}

function calculateDepartmentTimelineData(contracts: any[]): any[] {
  const departmentData: { [key: string]: any } = {}

  contracts.forEach(contract => {
    const department = contract.initiator.role || 'Unknown'
    
    if (!departmentData[department]) {
      departmentData[department] = {
        department,
        avgDays: 0,
        count: 0,
        overdue: 0,
        totalTime: 0,
        completedContracts: 0
      }
    }

    departmentData[department].count++

    if (contract.status === 'APPROVED') {
      const approvalTime = calculateContractApprovalTime(contract)
      if (approvalTime > 0) {
        departmentData[department].totalTime += approvalTime
        departmentData[department].completedContracts++
      }
    }

    // Check for overdue approvals
    const now = new Date()
    const hasOverdue = contract.approvals.some((a: any) => 
      a.status === 'PENDING' && a.dueDate && new Date(a.dueDate) < now
    )
    if (hasOverdue) {
      departmentData[department].overdue++
    }
  })

  return Object.values(departmentData).map((data: any) => ({
    department: data.department,
    avgDays: data.completedContracts > 0 ? Math.round((data.totalTime / data.completedContracts) * 10) / 10 : 0,
    count: data.count,
    overdue: data.overdue
  }))
}

function calculateBottlenecks(contracts: any[]): any[] {
  const bottlenecks: { [key: string]: any } = {}

  contracts.forEach(contract => {
    contract.approvals.forEach((approval: any) => {
      const step = `Шаг ${approval.workflowStep}` // In real implementation, this would be more descriptive
      
      if (!bottlenecks[step]) {
        bottlenecks[step] = {
          step,
          avgDelay: 0,
          contracts: 0,
          totalDelay: 0,
          maxDelay: 0
        }
      }

      bottlenecks[step].contracts++

      if (approval.status === 'APPROVED' && approval.dueDate) {
        const dueDate = new Date(approval.dueDate)
        const completedDate = new Date(approval.updatedAt)
        const delay = Math.max(0, (completedDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        
        bottlenecks[step].totalDelay += delay
        bottlenecks[step].maxDelay = Math.max(bottlenecks[step].maxDelay, delay)
      }
    })
  })

  return Object.values(bottlenecks).map((bottleneck: any) => ({
    step: bottleneck.step,
    avgDelay: bottleneck.contracts > 0 ? Math.round(bottleneck.totalDelay / bottleneck.contracts * 10) / 10 : 0,
    contracts: bottleneck.contracts,
    severity: getSeverityLevel(bottleneck.avgDelay)
  }))
}

function getSeverityLevel(avgDelay: number): string {
  if (avgDelay > 2) return 'high'
  if (avgDelay > 1) return 'medium'
  return 'low'
}

function calculateContractApprovalTime(contract: any): number {
  const approvals = contract.approvals.filter((a: any) => a.status === 'APPROVED')
  if (approvals.length === 0) return 0

  const totalTime = approvals.reduce((sum: number, approval: any) => {
    const created = new Date(approval.createdAt)
    const updated = new Date(approval.updatedAt)
    return sum + (updated.getTime() - created.getTime())
  }, 0)

  return Math.round(totalTime / approvals.length / (1000 * 60 * 60 * 24) * 10) / 10
}

function calculateAvgApprovalTime(contracts: any[]): number {
  const approvedContracts = contracts.filter(c => c.status === 'APPROVED')
  if (approvedContracts.length === 0) return 0

  const totalTime = approvedContracts.reduce((sum, contract) => {
    return sum + calculateContractApprovalTime(contract)
  }, 0)

  return Math.round(totalTime / approvedContracts.length * 10) / 10
}

function calculateMinApprovalTime(contracts: any[]): number {
  const approvedContracts = contracts.filter(c => c.status === 'APPROVED')
  if (approvedContracts.length === 0) return 0

  const times = approvedContracts.map(c => calculateContractApprovalTime(c))
  return Math.min(...times.filter(t => t > 0))
}

function calculateMaxApprovalTime(contracts: any[]): number {
  const approvedContracts = contracts.filter(c => c.status === 'APPROVED')
  if (approvedContracts.length === 0) return 0

  const times = approvedContracts.map(c => calculateContractApprovalTime(c))
  return Math.max(...times)
}

function calculateOverdueCount(contracts: any[]): number {
  const now = new Date()
  return contracts.filter(contract => 
    contract.approvals.some((a: any) => 
      a.status === 'PENDING' && a.dueDate && new Date(a.dueDate) < now
    )
  ).length
}