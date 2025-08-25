import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // В реальном приложении здесь может быть дополнительная логика
    // Например, инвалидация токена, запись в лог и т.д.
    
    return NextResponse.json({ message: 'Выход выполнен успешно' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}