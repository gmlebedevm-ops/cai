#!/bin/bash

# Скрипт для создания тестовых пользователей, ролей и прав для Contract.Ai
# Запуск: ./setup-test-users.sh

echo "=== Настройка тестовых пользователей для Contract.Ai ==="
echo ""

# Проверяем, установлен ли Node.js
if ! command -v node &> /dev/null; then
    echo "Ошибка: Node.js не установлен"
    exit 1
fi

# Проверяем, существует ли директория scripts
if [ ! -d "scripts" ]; then
    echo "Ошибка: Директория scripts не найдена"
    exit 1
fi

# Создаем временный файл для TypeScript скрипта
TEMP_SCRIPT="scripts/setup-test-data.ts"

cat > $TEMP_SCRIPT << 'EOF'
import { PrismaClient, UserRole, PermissionType } from '@prisma/client'

const prisma = new PrismaClient()

// Данные для тестовых пользователей
const testUsers = [
  {
    email: 'admin@test.com',
    name: 'Администратор Системы',
    role: 'ADMINISTRATOR' as UserRole,
    password: 'password123'
  },
  {
    email: 'initiator@test.com',
    name: 'Иван Иванов',
    role: 'INITIATOR' as UserRole,
    password: 'demo123'
  },
  {
    email: 'manager@test.com',
    name: 'Петр Петров',
    role: 'INITIATOR_MANAGER' as UserRole,
    password: 'demo123'
  },
  {
    email: 'head@test.com',
    name: 'Сергей Сергеев',
    role: 'DEPARTMENT_HEAD' as UserRole,
    password: 'demo123'
  },
  {
    email: 'lawyer@test.com',
    name: 'Анна Андреева',
    role: 'CHIEF_LAWYER' as UserRole,
    password: 'demo123'
  },
  {
    email: 'director@test.com',
    name: 'Мария Мария',
    role: 'GENERAL_DIRECTOR' as UserRole,
    password: 'demo123'
  },
  {
    email: 'office@test.com',
    name: 'Елена Еленова',
    role: 'OFFICE_MANAGER' as UserRole,
    password: 'demo123'
  }
]

// Данные для ролей
const roles = [
  {
    name: 'Администратор',
    description: 'Полный доступ ко всем функциям системы'
  },
  {
    name: 'Инициатор',
    description: 'Создание договоров и базовые операции'
  },
  {
    name: 'Менеджер инициаторов',
    description: 'Управление инициаторами и их договорами'
  },
  {
    name: 'Руководитель отдела',
    description: 'Управление отделом и согласование договоров'
  },
  {
    name: 'Главный юрист',
    description: 'Юридическая экспертиза и согласование'
  },
  {
    name: 'Генеральный директор',
    description: 'Финальное согласование и управление компанией'
  },
  {
    name: 'Офис-менеджер',
    description: 'Управление документами и справочниками'
  }
]

// Данные для разрешений
const permissions = [
  // Управление договорами
  { type: 'CREATE_CONTRACT' as PermissionType, name: 'Создание договоров', description: 'Создание новых договоров' },
  { type: 'VIEW_CONTRACT' as PermissionType, name: 'Просмотр договоров', description: 'Просмотр договоров' },
  { type: 'EDIT_CONTRACT' as PermissionType, name: 'Редактирование договоров', description: 'Редактирование договоров' },
  { type: 'DELETE_CONTRACT' as PermissionType, name: 'Удаление договоров', description: 'Удаление договоров' },
  { type: 'APPROVE_CONTRACT' as PermissionType, name: 'Согласование договоров', description: 'Согласование договоров' },
  { type: 'REJECT_CONTRACT' as PermissionType, name: 'Отклонение договоров', description: 'Отклонение договоров' },
  
  // Управление документами
  { type: 'UPLOAD_DOCUMENT' as PermissionType, name: 'Загрузка документов', description: 'Загрузка документов к договорам' },
  { type: 'VIEW_DOCUMENT' as PermissionType, name: 'Просмотр документов', description: 'Просмотр документов' },
  { type: 'DELETE_DOCUMENT' as PermissionType, name: 'Удаление документов', description: 'Удаление документов' },
  
  // Управление пользователями
  { type: 'CREATE_USER' as PermissionType, name: 'Создание пользователей', description: 'Создание пользователей системы' },
  { type: 'VIEW_USER' as PermissionType, name: 'Просмотр пользователей', description: 'Просмотр пользователей системы' },
  { type: 'EDIT_USER' as PermissionType, name: 'Редактирование пользователей', description: 'Редактирование пользователей' },
  { type: 'DELETE_USER' as PermissionType, name: 'Удаление пользователей', description: 'Удаление пользователей' },
  
  // Управление ролями и правами
  { type: 'MANAGE_ROLES' as PermissionType, name: 'Управление ролями', description: 'Управление ролями пользователей' },
  { type: 'MANAGE_PERMISSIONS' as PermissionType, name: 'Управление правами', description: 'Управление правами доступа' },
  
  // Управление настройками
  { type: 'MANAGE_WORKFLOWS' as PermissionType, name: 'Управление маршрутами', description: 'Управление маршрутами согласования' },
  { type: 'MANAGE_REFERENCES' as PermissionType, name: 'Управление справочниками', description: 'Управление справочниками' },
  { type: 'MANAGE_INTEGRATIONS' as PermissionType, name: 'Управление интеграциями', description: 'Управление интеграциями' },
  
  // Управление структурой компании
  { type: 'MANAGE_DEPARTMENTS' as PermissionType, name: 'Управление отделами', description: 'Управление структурой компании' },
  
  // Системные права
  { type: 'VIEW_REPORTS' as PermissionType, name: 'Просмотр отчетов', description: 'Просмотр системных отчетов' },
  { type: 'MANAGE_SYSTEM' as PermissionType, name: 'Управление системой', description: 'Полное управление системой' },
  { type: 'VIEW_ALL_CONTRACTS' as PermissionType, name: 'Просмотр всех договоров', description: 'Просмотр всех договоров в системе' },
  { type: 'VIEW_ALL_USERS' as PermissionType, name: 'Просмотр всех пользователей', description: 'Просмотр всех пользователей системы' }
]

