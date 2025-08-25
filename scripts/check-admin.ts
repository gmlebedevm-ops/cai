import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    })

    if (admin) {
      console.log('Администратор найден:')
      console.log('Email:', admin.email)
      console.log('Имя:', admin.name)
      console.log('Роль:', admin.role)
      console.log('Создан:', admin.createdAt)
      console.log('Обновлен:', admin.updatedAt)
    } else {
      console.log('Администратор не найден')
    }
  } catch (error) {
    console.error('Ошибка при проверке администратора:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()