import { env as loadEnv } from 'custom-env'
import { z } from 'zod'

process.env.APP_STAGE = process.env.APP_STAGE || 'dev'

const isProduction = process.env.APP_STAGE === 'production'
const isDevelopment = process.env.APP_STAGE === 'dev'
const isTest = process.env.APP_STAGE === 'test'

// Load .env file
if (isDevelopment) {
  loadEnv()
} else if (isTest) {
  loadEnv('test')
}

const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  APP_STAGE: z.enum(['dev', 'production', 'test']).default('dev'),

  // Server
  PORT: z.coerce.number().positive().default(3000),
  HOST: z.string().default('localhost'),

   DATABASE_URL: z.string().startsWith('postgresql://'),
  DATABASE_POOL_MIN: z.coerce.number().min(0).default(2),
  DATABASE_POOL_MAX: z.coerce.number().positive().default(10),

    // CORS
  CORS_ORIGIN: z
    .string()
    .or(z.array(z.string()))
    .transform((val) => {
      if (typeof val === 'string') {
        return val.split(',').map((origin) => origin.trim())
      }
      return val
    })
    .default([]),

  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug', 'trace'])
    .default(isProduction ? 'info' : 'debug'),
})

export type Env = z.infer<typeof envSchema>

let env: Env

try {
  env = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(z.treeifyError(error)))

    // More detailed error messages
    error.issues.forEach((err) => {
      const path = err.path.join('.')
      console.error(`  ${path}: ${err.message}`)
    })

    process.exit(1)
  }
  throw error
}

// Helper functions for environment checks
export const isProd = () => env.NODE_ENV === 'production'
export const isDev = () => env.NODE_ENV === 'development'
export const isTestEnv = () => env.NODE_ENV === 'test'

// Export the validated environment object
export { env }

// Default export for convenience
export default env