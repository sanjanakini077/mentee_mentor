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
  StudentDocument,
  VerificationStatus,
} from '@/types'

export interface MenteeFullData {
  profile: Profile
  studentProfile: StudentProfile
  assignedMentor: Profile | null
  mentorAssignmentDate?: string
  academicRecords: AcademicRecord[]
  mentorNotes: MentorNote[]
  recommendations: MentorRecommendation[]
  notifications: AppNotification[]
  documents: StudentDocument[]
  completionRate: number
  missingFields: string[]
}

/**
 * Calculates profile completion percentage and identifies missing fields
 */
export async function calculateProfileCompletion(
  profile: Profile | null,
  sp: StudentProfile | null
): Promise<{ rate: number; missing: string[] }> {
  const fields = [
    { name: 'Full Name', value: profile?.full_name },
    { name: 'Institutional Email', value: profile?.email },
    { name: 'Phone Number', value: profile?.phone_number },
    { name: 'USN', value: sp?.usn && sp.usn !== 'UNASSIGNED' ? sp.usn : null },
    { name: 'Department', value: sp?.department || profile?.department },
    { name: 'Semester', value: sp?.semester },
    { name: 'Academic Batch', value: sp?.academic_batch },
    { name: 'Blood Group', value: sp?.blood_group },
    { name: 'Permanent Address', value: sp?.address },
    { name: 'Parent/Guardian Name', value: sp?.parent_name },
    { name: 'Parent Contact Phone', value: sp?.parent_phone },
  ]

  const total = fields.length
  const completed = fields.filter((f) => f.value && String(f.value).trim().length > 0).length
  const missing = fields
    .filter((f) => !f.value || String(f.value).trim().length === 0)
    .map((f) => f.name)

  return {
    rate: Math.round((completed / total) * 100),
    missing,
  }
}

/**
 * Loads the active student mentee's full record from SQLite via Prisma
 */
