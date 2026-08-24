import { Router } from 'express'
import { db } from '../db/connection.ts'
import * as schema from '../db/schema.ts'
import { eq, desc, and, gte, lte, ilike } from 'drizzle-orm'
import { authenticateToken, requireResident, type AuthenticatedRequest } from '../middleware/auth.ts'
import { validateBody, validateParams, validateQuery } from '../middleware/validation.ts'
import {
  createComplaintSchema,
  complaintParamsSchema,
  complaintQuerySchema,
} from '../validators/schemas.ts'
import { upload, getFileUrl } from '../utils/upload.ts'
import { sendComplaintStatusEmail } from '../services/email.ts'

const router = Router()

// POST /api/complaints - Create a new complaint (with optional photo)
router.post(
  '/',
  authenticateToken,
  requireResident,
  upload.single('photo'),
  validateBody(createComplaintSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { category, description } = req.body
      const residentId = req.user!.id

      let photoUrl: string | undefined
      if (req.file) {
        photoUrl = getFileUrl(req.file.filename)
      }

      const [complaint] = await db
        .insert(schema.complaints)
        .values({
          residentId,
          category,
          description,
          photoUrl,
          status: 'Open',
          priority: 'Low',
          isOverdue: false,
        })
        .returning()

      // Create initial history entry
      await db.insert(schema.complaintHistory).values({
        complaintId: complaint.id,
        actorId: residentId,
        newStatus: 'Open',
        note: 'Complaint created',
      })

      const [complaintWithRelations] = await db.query.complaints.findMany({
        where: eq(schema.complaints.id, complaint.id),
        with: {
          resident: { columns: { name: true, email: true } },
          history: {
            orderBy: (history, { desc }) => [desc(history.timestamp)],
            with: { actor: { columns: { name: true } } },
          },
        },
        limit: 1,
      })

      res.status(201).json({
        message: 'Complaint created successfully',
        complaint: complaintWithRelations,
      })
    } catch (error) {
      console.error('Create complaint error:', error)
      res.status(500).json({ error: 'Failed to create complaint' })
    }
  }
)

// GET /api/complaints - List resident's own complaints with filters
router.get(
  '/',
  authenticateToken,
  requireResident,
  validateQuery(complaintQuerySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const residentId = req.user!.id
      const { page, limit, status, category, startDate, endDate } = req.query

      const conditions = [eq(schema.complaints.residentId, residentId)]

      if (status) {
        conditions.push(eq(schema.complaints.status, status))
      }
      if (category) {
        conditions.push(ilike(schema.complaints.category, `%${category}%`))
      }
      if (startDate) {
        conditions.push(gte(schema.complaints.createdAt, new Date(startDate)))
      }
      if (endDate) {
        conditions.push(lte(schema.complaints.createdAt, new Date(endDate)))
      }

      const offset = (page - 1) * limit

      const [complaints, totalResult] = await Promise.all([
        db.query.complaints.findMany({
          where: and(...conditions),
          with: {
            resident: { columns: { name: true, email: true } },
            history: {
              orderBy: (history, { desc }) => [desc(history.timestamp)],
              with: { actor: { columns: { name: true } } },
            },
          },
          orderBy: (complaints, { desc }) => [desc(complaints.createdAt)],
          limit,
          offset,
        }),
        db
          .select({ count: schema.complaints.id })
          .from(schema.complaints)
          .where(and(...conditions)),
      ])

      const total = totalResult.length

      res.json({
        complaints,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error('List complaints error:', error)
      res.status(500).json({ error: 'Failed to list complaints' })
    }
  }
)

// GET /api/complaints/:id - Get single complaint with full history
router.get(
  '/:id',
  authenticateToken,
  requireResident,
  validateParams(complaintParamsSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const complaintId = Number(req.params.id)
      const residentId = req.user!.id

      const [complaint] = await db.query.complaints.findMany({
        where: and(
          eq(schema.complaints.id, complaintId),
          eq(schema.complaints.residentId, residentId)
        ),
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

      res.json({ complaint })
    } catch (error) {
      console.error('Get complaint error:', error)
      res.status(500).json({ error: 'Failed to get complaint' })
    }
  }
)

export default router