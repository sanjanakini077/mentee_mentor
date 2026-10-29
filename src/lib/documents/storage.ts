import fs from 'fs'
import path from 'path'

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'documents')

/**
 * Ensures the uploads directory exists on the local server filesystem.
 */
export function ensureUploadsDirExists(): string {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
  return UPLOADS_DIR
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]

export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

