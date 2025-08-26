import { PrismaClient, PermissionType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Начинаем добавление ролей и разрешений...')

  try {
    // Очищаем существующие роли и разрешения
    await prisma.rolePermission.deleteMany()
    await prisma.permission.deleteMany()
    await prisma.role.deleteMany()
    console.log('✅ Существующие роли и разрешения удалены')

    // Создаем разрешения
    const permissions = [
      // Управление договорами
      { type: PermissionType.CREATE_CONTRACT, name: 'Создание договоров', description: 'Может создавать новые договоры' },
      { type: PermissionType.VIEW_CONTRACT, name: 'Просмотр договоров', description: 'Может просматривать договоры' },
      { type: PermissionType.EDIT_CONTRACT, name: 'Редактирование договоров', description: 'Может редактировать договоры' },
      { type: PermissionType.DELETE_CONTRACT, name: 'Удаление договоров', description: 'Может удалять договоры' },
      { type: PermissionType.APPROVE_CONTRACT, name: 'Согласование договоров', description: 'Может согласовывать договоры' },
      { type: PermissionType.REJECT_CONTRACT, name: 'Отклонение договоров', description: 'Может отклонять договоры' },
      
      // Управление документами
      { type: PermissionType.UPLOAD_DOCUMENT, name: 'Загрузка документов', description: 'Может загружать документы' },
      { type: PermissionType.VIEW_DOCUMENT, name: 'Просмотр документов', description: 'Может просматривать документы' },
      { type: PermissionType.DELETE_DOCUMENT, name: 'Удаление документов', description: 'Может удалять документы' },
      
      // Управление пользователями
      { type: PermissionType.CREATE_USER, name: 'Создание пользователей', description: 'Может создавать пользователей' },
      { type: PermissionType.VIEW_USER, name: 'Просмотр пользователей', description: 'Может просматривать пользователей' },
      { type: PermissionType.EDIT_USER, name: 'Редактирование пользователей', description: 'Может редактировать пользователей' },
      { type: PermissionType.DELETE_USER, name: 'Удаление пользователей', description: 'Может удалять пользователей' },
      
      // Управление ролями и правами
      { type: PermissionType.MANAGE_ROLES, name: 'Управление ролями', description: 'Может управлять ролями' },
      { type: PermissionType.MANAGE_PERMISSIONS, name: 'Управление разрешениями', description: 'Может управлять разрешениями' },
      
      // Управление настройками
      { type: PermissionType.MANAGE_WORKFLOWS, name: 'Управление маршрутами', description: 'Может управлять маршрутами согласования' },
      { type: PermissionType.MANAGE_REFERENCES, name: 'Управление справочниками', description: 'Может управлять справочниками' },
      { type: PermissionType.MANAGE_INTEGRATIONS, name: 'Управление интеграциями', description: 'Может управлять интеграциями' },
      
      // Управление структурой компании
      { type: PermissionType.MANAGE_DEPARTMENTS, name: 'Управление структурой компании', description: 'Может управлять структурой компании' },
      
      // Системные права
      { type: PermissionType.VIEW_REPORTS, name: 'Просмотр отчетов', description: 'Может просматривать отчеты' },
      { type: PermissionType.MANAGE_SYSTEM, name: 'Управление системой', description: 'Полный доступ к системе' },
      { type: PermissionType.VIEW_ALL_CONTRACTS, name: 'Просмотр всех договоров', description: 'Может просматривать все договоры' },
      { type: PermissionType.VIEW_ALL_USERS, name: 'Просмотр всех пользователей', description: 'Может просматривать всех пользователей' },
    ]

    const createdPermissions = []
    for (const permission of permissions) {
      const created = await prisma.permission.create({
        data: permission
      })
      createdPermissions.push(created)
    }
    console.log(`✅ Создано ${createdPermissions.length} разрешений`)

    // Создаем роли
    const roles = [
      {
        name: 'Администратор',
        description: 'Полный доступ ко всем функциям системы',
        permissionTypes: Object.values(PermissionType)
      },
      {
        name: 'Генеральный директор',
        description: 'Окончательное согласование договоров',
        permissionTypes: [
          PermissionType.VIEW_CONTRACT,
          PermissionType.EDIT_CONTRACT,
          PermissionType.APPROVE_CONTRACT,
          PermissionType.REJECT_CONTRACT,
          PermissionType.VIEW_DOCUMENT,
          PermissionType.UPLOAD_DOCUMENT,
          PermissionType.VIEW_ALL_CONTRACTS,
          PermissionType.VIEW_REPORTS
        ]
      },
      {
        name: 'Главный юрист',
        description: 'Юридическая экспертиза и согласование договоров',
        permissionTypes: [
          PermissionType.VIEW_CONTRACT,
          PermissionType.EDIT_CONTRACT,
          PermissionType.APPROVE_CONTRACT,
          PermissionType.REJECT_CONTRACT,
          PermissionType.VIEW_DOCUMENT,
          PermissionType.UPLOAD_DOCUMENT,
          PermissionType.VIEW_ALL_CONTRACTS
        ]
      },
      {
        name: 'Руководитель отдела',
        description: 'Руководит отделом, согласовывает договоры',
        permissionTypes: [
          PermissionType.VIEW_CONTRACT,
          PermissionType.EDIT_CONTRACT,
          PermissionType.APPROVE_CONTRACT,
          PermissionType.REJECT_CONTRACT,
          PermissionType.VIEW_DOCUMENT,
          PermissionType.UPLOAD_DOCUMENT,
          PermissionType.VIEW_ALL_CONTRACTS
        ]
      },
      {
        name: 'Менеджер инициаторов',
        description: 'Управляет инициаторами и их договорами',
        permissionTypes: [
          PermissionType.CREATE_CONTRACT,
          PermissionType.VIEW_CONTRACT,
          PermissionType.EDIT_CONTRACT,
          PermissionType.VIEW_DOCUMENT,
          PermissionType.UPLOAD_DOCUMENT,
          PermissionType.VIEW_USER
        ]
      },
      {
        name: 'Инициатор',
        description: 'Может создавать договоры и отслеживать их статус',
        permissionTypes: [
          PermissionType.CREATE_CONTRACT,
          PermissionType.VIEW_CONTRACT,
          PermissionType.EDIT_CONTRACT,
          PermissionType.VIEW_DOCUMENT,
          PermissionType.UPLOAD_DOCUMENT
        ]
      },
      {
        name: 'Офис-менеджер',
        description: 'Административная поддержка, управление документами',
        permissionTypes: [
          PermissionType.VIEW_CONTRACT,
          PermissionType.VIEW_DOCUMENT,
          PermissionType.UPLOAD_DOCUMENT,
          PermissionType.VIEW_ALL_CONTRACTS
        ]
      },
      {
        name: 'Безопасник',
        description: 'Проверка контрагентов',
        permissionTypes: [
          PermissionType.VIEW_CONTRACT,
          PermissionType.VIEW_DOCUMENT,
          PermissionType.VIEW_ALL_CONTRACTS
        ]
      }
    ]

    const createdRoles = []
    for (const role of roles) {
      const createdRole = await prisma.role.create({
        data: {
          name: role.name,
          description: role.description,
          isActive: true
        }
      })
      
      // Добавляем разрешения к роли
      const rolePermissions = role.permissionTypes.map(permissionType => {
        const permission = createdPermissions.find(p => p.type === permissionType)
        return {
          roleId: createdRole.id,
          permissionId: permission.id
        }
      })
      
      await prisma.rolePermission.createMany({
        data: rolePermissions
      })
      
      createdRoles.push(createdRole)
      console.log(`✅ Создана роль: ${role.name} с ${role.permissionTypes.length} разрешениями`)
    }

    console.log('✅ Добавление ролей и разрешений завершено!')

  } catch (error) {
    console.error('❌ Ошибка при создании ролей и разрешений:', error)
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