// Распределение прав для ролей
const rolePermissions = {
  'Администратор': [
    'CREATE_CONTRACT', 'VIEW_CONTRACT', 'EDIT_CONTRACT', 'DELETE_CONTRACT', 'APPROVE_CONTRACT', 'REJECT_CONTRACT',
    'UPLOAD_DOCUMENT', 'VIEW_DOCUMENT', 'DELETE_DOCUMENT',
    'CREATE_USER', 'VIEW_USER', 'EDIT_USER', 'DELETE_USER',
    'MANAGE_ROLES', 'MANAGE_PERMISSIONS',
    'MANAGE_WORKFLOWS', 'MANAGE_REFERENCES', 'MANAGE_INTEGRATIONS',
    'MANAGE_DEPARTMENTS',
    'VIEW_REPORTS', 'MANAGE_SYSTEM', 'VIEW_ALL_CONTRACTS', 'VIEW_ALL_USERS'
  ],
  'Инициатор': [
    'CREATE_CONTRACT', 'VIEW_CONTRACT', 'EDIT_CONTRACT',
    'UPLOAD_DOCUMENT', 'VIEW_DOCUMENT'
  ],
  'Менеджер инициаторов': [
    'CREATE_CONTRACT', 'VIEW_CONTRACT', 'EDIT_CONTRACT', 'APPROVE_CONTRACT',
    'UPLOAD_DOCUMENT', 'VIEW_DOCUMENT', 'DELETE_DOCUMENT',
    'VIEW_USER'
  ],
  'Руководитель отдела': [
    'CREATE_CONTRACT', 'VIEW_CONTRACT', 'EDIT_CONTRACT', 'APPROVE_CONTRACT', 'REJECT_CONTRACT',
    'UPLOAD_DOCUMENT', 'VIEW_DOCUMENT', 'DELETE_DOCUMENT',
    'VIEW_USER', 'EDIT_USER',
    'MANAGE_DEPARTMENTS',
    'VIEW_ALL_CONTRACTS'
  ],
  'Главный юрист': [
    'VIEW_CONTRACT', 'EDIT_CONTRACT', 'APPROVE_CONTRACT', 'REJECT_CONTRACT',
    'UPLOAD_DOCUMENT', 'VIEW_DOCUMENT',
    'VIEW_ALL_CONTRACTS'
  ],
  'Генеральный директор': [
    'CREATE_CONTRACT', 'VIEW_CONTRACT', 'EDIT_CONTRACT', 'APPROVE_CONTRACT', 'REJECT_CONTRACT',
    'UPLOAD_DOCUMENT', 'VIEW_DOCUMENT',
    'VIEW_USER', 'VIEW_ALL_CONTRACTS', 'VIEW_ALL_USERS',
    'VIEW_REPORTS'
  ],
  'Офис-менеджер': [
    'VIEW_CONTRACT',
    'UPLOAD_DOCUMENT', 'VIEW_DOCUMENT', 'DELETE_DOCUMENT',
    'MANAGE_REFERENCES',
    'VIEW_ALL_CONTRACTS'
  ]
}

// Соответствие ролей пользователям
const userRoles = {
  'admin@test.com': 'Администратор',
  'initiator@test.com': 'Инициатор',
  'manager@test.com': 'Менеджер инициаторов',
  'head@test.com': 'Руководитель отдела',
  'lawyer@test.com': 'Главный юрист',
  'director@test.com': 'Генеральный директор',
  'office@test.com': 'Офис-менеджер'
}

async function setupTestData() {
  try {
    console.log('Начинаем создание тестовых данных...')
    
    // Создаем разрешения
    console.log('\n1. Создание разрешений...')
    for (const perm of permissions) {
      const existingPermission = await prisma.permission.findFirst({
        where: {
          type: perm.type,
          name: perm.name
        }
      })
      
      if (!existingPermission) {
        await prisma.permission.create({
          data: perm
        })
        console.log(`  ✓ Создано разрешение: ${perm.name}`)
      } else {
        console.log(`  ✗ Разрешение уже существует: ${perm.name}`)
      }
    }
    
    // Создаем роли
    console.log('\n2. Создание ролей...')
    const createdRoles = new Map()
    
    for (const roleData of roles) {
      const existingRole = await prisma.role.findUnique({
        where: { name: roleData.name }
      })
      
      let role
      if (!existingRole) {
        role = await prisma.role.create({
          data: roleData
        })
        console.log(`  ✓ Создана роль: ${role.name}`)
      } else {
        role = existingRole
        console.log(`  ✗ Роль уже существует: ${role.name}`)
      }
      createdRoles.set(roleData.name, role)
    }
    
    // Назначаем права ролям
    console.log('\n3. Назначение прав ролям...')
    for (const [roleName, permissionTypes] of Object.entries(rolePermissions)) {
      const role = createdRoles.get(roleName)
      if (!role) continue
      
      // Получаем ID разрешений
      const permissionsToAssign = await prisma.permission.findMany({
        where: {
          type: {
            in: permissionTypes
          }
        }
      })
      
      // Удаляем существующие назначения прав
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      })
      
      // Назначаем новые права
      for (const permission of permissionsToAssign) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id
          }
        })
      }
      
      console.log(`  ✓ Роли "${roleName}" назначено ${permissionsToAssign.length} прав`)
    }
    
    // Создаем пользователей
    console.log('\n4. Создание пользователей...')
    for (const userData of testUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })
      
      if (!existingUser) {
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            role: userData.role
          }
        })
        console.log(`  ✓ Создан пользователь: ${user.name} (${user.email})`)
      } else {
        console.log(`  ✗ Пользователь уже существует: ${userData.name} (${userData.email})`)
      }
    }
    
    // Назначаем роли пользователям
    console.log('\n5. Назначение ролей пользователям...')
    for (const [userEmail, roleName] of Object.entries(userRoles)) {
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      })
      const role = createdRoles.get(roleName)
      
      if (user && role) {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: role.id }
        })
        console.log(`  ✓ Пользователю ${user.name} назначена роль: ${roleName}`)
      }
    }
    
    console.log('\n=== Тестовые данные успешно созданы! ===')
    console.log('\nДанные для входа:')
    console.log('────────────────────────────────────────────────────────────────────────────────')
    console.log('Email                    | Имя                  | Роль                  | Пароль')
    console.log('────────────────────────────────────────────────────────────────────────────────')
    for (const user of testUsers) {
      const roleName = userRoles[user.email] || 'Не назначена'
      console.log(`${user.email.padEnd(24)} | ${user.name?.padEnd(20)} | ${roleName.padEnd(20)} | ${user.password}`)
    }
    console.log('────────────────────────────────────────────────────────────────────────────────')
    
  } catch (error) {
    console.error('Ошибка при создании тестовых данных:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupTestData()
  .catch((error) => {
    console.error('Скрипт завершился с ошибкой:', error)
    process.exit(1)
  })
EOF

echo "Создан временный скрипт: $TEMP_SCRIPT"
echo ""

# Запускаем скрипт
echo "Запускаем создание тестовых данных..."
echo ""
npx tsx $TEMP_SCRIPT

# Проверяем результат
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Скрипт успешно выполнен!"
    echo ""
    echo "Теперь вы можете войти в систему, используя следующие данные:"
    echo ""
    echo "Администратор: admin@test.com / password123"
    echo "Инициатор: initiator@test.com / demo123"
    echo "Менеджер: manager@test.com / demo123"
    echo "Руководитель: head@test.com / demo123"
    echo "Юрист: lawyer@test.com / demo123"
    echo "Директор: director@test.com / demo123"
    echo "Офис-менеджер: office@test.com / demo123"
else
    echo ""
    echo "❌ Скрипт завершился с ошибкой!"
    echo "Проверьте вывод выше для получения подробной информации."
fi

# Удаляем временный файл
rm -f $TEMP_SCRIPT
echo ""
echo "Временный скрипт удален."