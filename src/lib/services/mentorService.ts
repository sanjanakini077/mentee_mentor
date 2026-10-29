'use server'

import prisma from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth/session'
import type {
  Profile,
  StudentProfile,
  AcademicRecord,
  MentorNote,
  MentorRecommendation,
  AppNotification,
  RecommendationCategory,
  NoteVisibility,
} from '@/types'

export interface MentorStudentSummary {
  id: string
  profileId: string
  usn: string
  fullName: string
  email: string
  department: string
  semester: number
  academicBatch: string
  verificationStatus: string
  phone?: string
  totalCourses: number
  totalCredits: number
  activeBacklogs: number
  avgAttendance?: number
  lastNoteDate?: string
  needsAttention: boolean
  attentionReason?: string
}

export interface MentorDashboardData {
  mentorProfile: Profile
  assignedStudentsCount: number
  pendingVerificationCount: number
  pendingRecommendationsCount: number
  recentNotes: MentorNote[]
  studentsRequiringFollowUp: MentorStudentSummary[]
  assignedStudents: MentorStudentSummary[]
  notifications: AppNotification[]
}

export interface StudentFullDetail {
  studentProfile: StudentProfile
  profile: Profile
  academicRecords: AcademicRecord[]
  mentorNotes: MentorNote[]
  recommendations: MentorRecommendation[]
  assignmentDate?: string
}

/**
 * Loads the mentor dashboard overview data from SQLite via Prisma
 */
export async function getMentorDashboardData(): Promise<MentorDashboardData> {
  const user = await getSessionUser('mentor')
  if (!user) {
    throw new Error('Unable to initialize faculty mentor session.')
  }

  const mentorProfile = user

  // Active assignments for this mentor
  const assignments = await prisma.mentorAssignment.findMany({
    where: {
      mentor_profile_id: mentorProfile.id,
      is_active: true,
    },
    include: {
      student_profile: {
        include: {
          profile: true,
          academic_records: true,
          mentor_notes: {
            orderBy: { note_date: 'desc' },
          },
        },
      },
    },
  })

  const studentSummaries: MentorStudentSummary[] = []

  for (const asg of assignments) {
    const sp = asg.student_profile
    if (!sp) continue

    const prof = sp.profile
    const records = sp.academic_records
    const notes = sp.mentor_notes

    const totalCourses = records.length
    const totalCredits = records.reduce((acc, r) => acc + (r.credits || 0), 0)
    const activeBacklogs = records.filter((r) => r.is_backlog).length

    const validAtt = records.filter((r) => r.attendance_percentage !== null)
    const avgAttendance =
      validAtt.length > 0
        ? Math.round(
            validAtt.reduce((acc, r) => acc + (r.attendance_percentage || 0), 0) /
              validAtt.length
          )
        : undefined

    const lastNoteDate = notes[0]?.note_date

    let needsAttention = false
    let attentionReason: string | undefined = undefined

    if (activeBacklogs > 0) {
      needsAttention = true
      attentionReason = `${activeBacklogs} active academic backlogs.`
    } else if (avgAttendance !== undefined && avgAttendance < 75) {
      needsAttention = true
      attentionReason = `Low course attendance (${avgAttendance}%).`
    } else if (sp.verification_status === 'submitted') {
      needsAttention = true
      attentionReason = 'Profile awaiting departmental verification.'
    }

    studentSummaries.push({
      id: sp.id,
      profileId: sp.profile_id,
      usn: sp.usn,
      fullName: prof?.full_name || 'Student',
      email: prof?.email || '',
      department: sp.department || prof?.department || 'Information Science & Engineering',
      semester: sp.semester,
      academicBatch: sp.academic_batch,
      verificationStatus: sp.verification_status,
      phone: prof?.phone_number || sp.phone || undefined,
      totalCourses,
      totalCredits,
      activeBacklogs,
      avgAttendance,
      lastNoteDate,
      needsAttention,
      attentionReason,
    })
  }

  const pendingVerificationCount = studentSummaries.filter(
    (s) => s.verificationStatus === 'submitted'
  ).length

  const pendingRecommendationsCount = await prisma.mentorRecommendation.count({
    where: {
      mentor_profile_id: mentorProfile.id,
      status: 'pending',
    },
  })

  const dbRecentNotes = await prisma.mentorNote.findMany({
    where: { mentor_profile_id: mentorProfile.id },
    orderBy: { created_at: 'desc' },
    take: 10,
    include: {
      student_profile: {
        include: { profile: true },
      },
    },
  })

  const recentNotes: MentorNote[] = dbRecentNotes.map((n) => ({
    id: n.id,
    student_profile_id: n.student_profile_id,
    student_id: n.student_profile_id,
    mentor_profile_id: n.mentor_profile_id,
    mentor_id: n.mentor_profile_id,
    note_date: n.note_date,
    content: n.content,
    visibility: n.visibility as any,
    created_at: n.created_at.toISOString(),
    updated_at: n.updated_at.toISOString(),
    student: n.student_profile
      ? {
          id: n.student_profile.id,
          profile_id: n.student_profile.profile_id,
          usn: n.student_profile.usn,
          department: n.student_profile.department,
          semester: n.student_profile.semester,
          academic_batch: n.student_profile.academic_batch,
          verification_status: n.student_profile.verification_status as any,
          created_at: n.student_profile.created_at.toISOString(),
          profiles: n.student_profile.profile
            ? {
                id: n.student_profile.profile.id,
                user_id: n.student_profile.profile.user_id || n.student_profile.profile.id,
                role: n.student_profile.profile.role as any,
                full_name: n.student_profile.profile.full_name,
                email: n.student_profile.profile.email,
                department: n.student_profile.profile.department,
                phone_number: n.student_profile.profile.phone_number || undefined,
                created_at: n.student_profile.profile.created_at.toISOString(),
                updated_at: n.student_profile.profile.updated_at.toISOString(),
              }
            : undefined,
        }
      : undefined,
  }))

  const studentsRequiringFollowUp = studentSummaries.filter((s) => s.needsAttention)

  const dbNotifs = await prisma.notification.findMany({
    where: { recipient_profile_id: mentorProfile.id },
    orderBy: { created_at: 'desc' },
    take: 20,
  })

  const notifications: AppNotification[] = dbNotifs.map((n) => ({
    id: n.id,
    recipient_profile_id: n.recipient_profile_id,
    title: n.title,
    message: n.message,
    type: n.type as any,
    related_entity_type: n.related_entity_type || undefined,
    related_entity_id: n.related_entity_id || undefined,
    is_read: n.is_read,
    read: n.is_read,
    created_at: n.created_at.toISOString(),
    timestamp: n.created_at.toISOString(),
  }))

  return {
    mentorProfile,
    assignedStudentsCount: studentSummaries.length,
    pendingVerificationCount,
    pendingRecommendationsCount,
    recentNotes,
    studentsRequiringFollowUp,
    assignedStudents: studentSummaries,
    notifications,
  }
}

