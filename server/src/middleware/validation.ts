import type { Request, Response, NextFunction } from 'express'
import { ZodError, ZodType } from 'zod'

/**
 * Validation middleware stores the parsed (coerced + defaulted) value on
 * res.locals — Express 5 regenerates req.query per access, so writing back
 * to it is unreliable. Handlers should read from getValidated* helpers below.
 */
export const getValidatedBody = <T>(res: Response): T => res.locals.validatedBody as T
export const getValidatedQuery = <T>(res: Response): T => res.locals.validatedQuery as T
export const getValidatedParams = <T>(res: Response): T => res.locals.validatedParams as T

export const validateBody =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      res.locals.validatedBody = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        })
      }
      next(error)
    }
  }

export const validateParams =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      res.locals.validatedParams = schema.parse(req.params)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        })
      }
      next(error)
    }
  }

export const validateQuery =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      res.locals.validatedQuery = schema.parse(req.query)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        })
      }
      next(error)
    }
  }