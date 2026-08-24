export interface User {
  id: number
  name: string
  email: string
  role: 'resident' | 'admin'
  createdAt: string
  avatar?: string
}

export interface Complaint {
  id: number
  residentId: number
  category: string
  description: string
  photoUrl?: string
  status: 'Open' | 'In Progress' | 'Resolved'
  priority: 'Low' | 'Medium' | 'High'
  isOverdue: boolean
  createdAt: string
  resident?: User
  history?: ComplaintHistory[]
}

export interface ComplaintHistory {
  id: number
  complaintId: number
  actorId: number
  newStatus: 'Open' | 'In Progress' | 'Resolved'
  note?: string
  timestamp: string
  actor?: User
}

export interface Notice {
  id: number
  content: string
  isImportant: boolean
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface MetricsData {
  byStatus: Array<{ status: string; count: number }>
  byCategory: Array<{ category: string; count: number }>
  overdueCount: number
  totalComplaints: number
}

export interface ComplaintFilters {
  page?: number
  limit?: number
  status?: 'Open' | 'In Progress' | 'Resolved'
  category?: string
  priority?: 'Low' | 'Medium' | 'High'
  residentId?: number
  startDate?: string
  endDate?: string
  isOverdue?: boolean
  sortBy?: 'createdAt' | 'priority' | 'status' | 'isOverdue'
  sortOrder?: 'asc' | 'desc'
  [key: string]: unknown
}

export interface NoticeFilters {
  page?: number
  limit?: number
  [key: string]: unknown
}

export interface CreateComplaintInput {
  category: string
  description: string
  photo?: File
}

export interface UpdateComplaintInput {
  status?: 'Open' | 'In Progress' | 'Resolved'
  priority?: 'Low' | 'Medium' | 'High'
  isOverdue?: boolean
  note?: string
}

export interface CreateNoticeInput {
  content: string
  isImportant: boolean
}

export interface UpdateNoticeInput {
  content?: string
  isImportant?: boolean
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  message: string
  user: User
}

export interface ApiError {
  error: string
  details?: Array<{ field: string; message: string }>
}