import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth/session'
import {
  ensureUploadsDirExists,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/documents/storage'

export async function POST(request: Request) {
  try {
    // 1. Authenticate student session
    const user = await getSessionUser('mentee')
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Student sign-in required to upload documents.' },
        { status: 401 }
      )
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { profile_id: user.id },
    })

    if (!studentProfile) {
      return NextResponse.json(
        { error: 'Student record could not be found.' },
        { status: 404 }
      )
    }

    // 2. Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string | null)?.trim() || ''
    const documentType = (formData.get('documentType') as string | null)?.trim() || 'other'

    if (!file) {
      return NextResponse.json(
        { error: 'No document file was selected for upload.' },
        { status: 400 }
      )
    }

    // 3. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds the 5 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please upload a smaller file.`,
        },
        { status: 400 }
      )
    }

    // 4. Validate file type & extension
    const ext = path.extname(file.name).toLowerCase()
    const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext)
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())

    if (!isExtAllowed && !isMimeAllowed) {
      return NextResponse.json(
        {
          error: 'Unsupported file format. Please upload PDF, JPG, or PNG files only.',
        },
        { status: 400 }
      )
    }

    // 5. Ensure storage directory exists
    const uploadsDir = ensureUploadsDirExists()

    // 6. Generate safe unique filename
    const safeExt = ext || (file.type === 'application/pdf' ? '.pdf' : '.png')
    const storedFilename = `doc_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${safeExt}`
    const fullFilePath = path.join(uploadsDir, storedFilename)

    // 7. Write file buffer to local disk
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await fs.promises.writeFile(fullFilePath, buffer)

    // 8. Save metadata in SQLite
    let createdDoc
    try {
      createdDoc = await prisma.studentDocument.create({
        data: {
          student_profile_id: studentProfile.id,
          title: title || file.name.replace(ext, ''),
          document_type: documentType,
          original_filename: file.name,
          stored_filename: storedFilename,
          file_path: fullFilePath,
          content_type: file.type || 'application/octet-stream',
          file_size: file.size,
        },
      })
    } catch (dbError) {
      // Clean up orphaned file on disk if database creation failed
      try {
        if (fs.existsSync(fullFilePath)) {
          fs.unlinkSync(fullFilePath)
        }
      } catch (cleanupErr) {
        console.error('Failed to clean up unreferenced file:', cleanupErr)
      }
      throw dbError
    }

    return NextResponse.json({
      success: true,
      document: {
        id: createdDoc.id,
        student_profile_id: createdDoc.student_profile_id,
        title: createdDoc.title,
        document_type: createdDoc.document_type,
        original_filename: createdDoc.original_filename,
        stored_filename: createdDoc.stored_filename,
        file_path: createdDoc.file_path,
        content_type: createdDoc.content_type,
        file_size: createdDoc.file_size,
        created_at: createdDoc.created_at.toISOString(),
        updated_at: createdDoc.updated_at.toISOString(),
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to upload document.' },
      { status: 500 }
    )
  }
}

