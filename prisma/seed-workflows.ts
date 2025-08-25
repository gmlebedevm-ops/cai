import { PrismaClient } from '@prisma/client'
import { WorkflowStatus, WorkflowStepType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Начинаем добавление тестовых workflow...')

  try {
    // Удаляем существующие workflow (если нужно)
    await prisma.workflow.deleteMany()
    console.log('✅ Существующие workflow удалены')

    // Создаем стандартный workflow согласования
    const standardWorkflow = await prisma.workflow.create({
      data: {
        name: 'Стандартное согласование',
        description: 'Базовый маршрут согласования для большинства договоров',
        status: WorkflowStatus.ACTIVE,
        isDefault: true,
        steps: {
          create: [
            {
              name: 'Согласование с руководителем инициатора',
              type: WorkflowStepType.APPROVAL,
              order: 1,
              description: 'Согласование с непосредственным руководителем',
              isRequired: true,
              dueDays: 3,
              role: 'INITIATOR_MANAGER'
            },
            {
              name: 'Проверка главным юристом',
              type: WorkflowStepType.APPROVAL,
              order: 2,
              description: 'Юридическая экспертиза договора',
              isRequired: true,
              dueDays: 5,
              role: 'CHIEF_LAWYER'
            },
            {
              name: 'Согласование с руководителем отдела',
              type: WorkflowStepType.APPROVAL,
              order: 3,
              description: 'Согласование с руководителем соответствующего отдела',
              isRequired: true,
              dueDays: 2,
              role: 'DEPARTMENT_HEAD'
            },
            {
              name: 'Финальное согласование с директором',
              type: WorkflowStepType.APPROVAL,
              order: 4,
              description: 'Окончательное согласование с генеральным директором',
              isRequired: true,
              dueDays: 3,
              role: 'GENERAL_DIRECTOR'
            },
            {
              name: 'Уведомление офис-менеджера',
              type: WorkflowStepType.NOTIFICATION,
              order: 5,
              description: 'Информирование офис-менеджера о готовности договора к подписанию',
              isRequired: false,
              role: 'OFFICE_MANAGER'
            }
          ]
        }
      }
    })

    console.log(`✅ Создан стандартный workflow: ${standardWorkflow.name}`)

    // Создаем упрощенный workflow для мелких договоров
    const simpleWorkflow = await prisma.workflow.create({
      data: {
        name: 'Упрощенное согласование',
        description: 'Быстрый маршрут для договоров до 100 тыс. ₽',
        status: WorkflowStatus.ACTIVE,
        isDefault: false,
        conditions: JSON.stringify({
          maxAmount: 100000
        }),
        steps: {
          create: [
            {
              name: 'Согласование с руководителем',
              type: WorkflowStepType.APPROVAL,
              order: 1,
              description: 'Согласование с руководителем инициатора',
              isRequired: true,
              dueDays: 1,
              role: 'INITIATOR_MANAGER'
            },
            {
              name: 'Проверка юристом',
              type: WorkflowStepType.REVIEW,
              order: 2,
              description: 'Экспресс-проверка юридических аспектов',
              isRequired: true,
              dueDays: 2,
              role: 'CHIEF_LAWYER'
            }
          ]
        }
      }
    })

    console.log(`✅ Создан упрощенный workflow: ${simpleWorkflow.name}`)

    // Создаем расширенный workflow для крупных договоров
    const extendedWorkflow = await prisma.workflow.create({
      data: {
        name: 'Расширенное согласование',
        description: 'Полный маршрут для крупных договоров от 500 тыс. ₽',
        status: WorkflowStatus.ACTIVE,
        isDefault: false,
        conditions: JSON.stringify({
          minAmount: 500000
        }),
        steps: {
          create: [
            {
              name: 'Предварительная экспертиза',
              type: WorkflowStepType.REVIEW,
              order: 1,
              description: 'Предварительная проверка соответствия требованиям',
              isRequired: true,
              dueDays: 2,
              role: 'INITIATOR_MANAGER'
            },
            {
              name: 'Финансовая проверка',
              type: WorkflowStepType.APPROVAL,
              order: 2,
              description: 'Проверка финансовых условий договора',
              isRequired: true,
              dueDays: 3,
              role: 'DEPARTMENT_HEAD'
            },
            {
              name: 'Юридическая экспертиза',
              type: WorkflowStepType.APPROVAL,
              order: 3,
              description: 'Полная юридическая проверка договора',
              isRequired: true,
              dueDays: 5,
              role: 'CHIEF_LAWYER'
            },
            {
              name: 'Согласование с директором',
              type: WorkflowStepType.APPROVAL,
              order: 4,
              description: 'Согласование с генеральным директором',
              isRequired: true,
              dueDays: 3,
              role: 'GENERAL_DIRECTOR'
            },
            {
              name: 'Уведомление об утверждении',
              type: WorkflowStepType.NOTIFICATION,
              order: 5,
              description: 'Уведомление всех участников об утверждении договора',
              isRequired: false,
              role: 'OFFICE_MANAGER'
            }
          ]
        }
      }
    })

    console.log(`✅ Создан расширенный workflow: ${extendedWorkflow.name}`)

    console.log('✅ Добавление тестовых workflow завершено!')

  } catch (error) {
    console.error('❌ Ошибка при создании workflow:', error)
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