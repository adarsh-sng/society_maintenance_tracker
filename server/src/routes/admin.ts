import { Router } from 'express'
import type { Request, Response } from 'express'
import { db } from '../db/connection.ts'
import * as schema from '../db/schema.ts'
import { eq, desc, asc, and, gte, lte, count, sql } from 'drizzle-orm'
import { authenticateToken, requireAdmin, type AuthenticatedRequest } from '../middleware/auth.ts'
import {
  validateBody,
  validateParams,
  validateQuery,
  getValidatedBody,
  getValidatedQuery,
} from '../middleware/validation.ts'
import {
  adminComplaintQuerySchema,
  updateComplaintBodySchema,
  complaintParamsSchema,
} from '../validators/schemas.ts'
import { checkAndMarkOverdue } from '../utils/overdue.ts'
import { sendComplaintStatusEmail } from '../services/email.ts'

const router = Router()

type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved'
type ComplaintPriority = 'Low' | 'Medium' | 'High'

// GET /api/admin/metrics - Dashboard metrics (Admin only)
// NOTE: declared before '/complaints/:id' so 'metrics' is never captured as :id
router.get(
  '/metrics',
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const [byStatus, byCategory, overdueCount, totalComplaints] = await Promise.all([
        db
          .select({ status: schema.complaints.status, value: count() })
          .from(schema.complaints)
          .groupBy(schema.complaints.status),
        db
          .select({ category: schema.complaints.category, value: count() })
          .from(schema.complaints)
          .groupBy(schema.complaints.category),
        db
          .select({ value: count() })
          .from(schema.complaints)
          .where(
            and(eq(schema.complaints.isOverdue, true), sql`${schema.complaints.status} != 'Resolved'`)
          ),
        db.select({ value: count() }).from(schema.complaints),
      ])

      res.json({
        byStatus: byStatus.map((s) => ({ status: s.status, count: s.value })),
        byCategory: byCategory.map((c) => ({ category: c.category, count: c.value })),
        overdueCount: overdueCount[0]?.value ?? 0,
        totalComplaints: totalComplaints[0]?.value ?? 0,
      })
    } catch (error) {
      console.error('Metrics error:', error)
      res.status(500).json({ error: 'Failed to get metrics' })
    }
  }
)

// GET /api/admin/complaints - List all complaints with filters (Admin only)
router.get(
  '/complaints',
  authenticateToken,
  requireAdmin,
  validateQuery(adminComplaintQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const query = getValidatedQuery<{
        page: number
        limit: number
        status?: ComplaintStatus
        category?: string
        priority?: ComplaintPriority
        residentId?: number
        startDate?: string
        endDate?: string
        isOverdue?: boolean
        sortBy: 'createdAt' | 'priority' | 'status' | 'isOverdue'
        sortOrder: 'asc' | 'desc'
      }>(res)

      const conditions = []

      if (query.status) conditions.push(eq(schema.complaints.status, query.status))
      if (query.category) conditions.push(eq(schema.complaints.category, query.category))
      if (query.priority) conditions.push(eq(schema.complaints.priority, query.priority))
      if (query.residentId) conditions.push(eq(schema.complaints.residentId, query.residentId))
      if (query.startDate) conditions.push(gte(schema.complaints.createdAt, new Date(query.startDate)))
      if (query.endDate) conditions.push(lte(schema.complaints.createdAt, new Date(query.endDate)))
      if (query.isOverdue !== undefined) {
        conditions.push(eq(schema.complaints.isOverdue, query.isOverdue))
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined
      const offset = (query.page - 1) * query.limit

      const sortColumn =
        query.sortBy === 'priority'
          ? schema.complaints.priority
          : query.sortBy === 'status'
            ? schema.complaints.status
            : query.sortBy === 'isOverdue'
              ? schema.complaints.isOverdue
              : schema.complaints.createdAt

      // Overdue first, then chosen sort direction on the requested column
      const orderBy = [desc(schema.complaints.isOverdue), query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)]

      const [complaints, totalResult] = await Promise.all([
        db.query.complaints.findMany({
          where,
          with: {
            resident: { columns: { name: true, email: true } },
            history: {
              orderBy: (history, { desc }) => [desc(history.timestamp)],
              with: { actor: { columns: { name: true, role: true } } },
            },
          },
          orderBy,
          limit: query.limit,
          offset,
        }),
        db.select({ value: count() }).from(schema.complaints).where(where),
      ])

      const total = totalResult[0]?.value ?? 0

      // Recompute overdue against the configured threshold for open complaints
      const complaintsWithOverdue = complaints.map((complaint) => {
        const isOverdueNow =
          checkAndMarkOverdue(complaint) || (complaint.status !== 'Resolved' && complaint.isOverdue)
        return { ...complaint, isOverdue: isOverdueNow }
      })

      res.json({
        complaints: complaintsWithOverdue,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      })
    } catch (error) {
      console.error('Admin list complaints error:', error)
      res.status(500).json({ error: 'Failed to list complaints' })
    }
  }
)

