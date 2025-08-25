export enum NotificationType {
  CONTRACT_CREATED = 'CONTRACT_CREATED',
  CONTRACT_UPDATED = 'CONTRACT_UPDATED',
  APPROVAL_REQUESTED = 'APPROVAL_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED'
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  readAt?: Date
  createdAt: Date
  userId: string
  contractId?: string
  actionUrl?: string
}