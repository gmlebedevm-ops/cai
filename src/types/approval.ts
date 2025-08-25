export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface Approval {
  id: string
  status: ApprovalStatus
  comment?: string
  workflowStep: number
  createdAt: Date
  updatedAt: Date
  approverId: string
  approver?: {
    id: string
    email: string
    name?: string
    role: string
  }
  contractId: string
  contract?: {
    id: string
    number: string
    counterparty: string
    status: string
  }
  dueDate?: Date
}

export interface ApprovalWithDetails extends Approval {
  contract: {
    id: string
    number: string
    counterparty: string
    status: string
    amount: number
    startDate: Date
    endDate: Date
    initiator?: {
      id: string
      name?: string
      email: string
    }
  }
  approver: {
    id: string
    email: string
    name?: string
    role: string
  }
}

export interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}