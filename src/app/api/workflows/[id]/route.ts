import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflow = await db.workflow.findUnique({
      where: { id: params.id },
      include: {
        steps: {
          orderBy: {
            order: 'asc'
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, status, conditions, steps } = body

    const existingWorkflow = await db.workflow.findUnique({
      where: { id: params.id }
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
      where: { id: params.id },
      data: updateData,
      include: {
        steps: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    // Если предоставлены шаги, обновляем их
    if (steps) {
      // Удаляем существующие шаги
      await db.workflowStep.deleteMany({
        where: { workflowId: params.id }
      })

      // Создаем новые шаги
      await db.workflowStep.createMany({
        data: steps.map((step: any, index: number) => ({
          workflowId: params.id,
          name: step.name,
          type: step.type,
          order: index + 1,
          description: step.description,
          conditions: step.conditions,
          isRequired: step.isRequired ?? true,
          dueDays: step.dueDays,
          role: step.role,
          userId: step.userId
        }))
      })
    }

    // Получаем обновленный workflow с шагами
    const updatedWorkflow = await db.workflow.findUnique({
      where: { id: params.id },
      include: {
        steps: {
          orderBy: {
            order: 'asc'
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
  { params }: { params: { id: string } }
) {
  try {
    const existingWorkflow = await db.workflow.findUnique({
      where: { id: params.id },
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

    await db.workflow.delete({
      where: { id: params.id }
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