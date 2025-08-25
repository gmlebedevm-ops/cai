import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Получаем все отделы
    const departments = await db.department.findMany({
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ]
    })

    // Строим иерархическую структуру
    const buildHierarchy = (departments: any[], parentId: string | null = null): any[] => {
      return departments
        .filter(dept => dept.parentId === parentId)
        .map(dept => ({
          id: dept.id,
          department: dept.name,
          parent: departments.find(d => d.id === dept.parentId)?.name || null,
          children: buildHierarchy(departments, dept.id)
        }))
    }

    // Находим корневой узел (уровень 0)
    const rootDepartments = departments.filter(dept => dept.level === 0)
    
    let hierarchy = []
    if (rootDepartments.length > 0) {
      const root = rootDepartments[0]
      hierarchy = [{
        id: root.id,
        department: root.name,
        parent: null,
        children: buildHierarchy(departments, root.id)
      }]
    }

    return NextResponse.json({
      success: true,
      hierarchy: hierarchy[0] || null,
      flatStructure: departments
    })
  } catch (error) {
    console.error('Error fetching company hierarchy:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка при загрузке иерархии компании' 
      },
      { status: 500 }
    )
  }
}