export async function getMenteeFullData(): Promise<MenteeFullData> {
  // 1. Get authenticated user or fallback to Sanjana Kini demo persona
  let user = await getSessionUser('mentee')

  if (!user) {
    throw new Error('Unable to initialize user profile.')
  }

  // 2. Fetch full profile and studentProfile from database
  let dbProfile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      student_profile: {
        include: {
          academic_records: {
            orderBy: [{ semester: 'asc' }, { course_code: 'asc' }],
          },
          mentor_assignments: {
            where: { is_active: true },
            include: { mentor: true },
          },
          mentor_notes: {
            where: { visibility: 'shared_with_mentee' },
            orderBy: { note_date: 'desc' },
          },
          recommendations: {
            orderBy: { created_at: 'desc' },
          },
          documents: {
            orderBy: { created_at: 'desc' },
          },
        },
      },
      notifications: {
        orderBy: { created_at: 'desc' },
      },
    },
  })

  // Auto-provision studentProfile if missing
  if (!dbProfile?.student_profile) {
    await prisma.studentProfile.create({
      data: {
        profile_id: user.id,
        usn: '4NM21IS042',
        department: user.department || 'Information Science & Engineering',
        semester: 6,
        academic_batch: '2021-2025',
        section: 'A',
        phone: user.phone_number || '+91 98450 12345',
        blood_group: 'O+',
        address: 'Nitte, Karkala Taluk, Udupi District, Karnataka 574110',
        parent_name: 'B. Suresh Shet',
        parent_phone: '+91 98450 99887',
        verification_status: 'submitted',
      },
    })

    dbProfile = await prisma.profile.findUnique({
      where: { id: user.id },
      include: {
        student_profile: {
          include: {
            academic_records: {
              orderBy: [{ semester: 'asc' }, { course_code: 'asc' }],
            },
            mentor_assignments: {
              where: { is_active: true },
              include: { mentor: true },
            },
            mentor_notes: {
              where: { visibility: 'shared_with_mentee' },
              orderBy: { note_date: 'desc' },
            },
            recommendations: {
              orderBy: { created_at: 'desc' },
            },
            documents: {
              orderBy: { created_at: 'desc' },
            },
          },
        },
        notifications: {
          orderBy: { created_at: 'desc' },
        },
      },
    })
  }

  const p = dbProfile!
  const sp = p.student_profile!

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
    verification_status: sp.verification_status as VerificationStatus,
    reviewer_profile_id: sp.reviewer_profile_id || undefined,
    review_comment: sp.review_comment || undefined,
    reviewed_at: sp.reviewed_at ? sp.reviewed_at.toISOString() : undefined,
    created_at: sp.created_at.toISOString(),
    updated_at: sp.updated_at.toISOString(),
    profiles: profile,
  }

  const activeAssignment = sp.mentor_assignments[0]
  let assignedMentor: Profile | null = null
  let mentorAssignmentDate: string | undefined = undefined

  if (activeAssignment?.mentor) {
    const m = activeAssignment.mentor
    assignedMentor = {
      id: m.id,
      user_id: m.user_id || m.id,
      role: m.role as any,
      full_name: m.full_name,
      email: m.email,
      department: m.department,
      phone_number: m.phone_number || undefined,
      avatar_url: m.avatar_url || undefined,
      created_at: m.created_at.toISOString(),
      updated_at: m.updated_at.toISOString(),
    }
    mentorAssignmentDate = activeAssignment.assigned_at.toISOString()
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

  const notifications: AppNotification[] = p.notifications.map((n) => ({
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

  const documents: StudentDocument[] = (sp.documents || []).map((doc) => ({
    id: doc.id,
    student_profile_id: doc.student_profile_id,
    title: doc.title,
    document_type: doc.document_type,
    original_filename: doc.original_filename,
    stored_filename: doc.stored_filename,
    file_path: doc.file_path,
    content_type: doc.content_type,
    file_size: doc.file_size,
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  }))

  const comp = await calculateProfileCompletion(profile, studentProfile)

  return {
    profile,
    studentProfile,
    assignedMentor,
    mentorAssignmentDate,
    academicRecords,
    mentorNotes,
    recommendations,
    notifications,
    documents,
    completionRate: comp.rate,
    missingFields: comp.missing,
  }
}

/**
 * Updates mentee demographic and contact details in SQLite.
 * Uses the authenticated session to guarantee a student can only modify their own profile.
 */
export async function updateMenteeProfile(params: {
  fullName: string
  phoneNumber?: string
  usn?: string
  department?: string
  semester: number
  bloodGroup?: string
  address?: string
  parentName?: string
  parentPhone?: string
}) {
  // 1. Authenticate student session securely
  const sessionUser = await getSessionUser('mentee')
  if (!sessionUser) {
    throw new Error('Unauthorized: Student session required.')
  }

  // 2. Load student record using authenticated session user ID (prevents modifying other accounts)
  const dbProfile = await prisma.profile.findUnique({
    where: { id: sessionUser.id },
    include: { student_profile: true },
  })

  if (!dbProfile || !dbProfile.student_profile) {
    throw new Error('Student profile record could not be found.')
  }

  const sp = dbProfile.student_profile

  // 3. Validation
  const fullName = params.fullName?.trim()
  if (!fullName || fullName.length < 2) {
    throw new Error('Full legal name is required (at least 2 characters).')
  }

  const semester = Number(params.semester) || 1
  if (semester < 1 || semester > 8) {
    throw new Error('Semester must be between 1 and 8.')
  }

  const phoneNumber = params.phoneNumber?.trim() || null
  if (phoneNumber && !/^[0-9+ -]{7,15}$/.test(phoneNumber)) {
    throw new Error('Please enter a valid telephone or mobile number.')
  }

  const parentPhone = params.parentPhone?.trim() || null
  if (parentPhone && !/^[0-9+ -]{7,15}$/.test(parentPhone)) {
    throw new Error('Please enter a valid emergency contact number.')
  }

  // 4. USN Handling: if changed, verify uniqueness
  let targetUsn = sp.usn
  if (params.usn) {
    const cleanUsn = params.usn.trim().toUpperCase()
    if (cleanUsn !== sp.usn) {
      const conflict = await prisma.studentProfile.findUnique({
        where: { usn: cleanUsn },
      })
      if (conflict && conflict.id !== sp.id) {
        throw new Error(`The USN '${cleanUsn}' is already in use by another student.`)
      }
      targetUsn = cleanUsn
    }
  }

  const dept = params.department?.trim() || sp.department

  // 5. Update Profile & StudentProfile in SQLite atomically
  await prisma.$transaction([
    prisma.profile.update({
      where: { id: dbProfile.id },
      data: {
        full_name: fullName,
        phone_number: phoneNumber,
        department: dept,
      },
    }),
    prisma.studentProfile.update({
      where: { id: sp.id },
      data: {
        usn: targetUsn,
        department: dept,
        semester,
        blood_group: params.bloodGroup?.trim() || null,
        address: params.address?.trim() || null,
        parent_name: params.parentName?.trim() || null,
        parent_phone: parentPhone,
        phone: phoneNumber,
      },
    }),
  ])

  return true
}

/**
 * Adds or updates an academic record in SQLite
 */
export async function saveAcademicRecord(params: {
  id?: string
  studentProfileId: string
  academicYear: string
  semester: number
  courseCode: string
  courseName: string
  credits: number
  marksObtained?: number
  maxMarks?: number
  grade?: string
  gradePoints?: number
  attendancePercentage?: number
  isBacklog?: boolean
  remarks?: string
  currentVerificationStatus: VerificationStatus
}) {
  if (params.currentVerificationStatus === 'submitted') {
    throw new Error(
      'Cannot add or edit academic records while your verification submission is under review.'
    )
  }
  if (params.currentVerificationStatus === 'approved') {
    throw new Error(
      'Academic records have been officially approved. Contact your mentor or HOD to request changes.'
    )
  }

  if (params.id) {
    const updated = await prisma.academicRecord.update({
      where: { id: params.id },
      data: {
        academic_year: params.academicYear.trim(),
        semester: Number(params.semester),
        course_code: params.courseCode.trim().toUpperCase(),
        course_name: params.courseName.trim(),
        credits: Number(params.credits) || 3,
        marks_obtained:
          params.marksObtained !== undefined ? Number(params.marksObtained) : null,
        max_marks: params.maxMarks ? Number(params.maxMarks) : 100,
        grade: params.grade?.trim().toUpperCase() || null,
        grade_points:
          params.gradePoints !== undefined ? Number(params.gradePoints) : null,
        attendance_percentage:
          params.attendancePercentage !== undefined
            ? Number(params.attendancePercentage)
            : null,
        is_backlog: Boolean(params.isBacklog),
        remarks: params.remarks?.trim() || null,
      },
    })
    return {
      ...updated,
      student_id: updated.student_profile_id,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    }
  }

  // Create new record
  const created = await prisma.academicRecord.create({
    data: {
      student_profile_id: params.studentProfileId,
      academic_year: params.academicYear.trim(),
      semester: Number(params.semester),
      course_code: params.courseCode.trim().toUpperCase(),
      course_name: params.courseName.trim(),
      credits: Number(params.credits) || 3,
      marks_obtained:
        params.marksObtained !== undefined ? Number(params.marksObtained) : null,
      max_marks: params.maxMarks ? Number(params.maxMarks) : 100,
      grade: params.grade?.trim().toUpperCase() || null,
      grade_points:
        params.gradePoints !== undefined ? Number(params.gradePoints) : null,
      attendance_percentage:
        params.attendancePercentage !== undefined
          ? Number(params.attendancePercentage)
          : null,
      is_backlog: Boolean(params.isBacklog),
      remarks: params.remarks?.trim() || null,
    },
  })

  return {
    ...created,
    student_id: created.student_profile_id,
    created_at: created.created_at.toISOString(),
    updated_at: created.updated_at.toISOString(),
  }
}

/**
 * Deletes an academic record from SQLite
 */
export async function deleteAcademicRecord(
  recordId: string,
  verificationStatus: VerificationStatus
) {
  if (verificationStatus === 'submitted' || verificationStatus === 'approved') {
    throw new Error(
      'Cannot delete records while verification is under review or already approved.'
    )
  }

  await prisma.academicRecord.delete({
    where: { id: recordId },
  })
  return true
}

/**
 * Submits the mentee's profile and academic records for verification
 */
export async function submitVerificationForReview(studentProfileId: string) {
  const sp = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: {
      profile: true,
      mentor_assignments: {
        where: { is_active: true },
      },
    },
  })

  if (!sp) {
    throw new Error('Student profile record could not be found.')
  }

  if (sp.verification_status === 'submitted') {
    throw new Error('Your records are already submitted and pending review.')
  }
  if (sp.verification_status === 'approved') {
    throw new Error('Your records have already been approved by the department.')
  }

  // Update status to 'submitted'
  await prisma.studentProfile.update({
    where: { id: studentProfileId },
    data: {
      verification_status: 'submitted',
      reviewed_at: null,
    },
  })

  const studentName = sp.profile.full_name || 'Student'

  // Notification for student
  await prisma.notification.create({
    data: {
      recipient_profile_id: sp.profile_id,
      title: 'Verification Request Submitted',
      message:
        'Your profile and academic records have been submitted for faculty mentor review and HOD endorsement.',
      type: 'info',
      related_entity_type: 'student_profiles',
      related_entity_id: studentProfileId,
    },
  })

  // Notification for HOD
  const hodProfile = await prisma.profile.findFirst({
    where: {
      OR: [{ role: 'administrator' }, { role: 'hod' }, { email: 'hod@demo.com' }],
    },
  })

  if (hodProfile) {
    await prisma.notification.create({
      data: {
        recipient_profile_id: hodProfile.id,
        title: 'Profile Submitted for Endorsement',
        message: `${studentName} (${sp.usn}) has submitted their profile for departmental verification.`,
        type: 'warning',
        related_entity_type: 'student_profiles',
        related_entity_id: studentProfileId,
      },
    })
  }

  // Notification for mentor if assigned
  const activeAssignment = sp.mentor_assignments[0]
  if (activeAssignment?.mentor_profile_id) {
    await prisma.notification.create({
      data: {
        recipient_profile_id: activeAssignment.mentor_profile_id,
        title: 'Mentee Profile Submitted',
        message: `Your mentee ${studentName} (${sp.usn}) submitted their profile for institutional verification.`,
        type: 'info',
        related_entity_type: 'student_profiles',
        related_entity_id: studentProfileId,
      },
    })
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      actor_profile_id: sp.profile_id,
      action: 'SUBMITTED_STUDENT_PROFILE',
      target_type: 'student_profiles',
      target_id: studentProfileId,
      metadata: JSON.stringify({ usn: sp.usn, status: 'submitted' }),
    },
  })

  return true
}

/**
 * Marks notification as read
 */
export async function markNotificationRead(notificationId: string) {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { is_read: true },
  })
  return true
}

/**
 * Marks all notifications as read for profile
 */
export async function markAllNotificationsRead(recipientProfileId: string) {
  await prisma.notification.updateMany({
    where: { recipient_profile_id: recipientProfileId },
    data: { is_read: true },
  })
  return true
}
