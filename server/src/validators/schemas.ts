import { z } from 'zod'

// --- Auth ---
export const registerSchema = z.object({
  name: z.string().min(2).max(256),
  email: z.string().email().max(256),
  password: z.string().min(8).max(128),
})

export const loginSchema = z.object({
  email: z.string().email().max(256),
  password: z.string().min(8).max(128),
})

// --- Complaints (Resident) ---
export const createComplaintSchema = z.object({
  category: z.string().min(2).max(128),
  description: z.string().min(10).max(5000),
})

export const complaintParamsSchema = z.object({
  id: z.coerce.number().positive(),
})

export const complaintQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(50).default(10),
  status: z.enum(['Open', 'In Progress', 'Resolved']).optional(),
  category: z.string().max(128).optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
})

// --- Admin Complaints ---
export const adminComplaintQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  status: z.enum(['Open', 'In Progress', 'Resolved']).optional(),
  category: z.string().max(128).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  residentId: z.coerce.number().positive().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  isOverdue: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  sortBy: z.enum(['createdAt', 'priority', 'status', 'isOverdue']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const updateComplaintBodySchema = z
  .object({
    status: z.enum(['Open', 'In Progress', 'Resolved']).optional(),
    priority: z.enum(['Low', 'Medium', 'High']).optional(),
    isOverdue: z.boolean().optional(),
    note: z.string().max(1000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

// --- Notices ---
export const createNoticeSchema = z.object({
  content: z.string().min(10).max(5000),
  isImportant: z.boolean().default(false),
})

export const updateNoticeBodySchema = z
  .object({
    content: z.string().min(10).max(5000).optional(),
    isImportant: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export const noticeParamsSchema = z.object({
  id: z.coerce.number().positive(),
})

export const noticeQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(50).default(10),
})

// --- Types ---
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateComplaintInput = z.infer<typeof createComplaintSchema>
export type UpdateComplaintInput = z.infer<typeof updateComplaintBodySchema>
export type CreateNoticeInput = z.infer<typeof createNoticeSchema>
export type UpdateNoticeInput = z.infer<typeof updateNoticeBodySchema>