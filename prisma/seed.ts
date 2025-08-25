import { PrismaClient } from '@prisma/client'
import { UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Начинаем добавление тестовых пользователей...')

  // Очищаем существующих пользователей (если нужно)
  // await prisma.user.deleteMany()

  // Создаем тестовых пользователей для каждой роли
  const users = [
    {
      email: 'initiator@test.com',
      name: 'Иван Иванов',
      role: UserRole.INITIATOR
    },
    {
      email: 'manager@test.com',
      name: 'Петр Петров',
      role: UserRole.INITIATOR_MANAGER
    },
    {
      email: 'head@test.com',
      name: 'Сергей Сергеев',
      role: UserRole.DEPARTMENT_HEAD
    },
    {
      email: 'lawyer@test.com',
      name: 'Анна Андреева',
      role: UserRole.CHIEF_LAWYER
    },
    {
      email: 'director@test.com',
      name: 'Мария Мария',
      role: UserRole.GENERAL_DIRECTOR
    },
    {
      email: 'office@test.com',
      name: 'Елена Еленова',
      role: UserRole.OFFICE_MANAGER
    }
  ]

  for (const user of users) {
    try {
      // Проверяем, существует ли пользователь
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email }
      })

      if (!existingUser) {
        await prisma.user.create({
          data: user
        })
        console.log(`✅ Создан пользователь: ${user.name} (${user.email}) - ${user.role}`)
      } else {
        console.log(`⚠️ Пользователь уже существует: ${user.email}`)
      }
    } catch (error) {
      console.error(`❌ Ошибка при создании пользователя ${user.email}:`, error)
    }
  }

  console.log('✅ Добавление тестовых пользователей завершено!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })