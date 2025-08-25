import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '6months'
    const sortBy = searchParams.get('sortBy') || 'efficiency'

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

    // Fetch users for department analysis
    const users = await db.user.findMany({
      include: {
        contracts: true,
        approvals: true
      }
    })

    // Calculate overview statistics
    const overview = calculateOverviewStats(contracts, users)

    // Calculate detailed department statistics
    const departmentDetails = calculateDepartmentDetails(contracts, users)

    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(departmentDetails)

    // Calculate workload distribution
    const workloadDistribution = calculateWorkloadDistribution(users, contracts)

    return NextResponse.json({
      overview,
      departmentDetails,
      performanceMetrics,
      workloadDistribution
    })

  } catch (error) {
    console.error('Error fetching statistics data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics data' },
      { status: 500 }
    )
  }
}

function calculateOverviewStats(contracts: any[], users: any[]): any {
  const departments = [...new Set(users.map(u => u.role))].filter(Boolean)
  
  const departmentStats = departments.map(dept => {
    const deptUsers = users.filter(u => u.role === dept)
    const deptContracts = contracts.filter(c => c.initiator.role === dept)
    
    const approved = deptContracts.filter(c => c.status === 'APPROVED').length
    const efficiency = deptContracts.length > 0 ? (approved / deptContracts.length) * 100 : 0
    
    return {
      name: dept,
      efficiency: Math.round(efficiency * 10) / 10,
      contracts: deptContracts.length
    }
  })

  const bestPerforming = departmentStats.reduce((best, current) => 
    current.efficiency > best.efficiency ? current : best
  , departmentStats[0])

  const worstPerforming = departmentStats.reduce((worst, current) => 
    current.efficiency < worst.efficiency ? current : worst
  , departmentStats[0])

  const avgEfficiency = departmentStats.length > 0 
    ? Math.round((departmentStats.reduce((sum, dept) => sum + dept.efficiency, 0) / departmentStats.length) * 10) / 10
    : 0

  return {
    totalDepartments: departments.length,
    totalContracts: contracts.length,
    avgEfficiency,
    bestPerformingDept: bestPerforming?.name || 'N/A',
    worstPerformingDept: worstPerforming?.name || 'N/A'
  }
}

function calculateDepartmentDetails(contracts: any[], users: any[]): any[] {
  const departments = [...new Set(users.map(u => u.role))].filter(Boolean)
  
  return departments.map(dept => {
    const deptUsers = users.filter(u => u.role === dept)
    const deptContracts = contracts.filter(c => c.initiator.role === dept)
    
    const approved = deptContracts.filter(c => c.status === 'APPROVED').length
    const rejected = deptContracts.filter(c => c.status === 'REJECTED').length
    const pending = deptContracts.filter(c => c.status === 'IN_REVIEW').length
    
    // Calculate average approval time
    const approvedContracts = deptContracts.filter(c => c.status === 'APPROVED')
    const avgApprovalTime = approvedContracts.length > 0 
      ? calculateDepartmentAvgApprovalTime(approvedContracts)
      : 0
    
    // Calculate overdue rate
    const overdueContracts = deptContracts.filter(contract => 
      contract.approvals.some((a: any) => {
        if (a.status !== 'PENDING' || !a.dueDate) return false
        return new Date(a.dueDate) < new Date()
      })
    ).length
    
    const overdueRate = deptContracts.length > 0 
      ? Math.round((overdueContracts / deptContracts.length) * 100 * 10) / 10
      : 0
    
    // Calculate efficiency
    const efficiency = deptContracts.length > 0 
      ? Math.round((approved / deptContracts.length) * 100 * 10) / 10
      : 0
    
    // Determine workload level
    const pendingApprovals = deptContracts.reduce((sum, contract) => 
      sum + contract.approvals.filter((a: any) => a.status === 'PENDING').length, 0
    )
    
    const workload = pendingApprovals > 10 ? 'Высокая' : 
                    pendingApprovals > 5 ? 'Средняя' : 'Низкая'
    
    // Determine trend (simplified)
    const trend = efficiency > 85 ? 'up' : efficiency < 70 ? 'down' : 'stable'
    
    // Get top users
    const topUsers = deptUsers
      .sort((a, b) => b.approvals.length - a.approvals.length)
      .slice(0, 2)
      .map(u => u.name || 'Unknown')
    
    // Get contract types (simplified)
    const contractTypes = ['Поставщик', 'Клиент', 'Партнер'] // In real implementation, this would come from contract data
    
    return {
      name: dept,
      totalContracts: deptContracts.length,
      approved,
      rejected,
      pending,
      avgApprovalTime: Math.round(avgApprovalTime * 10) / 10,
      efficiency,
      overdueRate,
      workload,
      trend,
      topUsers,
      contractTypes
    }
  })
}

