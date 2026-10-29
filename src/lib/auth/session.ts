import { cookies } from 'next/headers'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import type { Profile } from '@/types'

const COOKIE_NAME = 'mms_session'
const SECRET_KEY =
  process.env.SESSION_SECRET || 'nitte-nmamit-ise-mms-secret-key-2024-2025'

interface SessionPayload {
  userId: string
  email: string
  role: string
  exp: number
}

function signPayload(payloadStr: string): string {
  return crypto.createHmac('sha256', SECRET_KEY).update(payloadStr).digest('hex')
}

export function createToken(userId: string, email: string, role: string): string {
  const payload: SessionPayload = {
    userId,
    email,
    role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  }
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = signPayload(payloadStr)
  return `${payloadStr}.${signature}`
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null
    const [payloadStr, signature] = parts
    const expectedSig = signPayload(payloadStr)
    if (
      signature.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      return null
    }
    const payloadJson = Buffer.from(payloadStr, 'base64url').toString('utf-8')
    const payload: SessionPayload = JSON.parse(payloadJson)
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

/**
 * Sets session cookie on the server
 */
export async function setSessionCookie(userId: string, email: string, role: string) {
  const token = createToken(userId, email, role)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })
}

/**
 * Clears the session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/**
 * Retrieves the currently logged-in user profile from SQLite.
 * If fallbackRole is provided and no session cookie is found, returns default persona for that role.
 */
export async function getSessionUser(
  fallbackRole?: 'mentee' | 'mentor' | 'administrator' | 'hod'
): Promise<Profile | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (token) {
    const payload = verifyToken(token)
    if (payload?.userId) {
      const p = await prisma.profile.findUnique({
        where: { id: payload.userId },
      })
      if (p) {
        return {
          id: p.id,
          user_id: p.user_id || p.id,
          role: p.role as any,
          full_name: p.full_name,
          email: p.email,
          department: p.department,
          phone_number: p.phone_number || undefined,
          avatar_url: p.avatar_url || undefined,
          created_at: p.created_at.toISOString(),
          updated_at: p.updated_at.toISOString(),
        }
      }
    }
  }

  // Graceful fallback for demonstration mode if requested
  if (fallbackRole) {
    let email = 'student@demo.com'
    if (fallbackRole === 'mentor') email = 'mentor@demo.com'
    if (fallbackRole === 'administrator' || fallbackRole === 'hod') email = 'hod@demo.com'

    const p = await prisma.profile.findUnique({
      where: { email },
    })
    if (p) {
      return {
        id: p.id,
        user_id: p.user_id || p.id,
        role: p.role as any,
        full_name: p.full_name,
        email: p.email,
        department: p.department,
        phone_number: p.phone_number || undefined,
        avatar_url: p.avatar_url || undefined,
        created_at: p.created_at.toISOString(),
        updated_at: p.updated_at.toISOString(),
      }
    }
  }

  return null
}

/**
 * Validates role-based server access
 */
export async function requireAuthUser(allowedRoles?: string[]): Promise<Profile> {
  const user = await getSessionUser()
  if (!user) {
    throw new Error('Unauthorized: Authentication session required.')
  }
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(user.role)
    if (!hasRole) {
      throw new Error(`Forbidden: Insufficient privileges for role '${user.role}'.`)
    }
  }
  return user
}

