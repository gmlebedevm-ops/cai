import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = await db.role.findUnique({
      where: { id: params.id },
      include: {
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
      }
    })

    if (!role) {
      return NextResponse.json(
        { error: 'Роль не найдена' },
        { status: 404 }
      )
    }

    return NextResponse.json(role)
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, permissionIds, isActive } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Название роли обязательно' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли роль
    const existingRole = await db.role.findUnique({
      where: { id: params.id }
    })

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Роль не найдена' },
        { status: 404 }
      )
    }

    // Проверяем, не занято ли название другой ролью
    if (name !== existingRole.name) {
      const nameExists = await db.role.findUnique({
        where: { name }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Роль с таким названием уже существует' },
          { status: 400 }
        )
      }
    }

    // Обновляем роль
    const updatedRole = await db.role.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        isActive: isActive !== undefined ? isActive : existingRole.isActive
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    // Обновляем разрешения, если они переданы
    if (permissionIds !== undefined) {
      // Удаляем старые разрешения
      await db.rolePermission.deleteMany({
        where: { roleId: params.id }
      })

      // Добавляем новые разрешения
      if (permissionIds.length > 0) {
        await db.rolePermission.createMany({
          data: permissionIds.map((permissionId: string) => ({
            roleId: params.id,
            permissionId
          }))
        })
      }

      // Получаем обновленную роль с разрешениями
      const finalRole = await db.role.findUnique({
        where: { id: params.id },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      })

      return NextResponse.json(finalRole)
    }

    return NextResponse.json(updatedRole)
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем, существует ли роль
    const existingRole = await db.role.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Роль не найдена' },
        { status: 404 }
      )
    }

    // Проверяем, есть ли пользователи с этой ролью
    if (existingRole._count.users > 0) {
      return NextResponse.json(
        { error: 'Нельзя удалить роль, так как есть пользователи с этой ролью' },
        { status: 400 }
      )
    }

    // Удаляем разрешения роли
    await db.rolePermission.deleteMany({
      where: { roleId: params.id }
    })

    // Удаляем роль
    await db.role.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Роль успешно удалена' })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}