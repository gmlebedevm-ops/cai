import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAllUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { email: 'asc' }
    })

    console.log('Все пользователи в системе:')
    console.log('=====================================')
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`)
      console.log(`   Имя: ${user.name || 'Не указано'}`)
      console.log(`   Роль: ${user.role}`)
      console.log(`   Создан: ${user.createdAt}`)
      console.log('---')
    })
    
    console.log(`Всего пользователей: ${users.length}`)
  } catch (error) {
    console.error('Ошибка при проверке пользователей:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllUsers()