import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ReferenceType } from '@/types/workflow'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')
    const parentCode = searchParams.get('parentCode')
    const search = searchParams.get('search')

    let whereClause: any = {}

    if (type && type !== 'all') {
      whereClause.type = type
    }

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    if (parentCode !== null) {
      whereClause.parentCode = parentCode || null
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const references = await db.reference.findMany({
      where: whereClause,
      include: {
        children: {
          orderBy: {
            sortOrder: 'asc'
          }
        },
        parent: true
      },
      orderBy: [
        { type: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(references)
  } catch (error) {
    console.error('Error fetching references:', error)
    return NextResponse.json(
      { error: 'Failed to fetch references' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, code, name, description, value, isActive = true, sortOrder = 0, metadata, parentCode } = body

    if (!type || !code || !name) {
      return NextResponse.json(
        { error: 'Type, code, and name are required' },
        { status: 400 }
      )
    }

    // Проверяем уникальность кода
    const existingReference = await db.reference.findUnique({
      where: { code }
    })

    if (existingReference) {
      return NextResponse.json(
        { error: 'Reference with this code already exists' },
        { status: 400 }
      )
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
    }

    const reference = await db.reference.create({
      data: {
        type,
        code,
        name,
        description,
        value,
        isActive,
        sortOrder,
        metadata,
        parentCode
      },
      include: {
        children: true,
        parent: true
      }
    })

    return NextResponse.json(reference, { status: 201 })
  } catch (error) {
    console.error('Error creating reference:', error)
    return NextResponse.json(
      { error: 'Failed to create reference' },
      { status: 500 }
    )
  }
}