// GET /api/admin/complaints/:id - Get single complaint with full history (Admin)
router.get(
  '/complaints/:id',
  authenticateToken,
  requireAdmin,
  validateParams(complaintParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const complaintId = Number(req.params.id)

      const [complaint] = await db.query.complaints.findMany({
        where: eq(schema.complaints.id, complaintId),
        with: {
          resident: { columns: { name: true, email: true } },
          history: {
            orderBy: (history, { desc }) => [desc(history.timestamp)],
            with: { actor: { columns: { name: true, role: true } } },
          },
        },
        limit: 1,
      })

      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' })
      }

      const isOverdueNow = checkAndMarkOverdue(complaint) || complaint.isOverdue

      res.json({ complaint: { ...complaint, isOverdue: isOverdueNow } })
    } catch (error) {
      console.error('Admin get complaint error:', error)
      res.status(500).json({ error: 'Failed to get complaint' })
    }
  }
)

// PATCH /api/admin/complaints/:id - Update status, priority, overdue flag (Admin)
router.patch(
  '/complaints/:id',
  authenticateToken,
  requireAdmin,
  validateParams(complaintParamsSchema),
  validateBody(updateComplaintBodySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const complaintId = Number(req.params.id)
      const adminId = req.user!.id
      const body = getValidatedBody<{
        status?: ComplaintStatus
        priority?: ComplaintPriority
        isOverdue?: boolean
        note?: string
      }>(res)

      const [existingComplaint] = await db
        .select()
        .from(schema.complaints)
        .where(eq(schema.complaints.id, complaintId))
        .limit(1)

      if (!existingComplaint) {
        return res.status(404).json({ error: 'Complaint not found' })
      }

      if (existingComplaint.status === 'Resolved') {
        return res
          .status(400)
          .json({ error: 'Resolved complaints are closed and cannot be updated' })
      }

      const oldStatus = existingComplaint.status
      const updateData: Partial<typeof schema.complaints.$inferInsert> = {}

      if (body.status && body.status !== oldStatus) updateData.status = body.status
      if (body.priority) updateData.priority = body.priority
      if (body.isOverdue !== undefined) updateData.isOverdue = body.isOverdue

      if (Object.keys(updateData).length > 0) {
        await db
          .update(schema.complaints)
          .set(updateData)
          .where(eq(schema.complaints.id, complaintId))
      }

      // Status change -> history entry + resident email
      if (body.status && body.status !== oldStatus) {
        await db.insert(schema.complaintHistory).values({
          complaintId,
          actorId: adminId,
          newStatus: body.status,
          note: body.note || `Status changed from ${oldStatus} to ${body.status}`,
        })

        const [resident] = await db
          .select({ email: schema.users.email, name: schema.users.name })
          .from(schema.users)
          .where(eq(schema.users.id, existingComplaint.residentId))
          .limit(1)

        if (resident) {
          // Fire-and-forget: don't fail the request if email fails
          void sendComplaintStatusEmail(
            resident.email,
            resident.name,
            complaintId,
            existingComplaint.category,
            oldStatus,
            body.status,
            body.note
          ).catch((err) => console.error('Status email failed:', err))
        }
      }

      // Manual overdue flag change -> history entry
      if (body.isOverdue !== undefined && body.isOverdue !== existingComplaint.isOverdue) {
        await db.insert(schema.complaintHistory).values({
          complaintId,
          actorId: adminId,
          newStatus: body.status ?? existingComplaint.status,
          note: body.isOverdue ? 'Manually flagged as overdue' : 'Overdue flag removed',
        })
      }

      const [complaintWithRelations] = await db.query.complaints.findMany({
        where: eq(schema.complaints.id, complaintId),
        with: {
          resident: { columns: { name: true, email: true } },
          history: {
            orderBy: (history, { desc }) => [desc(history.timestamp)],
            with: { actor: { columns: { name: true, role: true } } },
          },
        },
        limit: 1,
      })

      res.json({
        message: 'Complaint updated successfully',
        complaint: complaintWithRelations,
      })
    } catch (error) {
      console.error('Admin update complaint error:', error)
      res.status(500).json({ error: 'Failed to update complaint' })
    }
  }
)

// POST /api/admin/complaints/:id/flag-overdue - Manually flag as overdue
router.post(
  '/complaints/:id/flag-overdue',
  authenticateToken,
  requireAdmin,
  validateParams(complaintParamsSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const complaintId = Number(req.params.id)
      const adminId = req.user!.id

      const [existingComplaint] = await db
        .select()
        .from(schema.complaints)
        .where(eq(schema.complaints.id, complaintId))
        .limit(1)

      if (!existingComplaint) {
        return res.status(404).json({ error: 'Complaint not found' })
      }

      if (existingComplaint.status === 'Resolved') {
        return res.status(400).json({ error: 'Cannot flag resolved complaint as overdue' })
      }

      await db
        .update(schema.complaints)
        .set({ isOverdue: true })
        .where(eq(schema.complaints.id, complaintId))

      await db.insert(schema.complaintHistory).values({
        complaintId,
        actorId: adminId,
        newStatus: existingComplaint.status,
        note: 'Manually flagged as overdue by admin',
      })

      const [complaintWithRelations] = await db.query.complaints.findMany({
        where: eq(schema.complaints.id, complaintId),
        with: {
          resident: { columns: { name: true, email: true } },
          history: {
            orderBy: (history, { desc }) => [desc(history.timestamp)],
            with: { actor: { columns: { name: true, role: true } } },
          },
        },
        limit: 1,
      })

      res.json({
        message: 'Complaint flagged as overdue',
        complaint: complaintWithRelations,
      })
    } catch (error) {
      console.error('Flag overdue error:', error)
      res.status(500).json({ error: 'Failed to flag complaint as overdue' })
    }
  }
)

export default router