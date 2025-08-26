import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const workflow = await db.workflow.findUnique({
      where: { id },
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
            status: true,
            createdAt: true
          }
        }
      }
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Error fetching workflow:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, status, conditions, steps } = body

    const existingWorkflow = await db.workflow.findUnique({
      where: { id }
    })

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Обновляем основной workflow
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (conditions !== undefined) updateData.conditions = conditions

    const workflow = await db.workflow.update({
      where: { id },
      data: updateData,
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

    // Если предоставлены шаги, обновляем их
    if (steps) {
      // Удаляем существующие шаги и связи для параллельного согласования
      await db.workflowStepRole.deleteMany({
        where: {
          step: {
            workflowId: id
          }
        }
      })
      
      await db.workflowStep.deleteMany({
        where: { workflowId: id }
      })

      // Создаем новые шаги
      const createdSteps = await db.workflowStep.createMany({
        data: steps.map((step: any, index: number) => ({
          workflowId: id,
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
        }))
      })

      // Получаем созданные шаги для создания связей
      const workflowSteps = await db.workflowStep.findMany({
        where: { workflowId: id },
        orderBy: { order: 'asc' }
      })

      // Создаем связи для параллельного согласования
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        const workflowStep = workflowSteps[i]

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
    }

    // Получаем обновленный workflow с шагами и связями
    const updatedWorkflow = await db.workflow.findUnique({
      where: { id },
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

    return NextResponse.json(updatedWorkflow)
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existingWorkflow = await db.workflow.findUnique({
      where: { id },
      include: {
        contracts: true
      }
    })

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Проверяем, используется ли workflow в договорах
    if (existingWorkflow.contracts && existingWorkflow.contracts.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete workflow that is used by contracts' },
        { status: 400 }
      )
    }

    // Удаляем связи для параллельного согласования
    await db.workflowStepRole.deleteMany({
      where: {
        step: {
          workflowId: id
        }
      }
    })

    // Удаляем шаги
    await db.workflowStep.deleteMany({
      where: { workflowId: id }
    })

    // Удаляем workflow
    await db.workflow.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Workflow deleted successfully' })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}