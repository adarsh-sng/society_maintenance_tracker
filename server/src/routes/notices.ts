import { Router } from 'express'
import type { Request, Response } from 'express'
import { db } from '../db/connection.ts'
import * as schema from '../db/schema.ts'
import { eq, desc, count } from 'drizzle-orm'
import { authenticateToken, requireAdmin, type AuthenticatedRequest } from '../middleware/auth.ts'
import {
  validateBody,
  validateParams,
  validateQuery,
  getValidatedBody,
  getValidatedQuery,
} from '../middleware/validation.ts'
import {
  createNoticeSchema,
  updateNoticeBodySchema,
  noticeParamsSchema,
  noticeQuerySchema,
} from '../validators/schemas.ts'
import { sendImportantNoticeEmail } from '../services/email.ts'

const router = Router()

const notifyResidentsOfImportantNotice = async (content: string): Promise<void> => {
  const residents = await db
    .select({ email: schema.users.email, name: schema.users.name })
    .from(schema.users)
    .where(eq(schema.users.role, 'resident'))

  // Fire-and-forget: don't block the response on email delivery
  for (const resident of residents) {
    void sendImportantNoticeEmail(resident.email, resident.name, content).catch((err) =>
      console.error('Notice email failed:', err)
    )
  }
}

// GET /api/notices - List all notices (Public, important pinned first)
router.get(
  '/',
  validateQuery(noticeQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const query = getValidatedQuery<{ page: number; limit: number }>(res)
      const offset = (query.page - 1) * query.limit

      const [notices, totalResult] = await Promise.all([
        db.query.notices.findMany({
          orderBy: [desc(schema.notices.isImportant), desc(schema.notices.createdAt)],
          limit: query.limit,
          offset,
        }),
        db.select({ value: count() }).from(schema.notices),
      ])

      const total = totalResult[0]?.value ?? 0

      res.json({
        notices,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
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
  async (req: Request, res: Response) => {
    try {
      const noticeId = Number(req.params.id)

      const [notice] = await db
        .select()
        .from(schema.notices)
        .where(eq(schema.notices.id, noticeId))
        .limit(1)

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
  async (req: Request, res: Response) => {
    try {
      const body = getValidatedBody<{ content: string; isImportant: boolean }>(res)

      const [notice] = await db
        .insert(schema.notices)
        .values({ content: body.content, isImportant: body.isImportant })
        .returning()

      if (body.isImportant) {
        await notifyResidentsOfImportantNotice(body.content)
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
  validateParams(noticeParamsSchema),
  validateBody(updateNoticeBodySchema),
  async (req: Request, res: Response) => {
    try {
      const noticeId = Number(req.params.id)
      const body = getValidatedBody<{ content?: string; isImportant?: boolean }>(res)

      const [existingNotice] = await db
        .select()
        .from(schema.notices)
        .where(eq(schema.notices.id, noticeId))
        .limit(1)

      if (!existingNotice) {
        return res.status(404).json({ error: 'Notice not found' })
      }

      const updateData: Partial<typeof schema.notices.$inferInsert> = {}
      if (body.content !== undefined) updateData.content = body.content
      if (body.isImportant !== undefined) updateData.isImportant = body.isImportant

      const [updated] = await db
        .update(schema.notices)
        .set(updateData)
        .where(eq(schema.notices.id, noticeId))
        .returning()

      // Newly marked important -> broadcast email
      if (body.isImportant === true && existingNotice.isImportant === false) {
        await notifyResidentsOfImportantNotice(body.content ?? existingNotice.content)
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
  async (req: Request, res: Response) => {
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