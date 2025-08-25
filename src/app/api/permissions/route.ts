import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    let where: any = {}
    if (type) {
      where.type = type
    }

    const permissions = await db.permission.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    // Группируем разрешения по типам
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.type]) {
        acc[permission.type] = []
      }
      acc[permission.type].push(permission)
      return acc
    }, {} as Record<string, typeof permissions>)

    return NextResponse.json({
      permissions,
      groupedPermissions,
      total: permissions.length
    })
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, name, description } = await request.json()

    if (!type || !name) {
      return NextResponse.json(
        { error: 'Тип и название разрешения обязательны' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли разрешение с таким названием
    const existingPermission = await db.permission.findFirst({
      where: {
        AND: [
          { type },
          { name }
        ]
      }
    })

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Разрешение с таким названием и типом уже существует' },
        { status: 400 }
      )
    }

    // Создаем новое разрешение
    const newPermission = await db.permission.create({
      data: {
        type,
        name,
        description: description || null
      }
    })

    return NextResponse.json(newPermission, { status: 201 })
  } catch (error) {
    console.error('Error creating permission:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}