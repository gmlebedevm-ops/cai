import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { departmentId } = await request.json();

    // Проверка существования пользователя
    const user = await db.user.findUnique({
      where: { id: params.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Если указан departmentId, проверяем существование отдела
    if (departmentId) {
      const department = await db.department.findUnique({
        where: { id: departmentId }
      });

      if (!department) {
        return NextResponse.json({ error: 'Department not found' }, { status: 404 });
      }
    }

    // Обновление отдела пользователя
    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: {
        departmentId: departmentId || null
      },
      include: {
        department: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user department:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}