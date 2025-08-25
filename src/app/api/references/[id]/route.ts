import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reference = await db.reference.findUnique({
      where: { id: params.id },
      include: {
        children: {
          orderBy: {
            sortOrder: 'asc'
          }
        },
        parent: true
      }
    })

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(reference)
  } catch (error) {
    console.error('Error fetching reference:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reference' },
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
    const { type, code, name, description, value, isActive, sortOrder, metadata, parentCode } = body

    const existingReference = await db.reference.findUnique({
      where: { id: params.id }
    })

    if (!existingReference) {
      return NextResponse.json(
        { error: 'Reference not found' },
        { status: 404 }
      )
    }

    // Проверяем уникальность кода, если он меняется
    if (code && code !== existingReference.code) {
      const codeExists = await db.reference.findUnique({
        where: { code }
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Reference with this code already exists' },
          { status: 400 }
        )
      }
    }

    // Если указан parentCode, проверяем его существование
    if (parentCode) {
      const parentReference = await db.reference.findUnique({
        where: { code: parentCode }
      })

      if (!parentReference) {
        return NextResponse.json(
          { error: 'Parent reference not found' },
          { status: 400 }
        )
      }

      // Проверяем, что не создается циклическая зависимость
      if (parentCode === existingReference.code) {
        return NextResponse.json(
          { error: 'Reference cannot be its own parent' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (type !== undefined) updateData.type = type
    if (code !== undefined) updateData.code = code
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (value !== undefined) updateData.value = value
    if (isActive !== undefined) updateData.isActive = isActive
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder
    if (metadata !== undefined) updateData.metadata = metadata
    if (parentCode !== undefined) updateData.parentCode = parentCode || null

    const reference = await db.reference.update({
      where: { id: params.id },
      data: updateData,
      include: {
        children: {
          orderBy: {
            sortOrder: 'asc'
          }
        },
        parent: true
      }
    })

    return NextResponse.json(reference)
  } catch (error) {
    console.error('Error updating reference:', error)
    return NextResponse.json(
      { error: 'Failed to update reference' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingReference = await db.reference.findUnique({
      where: { id: params.id },
      include: {
        children: true
      }
    })

    if (!existingReference) {
      return NextResponse.json(
        { error: 'Reference not found' },
        { status: 404 }
      )
    }

    // Проверяем, есть ли дочерние элементы
    if (existingReference.children && existingReference.children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete reference that has children' },
        { status: 400 }
      )
    }

    await db.reference.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Reference deleted successfully' })
  } catch (error) {
    console.error('Error deleting reference:', error)
    return NextResponse.json(
      { error: 'Failed to delete reference' },
      { status: 500 }
    )
  }
}