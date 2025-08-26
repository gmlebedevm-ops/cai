import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    
    const offset = (page - 1) * limit

    // Формируем условие WHERE
    let where: any = {}
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (role && role !== 'all') {
      where.roleId = role
    }

    // Получаем пользователей с пагинацией
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true, // Старое поле для обратной совместимости
          roleId: true, // Новое поле
          userRole: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          createdAt: true,
          updatedAt: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true
            }
          },
          // Считаем связанные сущности для статистики
          _count: {
            select: {
              contracts: true,
              comments: true,
              approvals: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      db.user.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, roleId, departmentId } = await request.json()

    if (!email || !roleId) {
      return NextResponse.json(
        { error: 'Email и роль обязательны' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
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

    // Создаем нового пользователя
    const newUser = await db.user.create({
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
        createdAt: true,
        updatedAt: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}