/**
 * Loads a student's full detail for the faculty mentor view
 */
export async function getAssignedStudentDetail(
  studentProfileId: string
): Promise<StudentFullDetail> {
  const sp = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: {
      profile: true,
      academic_records: {
        orderBy: [{ semester: 'asc' }, { course_code: 'asc' }],
      },
      mentor_notes: {
        orderBy: { note_date: 'desc' },
      },
      recommendations: {
        orderBy: { created_at: 'desc' },
      },
      mentor_assignments: {
        where: { is_active: true },
      },
    },
  })

  if (!sp) {
    throw new Error('Student profile not found.')
  }

  const p = sp.profile
  const profile: Profile = {
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

  const studentProfile: StudentProfile = {
    id: sp.id,
    profile_id: sp.profile_id,
    usn: sp.usn,
    department: sp.department,
    semester: sp.semester,
    academic_batch: sp.academic_batch,
    section: sp.section || undefined,
    phone: sp.phone || undefined,
    address: sp.address || undefined,
    parent_name: sp.parent_name || undefined,
    parent_phone: sp.parent_phone || undefined,
    blood_group: sp.blood_group || undefined,
    verification_status: sp.verification_status as any,
    reviewer_profile_id: sp.reviewer_profile_id || undefined,
    review_comment: sp.review_comment || undefined,
    reviewed_at: sp.reviewed_at ? sp.reviewed_at.toISOString() : undefined,
    created_at: sp.created_at.toISOString(),
    updated_at: sp.updated_at.toISOString(),
    profiles: profile,
  }

  const academicRecords: AcademicRecord[] = sp.academic_records.map((ar) => ({
    id: ar.id,
    student_profile_id: ar.student_profile_id,
    student_id: ar.student_profile_id,
    semester: ar.semester,
    academic_year: ar.academic_year,
    course_code: ar.course_code,
    course_name: ar.course_name,
    credits: ar.credits,
    marks_obtained: ar.marks_obtained ?? undefined,
    max_marks: ar.max_marks,
    grade: ar.grade || undefined,
    grade_points: ar.grade_points ?? undefined,
    attendance_percentage: ar.attendance_percentage ?? undefined,
    is_backlog: ar.is_backlog,
    remarks: ar.remarks || undefined,
    sgpa: ar.sgpa ?? undefined,
    cgpa: ar.cgpa ?? undefined,
    backlogs: ar.backlogs,
    created_at: ar.created_at.toISOString(),
    updated_at: ar.updated_at.toISOString(),
  }))

  const mentorNotes: MentorNote[] = sp.mentor_notes.map((n) => ({
    id: n.id,
    student_profile_id: n.student_profile_id,
    student_id: n.student_profile_id,
    mentor_profile_id: n.mentor_profile_id,
    mentor_id: n.mentor_profile_id,
    note_date: n.note_date,
    content: n.content,
    visibility: n.visibility as any,
    created_at: n.created_at.toISOString(),
    updated_at: n.updated_at.toISOString(),
  }))

  const recommendations: MentorRecommendation[] = sp.recommendations.map((r) => ({
    id: r.id,
    student_profile_id: r.student_profile_id,
    student_id: r.student_profile_id,
    mentor_profile_id: r.mentor_profile_id,
    mentor_id: r.mentor_profile_id,
    category: r.category as any,
    details: r.details,
    content: r.details,
    status: r.status as any,
    reviewer_profile_id: r.reviewer_profile_id || undefined,
    review_comment: r.review_comment || undefined,
    reviewed_at: r.reviewed_at ? r.reviewed_at.toISOString() : undefined,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
  }))

  const assignment = sp.mentor_assignments[0]

  return {
    studentProfile,
    profile,
    academicRecords,
    mentorNotes,
    recommendations,
    assignmentDate: assignment?.assigned_at.toISOString(),
  }
}

/**
 * Creates a new mentor guidance note in SQLite
 */
export async function createMentorNote(params: {
  studentProfileId: string
  content: string
  noteDate?: string
  visibility?: NoteVisibility
}) {
  const mentor = await getSessionUser('mentor')
  if (!mentor) {
    throw new Error('Unauthorized: Mentor session required.')
  }

  const created = await prisma.mentorNote.create({
    data: {
      student_profile_id: params.studentProfileId,
      mentor_profile_id: mentor.id,
      note_date: params.noteDate || new Date().toISOString().split('T')[0],
      content: params.content.trim(),
      visibility: params.visibility || 'shared_with_mentee',
    },
  })

  // Notify student if shared
  if (created.visibility === 'shared_with_mentee') {
    const sp = await prisma.studentProfile.findUnique({
      where: { id: params.studentProfileId },
    })
    if (sp) {
      await prisma.notification.create({
        data: {
          recipient_profile_id: sp.profile_id,
          title: 'New Mentoring Note',
          message: `${mentor.full_name} added guidance to your student record.`,
          type: 'info',
          related_entity_type: 'mentor_notes',
          related_entity_id: created.id,
        },
      })
    }
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      actor_profile_id: mentor.id,
      action: 'CREATED_MENTOR_NOTE',
      target_type: 'mentor_notes',
      target_id: created.id,
      metadata: JSON.stringify({
        student_profile_id: params.studentProfileId,
        visibility: created.visibility,
      }),
    },
  })

  return {
    id: created.id,
    student_profile_id: created.student_profile_id,
    student_id: created.student_profile_id,
    mentor_profile_id: created.mentor_profile_id,
    mentor_id: created.mentor_profile_id,
    note_date: created.note_date,
    content: created.content,
    visibility: created.visibility as any,
    created_at: created.created_at.toISOString(),
    updated_at: created.updated_at.toISOString(),
  }
}

/**
 * Updates an existing mentor note
 */
