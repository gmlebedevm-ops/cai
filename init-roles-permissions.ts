import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Начинаем инициализацию ролей и разрешений...')

  try {
    // Сначала очищаем существующие данные (если нужно)
    await prisma.rolePermission.deleteMany()
    await prisma.permission.deleteMany()
    await prisma.role.deleteMany()
    console.log('✅ Существующие роли и разрешения удалены')

    // Создаем разрешения
    const permissions = await prisma.permission.createMany({
      data: [
        // Управление договорами
        { type: 'CREATE_CONTRACT', name: 'Создание договоров', description: 'Может создавать новые договоры' },
        { type: 'VIEW_CONTRACT', name: 'Просмотр договоров', description: 'Может просматривать договоры' },
        { type: 'EDIT_CONTRACT', name: 'Редактирование договоров', description: 'Может редактировать договоры' },
        { type: 'DELETE_CONTRACT', name: 'Удаление договоров', description: 'Может удалять договоры' },
        { type: 'APPROVE_CONTRACT', name: 'Согласование договоров', description: 'Может согласовывать договоры' },
        { type: 'REJECT_CONTRACT', name: 'Отклонение договоров', description: 'Может отклонять договоры' },
        
        // Управление документами
        { type: 'UPLOAD_DOCUMENT', name: 'Загрузка документов', description: 'Может загружать документы' },
        { type: 'VIEW_DOCUMENT', name: 'Просмотр документов', description: 'Может просматривать документы' },
        { type: 'DELETE_DOCUMENT', name: 'Удаление документов', description: 'Может удалять документы' },
        
        // Управление пользователями
        { type: 'CREATE_USER', name: 'Создание пользователей', description: 'Может создавать пользователей' },
        { type: 'VIEW_USER', name: 'Просмотр пользователей', description: 'Может просматривать пользователей' },
        { type: 'EDIT_USER', name: 'Редактирование пользователей', description: 'Может редактировать пользователей' },
        { type: 'DELETE_USER', name: 'Удаление пользователей', description: 'Может удалять пользователей' },
        
        // Управление ролями и правами
        { type: 'MANAGE_ROLES', name: 'Управление ролями', description: 'Может управлять ролями' },
        { type: 'MANAGE_PERMISSIONS', name: 'Управление разрешениями', description: 'Может управлять разрешениями' },
        
        // Управление настройками
        { type: 'MANAGE_WORKFLOWS', name: 'Управление маршрутами', description: 'Может управлять маршрутами согласования' },
        { type: 'MANAGE_REFERENCES', name: 'Управление справочниками', description: 'Может управлять справочниками' },
        { type: 'MANAGE_INTEGRATIONS', name: 'Управление интеграциями', description: 'Может управлять интеграциями' },
        { type: 'MANAGE_DEPARTMENTS', name: 'Управление структурой компании', description: 'Может управлять структурой компании' },
        
        // Системные права
        { type: 'VIEW_REPORTS', name: 'Просмотр отчетов', description: 'Может просматривать отчеты' },
        { type: 'MANAGE_SYSTEM', name: 'Управление системой', description: 'Полный доступ к системе' },
        { type: 'VIEW_ALL_CONTRACTS', name: 'Просмотр всех договоров', description: 'Может просматривать все договоры' },
        { type: 'VIEW_ALL_USERS', name: 'Просмотр всех пользователей', description: 'Может просматривать всех пользователей' }
      ]
    })
    console.log(`✅ Создано ${permissions.count} разрешений`)

    // Получаем все созданные разрешения для связи с ролями
    const allPermissions = await prisma.permission.findMany()

    // Создаем роли
    const roles = await prisma.role.createMany({
      data: [
        {
          name: 'Инициатор',
          description: 'Может создавать договоры и отслеживать их статус'
        },
        {
          name: 'Менеджер инициаторов',
          description: 'Управляет инициаторами и их договорами'
        },
        {
          name: 'Руководитель отдела',
          description: 'Руководит отделом, согласовывает договоры'
        },
        {
          name: 'Главный юрист',
          description: 'Юридическая экспертиза и согласование договоров'
        },
        {
          name: 'Генеральный директор',
          description: 'Окончательное согласование договоров'
        },
        {
          name: 'Офис-менеджер',
          description: 'Административная поддержка, управление документами'
        },
        {
          name: 'Администратор',
          description: 'Полный доступ ко всем функциям системы'
        }
      ]
    })
    console.log(`✅ Создано ${roles.count} ролей`)

    // Получаем все созданные роли
    const allRoles = await prisma.role.findMany()

    // Создаем связи ролей с разрешениями
    const rolePermissions = []

    // Инициатор - базовые права на работу с договорами
    const initiatorRole = allRoles.find(r => r.name === 'Инициатор')
    if (initiatorRole) {
      const initiatorPermissions = allPermissions.filter(p => 
        ['CREATE_CONTRACT', 'VIEW_CONTRACT', 'EDIT_CONTRACT', 'VIEW_DOCUMENT', 'UPLOAD_DOCUMENT'].includes(p.type)
      )
      rolePermissions.push(...initiatorPermissions.map(p => ({
        roleId: initiatorRole.id,
        permissionId: p.id
      })))
    }

    // Менеджер инициаторов - права на управление пользователями и договорами
    const initiatorManagerRole = allRoles.find(r => r.name === 'Менеджер инициаторов')
    if (initiatorManagerRole) {
      const managerPermissions = allPermissions.filter(p => 
        ['CREATE_CONTRACT', 'VIEW_CONTRACT', 'EDIT_CONTRACT', 'APPROVE_CONTRACT', 'REJECT_CONTRACT', 
         'VIEW_DOCUMENT', 'UPLOAD_DOCUMENT', 'VIEW_USER', 'VIEW_ALL_CONTRACTS'].includes(p.type)
      )
      rolePermissions.push(...managerPermissions.map(p => ({
        roleId: initiatorManagerRole.id,
        permissionId: p.id
      })))
    }

    // Руководитель отдела - права на согласование и управление
    const departmentHeadRole = allRoles.find(r => r.name === 'Руководитель отдела')
    if (departmentHeadRole) {
      const headPermissions = allPermissions.filter(p => 
        ['CREATE_CONTRACT', 'VIEW_CONTRACT', 'EDIT_CONTRACT', 'APPROVE_CONTRACT', 'REJECT_CONTRACT',
         'VIEW_DOCUMENT', 'UPLOAD_DOCUMENT', 'VIEW_USER', 'VIEW_ALL_CONTRACTS'].includes(p.type)
      )
      rolePermissions.push(...headPermissions.map(p => ({
        roleId: departmentHeadRole.id,
        permissionId: p.id
      })))
    }

    // Главный юрист - юридические права
    const chiefLawyerRole = allRoles.find(r => r.name === 'Главный юрист')
    if (chiefLawyerRole) {
      const lawyerPermissions = allPermissions.filter(p => 
        ['CREATE_CONTRACT', 'VIEW_CONTRACT', 'EDIT_CONTRACT', 'APPROVE_CONTRACT', 'REJECT_CONTRACT',
         'VIEW_DOCUMENT', 'UPLOAD_DOCUMENT', 'DELETE_DOCUMENT', 'VIEW_ALL_CONTRACTS', 'VIEW_ALL_USERS'].includes(p.type)
      )
      rolePermissions.push(...lawyerPermissions.map(p => ({
        roleId: chiefLawyerRole.id,
        permissionId: p.id
      })))
    }

    // Генеральный директор - все права кроме управления системой
    const generalDirectorRole = allRoles.find(r => r.name === 'Генеральный директор')
    if (generalDirectorRole) {
      const directorPermissions = allPermissions.filter(p => 
        !['MANAGE_SYSTEM'].includes(p.type) // Все права кроме управления системой
      )
      rolePermissions.push(...directorPermissions.map(p => ({
        roleId: generalDirectorRole.id,
        permissionId: p.id
      })))
    }

    // Офис-менеджер - права на работу с документами
    const officeManagerRole = allRoles.find(r => r.name === 'Офис-менеджер')
    if (officeManagerRole) {
      const officePermissions = allPermissions.filter(p => 
        ['VIEW_CONTRACT', 'VIEW_DOCUMENT', 'UPLOAD_DOCUMENT', 'VIEW_ALL_CONTRACTS', 'VIEW_ALL_USERS'].includes(p.type)
      )
      rolePermissions.push(...officePermissions.map(p => ({
        roleId: officeManagerRole.id,
        permissionId: p.id
      })))
    }

    // Администратор - все права
    const adminRole = allRoles.find(r => r.name === 'Администратор')
    if (adminRole) {
      const adminPermissions = allPermissions.map(p => ({
        roleId: adminRole.id,
        permissionId: p.id
      }))
      rolePermissions.push(...adminPermissions)
    }

    // Создаем связи ролей с разрешениями
    await prisma.rolePermission.createMany({
      data: rolePermissions
    })
    console.log(`✅ Создано ${rolePermissions.length} связей ролей с разрешениями`)

    // Выводим статистику
    console.log('\n📊 Статистика созданных данных:')
    console.log(`- Разрешений: ${allPermissions.length}`)
    console.log(`- Ролей: ${allRoles.length}`)
    console.log(`- Связей ролей-разрешений: ${rolePermissions.length}`)

    console.log('\n🎉 Инициализация ролей и разрешений успешно завершена!')

  } catch (error) {
    console.error('❌ Ошибка при инициализации ролей и разрешений:', error)
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