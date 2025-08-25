export enum ContractStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  SIGNED = 'SIGNED',
  ARCHIVED = 'ARCHIVED',
  REJECTED = 'REJECTED'
}

export enum UserRole {
  INITIATOR = 'INITIATOR',
  INITIATOR_MANAGER = 'INITIATOR_MANAGER',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  CHIEF_LAWYER = 'CHIEF_LAWYER',
  GENERAL_DIRECTOR = 'GENERAL_DIRECTOR',
  OFFICE_MANAGER = 'OFFICE_MANAGER',
  ADMINISTRATOR = 'ADMINISTRATOR'
}

export enum DocumentType {
  CONTRACT = 'CONTRACT',
  TENDER_SHEET = 'TENDER_SHEET',
  COMMERCIAL_PROPOSAL = 'COMMERCIAL_PROPOSAL',
  DISAGREEMENT_PROTOCOL = 'DISAGREEMENT_PROTOCOL',
  OTHER = 'OTHER'
}

export enum ShippingMethod {
  RUSSIAN_POST = 'RUSSIAN_POST',
  COURIER = 'COURIER',
  SELF_PICKUP = 'SELF_PICKUP',
  OTHER = 'OTHER'
}

export enum ShippingStatus {
  PENDING = 'PENDING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  LOST = 'LOST'
}

export interface User {
  id: string
  email: string
  name?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface Contract {
  id: string
  number: string
  counterparty: string
  amount: number
  startDate: Date
  endDate: Date
  status: ContractStatus
  createdAt: Date
  updatedAt: Date
  initiatorId: string
  initiator?: User
  
  // Shipping Information
  shippingMethod?: ShippingMethod
  shippingStatus?: ShippingStatus
  trackingNumber?: string
  shippingDate?: Date
  deliveryDate?: Date
  shippingAddress?: string
  shippingNotes?: string
}

export interface Document {
  id: string
  filename: string
  filePath: string
  fileSize: number
  mimeType: string
  type: DocumentType
  createdAt: Date
  updatedAt: Date
  contractId: string
}

export interface Comment {
  id: string
  text: string
  createdAt: Date
  updatedAt: Date
  authorId: string
  author?: User
  contractId: string
  parentId?: string
  parent?: Comment
  replies?: Comment[]
}

export interface Approval {
  id: string
  status: string
  comment?: string
  createdAt: Date
  updatedAt: Date
  approverId: string
  approver?: User
  contractId: string
  dueDate?: Date
}

export interface ContractHistory {
  id: string
  action: string
  details: string
  createdAt: Date
  contractId: string
}