function calculateDepartmentAvgApprovalTime(contracts: any[]): number {
  const totalTime = contracts.reduce((sum, contract) => {
    const approvals = contract.approvals.filter((a: any) => a.status === 'APPROVED')
    if (approvals.length === 0) return sum
    
    const contractTime = approvals.reduce((contractSum, approval) => {
      const created = new Date(approval.createdAt)
      const updated = new Date(approval.updatedAt)
      return contractSum + (updated.getTime() - created.getTime())
    }, 0)
    
    return sum + (contractTime / approvals.length)
  }, 0)
  
  const avgTimeMs = totalTime / contracts.length
  return avgTimeMs / (1000 * 60 * 60 * 24) // Convert to days
}

function calculatePerformanceMetrics(departmentDetails: any[]): any[] {
  const metrics = []
  
  // Best efficiency
  const bestEfficiency = departmentDetails.reduce((best, current) => 
    current.efficiency > best.efficiency ? current : best
  , departmentDetails[0])
  
  metrics.push({
    metric: 'Эффективность',
    department: bestEfficiency.name,
    value: bestEfficiency.efficiency,
    unit: '%',
    trend: 'up'
  })
  
  // Fastest approval time
  const fastestDept = departmentDetails.reduce((fastest, current) => 
    current.avgApprovalTime < fastest.avgApprovalTime ? current : fastest
  , departmentDetails[0])
  
  metrics.push({
    metric: 'Скорость согласования',
    department: fastestDept.name,
    value: fastestDept.avgApprovalTime,
    unit: 'дней',
    trend: 'down'
  })
  
  // Lowest overdue rate
  const lowestOverdue = departmentDetails.reduce((lowest, current) => 
    current.overdueRate < lowest.overdueRate ? current : lowest
  , departmentDetails[0])
  
  metrics.push({
    metric: 'Минимум просрочек',
    department: lowestOverdue.name,
    value: lowestOverdue.overdueRate,
    unit: '%',
    trend: 'down'
  })
  
  // Most stable (highest efficiency with low variance)
  const mostStable = departmentDetails.reduce((stable, current) => {
    const stableScore = stable.efficiency - (stable.overdueRate * 0.5)
    const currentScore = current.efficiency - (current.overdueRate * 0.5)
    return currentScore > stableScore ? current : stable
  }, departmentDetails[0])
  
  metrics.push({
    metric: 'Стабильность',
    department: mostStable.name,
    value: mostStable.efficiency,
    unit: '%',
    trend: 'stable'
  })
  
  return metrics
}

function calculateWorkloadDistribution(users: any[], contracts: any[]): any[] {
  const departments = [...new Set(users.map(u => u.role))].filter(Boolean)
  
  return departments.map(dept => {
    const deptUsers = users.filter(u => u.role === dept)
    const deptContracts = contracts.filter(c => c.initiator.role === dept)
    
    // Current workload (pending approvals)
    const currentWorkload = deptContracts.reduce((sum, contract) => 
      sum + contract.approvals.filter((a: any) => a.status === 'PENDING').length, 0
    )
    
    // Estimated capacity (simplified calculation)
    const capacity = Math.max(5, deptUsers.length * 3)
    
    // Utilization percentage
    const utilization = Math.round((currentWorkload / capacity) * 100)
    
    return {
      department: dept,
      current: currentWorkload,
      capacity,
      utilization
    }
  })
}