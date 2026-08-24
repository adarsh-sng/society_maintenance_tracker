import { SignJWT, jwtVerify } from 'jose'
import { createSecretKey } from 'crypto'
import { env } from '../../env.ts'

export interface JwtPayload {
  id: number
  email: string
  name: string
  role: 'resident' | 'admin'
  [key: string]: unknown
}

const getSecretKey = () => createSecretKey(env.JWT_SECRET, 'utf-8')

export const generateToken = async (payload: JwtPayload): Promise<string> => {
  return await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(getSecretKey())
}

export const verifyToken = async (token: string): Promise<JwtPayload> => {
  const { payload } = await jwtVerify(token, getSecretKey())
  return {
    id: payload.id as number,
    email: payload.email as string,
    name: payload.name as string,
    role: payload.role as 'resident' | 'admin',
  }
}

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    }
  } catch {
    return null
  }
}

export const setAuthCookie = (res: any, token: string) => {
  const isProduction = env.NODE_ENV === 'production'
  res.cookie(env.JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  })
}

export const clearAuthCookie = (res: any) => {
  const isProduction = env.NODE_ENV === 'production'
  res.clearCookie(env.JWT_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  })
}

export const getTokenFromCookie = (req: any): string | undefined => {
  return req.cookies?.[env.JWT_COOKIE_NAME]
}