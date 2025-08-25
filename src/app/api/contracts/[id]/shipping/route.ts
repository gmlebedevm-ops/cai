import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      shippingMethod,
      shippingStatus,
      trackingNumber,
      shippingDate,
      deliveryDate,
      shippingAddress,
      shippingNotes
    } = body

    // Update contract with shipping information
    const updatedContract = await db.contract.update({
      where: { id: params.id },
      data: {
        shippingMethod: shippingMethod || null,
        shippingStatus: shippingStatus || null,
        trackingNumber: trackingNumber || null,
        shippingDate: shippingDate ? new Date(shippingDate) : null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        shippingAddress: shippingAddress || null,
        shippingNotes: shippingNotes || null,
        updatedAt: new Date()
      },
      include: {
        initiator: true,
        approvals: {
          include: {
            approver: true
          }
        },
        documents: true
      }
    })

    // Create history record
    await db.contractHistory.create({
      data: {
        contractId: params.id,
        action: 'SHIPPING_UPDATED',
        details: JSON.stringify({
          shippingMethod,
          shippingStatus,
          trackingNumber,
          shippingDate,
          deliveryDate
        })
      }
    })

    return NextResponse.json(updatedContract)
  } catch (error) {
    console.error('Error updating shipping information:', error)
    return NextResponse.json(
      { error: 'Failed to update shipping information' },
      { status: 500 }
    )
  }
}