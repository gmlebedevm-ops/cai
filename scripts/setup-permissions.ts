import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupPermissions() {
  try {
    console.log('Начинаю настройку разрешений...')

    // Определение разрешений
    const permissionsData = [
      // Управление договорами
      { type: 'CREATE_CONTRACT', name: 'Создание договоров', description: 'Создавать новые договоры в системе' },
      { type: 'VIEW_CONTRACT', name: 'Просмотр договоров', description: 'Просматривать договоры и их детали' },
      { type: 'EDIT_CONTRACT', name: 'Редактирование договоров', description: 'Редактировать существующие договоры' },
      { type: 'DELETE_CONTRACT', name: 'Удаление договоров', description: 'Удалять договоры из системы' },
      { type: 'APPROVE_CONTRACT', name: 'Согласование договоров', description: 'Согласовывать договоры' },
      { type: 'REJECT_CONTRACT', name: 'Отклонение договоров', description: 'Отклонять договоры' },
      
      // Управление документами
      { type: 'UPLOAD_DOCUMENT', name: 'Загрузка документов', description: 'Загружать документы к договорам' },
      { type: 'VIEW_DOCUMENT', name: 'Просмотр документов', description: 'Просматривать загруженные документы' },
      { type: 'DELETE_DOCUMENT', name: 'Удаление документов', description: 'Удалять документы' },
      
      // Управление пользователями
      { type: 'CREATE_USER', name: 'Создание пользователей', description: 'Создавать новых пользователей' },
      { type: 'VIEW_USER', name: 'Просмотр пользователей', description: 'Просматривать список пользователей' },
      { type: 'EDIT_USER', name: 'Редактирование пользователей', description: 'Редактировать данные пользователей' },
      { type: 'DELETE_USER', name: 'Удаление пользователей', description: 'Удалять пользователей' },
      
      // Управление ролями и правами
      { type: 'MANAGE_ROLES', name: 'Управление ролями', description: 'Создавать и редактировать роли' },
      { type: 'MANAGE_PERMISSIONS', name: 'Управление разрешениями', description: 'Управлять разрешениями системы' },
      
      // Управление настройками
      { type: 'MANAGE_WORKFLOWS', name: 'Управление маршрутами', description: 'Управлять маршрутами согласования' },
      { type: 'MANAGE_REFERENCES', name: 'Управление справочниками', description: 'Управлять справочниками системы' },
      { type: 'MANAGE_INTEGRATIONS', name: 'Управление интеграциями', description: 'Управлять интеграциями с другими системами' },
      
      // Системные права
      { type: 'VIEW_REPORTS', name: 'Просмотр отчетов', description: 'Просматривать системные отчеты' },
      { type: 'MANAGE_SYSTEM', name: 'Управление системой', description: 'Полное управление системой' },
      { type: 'VIEW_ALL_CONTRACTS', name: 'Просмотр всех договоров', description: 'Просматривать все договоры в системе' },
      { type: 'VIEW_ALL_USERS', name: 'Просмотр всех пользователей', description: 'Просматривать всех пользователей' }
    ]

    // Создаем разрешения
    for (const permData of permissionsData) {
      const existingPermission = await prisma.permission.findFirst({
        where: {
          AND: [
            { type: permData.type },
            { name: permData.name }
          ]
        }
      })

      if (!existingPermission) {
        await prisma.permission.create({
          data: permData
        })
        console.log(`Создано разрешение: ${permData.name}`)
      } else {
        console.log(`Разрешение уже существует: ${permData.name}`)
      }
    }

    // Создаем базовые роли
    const adminRole = await prisma.role.upsert({
      where: { name: 'Администратор' },
      update: {},
      create: {
        name: 'Администратор',
        description: 'Полный доступ ко всем функциям системы',
        isActive: true
      }
    })

    const managerRole = await prisma.role.upsert({
      where: { name: 'Менеджер' },
      update: {},
      create: {
        name: 'Менеджер',
        description: 'Управление договорами и пользователями',
        isActive: true
      }
    })

    const viewerRole = await prisma.role.upsert({
      where: { name: 'Наблюдатель' },
      update: {},
      create: {
        name: 'Наблюдатель',
        description: 'Только просмотр информации',
        isActive: true
      }
    })

    console.log('Базовые роли созданы')

    // Получаем все разрешения
    const allPermissions = await prisma.permission.findMany()

    // Добавляем все разрешения роли Администратора
    const existingAdminPermissions = await prisma.rolePermission.findMany({
      where: { roleId: adminRole.id }
    })

    if (existingAdminPermissions.length === 0) {
      await prisma.rolePermission.createMany({
        data: allPermissions.map(permission => ({
          roleId: adminRole.id,
          permissionId: permission.id
        }))
      })
      console.log('Добавлены все разрешения роли Администратор')
    }

    // Добавляем ограниченные разрешения роли Менеджера
    const managerPermissions = allPermissions.filter(p => 
      [
        'CREATE_CONTRACT', 'VIEW_CONTRACT', 'EDIT_CONTRACT', 'VIEW_ALL_CONTRACTS',
        'UPLOAD_DOCUMENT', 'VIEW_DOCUMENT', 'VIEW_USER', 'VIEW_REPORTS'
      ].includes(p.type)
    )

    const existingManagerPermissions = await prisma.rolePermission.findMany({
      where: { roleId: managerRole.id }
    })

    if (existingManagerPermissions.length === 0) {
      await prisma.rolePermission.createMany({
        data: managerPermissions.map(permission => ({
          roleId: managerRole.id,
          permissionId: permission.id
        }))
      })
      console.log('Добавлены разрешения роли Менеджер')
    }

    // Добавляем только права на просмотр роли Наблюдателя
    const viewerPermissions = allPermissions.filter(p => 
      ['VIEW_CONTRACT', 'VIEW_DOCUMENT', 'VIEW_REPORTS'].includes(p.type)
    )

    const existingViewerPermissions = await prisma.rolePermission.findMany({
      where: { roleId: viewerRole.id }
    })

    if (existingViewerPermissions.length === 0) {
      await prisma.rolePermission.createMany({
        data: viewerPermissions.map(permission => ({
          roleId: viewerRole.id,
          permissionId: permission.id
        }))
      })
      console.log('Добавлены разрешения роли Наблюдатель')
    }

    console.log('Настройка разрешений завершена успешно!')
  } catch (error) {
    console.error('Ошибка при настройке разрешений:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupPermissions()