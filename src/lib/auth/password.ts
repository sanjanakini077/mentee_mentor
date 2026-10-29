import crypto from 'crypto'

/**
 * Hashes a plain password using cryptographic scrypt and random salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${derivedKey}`
}

/**
 * Verifies a password against the stored password hash.
 * Supports scrypt hashes and backwards-compatible plaintext check for demo seed accounts.
 */
export function verifyPassword(password: string, storedPassword?: string | null): boolean {
  if (!storedPassword) return false

  if (storedPassword.startsWith('scrypt:')) {
    const parts = storedPassword.split(':')
    if (parts.length !== 3) return false
    const [, salt, expectedHash] = parts
    try {
      const actualHash = crypto.scryptSync(password, salt, 64).toString('hex')
      const actualBuf = Buffer.from(actualHash, 'hex')
      const expectedBuf = Buffer.from(expectedHash, 'hex')
      if (actualBuf.length !== expectedBuf.length) return false
      return crypto.timingSafeEqual(actualBuf, expectedBuf)
    } catch {
      return false
    }
  }

  // Backwards compatibility for existing demo seed accounts (e.g. demo123)
  return password === storedPassword
}

