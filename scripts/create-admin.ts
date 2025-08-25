import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Проверяем, существует ли уже администратор
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    })

    if (existingAdmin) {
      console.log('Администратор уже существует:', existingAdmin)
      return
    }

    // Создаем администратора
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        name: 'Администратор Системы',
        role: 'GENERAL_DIRECTOR', // Максимальные права
      }
    })

    console.log('Администратор успешно создан:', admin)
    console.log('Данные для входа:')
    console.log('Email: admin@test.com')
    console.log('Пароль: password123')
  } catch (error) {
    console.error('Ошибка при создании администратора:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()