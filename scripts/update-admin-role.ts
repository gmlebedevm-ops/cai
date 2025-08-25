import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateAdminRole() {
  try {
    // Находим администратора
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    })

    if (!admin) {
      console.log('Администратор не найден')
      return
    }

    console.log('Текущие данные администратора:', admin)

    // Обновляем роль
    const updatedAdmin = await prisma.user.update({
      where: { email: 'admin@test.com' },
      data: {
        role: 'ADMINISTRATOR'
      }
    })

    console.log('Роль администратора успешно обновлена:', updatedAdmin)
  } catch (error) {
    console.error('Ошибка при обновлении роли администратора:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateAdminRole()