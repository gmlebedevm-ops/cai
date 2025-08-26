import { UserRole } from './contract'
import { PermissionType } from './index'

export enum WorkflowStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT'
}

export enum WorkflowStepType {
  APPROVAL = 'APPROVAL',
  REVIEW = 'REVIEW',
  NOTIFICATION = 'NOTIFICATION',
  CONDITION = 'CONDITION'
}

export enum ReferenceType {
  COUNTERPARTY = 'COUNTERPARTY',
  CONTRACT_TYPE = 'CONTRACT_TYPE',
  DEPARTMENT = 'DEPARTMENT',
  POSITION = 'POSITION',
  DOCUMENT_CATEGORY = 'DOCUMENT_CATEGORY',
  APPROVAL_REASON = 'APPROVAL_REASON',
  REJECTION_REASON = 'REJECTION_REASON'
}

export interface Workflow {
  id: string
  name: string
  description?: string
  status: WorkflowStatus
  version: number
  isDefault: boolean
  conditions?: string
  createdAt: Date
  updatedAt: Date
  steps?: WorkflowStep[]
  contracts?: Contract[]
}

export interface WorkflowStep {
  id: string
  name: string
  type: WorkflowStepType
  order: number
  description?: string
  conditions?: string
  isRequired: boolean
  dueDays?: number
  
  // Старая система ролей (для обратной совместимости)
  role?: UserRole
  userId?: string
  
  // Новая система ролей
  roleId?: string
  roleData?: Role
  
  // Для параллельного согласования
  isParallel?: boolean
  parallelRoleIds?: string[]
  parallelRoles?: WorkflowStepRole[]
  
  createdAt: Date
  updatedAt: Date
  workflowId: string
  workflow?: Workflow
  approvals?: Approval[]
}

// Интерфейс для связи шага с ролями (параллельное согласование)
export interface WorkflowStepRole {
  id: string
  stepId: string
  roleId: string
  createdAt: Date
  step?: WorkflowStep
  role?: Role
}

// Интерфейс для новой системы ролей
export interface Role {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  permissions?: RolePermission[]
  users?: User[]
  workflowSteps?: WorkflowStepRole[]
  singleWorkflowSteps?: WorkflowStep[]
}

export interface RolePermission {
  id: string
  roleId: string
  permissionId: string
  createdAt: Date
  role?: Role
  permission?: Permission
}

export interface Permission {
  id: string
  type: PermissionType
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface Reference {
  id: string
  type: ReferenceType
  code: string
  name: string
  description?: string
  value?: string
  isActive: boolean
  sortOrder: number
  metadata?: string
  createdAt: Date
  updatedAt: Date
  parentCode?: string
  children?: Reference[]
  parent?: Reference
}

export interface CreateWorkflowInput {
  name: string
  description?: string
  status?: WorkflowStatus
  conditions?: string
  steps?: Omit<WorkflowStep, 'id' | 'createdAt' | 'updatedAt' | 'workflowId' | 'workflow' | 'approvals'>[]
}

export interface UpdateWorkflowInput {
  id: string
  name?: string
  description?: string
  status?: WorkflowStatus
  conditions?: string
  steps?: Omit<WorkflowStep, 'id' | 'createdAt' | 'updatedAt' | 'workflowId' | 'workflow' | 'approvals'>[]
}

export interface CreateReferenceInput {
  type: ReferenceType
  code: string
  name: string
  description?: string
  value?: string
  isActive?: boolean
  sortOrder?: number
  metadata?: string
  parentCode?: string
}

export interface UpdateReferenceInput {
  id: string
  type?: ReferenceType
  code?: string
  name?: string
  description?: string
  value?: string
  isActive?: boolean
  sortOrder?: number
  metadata?: string
  parentCode?: string
}