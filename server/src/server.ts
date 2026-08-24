import { env, isDev, isTestEnv } from '../env.ts'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Request, Response } from 'express'

import authRoutes from './routes/auth.ts'
import complaintRoutes from './routes/complaints.ts'
import adminRoutes from './routes/admin.ts'
import noticeRoutes from './routes/notices.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(
  morgan('dev', {
    skip: () => isTestEnv(),
  })
)

// Static file serving for uploads
app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Society Maintenance Tracker API',
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/complaints', complaintRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/notices', noticeRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  })
})

// Global error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack)
    res.status(500).json({
      error: 'Something went wrong!',
      ...(isDev() && { details: err.message }),
    })
  }
)

export { app }

export default app