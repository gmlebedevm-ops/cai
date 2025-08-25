export interface User {
  id: string
  email: string
  name?: string | null
  role: string
  createdAt: Date
  updatedAt: Date
  roleId?: string | null
  userRole?: {
    id: string
    name: string
    description?: string | null
    isActive: boolean
    permissions?: RolePermission[]
  }
  departmentId?: string | null
  department?: {
    id: string
    name: string
    code: string
    description?: string | null
    isActive: boolean
  }
}

export interface Role {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  permissions?: RolePermission[]
}

export interface Permission {
  id: string
  type: string
  name: string
  description?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface RolePermission {
  id: string
  roleId: string
  permissionId: string
  createdAt: Date
  role?: Role
  permission?: Permission
}

export interface Department {
  id: string
  name: string
  code: string
  description?: string | null
  parentId?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  parent?: Department | null
  children?: Department[]
  users?: User[]
  _count?: {
    users: number
    children: number
  }
}

export interface Contract {
  id: string
  number: string
  counterparty: string
  amount: number
  startDate: Date
  endDate: Date
  status: string
  createdAt: Date
  updatedAt: Date
  initiatorId: string
  initiator?: User
  workflowId?: string | null
  workflow?: Workflow
  documents?: Document[]
  comments?: Comment[]
  approvals?: Approval[]
  history?: ContractHistory[]
  notifications?: Notification[]
}

export interface Workflow {
  id: string
  name: string
  description?: string | null
  status: string
  version: number
  isDefault: boolean
  conditions?: string | null
  createdAt: Date
  updatedAt: Date
  steps?: WorkflowStep[]
  contracts?: Contract[]
}

export interface WorkflowStep {
  id: string
  name: string
  type: string
  order: number
  description?: string | null
  conditions?: string | null
  isRequired: boolean
  dueDays?: number | null
  role?: string | null
  userId?: string | null
  createdAt: Date
  updatedAt: Date
  workflowId: string
  workflow?: Workflow
  approvals?: Approval[]
}

export interface Document {
  id: string
  filename: string
  filePath: string
  fileSize: number
  mimeType: string
  type: string
  createdAt: Date
  updatedAt: Date
  contractId: string
  contract?: Contract
  versions?: DocumentVersion[]
}

export interface DocumentVersion {
  id: string
  version: number
  filePath: string
  changes: string
  createdAt: Date
  documentId: string
  document?: Document
  authorId: string
  author?: User
}

export interface Comment {
  id: string
  text: string
  createdAt: Date
  updatedAt: Date
  authorId: string
  author?: User
  contractId: string
  contract?: Contract
  parentId?: string | null
  parent?: Comment | null
  replies?: Comment[]
}

export interface Approval {
  id: string
  status: string
  comment?: string | null
  stepNumber: number
  createdAt: Date
  updatedAt: Date
  approverId: string
  approver?: User
  contractId: string
  contract?: Contract
  workflowStepId?: string | null
  workflowStep?: WorkflowStep
  dueDate?: Date | null
}

export interface ContractHistory {
  id: string
  action: string
  details: string
  createdAt: Date
  contractId: string
  contract?: Contract
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  readAt?: Date | null
  createdAt: Date
  userId: string
  user?: User
  contractId?: string | null
  contract?: Contract | null
  actionUrl?: string | null
}

export interface Reference {
  id: string
  type: string
  code: string
  name: string
  description?: string | null
  value?: string | null
  isActive: boolean
  sortOrder: number
  metadata?: string | null
  createdAt: Date
  updatedAt: Date
  parentCode?: string | null
  children?: Reference[]
  parent?: Reference | null
}