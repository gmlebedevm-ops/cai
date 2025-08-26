import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { WorkflowStatus } from '@/types/workflow'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const isDefault = searchParams.get('isDefault')

    let whereClause: any = {}

    if (status && status !== 'all') {
      whereClause.status = status
    }

    if (isDefault !== null) {
      whereClause.isDefault = isDefault === 'true'
    }

    const workflows = await db.workflow.findMany({
      where: whereClause,
      include: {
        steps: {
          orderBy: {
            order: 'asc'
          },
          include: {
            roleData: true,
            parallelRoles: {
              include: {
                role: true
              }
            }
          }
        },
        contracts: {
          select: {
            id: true,
            number: true,
            status: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(workflows)
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, status = WorkflowStatus.DRAFT, conditions, steps = [] } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Workflow name is required' },
        { status: 400 }
      )
    }

    // Если это первый workflow, делаем его по умолчанию
    const existingWorkflows = await db.workflow.count()
    const isDefault = existingWorkflows === 0

    const workflow = await db.workflow.create({
      data: {
        name,
        description,
        status,
        conditions,
        isDefault,
        steps: {
          create: await Promise.all(steps.map(async (step: any, index: number) => {
            // Создаем базовый шаг
            const stepData: any = {
              name: step.name,
              type: step.type,
              order: index + 1,
              description: step.description,
              conditions: step.conditions,
              isRequired: step.isRequired ?? true,
              dueDays: step.dueDays,
              // Старая система ролей (для обратной совместимости)
              role: step.role,
              userId: step.userId,
              // Новая система ролей
              roleId: step.roleId
            }

            return stepData
          }))
        }
      },
      include: {
        steps: {
          orderBy: {
            order: 'asc'
          },
          include: {
            roleData: true,
            parallelRoles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    })

    // Теперь создаем связи для параллельного согласования
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const workflowStep = workflow.steps[i]

      // Если есть параллельные роли, создаем связи
      if (step.parallelRoleIds && step.parallelRoleIds.length > 0) {
        await db.workflowStepRole.createMany({
          data: step.parallelRoleIds.map((roleId: string) => ({
            stepId: workflowStep.id,
            roleId
          }))
        })
      }
    }

    // Получаем обновленный workflow с связями для параллельного согласования
    const updatedWorkflow = await db.workflow.findUnique({
      where: { id: workflow.id },
      include: {
        steps: {
          orderBy: {
            order: 'asc'
          },
          include: {
            roleData: true,
            parallelRoles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedWorkflow, { status: 201 })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
}