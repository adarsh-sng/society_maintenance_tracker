import { Router } from 'express'
import { db } from '../db/connection.ts'
import * as schema from '../db/schema.ts'
import { eq, desc, and, gte, lte, ilike, count, sql } from 'drizzle-orm'
import { authenticateToken, requireAdmin, type AuthenticatedRequest } from '../middleware/auth.ts'
import { validateBody, validateParams, validateQuery } from '../middleware/validation.ts'
import {
  adminComplaintQuerySchema,
  updateComplaintSchema,
  flagOverdueSchema,
} from '../validators/schemas.ts'
import { checkAndMarkOverdue } from '../utils/overdue.ts'
import { sendComplaintStatusEmail } from '../services/email.ts'

const router = Router()

// GET /api/admin/complaints - List all complaints with filters (Admin only)
router.get(
  '/complaints',
  authenticateToken,
  requireAdmin,
  validateQuery(adminComplaintQuerySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        page,
        limit,
        status,
        category,
        priority,
        residentId,
        startDate,
        endDate,
        isOverdue,
        sortBy,
        sortOrder,
      } = req.query

      const conditions = []

      if (status) {
        conditions.push(eq(schema.complaints.status, status))
      }
      if (category) {
        conditions.push(ilike(schema.complaints.category, `%${category}%`))
      }
      if (priority) {
        conditions.push(eq(schema.complaints.priority, priority))
      }
      if (residentId) {
        conditions.push(eq(schema.complaints.residentId, Number(residentId)))
      }
      if (startDate) {
        conditions.push(gte(schema.complaints.createdAt, new Date(startDate)))
      }
      if (endDate) {
        conditions.push(lte(schema.complaints.createdAt, new Date(endDate)))
      }
      if (isOverdue !== undefined) {
        conditions.push(eq(schema.complaints.isOverdue, isOverdue))
      }

      const offset = (page - 1) * limit

      const orderByColumn = schema.complaints[sortBy as keyof typeof schema.complaints]
      const orderBy = sortOrder === 'asc' ? orderByColumn : desc(orderByColumn)

      const [complaints, totalResult] = await Promise.all([
        db.query.complaints.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          with: {
            resident: { columns: { name: true, email: true } },
            history: {
              orderBy: (history, { desc }) => [desc(history.timestamp)],
              with: { actor: { columns: { name: true, role: true } } },
            },
          },
          orderBy,
          limit,
          offset,
        }),
        db
          .select({ count: count() })
          .from(schema.complaints)
          .where(conditions.length > 0 ? and(...conditions) : undefined),
      ])

      const total = totalResult[0]?.count ?? 0

      // Check and mark overdue for each complaint
      const complaintsWithOverdue = complaints.map((complaint) => {
        const isOverdueNow = checkAndMarkOverdue(complaint)
        return { ...complaint, isOverdue: isOverdueNow || complaint.isOverdue }
      })

      res.json({
        complaints: complaintsWithOverdue,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
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
  validateParams(flagOverdueSchema),
  async (req: AuthenticatedRequest, res: Response) => {
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

      const isOverdueNow = checkAndMarkOverdue(complaint)

      res.json({ complaint: { ...complaint, isOverdue: isOverdueNow || complaint.isOverdue } })
    } catch (error) {
      console.error('Admin get complaint error:', error)
      res.status(500).json({ error: 'Failed to get complaint' })
    }
  }
)

// PATCH /api/admin/complaints/:id - Update complaint status, priority, overdue flag (Admin)
router.patch(
  '/complaints/:id',
  authenticateToken,
  requireAdmin,
  validateParams(updateComplaintSchema),
  validateBody(updateComplaintSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const complaintId = Number(req.params.id)
      const adminId = req.user!.id
      const { status, priority, isOverdue, note } = req.body

      const [existingComplaint] = await db
        .select()
        .from(schema.complaints)
        .where(eq(schema.complaints.id, complaintId))
        .limit(1)

      if (!existingComplaint) {
        return res.status(404).json({ error: 'Complaint not found' })
      }

      const oldStatus = existingComplaint.status
      const updateData: Partial<typeof schema.complaints.$inferInsert> = {}

      if (status && status !== oldStatus) {
        updateData.status = status
      }
      if (priority) {
        updateData.priority = priority
      }
      if (isOverdue !== undefined) {
        updateData.isOverdue = isOverdue
      }

      let updatedComplaint = existingComplaint
      if (Object.keys(updateData).length > 0) {
        const [updated] = await db
          .update(schema.complaints)
          .set(updateData)
          .where(eq(schema.complaints.id, complaintId))
          .returning()
        updatedComplaint = updated
      }

      // If status changed, create history entry and send email
      if (status && status !== oldStatus) {
        await db.insert(schema.complaintHistory).values({
          complaintId,
          actorId: adminId,
          newStatus: status,
          note: note || `Status changed from ${oldStatus} to ${status}`,
        })

        // Send email to resident
        const [resident] = await db
          .select({ email: schema.users.email, name: schema.users.name })
          .from(schema.users)
          .where(eq(schema.users.id, existingComplaint.residentId))
          .limit(1)

        if (resident) {
          await sendComplaintStatusEmail(
            resident.email,
            resident.name,
            complaintId,
            existingComplaint.category,
            oldStatus,
            status,
            note
          )
        }
      }

      // If manually flagged as overdue, create history entry
      if (isOverdue !== undefined && isOverdue !== existingComplaint.isOverdue) {
        await db.insert(schema.complaintHistory).values({
          complaintId,
          actorId: adminId,
          newStatus: existingComplaint.status,
          note: isOverdue ? 'Manually flagged as overdue' : 'Overdue flag removed',
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
  validateParams(flagOverdueSchema),
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

      const [updated] = await db
        .update(schema.complaints)
        .set({ isOverdue: true })
        .where(eq(schema.complaints.id, complaintId))
        .returning()

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

// GET /api/admin/metrics - Dashboard metrics (Admin only)
router.get(
  '/metrics',
  authenticateToken,
  requireAdmin,
  validateQuery(metricsQuerySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const [byStatus, byCategory, overdueCount, totalComplaints] = await Promise.all([
        db
          .select({
            status: schema.complaints.status,
            count: count(),
          })
          .from(schema.complaints)
          .groupBy(schema.complaints.status),
        db
          .select({
            category: schema.complaints.category,
            count: count(),
          })
          .from(schema.complaints)
          .groupBy(schema.complaints.category),
        db
          .select({ count: count() })
          .from(schema.complaints)
          .where(and(eq(schema.complaints.isOverdue, true), sql`${schema.complaints.status} != 'Resolved'`)),
        db.select({ count: count() }).from(schema.complaints),
      ])

      res.json({
        byStatus: byStatus.map((s) => ({ status: s.status, count: s.count })),
        byCategory: byCategory.map((c) => ({ category: c.category, count: c.count })),
        overdueCount: overdueCount[0]?.count ?? 0,
        totalComplaints: totalComplaints[0]?.count ?? 0,
      })
    } catch (error) {
      console.error('Metrics error:', error)
      res.status(500).json({ error: 'Failed to get metrics' })
    }
  }
)

export default router