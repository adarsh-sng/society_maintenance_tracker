import { Router } from 'express'
import type { Request, Response } from 'express'
import { db } from '../db/connection.ts'
import * as schema from '../db/schema.ts'
import { eq, desc, and, gte, lte } from 'drizzle-orm'
import { count } from 'drizzle-orm'
import { authenticateToken, requireResident, type AuthenticatedRequest } from '../middleware/auth.ts'
import { validateBody, validateParams, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation.ts'
import {
  createComplaintSchema,
  complaintParamsSchema,
  complaintQuerySchema,
} from '../validators/schemas.ts'
import { upload, getFileUrl } from '../utils/upload.ts'

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
      const { category, description } = getValidatedBody<{
        category: string
        description: string
      }>(res)
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
      const query = getValidatedQuery<{
        page: number
        limit: number
        status?: 'Open' | 'In Progress' | 'Resolved'
        category?: string
        startDate?: string
        endDate?: string
      }>(res)

      const conditions = [eq(schema.complaints.residentId, residentId)]

      if (query.status) {
        conditions.push(eq(schema.complaints.status, query.status))
      }
      if (query.category) {
        conditions.push(eq(schema.complaints.category, query.category))
      }
      if (query.startDate) {
        conditions.push(gte(schema.complaints.createdAt, new Date(query.startDate)))
      }
      if (query.endDate) {
        conditions.push(lte(schema.complaints.createdAt, new Date(query.endDate)))
      }

      const where = and(...conditions)
      const offset = (query.page - 1) * query.limit

      const [complaints, totalResult] = await Promise.all([
        db.query.complaints.findMany({
          where,
          with: {
            resident: { columns: { name: true, email: true } },
            history: {
              orderBy: (history, { desc }) => [desc(history.timestamp)],
              with: { actor: { columns: { name: true } } },
            },
          },
          orderBy: (complaints, { desc }) => [desc(complaints.createdAt)],
          limit: query.limit,
          offset,
        }),
        db.select({ value: count() }).from(schema.complaints).where(where),
      ])

      const total = totalResult[0]?.value ?? 0

      res.json({
        complaints,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
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