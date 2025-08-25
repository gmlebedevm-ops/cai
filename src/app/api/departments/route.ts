import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const departments = await db.department.findMany({
      include: {
        parent: true,
        children: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            users: true,
            children: true
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { path: 'asc' }
      ]
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/departments called')
    
    const { name, description, parentId } = await request.json();
    console.log('Received data:', { name, description, parentId })

    if (!name) {
      console.log('Missing required fields:', { name })
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Проверка существования родительского отдела, если указан
    let level = 0;
    let path = name;
    
    if (parentId) {
      const parentDepartment = await db.department.findUnique({
        where: { id: parentId }
      });

      if (!parentDepartment) {
        console.log('Parent department not found:', parentId)
        return NextResponse.json({ error: 'Parent department not found' }, { status: 400 });
      }
      
      level = parentDepartment.level + 1;
      path = `${parentDepartment.path}/${name}`;
    }

    console.log('Creating department...')
    const department = await db.department.create({
      data: {
        name,
        description,
        parentId,
        level,
        path,
        childrenCount: 0
      },
      include: {
        parent: true,
        children: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Обновляем childrenCount у родителя
    if (parentId) {
      await db.department.update({
        where: { id: parentId },
        data: {
          childrenCount: {
            increment: 1
          }
        }
      });
    }

    console.log('Department created:', department)

    return NextResponse.json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}