export async function updateMentorNote(params: {
  noteId: string
  content: string
  noteDate?: string
  visibility?: NoteVisibility
}) {
  const updated = await prisma.mentorNote.update({
    where: { id: params.noteId },
    data: {
      content: params.content.trim(),
      ...(params.noteDate ? { note_date: params.noteDate } : {}),
      ...(params.visibility ? { visibility: params.visibility } : {}),
    },
  })

  return {
    id: updated.id,
    student_profile_id: updated.student_profile_id,
    student_id: updated.student_profile_id,
    mentor_profile_id: updated.mentor_profile_id,
    mentor_id: updated.mentor_profile_id,
    note_date: updated.note_date,
    content: updated.content,
    visibility: updated.visibility as any,
    created_at: updated.created_at.toISOString(),
    updated_at: updated.updated_at.toISOString(),
  }
}

/**
 * Deletes a mentor note
 */
export async function deleteMentorNote(noteId: string) {
  await prisma.mentorNote.delete({
    where: { id: noteId },
  })
  return true
}

/**
 * Submits a new mentor recommendation to HOD in SQLite
 */
export async function createMentorRecommendation(params: {
  studentProfileId: string
  category: RecommendationCategory
  details: string
}) {
  const mentor = await getSessionUser('mentor')
  if (!mentor) {
    throw new Error('Unauthorized: Mentor session required.')
  }

  const created = await prisma.mentorRecommendation.create({
    data: {
      student_profile_id: params.studentProfileId,
      mentor_profile_id: mentor.id,
      category: params.category,
      details: params.details.trim(),
      status: 'pending',
    },
  })

  // Notify HOD
  const sp = await prisma.studentProfile.findUnique({
    where: { id: params.studentProfileId },
    include: { profile: true },
  })
  const studentName = sp?.profile.full_name || 'Student'

  const hod = await prisma.profile.findFirst({
    where: {
      OR: [{ role: 'administrator' }, { role: 'hod' }, { email: 'hod@demo.com' }],
    },
  })

  if (hod) {
    await prisma.notification.create({
      data: {
        recipient_profile_id: hod.id,
        title: 'Mentor Recommendation Submitted',
        message: `${mentor.full_name} submitted a ${params.category} recommendation for ${studentName}.`,
        type: 'warning',
        related_entity_type: 'mentor_recommendations',
        related_entity_id: created.id,
      },
    })
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      actor_profile_id: mentor.id,
      action: 'SUBMITTED_RECOMMENDATION',
      target_type: 'mentor_recommendations',
      target_id: created.id,
      metadata: JSON.stringify({
        category: params.category,
        student_profile_id: params.studentProfileId,
      }),
    },
  })

  return {
    id: created.id,
    student_profile_id: created.student_profile_id,
    student_id: created.student_profile_id,
    mentor_profile_id: created.mentor_profile_id,
    mentor_id: created.mentor_profile_id,
    category: created.category as any,
    details: created.details,
    content: created.details,
    status: created.status as any,
    created_at: created.created_at.toISOString(),
    updated_at: created.updated_at.toISOString(),
  }
}

/**
 * Updates a mentor recommendation
 */
export async function updateMentorRecommendation(params: {
  recommendationId: string
  category: RecommendationCategory
  details: string
}) {
  const updated = await prisma.mentorRecommendation.update({
    where: { id: params.recommendationId },
    data: {
      category: params.category,
      details: params.details.trim(),
    },
  })

  return {
    id: updated.id,
    student_profile_id: updated.student_profile_id,
    student_id: updated.student_profile_id,
    mentor_profile_id: updated.mentor_profile_id,
    mentor_id: updated.mentor_profile_id,
    category: updated.category as any,
    details: updated.details,
    content: updated.details,
    status: updated.status as any,
    created_at: updated.created_at.toISOString(),
    updated_at: updated.updated_at.toISOString(),
  }
}

/**
 * Deletes a mentor recommendation
 */
export async function deleteMentorRecommendation(recommendationId: string) {
  await prisma.mentorRecommendation.delete({
    where: { id: recommendationId },
  })
  return true
}

/**
 * Loads all notes authored by or visible to mentor
 */
export async function getMentorNotesData(): Promise<{
  notes: MentorNote[]
  students: { id: string; fullName: string; usn: string }[]
}> {
  const mentor = await getSessionUser('mentor')
  if (!mentor) throw new Error('Mentor session required.')

  const notes = await prisma.mentorNote.findMany({
    where: { mentor_profile_id: mentor.id },
    orderBy: { note_date: 'desc' },
    include: {
      student_profile: {
        include: { profile: true },
      },
    },
  })

  const assignments = await prisma.mentorAssignment.findMany({
    where: { mentor_profile_id: mentor.id, is_active: true },
    include: {
      student_profile: {
        include: { profile: true },
      },
    },
  })

  const mappedNotes: MentorNote[] = notes.map((n) => ({
    id: n.id,
    student_profile_id: n.student_profile_id,
    student_id: n.student_profile_id,
    mentor_profile_id: n.mentor_profile_id,
    mentor_id: n.mentor_profile_id,
    note_date: n.note_date,
    content: n.content,
    visibility: n.visibility as any,
    created_at: n.created_at.toISOString(),
    updated_at: n.updated_at.toISOString(),
    student: n.student_profile
      ? {
          id: n.student_profile.id,
          profile_id: n.student_profile.profile_id,
          usn: n.student_profile.usn,
          semester: n.student_profile.semester,
          verification_status: n.student_profile.verification_status as any,
          profiles: {
            id: n.student_profile.profile.id,
            user_id: n.student_profile.profile.user_id || n.student_profile.profile.id,
            role: n.student_profile.profile.role as any,
            full_name: n.student_profile.profile.full_name,
            email: n.student_profile.profile.email,
            department: n.student_profile.profile.department,
            created_at: n.student_profile.profile.created_at.toISOString(),
            updated_at: n.student_profile.profile.updated_at.toISOString(),
          },
        }
      : undefined,
  }))

  const mappedStudents = assignments
    .filter((a) => a.student_profile)
    .map((a) => ({
      id: a.student_profile.id,
      fullName: a.student_profile.profile.full_name,
      usn: a.student_profile.usn,
    }))

  return {
    notes: mappedNotes,
    students: mappedStudents,
  }
}

/**
 * Loads all recommendations authored by mentor
 */
export async function getMentorRecommendationsData(): Promise<{
  recommendations: MentorRecommendation[]
  students: { id: string; fullName: string; usn: string }[]
}> {
  const mentor = await getSessionUser('mentor')
  if (!mentor) throw new Error('Mentor session required.')

  const recs = await prisma.mentorRecommendation.findMany({
    where: { mentor_profile_id: mentor.id },
    orderBy: { created_at: 'desc' },
    include: {
      student_profile: {
        include: { profile: true },
      },
    },
  })

  const assignments = await prisma.mentorAssignment.findMany({
    where: { mentor_profile_id: mentor.id, is_active: true },
    include: {
      student_profile: {
        include: { profile: true },
      },
    },
  })

  const mappedRecs: MentorRecommendation[] = recs.map((r) => ({
    id: r.id,
    student_profile_id: r.student_profile_id,
    student_id: r.student_profile_id,
    mentor_profile_id: r.mentor_profile_id,
    mentor_id: r.mentor_profile_id,
    category: r.category as any,
    details: r.details,
    content: r.details,
    status: r.status as any,
    review_comment: r.review_comment || undefined,
    hod_comment: r.review_comment || undefined,
    reviewed_at: r.reviewed_at ? r.reviewed_at.toISOString() : undefined,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
    student: r.student_profile
      ? {
          id: r.student_profile.id,
          profile_id: r.student_profile.profile_id,
          usn: r.student_profile.usn,
          semester: r.student_profile.semester,
          verification_status: r.student_profile.verification_status as any,
          profiles: {
            id: r.student_profile.profile.id,
            user_id: r.student_profile.profile.user_id || r.student_profile.profile.id,
            role: r.student_profile.profile.role as any,
            full_name: r.student_profile.profile.full_name,
            email: r.student_profile.profile.email,
            department: r.student_profile.profile.department,
            created_at: r.student_profile.profile.created_at.toISOString(),
            updated_at: r.student_profile.profile.updated_at.toISOString(),
          },
        }
      : undefined,
  }))

  const mappedStudents = assignments
    .filter((a) => a.student_profile)
    .map((a) => ({
      id: a.student_profile.id,
      fullName: a.student_profile.profile.full_name,
      usn: a.student_profile.usn,
    }))

  return {
    recommendations: mappedRecs,
    students: mappedStudents,
  }
}
