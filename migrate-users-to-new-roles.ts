import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Начинаем миграцию пользователей на новую систему ролей...')

  try {
    // Получаем всех пользователей и новые роли
    const users = await prisma.user.findMany()
    const roles = await prisma.role.findMany()

    console.log(`📋 Найдено ${users.length} пользователей и ${roles.length} ролей`)

    // Маппинг старых ролей на новые
    const roleMapping: Record<string, string> = {
      'INITIATOR': 'Инициатор',
      'INITIATOR_MANAGER': 'Менеджер инициаторов',
      'DEPARTMENT_HEAD': 'Руководитель отдела',
      'CHIEF_LAWYER': 'Главный юрист',
      'GENERAL_DIRECTOR': 'Генеральный директор',
      'OFFICE_MANAGER': 'Офис-менеджер',
      'ADMINISTRATOR': 'Администратор'
    }

    let updatedCount = 0

    // Обновляем каждого пользователя
    for (const user of users) {
      const newRoleName = roleMapping[user.role]
      
      if (newRoleName) {
        const newRole = roles.find(role => role.name === newRoleName)
        
        if (newRole) {
          await prisma.user.update({
            where: { id: user.id },
            data: { roleId: newRole.id }
          })
          console.log(`✅ Пользователь ${user.email} (${user.role}) -> ${newRoleName} (ID: ${newRole.id})`)
          updatedCount++
        } else {
          console.log(`⚠️ Не найдена роль "${newRoleName}" для пользователя ${user.email}`)
        }
      } else {
        console.log(`⚠️ Неизвестная роль "${user.role}" для пользователя ${user.email}`)
      }
    }

    console.log(`\n🎉 Миграция завершена! Обновлено ${updatedCount} пользователей`)

    // Выводим итоговую статистику
    const updatedUsers = await prisma.user.findMany({
      include: {
        userRole: {
          select: {
            name: true,
            description: true
          }
        }
      }
    })

    console.log('\n📊 Итоговая статистика:')
    updatedUsers.forEach(user => {
      console.log(`- ${user.email}: ${user.role} -> ${user.userRole?.name || 'Без роли'}`)
    })

  } catch (error) {
    console.error('❌ Ошибка при миграции пользователей:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })