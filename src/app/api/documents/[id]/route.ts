import { NextResponse } from 'next/server'
import fs from 'fs'
import prisma from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Download or view an academic document with authorization check.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication session required.' },
        { status: 401 }
      )
    }

    const doc = await prisma.studentDocument.findUnique({
      where: { id },
      include: {
        student_profile: {
          include: {
            mentor_assignments: {
              where: { is_active: true },
            },
          },
        },
      },
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    }

    // Ownership & authorization check
    const isOwner = doc.student_profile.profile_id === user.id
    const isAdmin = user.role === 'administrator' || user.role === 'hod'
    const isAssignedMentor =
      user.role === 'mentor' &&
      doc.student_profile.mentor_assignments.some(
        (a) => a.mentor_profile_id === user.id
      )

    if (!isOwner && !isAdmin && !isAssignedMentor) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view this document.' },
        { status: 403 }
      )
    }

    // Check file existence on disk
    if (!fs.existsSync(doc.file_path)) {
      return NextResponse.json(
        { error: 'Document file could not be located on the server filesystem.' },
        { status: 404 }
      )
    }

    const fileBuffer = await fs.promises.readFile(doc.file_path)

    const url = new URL(request.url)
    const download = url.searchParams.get('download') === 'true'
    const disposition = download ? 'attachment' : 'inline'

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': doc.content_type || 'application/octet-stream',
        'Content-Length': String(fileBuffer.length),
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(doc.original_filename)}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to retrieve document.' },
      { status: 500 }
    )
  }
}

/**
 * Delete a document with ownership check.
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getSessionUser('mentee')

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Student session required.' },
        { status: 401 }
      )
    }

    const doc = await prisma.studentDocument.findUnique({
      where: { id },
      include: { student_profile: true },
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    }

    // Ownership check: Student can only delete their own document
    if (doc.student_profile.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own documents.' },
        { status: 403 }
      )
    }

    // Delete file from filesystem
    try {
      if (fs.existsSync(doc.file_path)) {
        await fs.promises.unlink(doc.file_path)
      }
    } catch (fsErr) {
      console.warn('Could not remove file from filesystem:', fsErr)
    }

    // Delete record from SQLite
    await prisma.studentDocument.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully.',
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to delete document.' },
      { status: 500 }
    )
  }
}

