import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roleId: true,
        userRole: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contracts: true,
            comments: true,
            approvals: true,
            documentVersions: true,
            notifications: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
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
    const { email, name, roleId, departmentId } = await request.json()

    if (!email || !roleId) {
      return NextResponse.json(
        { error: 'Email и роль обязательны' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли пользователь
    const existingUser = await db.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Проверяем, не занят ли email другим пользователем
    if (email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Пользователь с таким email уже существует' },
          { status: 400 }
        )
      }
    }

    // Проверяем, существует ли роль
    const role = await db.role.findUnique({
      where: { id: roleId }
    })

    if (!role) {
      return NextResponse.json(
        { error: 'Указанная роль не существует' },
        { status: 400 }
      )
    }

    // Обновляем пользователя
    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: {
        email,
        name: name || null,
        roleId,
        departmentId: departmentId || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roleId: true,
        userRole: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
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
    // Проверяем, существует ли пользователь
    const existingUser = await db.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Удаляем пользователя
    await db.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Пользователь успешно удален' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}