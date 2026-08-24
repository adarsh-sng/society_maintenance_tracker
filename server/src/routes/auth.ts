import { Router } from 'express'
import type { Request, Response } from 'express'
import { db } from '../db/connection.ts'
import * as schema from '../db/schema.ts'
import { eq } from 'drizzle-orm'
import { hashPassword, comparePassword } from '../utils/password.ts'
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/jwt.ts'
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.ts'
import { validateBody, getValidatedBody } from '../middleware/validation.ts'
import { registerSchema, loginSchema } from '../validators/schemas.ts'

const router = Router()

// POST /api/auth/register - Resident registration
router.post(
  '/register',
  validateBody(registerSchema),
  async (req: Request, res: Response) => {
    try {
      const { name, email, password } = getValidatedBody<{
        name: string
        email: string
        password: string
      }>(res)

      const existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1)

      if (existingUser.length > 0) {
        return res.status(409).json({ error: 'Email already registered' })
      }

      const passwordHash = await hashPassword(password)

      const [user] = await db
        .insert(schema.users)
        .values({
          name,
          email,
          passwordHash,
          role: 'resident',
        })
        .returning({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          role: schema.users.role,
        })

      const token = await generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })

      setAuthCookie(res, token)

      res.status(201).json({
        message: 'Registration successful',
        user,
      })
    } catch (error) {
      console.error('Registration error:', error)
      res.status(500).json({ error: 'Registration failed' })
    }
  }
)

// POST /api/auth/login - Login
router.post(
  '/login',
  validateBody(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = getValidatedBody<{ email: string; password: string }>(res)

      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1)

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const isValid = await comparePassword(password, user.passwordHash)
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const token = await generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })

      setAuthCookie(res, token)

      res.json({
        message: 'Login successful',
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({ error: 'Login failed' })
    }
  }
)

// POST /api/auth/logout - Logout
router.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res)
  res.json({ message: 'Logged out successfully' })
})

// GET /api/auth/me - Get current user
router.get(
  '/me',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const [user] = await db
        .select({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
        })
        .from(schema.users)
        .where(eq(schema.users.id, req.user!.id))
        .limit(1)

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json({ user })
    } catch (error) {
      console.error('Get me error:', error)
      res.status(500).json({ error: 'Failed to get user' })
    }
  }
)

export default router