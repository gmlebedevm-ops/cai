import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const includePermissions = searchParams.get('includePermissions') === 'true'
    
    const offset = (page - 1) * limit

    const [roles, total] = await Promise.all([
      db.role.findMany({
        include: includePermissions ? {
          permissions: {
            include: {
              permission: true
            }
          },
          _count: {
            select: {
              users: true
            }
          }
        } : {
          _count: {
            select: {
              users: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit
      }),
      db.role.count()
    ])

    return NextResponse.json({
      roles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, permissionIds } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Название роли обязательно' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли роль с таким названием
    const existingRole = await db.role.findUnique({
      where: { name }
    })

    if (existingRole) {
      return NextResponse.json(
        { error: 'Роль с таким названием уже существует' },
        { status: 400 }
      )
    }

    // Создаем новую роль
    const newRole = await db.role.create({
      data: {
        name,
        description: description || null
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    // Если указаны разрешения, добавляем их к роли
    if (permissionIds && permissionIds.length > 0) {
      await db.rolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({
          roleId: newRole.id,
          permissionId
        }))
      })

      // Получаем обновленную роль с разрешениями
      const updatedRole = await db.role.findUnique({
        where: { id: newRole.id },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      })

      return NextResponse.json(updatedRole, { status: 201 })
    }

    return NextResponse.json(newRole, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}