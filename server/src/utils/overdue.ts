import { env } from '../../env.ts'
import type { Complaint } from '../db/schema.ts'

export const checkAndMarkOverdue = (complaint: Complaint, thresholdDays?: number): boolean => {
  const daysThreshold = thresholdDays ?? env.OVERDUE_DAYS
  const createdAt = new Date(complaint.createdAt)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

  return complaint.status !== 'Resolved' && diffDays > daysThreshold && !complaint.isOverdue
}

export const calculateDaysOpen = (createdAt: Date | string): number => {
  const created = new Date(createdAt)
  const now = new Date()
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
}