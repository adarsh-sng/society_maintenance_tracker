import { z } from 'zod'

// --- Auth ---
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(256),
    email: z.string().email().max(256),
    password: z.string().min(8).max(128),
  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().max(256),
    password: z.string().min(8).max(128),
  }),
})

// --- Complaints (Resident) ---
export const createComplaintSchema = z.object({
  body: z.object({
    category: z.string().min(2).max(128),
    description: z.string().min(10).max(5000),
  }),
})

export const complaintParamsSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
})

export const complaintQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().positive().default(1),
    limit: z.coerce.number().positive().max(50).default(10),
    status: z.enum(['Open', 'In Progress', 'Resolved']).optional(),
    category: z.string().max(128).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
})

// --- Admin Complaints ---
export const adminComplaintQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().positive().default(1),
    limit: z.coerce.number().positive().max(100).default(20),
    status: z.enum(['Open', 'In Progress', 'Resolved']).optional(),
    category: z.string().max(128).optional(),
    priority: z.enum(['Low', 'Medium', 'High']).optional(),
    residentId: z.coerce.number().positive().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isOverdue: z.coerce.boolean().optional(),
    sortBy: z.enum(['createdAt', 'priority', 'status', 'isOverdue']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
})

export const updateComplaintSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    status: z.enum(['Open', 'In Progress', 'Resolved']).optional(),
    priority: z.enum(['Low', 'Medium', 'High']).optional(),
    isOverdue: z.boolean().optional(),
    note: z.string().max(1000).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
})

export const flagOverdueSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
})

// --- Notices ---
export const createNoticeSchema = z.object({
  body: z.object({
    content: z.string().min(10).max(5000),
    isImportant: z.boolean().default(false),
  }),
})

export const updateNoticeSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    content: z.string().min(10).max(5000).optional(),
    isImportant: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
})

export const noticeParamsSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
})

export const noticeQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().positive().default(1),
    limit: z.coerce.number().positive().max(50).default(10),
  }),
})

// --- Metrics ---
export const metricsQuerySchema = z.object({
  query: z.object({}),
})

// --- File Upload ---
export const uploadFileSchema = z.object({
  body: z.object({}),
})

// --- Types ---
export type RegisterInput = z.infer<typeof registerSchema.shape.body>
export type LoginInput = z.infer<typeof loginSchema.shape.body>
export type CreateComplaintInput = z.infer<typeof createComplaintSchema.shape.body>
export type UpdateComplaintInput = z.infer<typeof updateComplaintSchema.shape.body>
export type CreateNoticeInput = z.infer<typeof createNoticeSchema.shape.body>
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema.shape.body>