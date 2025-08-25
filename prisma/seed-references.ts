import { PrismaClient, ReferenceType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Начинаем добавление справочников...')

  // Очищаем существующие справочники
  await prisma.reference.deleteMany()
  console.log('✅ Существующие справочники удалены')

  // Контрагенты
  const counterparties = [
    { 
      code: 'CLIENT_001', 
      name: 'ООО "Ромашка"', 
      description: 'Крупный поставщик офисной техники и расходных материалов', 
      value: JSON.stringify({
        phone: '+7 (495) 123-45-67',
        email: 'info@romashka.ru',
        address: 'г. Москва, ул. Садовая, д. 15, офис 301',
        website: 'https://romashka.ru'
      })
    },
    { 
      code: 'CLIENT_002', 
      name: 'ООО "Василек"', 
      description: 'IT-компания, разработчик программного обеспечения', 
      value: JSON.stringify({
        phone: '+7 (812) 234-56-78',
        email: 'contact@vasilek.com',
        address: 'г. Санкт-Петербург, Невский пр., д. 42',
        website: 'https://vasilek.com'
      })
    },
    { 
      code: 'CLIENT_003', 
      name: 'ИП Петров И.И.', 
      description: 'Индивидуальный предприниматель, консалтинговые услуги', 
      value: JSON.stringify({
        phone: '+7 (916) 345-67-89',
        email: 'petrov.ii@example.com',
        address: 'г. Москва, ул. Тверская, д. 7',
        website: ''
      })
    },
    { 
      code: 'CLIENT_004', 
      name: 'АО "Гвоздика"', 
      description: 'Государственная компания, строительные услуги', 
      value: JSON.stringify({
        phone: '+7 (499) 456-78-90',
        email: 'office@gvozdika.ru',
        address: 'г. Москва, ул. Профсоюзная, д. 89',
        website: 'https://gvozdika.ru'
      })
    },
    { 
      code: 'CLIENT_005', 
      name: 'ООО "Незабудка"', 
      description: 'Иностранный партнер, логистические услуги', 
      value: JSON.stringify({
        phone: '+7 (495) 567-89-01',
        email: 'moscow@nezabudka.com',
        address: 'г. Москва, ул. Смоленская, д. 12',
        website: 'https://nezabudka.com'
      })
    },
    { 
      code: 'CLIENT_006', 
      name: 'ООО "Ландыш"', 
      description: 'Поставщик мебели и офисного оборудования', 
      value: JSON.stringify({
        phone: '+7 (495) 678-90-12',
        email: 'sales@landysh.ru',
        address: 'г. Москва, ул. Гарибальди, д. 23',
        website: 'https://landysh.ru'
      })
    },
    { 
      code: 'CLIENT_007', 
      name: 'ООО "Фиалка"', 
      description: 'Маркетинговое агентство', 
      value: JSON.stringify({
        phone: '+7 (812) 789-01-23',
        email: 'hello@fialka.com',
        address: 'г. Санкт-Петербург, ул. Рубинштейна, д. 15',
        website: 'https://fialka.com'
      })
    },
    { 
      code: 'CLIENT_008', 
      name: 'ИП Сидоров А.В.', 
      description: 'Юридические и бухгалтерские услуги', 
      value: JSON.stringify({
        phone: '+7 (926) 890-12-34',
        email: 'sidorov.av@example.com',
        address: 'г. Москва, ул. Арбат, д. 35',
        website: ''
      })
    },
    // Иерархические контрагенты
    { 
      code: 'CLIENT_GROUP_A', 
      name: 'Группа компаний "Прогресс"', 
      description: 'Холдинговая компания, объединяющая несколько предприятий', 
      value: JSON.stringify({
        phone: '+7 (495) 111-22-33',
        email: 'info@progress-group.ru',
        address: 'г. Москва, ул. Красная Пресня, д. 1',
        website: 'https://progress-group.ru'
      })
    },
    { 
      code: 'CLIENT_SUB_A1', 
      name: 'ООО "Прогресс-Строй"', 
      description: 'Строительное подразделение холдинга', 
      value: JSON.stringify({
        phone: '+7 (495) 222-33-44',
        email: 'stroy@progress-group.ru',
        address: 'г. Москва, ул. Строителей, д. 10',
        website: 'https://stroy.progress-group.ru'
      }),
      parentCode: 'CLIENT_GROUP_A'
    },
    { 
      code: 'CLIENT_SUB_A2', 
      name: 'ООО "Прогресс-Трейд"', 
      description: 'Торговое подразделение холдинга', 
      value: JSON.stringify({
        phone: '+7 (495) 333-44-55',
        email: 'trade@progress-group.ru',
        address: 'г. Москва, ул. Торговой, д. 20',
        website: 'https://trade.progress-group.ru'
      }),
      parentCode: 'CLIENT_GROUP_A'
    },
  ]

  // Типы договоров
  const contractTypes = [
    { code: 'SERVICE', name: 'Договор оказания услуг', description: 'Основной тип договоров на услуги' },
    { code: 'SUPPLY', name: 'Договор поставки', description: 'Поставка товаров и оборудования' },
    { code: 'LEASE', name: 'Договор аренды', description: 'Аренда помещений и оборудования' },
    { code: 'WORK', name: 'Договор подряда', description: 'Выполнение работ' },
    { code: 'LICENSE', name: 'Лицензионный договор', description: 'Предоставление прав на использование' },
    { code: 'CONFIDENTIAL', name: 'Соглашение о конфиденциальности', description: 'NDA' },
    { code: 'PARTNERSHIP', name: 'Договор о партнерстве', description: 'Сотрудничество между компаниями' },
  ]

  // Отделы
  const departments = [
    { code: 'IT', name: 'IT отдел', description: 'Информационные технологии' },
    { code: 'HR', name: 'Отдел кадров', description: 'Управление персоналом' },
    { code: 'FIN', name: 'Финансовый отдел', description: 'Финансы и бухгалтерия' },
    { code: 'LEGAL', name: 'Юридический отдел', description: 'Правовое обеспечение' },
    { code: 'SALES', name: 'Отдел продаж', description: 'Продажи и маркетинг' },
    { code: 'PROCUREMENT', name: 'Отдел закупок', description: 'Закупки и логистика' },
    { code: 'PRODUCTION', name: 'Производственный отдел', description: 'Производство и контроль качества' },
    { code: 'ADMIN', name: 'Администрация', description: 'Административно-хозяйственный отдел' },
  ]

  // Должности
  const positions = [
    { code: 'CEO', name: 'Генеральный директор', description: 'Руководитель компании' },
    { code: 'CTO', name: 'Технический директор', description: 'Руководитель IT направления' },
    { code: 'CFO', name: 'Финансовый директор', description: 'Руководитель финансов' },
    { code: 'HR_DIRECTOR', name: 'Директор по персоналу', description: 'Руководитель HR' },
    { code: 'LEGAL_DIRECTOR', name: 'Юридический директор', description: 'Руководитель юридического отдела' },
    { code: 'SALES_DIRECTOR', name: 'Директор по продажам', description: 'Руководитель отдела продаж' },
    { code: 'IT_MANAGER', name: 'IT менеджер', description: 'Руководитель IT проектов' },
    { code: 'HR_MANAGER', name: 'HR менеджер', description: 'Специалист по персоналу' },
    { code: 'FIN_MANAGER', name: 'Финансовый менеджер', description: 'Финансовый специалист' },
    { code: 'LEGAL_ADVISOR', name: 'Юридический консультант', description: 'Юрист' },
    { code: 'SALES_MANAGER', name: 'Менеджер по продажам', description: 'Специалист по продажам' },
    { code: 'PROCUREMENT_MANAGER', name: 'Менеджер по закупкам', description: 'Специалист по закупкам' },
    { code: 'SPECIALIST', name: 'Специалист', description: 'Специалист различного профиля' },
  ]

  // Категории документов
  const documentCategories = [
    { code: 'CONTRACT', name: 'Договор', description: 'Основной договор' },
    { code: 'ANNEX', name: 'Приложение к договору', description: 'Дополнительное соглашение' },
    { code: 'SPECIFICATION', name: 'Спецификация', description: 'Техническая спецификация' },
    { code: 'INVOICE', name: 'Счет', description: 'Счет на оплату' },
    { code: 'ACT', name: 'Акт выполненных работ', description: 'Акт сдачи-приемки' },
    { code: 'PROTOCOL', name: 'Протокол', description: 'Протокол разногласий или согласования' },
    { code: 'CERTIFICATE', name: 'Сертификат', description: 'Сертификат качества' },
    { code: 'LICENSE_DOC', name: 'Лицензия', description: 'Лицензионный документ' },
  ]

  // Причины согласования
  const approvalReasons = [
    { code: 'STANDARD', name: 'Стандартное согласование', description: 'Обычный порядок согласования' },
    { code: 'URGENT', name: 'Срочное согласование', description: 'Требуется срочное рассмотрение' },
    { code: 'COMPLEX', name: 'Сложное согласование', description: 'Требуется экспертиза нескольких отделов' },
    { code: 'HIGH_VALUE', name: 'Высокая стоимость', description: 'Согласование крупной суммы' },
    { code: 'RISKY', name: 'Повышенные риски', description: 'Требуется тщательная проверка' },
    { code: 'INTERNATIONAL', name: 'Международная сделка', description: 'Согласование внешнеэкономической деятельности' },
  ]

  // Причины отказа
  const rejectionReasons = [
    { code: 'INCOMPLETE', name: 'Неполный комплект документов', description: 'Отсутствуют необходимые документы' },
    { code: 'FORMAL_VIOLATION', name: 'Формальное нарушение', description: 'Нарушение процедуры оформления' },
    { code: 'CONTENT_VIOLATION', name: 'Содержательное нарушение', description: 'Некорректные условия' },
    { code: 'FINANCIAL_RISK', name: 'Финансовые риски', description: 'Неблагоприятные финансовые условия' },
    { code: 'LEGAL_RISK', name: 'Юридические риски', description: 'Правовые риски и нарушения' },
    { code: 'TECHNICAL_VIOLATION', name: 'Техническое нарушение', description: 'Несоответствие техническим требованиям' },
    { code: 'BUDGET_EXCEEDED', name: 'Превышение бюджета', description: 'Сумма превышает бюджетные ограничения' },
    { code: 'APPROVAL_REQUIRED', name: 'Требуется дополнительное согласование', description: 'Необходимо согласование с другими отделами' },
  ]

  // Функция для создания справочников
  const createReferences = async (references: any[], type: ReferenceType) => {
    for (const ref of references) {
      await prisma.reference.create({
        data: {
          type,
          code: ref.code,
          name: ref.name,
          description: ref.description,
          value: ref.value || null,
          isActive: true,
          sortOrder: 0,
          metadata: null,
          parentCode: ref.parentCode || null,
        },
      })
    }
  }

  // Создаем все справочники
  await createReferences(counterparties, ReferenceType.COUNTERPARTY)
  console.log('✅ Контрагенты созданы')

  await createReferences(contractTypes, ReferenceType.CONTRACT_TYPE)
  console.log('✅ Типы договоров созданы')

  await createReferences(departments, ReferenceType.DEPARTMENT)
  console.log('✅ Отделы созданы')

  await createReferences(positions, ReferenceType.POSITION)
  console.log('✅ Должности созданы')

  await createReferences(documentCategories, ReferenceType.DOCUMENT_CATEGORY)
  console.log('✅ Категории документов созданы')

  await createReferences(approvalReasons, ReferenceType.APPROVAL_REASON)
  console.log('✅ Причины согласования созданы')

  await createReferences(rejectionReasons, ReferenceType.REJECTION_REASON)
  console.log('✅ Причины отказа созданы')

  // Иерархия отделов
  await prisma.reference.create({
    data: {
      type: ReferenceType.DEPARTMENT,
      code: 'IT_DEV',
      name: 'Разработка',
      description: 'Подразделение разработки',
      value: 'DEV',
      isActive: true,
      sortOrder: 0,
      metadata: null,
      parentCode: 'IT',
    },
  })

  await prisma.reference.create({
    data: {
      type: ReferenceType.DEPARTMENT,
      code: 'IT_SUPPORT',
      name: 'Техническая поддержка',
      description: 'Подразделение поддержки',
      value: 'SUPPORT',
      isActive: true,
      sortOrder: 0,
      metadata: null,
      parentCode: 'IT',
    },
  })

  console.log('✅ Иерархические структуры созданы')
  console.log('✅ Добавление справочников завершено!')
}

main()
  .catch((e) => {
    console.error('Ошибка при добавлении справочников:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })