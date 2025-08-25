import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Получаем все отделы из базы данных
    const departments = await db.department.findMany({
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      departments
    })
  } catch (error) {
    console.error('Error fetching company structure:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка при загрузке структуры компании' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company_structure } = body

    if (!company_structure || !company_structure.root_node || !company_structure.children) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Некорректная структура компании' 
        },
        { status: 400 }
      )
    }

    // Очищаем существующие отделы
    await db.department.deleteMany()

    // Функция для рекурсивного добавления отделов
    const addDepartments = async (
      nodes: any[], 
      parentId: string | null = null, 
      level: number = 0
    ) => {
      for (const node of nodes) {
        const departmentName = node.department || node
        
        // Создаем отдел
        const department = await db.department.create({
          data: {
            name: departmentName,
            parentId: parentId,
            level: level,
            path: parentId ? `${parentId}/${departmentName}` : departmentName,
            childrenCount: node.children ? node.children.length : 0
          }
        })

        // Рекурсивно добавляем дочерние отделы
        if (node.children && node.children.length > 0) {
          await addDepartments(node.children, department.id, level + 1)
        }
      }
    }

    // Добавляем корневой узел
    const rootDepartment = await db.department.create({
      data: {
        name: company_structure.root_node,
        parentId: null,
        level: 0,
        path: company_structure.root_node,
        childrenCount: company_structure.children.length
      }
    })

    // Добавляем дочерние отделы
    await addDepartments(company_structure.children, rootDepartment.id, 1)

    return NextResponse.json({
      success: true,
      message: 'Структура компании успешно сохранена'
    })
  } catch (error) {
    console.error('Error saving company structure:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка при сохранении структуры компании' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    // Очищаем все отделы
    await db.department.deleteMany()

    return NextResponse.json({
      success: true,
      message: 'Структура компании успешно удалена'
    })
  } catch (error) {
    console.error('Error deleting company structure:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка при удалении структуры компании' 
      },
      { status: 500 }
    )
  }
}