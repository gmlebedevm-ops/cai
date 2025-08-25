import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractId, workflowId } = body

    if (!contractId || !workflowId) {
      return NextResponse.json(
        { error: 'Missing required fields: contractId and workflowId' },
        { status: 400 }
      )
    }

    // Get contract with workflow
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        },
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

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    if (!contract.workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Update contract status to IN_REVIEW
    await db.contract.update({
      where: { id: contractId },
      data: { status: 'IN_REVIEW' }
    })

    // Create approvals for each workflow step
    const approvals = []
    for (const step of contract.workflow.steps) {
      // Skip notification steps, only create approvals for approval/review steps
      if (step.type === 'APPROVAL' || step.type === 'REVIEW') {
        // Find users for this step based on role or specific user
        let approvers = []
        
        if (step.userId) {
          // Specific user assigned
          const user = await db.user.findUnique({
            where: { id: step.userId }
          })
          if (user) approvers.push(user)
        } else if (step.role) {
          // Users with specific role
          approvers = await db.user.findMany({
            where: { role: step.role }
          })
        }

        // Create approval for each approver
        for (const approver of approvers) {
          const dueDate = step.dueDays ? 
            new Date(Date.now() + step.dueDays * 24 * 60 * 60 * 1000) : 
            null

          const approval = await db.approval.create({
            data: {
              contractId,
              approverId: approver.id,
              status: 'PENDING',
              stepNumber: step.order,
              workflowStepId: step.id,
              dueDate
            },
            include: {
              approver: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  role: true
                }
              },
              workflowStep: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  order: true
                }
              }
            }
          })

          approvals.push(approval)

          // Create notification for approver
          await db.notification.create({
            data: {
              type: 'APPROVAL_REQUESTED',
              title: 'Новый договор на согласовании',
              message: `Договор ${contract.number} от ${contract.counterparty} требует вашего согласования`,
              userId: approver.id,
              contractId,
              actionUrl: `/contracts/${contractId}`
            }
          })
        }
      }
    }

    // Create contract history entry
    await db.contractHistory.create({
      data: {
        action: 'APPROVAL_PROCESS_STARTED',
        details: JSON.stringify({
          workflowId,
          workflowName: contract.workflow.name,
          stepsCount: contract.workflow.steps.length,
          approvalsCreated: approvals.length
        }),
        contractId
      }
    })

    // Create notification for contract initiator
    await db.notification.create({
      data: {
        type: 'CONTRACT_UPDATED',
        title: 'Договор отправлен на согласование',
        message: `Ваш договор ${contract.number} был отправлен на согласование по маршруту "${contract.workflow.name}"`,
        userId: contract.initiatorId,
        contractId,
        actionUrl: `/contracts/${contractId}`
      }
    })

    return NextResponse.json({
      message: 'Approval process started successfully',
      contractId,
      workflowId,
      approvalsCreated: approvals.length,
      approvals
    })

  } catch (error) {
    console.error('Error starting approval process:', error)
    return NextResponse.json(
      { error: 'Failed to start approval process' },
      { status: 500 }
    )
  }
}