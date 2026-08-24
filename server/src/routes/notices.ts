import { Router } from 'express'
import { db } from '../db/connection.ts'
import * as schema from '../db/schema.ts'
import { eq, desc, and } from 'drizzle-orm'
import { authenticateToken, requireAdmin, type AuthenticatedRequest } from '../middleware/auth.ts'
import { validateBody, validateParams, validateQuery } from '../middleware/validation.ts'
import {
  createNoticeSchema,
  updateNoticeSchema,
  noticeParamsSchema,
  noticeQuerySchema,
} from '../validators/schemas.ts'
import { sendImportantNoticeEmail } from '../services/email.ts'

const router = Router()

// GET /api/notices - List all notices (Public, important pinned first)
router.get(
  '/',
  validateQuery(noticeQuerySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page, limit } = req.query
      const offset = (page - 1) * limit

      const [notices, totalResult] = await Promise.all([
        db.query.notices.findMany({
          orderBy: (notices, { desc }) => [desc(notices.isImportant), desc(notices.createdAt)],
          limit,
          offset,
        }),
        db.select({ count: count() }).from(schema.notices),
      ])

      const total = totalResult[0]?.count ?? 0

      res.json({
        notices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error('List notices error:', error)
      res.status(500).json({ error: 'Failed to list notices' })
    }
  }
)

// GET /api/notices/:id - Get single notice
router.get(
  '/:id',
  validateParams(noticeParamsSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const noticeId = Number(req.params.id)

      const [notice] = await db.query.notices.findMany({
        where: eq(schema.notices.id, noticeId),
        limit: 1,
      })

      if (!notice) {
        return res.status(404).json({ error: 'Notice not found' })
      }

      res.json({ notice })
    } catch (error) {
      console.error('Get notice error:', error)
      res.status(500).json({ error: 'Failed to get notice' })
    }
  }
)

// POST /api/notices - Create notice (Admin only)
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validateBody(createNoticeSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { content, isImportant } = req.body

      const [notice] = await db
        .insert(schema.notices)
        .values({ content, isImportant })
        .returning()

      // If important, send email to all residents
      if (isImportant) {
        const residents = await db
          .select({ email: schema.users.email, name: schema.users.name })
          .from(schema.users)
          .where(eq(schema.users.role, 'resident'))

        for (const resident of residents) {
          await sendImportantNoticeEmail(resident.email, resident.name, content)
        }
      }

      res.status(201).json({
        message: 'Notice created successfully',
        notice,
      })
    } catch (error) {
      console.error('Create notice error:', error)
      res.status(500).json({ error: 'Failed to create notice' })
    }
  }
)

// PATCH /api/notices/:id - Update notice (Admin only)
router.patch(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateParams(updateNoticeSchema),
  validateBody(updateNoticeSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const noticeId = Number(req.params.id)
      const { content, isImportant } = req.body

      const [existingNotice] = await db
        .select()
        .from(schema.notices)
        .where(eq(schema.notices.id, noticeId))
        .limit(1)

      if (!existingNotice) {
        return res.status(404).json({ error: 'Notice not found' })
      }

      const updateData: Partial<typeof schema.notices.$inferInsert> = {}
      if (content !== undefined) updateData.content = content
      if (isImportant !== undefined) updateData.isImportant = isImportant

      const [updated] = await db
        .update(schema.notices)
        .set(updateData)
        .where(eq(schema.notices.id, noticeId))
        .returning()

      // If newly marked as important, send emails
      if (isImportant === true && existingNotice.isImportant === false) {
        const residents = await db
          .select({ email: schema.users.email, name: schema.users.name })
          .from(schema.users)
          .where(eq(schema.users.role, 'resident'))

        for (const resident of residents) {
          await sendImportantNoticeEmail(resident.email, resident.name, content || existingNotice.content)
        }
      }

      res.json({
        message: 'Notice updated successfully',
        notice: updated,
      })
    } catch (error) {
      console.error('Update notice error:', error)
      res.status(500).json({ error: 'Failed to update notice' })
    }
  }
)

// DELETE /api/notices/:id - Delete notice (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateParams(noticeParamsSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const noticeId = Number(req.params.id)

      const [existingNotice] = await db
        .select()
        .from(schema.notices)
        .where(eq(schema.notices.id, noticeId))
        .limit(1)

      if (!existingNotice) {
        return res.status(404).json({ error: 'Notice not found' })
      }

      await db.delete(schema.notices).where(eq(schema.notices.id, noticeId))

      res.json({ message: 'Notice deleted successfully' })
    } catch (error) {
      console.error('Delete notice error:', error)
      res.status(500).json({ error: 'Failed to delete notice' })
    }
  }
)

export default router