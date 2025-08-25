import { NextResponse } from 'next/server'

// Определение ролей и их описаний
const roles = [
  {
    value: 'INITIATOR',
    label: 'Инициатор',
    description: 'Может создавать договоры и отслеживать их статус'
  },
  {
    value: 'INITIATOR_MANAGER',
    label: 'Менеджер инициаторов',
    description: 'Управляет инициаторами и их договорами'
  },
  {
    value: 'DEPARTMENT_HEAD',
    label: 'Руководитель отдела',
    description: 'Руководит отделом, согласовывает договоры'
  },
  {
    value: 'CHIEF_LAWYER',
    label: 'Главный юрист',
    description: 'Юридическая экспертиза и согласование договоров'
  },
  {
    value: 'GENERAL_DIRECTOR',
    label: 'Генеральный директор',
    description: 'Окончательное согласование договоров'
  },
  {
    value: 'OFFICE_MANAGER',
    label: 'Офис-менеджер',
    description: 'Административная поддержка, управление документами'
  },
  {
    value: 'ADMINISTRATOR',
    label: 'Администратор',
    description: 'Полный доступ ко всем функциям системы'
  }
]

export async function GET() {
  try {
    return NextResponse.json({
      roles,
      total: roles.length
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}