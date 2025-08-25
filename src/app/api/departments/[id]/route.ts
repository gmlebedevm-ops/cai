import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const department = await db.department.findUnique({
      where: { id: params.id },
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

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const { name, code, description, parentId, isActive } = await request.json();

    // Проверка существования отдела
    const existingDepartment = await db.department.findUnique({
      where: { id: params.id }
    });

    if (!existingDepartment) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Проверка уникальности кода, если он меняется
    if (code && code !== existingDepartment.code) {
      const codeExists = await db.department.findUnique({
        where: { code }
      });

      if (codeExists) {
        return NextResponse.json({ error: 'Department with this code already exists' }, { status: 400 });
      }
    }

    // Проверка существования родительского отдела, если указан
    if (parentId) {
      const parentDepartment = await db.department.findUnique({
        where: { id: parentId }
      });

      if (!parentDepartment) {
        return NextResponse.json({ error: 'Parent department not found' }, { status: 400 });
      }

      // Проверка на циклическую зависимость
      if (parentId === params.id) {
        return NextResponse.json({ error: 'Department cannot be its own parent' }, { status: 400 });
      }
    }

    const department = await db.department.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId }),
        ...(isActive !== undefined && { isActive })
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

    return NextResponse.json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    // Проверка существования отдела
    const department = await db.department.findUnique({
      where: { id: params.id },
      include: {
        users: true,
        children: true
      }
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Проверка на наличие пользователей
    if (department.users.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete department with assigned users' 
      }, { status: 400 });
    }

    // Проверка на наличие дочерних отделов
    if (department.children.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete department with subdepartments' 
      }, { status: 400 });
    }

    await db.department.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}