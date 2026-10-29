'use server'

import prisma from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth/session'
import type {
  Profile,
  StudentProfile,
  AcademicRecord,
  MentorAssignment,
  MentorRecommendation,
  AuditLog,
  VerificationStatus,
  RecommendationStatus,
} from '@/types'

export interface AdminDashboardData {
  adminProfile: Profile
  totalStudents: number
  awaitingReviewCount: number
  approvedCount: number
  correctionNeededCount: number
  pendingRecommendationsCount: number
  activeMentorsCount: number
  pendingStudentSubmissions: any[]
  pendingRecommendations: any[]
  recentAuditLogs: AuditLog[]
}

/**
 * Loads HOD Administrator dashboard metrics and pending queue from SQLite via Prisma
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const user = await getSessionUser('administrator')
  if (!user) {
    throw new Error('Unable to initialize department administrator session.')
  }

  const adminProfile = user
  const dept = adminProfile.department || 'Information Science & Engineering'

  // Total students
  const totalStudents = await prisma.studentProfile.count({
    where: dept ? { department: dept } : undefined,
  })

  // Status counts
  const awaitingReviewCount = await prisma.studentProfile.count({
    where: { verification_status: 'submitted' },
  })
  const approvedCount = await prisma.studentProfile.count({
    where: { verification_status: 'approved' },
  })
  const correctionNeededCount = await prisma.studentProfile.count({
    where: { verification_status: 'correction_requested' },
  })

  // Active mentors count
  const activeMentorsCount = await prisma.profile.count({
    where: { role: 'mentor' },
  })

  // Pending recommendations
  const dbPendingRecs = await prisma.mentorRecommendation.findMany({
    where: { status: 'pending' },
    orderBy: { created_at: 'desc' },
    include: {
      student_profile: {
        include: { profile: true },
      },
      mentor: true,
    },
  })

  const pendingRecommendations = dbPendingRecs.map((r) => ({
    id: r.id,
    student_profile_id: r.student_profile_id,
    mentor_profile_id: r.mentor_profile_id,
    category: r.category,
    details: r.details,
    content: r.details,
    status: r.status,
    created_at: r.created_at.toISOString(),
    student: r.student_profile
      ? {
          id: r.student_profile.id,
          usn: r.student_profile.usn,
          semester: r.student_profile.semester,
          profiles: {
            id: r.student_profile.profile.id,
            full_name: r.student_profile.profile.full_name,
            email: r.student_profile.profile.email,
          },
        }
      : null,
    mentor: r.mentor
      ? {
          id: r.mentor.id,
          full_name: r.mentor.full_name,
          email: r.mentor.email,
        }
      : null,
  }))

  // Pending student profile submissions
  const dbPendingSubs = await prisma.studentProfile.findMany({
    where: { verification_status: 'submitted' },
    orderBy: { updated_at: 'desc' },
    include: {
      profile: true,
      academic_records: true,
      mentor_assignments: {
        where: { is_active: true },
        include: { mentor: true },
      },
    },
  })

  const pendingStudentSubmissions = dbPendingSubs.map((s) => ({
    id: s.id,
    profile_id: s.profile_id,
    usn: s.usn,
    department: s.department,
    semester: s.semester,
    academic_batch: s.academic_batch,
    verification_status: s.verification_status,
    updated_at: s.updated_at.toISOString(),
    created_at: s.created_at.toISOString(),
    profiles: {
      id: s.profile.id,
      user_id: s.profile.user_id || s.profile.id,
      full_name: s.profile.full_name,
      email: s.profile.email,
      department: s.profile.department,
      phone_number: s.profile.phone_number || undefined,
    },
    mentor_assignment: s.mentor_assignments[0]
      ? {
          mentor: s.mentor_assignments[0].mentor
            ? {
                id: s.mentor_assignments[0].mentor.id,
                full_name: s.mentor_assignments[0].mentor.full_name,
              }
            : null,
        }
      : null,
  }))

  // Recent audit logs
  const dbLogs = await prisma.auditLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 10,
    include: { actor: true },
  })

  const recentAuditLogs: AuditLog[] = dbLogs.map((log) => ({
    id: log.id,
    actor_profile_id: log.actor_profile_id || undefined,
    actor_id: log.actor_profile_id || undefined,
    action: log.action,
    target_type: log.target_type,
    target_id: log.target_id,
    metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
    created_at: log.created_at.toISOString(),
    actor: log.actor
      ? {
          id: log.actor.id,
          user_id: log.actor.user_id || log.actor.id,
          role: log.actor.role as any,
          full_name: log.actor.full_name,
          email: log.actor.email,
          department: log.actor.department,
          created_at: log.actor.created_at.toISOString(),
          updated_at: log.actor.updated_at.toISOString(),
        }
      : undefined,
  }))

  return {
    adminProfile,
    totalStudents,
    awaitingReviewCount,
    approvedCount,
    correctionNeededCount,
    pendingRecommendationsCount: pendingRecommendations.length,
    activeMentorsCount,
    pendingStudentSubmissions,
    pendingRecommendations,
    recentAuditLogs,
  }
}

/**
 * Reviews a student profile (approve, reject, or request corrections)
 */
export async function reviewStudentProfile(params: {
  studentProfileId: string
  status?: 'approved' | 'rejected' | 'correction_requested'
  decision?: 'approved' | 'rejected' | 'correction_requested'
  comment?: string
  reviewComment?: string
}) {
  const finalStatus = params.status || params.decision || 'approved'
  const finalComment = params.comment || params.reviewComment || ''
  const adminProf = await getSessionUser('administrator')

  const updatedSp = await prisma.studentProfile.update({
    where: { id: params.studentProfileId },
    data: {
      verification_status: finalStatus,
      reviewer_profile_id: adminProf?.id || null,
      review_comment: finalComment.trim() || null,
      reviewed_at: new Date(),
    },
    include: { profile: true },
  })

  // Audit log
  if (adminProf) {
    await prisma.auditLog.create({
      data: {
        actor_profile_id: adminProf.id,
        action: `STUDENT_VERIFICATION_${finalStatus.toUpperCase()}`,
        target_type: 'student_profiles',
        target_id: params.studentProfileId,
        metadata: JSON.stringify({
          new_status: finalStatus,
          reviewer_comment: finalComment,
        }),
      },
    })
  }

  // Notify student
  const statusMessages: Record<string, string> = {
    approved:
      'Your academic profile and records have been officially verified and endorsed by the HOD.',
    rejected: `Your verification submission was rejected by the department. Reason: ${finalComment || 'Contact department desk.'}`,
    correction_requested: `Corrections requested on your profile by HOD: ${finalComment || 'Please update your details.'}`,
  }

  await prisma.notification.create({
    data: {
      recipient_profile_id: updatedSp.profile_id,
      title: `Profile Verification: ${finalStatus.replace('_', ' ').toUpperCase()}`,
      message:
        statusMessages[finalStatus] || 'Your verification status has been updated.',
      type:
        finalStatus === 'approved'
          ? 'success'
          : finalStatus === 'rejected'
            ? 'danger'
            : 'warning',
      related_entity_type: 'student_profiles',
      related_entity_id: params.studentProfileId,
    },
  })

  return {
    ...updatedSp,
    reviewed_at: updatedSp.reviewed_at?.toISOString(),
    created_at: updatedSp.created_at.toISOString(),
    updated_at: updatedSp.updated_at.toISOString(),
  }
}

/**
 * Reviews a mentor recommendation (approve or reject)
 */
export async function reviewMentorRecommendation(params: {
  recommendationId: string
  status?: 'approved' | 'rejected'
  decision?: 'approved' | 'rejected'
  comment?: string
  reviewComment?: string
}) {
  const finalStatus = params.status || params.decision || 'approved'
  const finalComment = params.comment || params.reviewComment || ''
  const adminProf = await getSessionUser('administrator')

  const updatedRec = await prisma.mentorRecommendation.update({
    where: { id: params.recommendationId },
    data: {
      status: finalStatus,
      reviewer_profile_id: adminProf?.id || null,
      review_comment: finalComment.trim() || null,
      reviewed_at: new Date(),
    },
  })

  // Audit log
  if (adminProf) {
    await prisma.auditLog.create({
      data: {
        actor_profile_id: adminProf.id,
        action: `RECOMMENDATION_${finalStatus.toUpperCase()}`,
        target_type: 'mentor_recommendations',
        target_id: params.recommendationId,
        metadata: JSON.stringify({
          status: finalStatus,
          comment: finalComment,
        }),
      },
    })
  }

  // Notify mentor
  if (updatedRec.mentor_profile_id) {
    await prisma.notification.create({
      data: {
        recipient_profile_id: updatedRec.mentor_profile_id,
        title: `Recommendation ${finalStatus.toUpperCase()}`,
        message: `Your ${updatedRec.category || ''} recommendation has been ${finalStatus} by Department HOD. ${finalComment ? `Feedback: "${finalComment}"` : ''}`,
        type: finalStatus === 'approved' ? 'success' : 'danger',
        related_entity_type: 'mentor_recommendations',
        related_entity_id: params.recommendationId,
      },
    })
  }

  // Notify student if approved
  if (finalStatus === 'approved' && updatedRec.student_profile_id) {
    const sp = await prisma.studentProfile.findUnique({
      where: { id: updatedRec.student_profile_id },
    })
    if (sp) {
      await prisma.notification.create({
        data: {
          recipient_profile_id: sp.profile_id,
          title: `Faculty Recommendation Endorsed`,
          message: `A ${updatedRec.category || ''} recommendation from your faculty mentor has been approved by the HOD.`,
          type: 'success',
          related_entity_type: 'mentor_recommendations',
          related_entity_id: params.recommendationId,
        },
      })
    }
  }

  return {
    ...updatedRec,
    reviewed_at: updatedRec.reviewed_at?.toISOString(),
    created_at: updatedRec.created_at.toISOString(),
    updated_at: updatedRec.updated_at.toISOString(),
  }
}

/**
 * Assigns or reassigns a faculty mentor to a student
 */
export async function assignMentorToStudent(params: {
  studentProfileId: string
  mentorProfileId: string
  notes?: string
}) {
  const adminProf = await getSessionUser('administrator')

  // Deactivate existing active assignment for this student
  await prisma.mentorAssignment.updateMany({
    where: {
      student_profile_id: params.studentProfileId,
      is_active: true,
    },
    data: { is_active: false },
  })

  // Create new active assignment
  const newAssign = await prisma.mentorAssignment.create({
    data: {
      student_profile_id: params.studentProfileId,
      mentor_profile_id: params.mentorProfileId,
      assigned_by_profile_id: adminProf?.id || null,
      is_active: true,
      notes: params.notes?.trim() || 'Assigned by Department HOD.',
    },
    include: {
      student_profile: { include: { profile: true } },
      mentor: true,
    },
  })

  const sp = newAssign.student_profile
  const mentorProf = newAssign.mentor

  // Audit log
  if (adminProf) {
    await prisma.auditLog.create({
      data: {
        actor_profile_id: adminProf.id,
        action: 'ASSIGNED_MENTOR_TO_STUDENT',
        target_type: 'mentor_assignments',
        target_id: newAssign.id,
        metadata: JSON.stringify({
          student_profile_id: params.studentProfileId,
          mentor_profile_id: params.mentorProfileId,
          notes: params.notes,
        }),
      },
    })
  }

  // Notify mentor
  await prisma.notification.create({
    data: {
      recipient_profile_id: params.mentorProfileId,
      title: 'New Mentee Assigned',
      message: `You have been designated as faculty mentor for ${sp.profile.full_name} (${sp.usn}).`,
      type: 'info',
      related_entity_type: 'mentor_assignments',
      related_entity_id: newAssign.id,
    },
  })

  // Notify student
  await prisma.notification.create({
    data: {
      recipient_profile_id: sp.profile_id,
      title: 'Mentor Allocated',
      message: `${mentorProf.full_name} has been officially allocated as your faculty mentor.`,
      type: 'info',
      related_entity_type: 'mentor_assignments',
      related_entity_id: newAssign.id,
    },
  })

  return {
    ...newAssign,
    assigned_at: newAssign.assigned_at.toISOString(),
  }
}

export interface FacultyMemberItem {
  id: string
  fullName: string
  email: string
  phone?: string
  department: string
  createdAt: string
  activeMenteeCount: number
}

/**
 * Loads department faculty members
 */
export async function getDepartmentFacultyList(): Promise<{
  department: string
  faculty: FacultyMemberItem[]
  mentors: (Profile & { activeStudentCount: number; phone?: string })[]
}> {
  const adminProf = await getSessionUser('administrator')
  const dept = adminProf?.department || 'Information Science & Engineering'

  const mentorProfiles = await prisma.profile.findMany({
    where: { role: 'mentor' },
    include: {
      mentor_assignments: {
        where: { is_active: true },
      },
    },
    orderBy: { full_name: 'asc' },
  })

  const mentors = mentorProfiles.map((m) => ({
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
    activeStudentCount: m.mentor_assignments.length,
    phone: m.phone_number || undefined,
  }))

  const faculty: FacultyMemberItem[] = mentors.map((m) => ({
    id: m.id,
    fullName: m.full_name,
    email: m.email,
    phone: m.phone_number,
    department: m.department,
    createdAt: m.created_at,
    activeMenteeCount: m.activeStudentCount,
  }))

  return {
    department: dept,
    faculty,
    mentors,
  }
}

/**
 * Provisions a new faculty mentor in SQLite
 */
export async function provisionFacultyMentor(params: {
  email: string
  fullName: string
  phone?: string
  password?: string
}) {
  const adminProf = await getSessionUser('administrator')
  const dept = adminProf?.department || 'Information Science & Engineering'
  const email = params.email.trim().toLowerCase()

  const existing = await prisma.profile.findUnique({
    where: { email },
  })

  if (existing) {
    const updated = await prisma.profile.update({
      where: { id: existing.id },
      data: {
        role: 'mentor',
        full_name: params.fullName.trim(),
        phone_number: params.phone?.trim() || existing.phone_number,
      },
    })
    return {
      success: true,
      profile: {
        ...updated,
        created_at: updated.created_at.toISOString(),
        updated_at: updated.updated_at.toISOString(),
      },
      message: 'Existing user elevated to Faculty Mentor.',
    }
  }

  const created = await prisma.profile.create({
    data: {
      email,
      full_name: params.fullName.trim(),
      role: 'mentor',
      department: dept,
      phone_number: params.phone?.trim() || null,
      password: params.password || 'demo123',
    },
  })

  await prisma.profile.update({
    where: { id: created.id },
    data: { user_id: created.id },
  })

  if (adminProf) {
    await prisma.auditLog.create({
      data: {
        actor_profile_id: adminProf.id,
        action: 'PROVISIONED_FACULTY_MENTOR',
        target_type: 'profiles',
        target_id: created.id,
        metadata: JSON.stringify({
          email,
          full_name: params.fullName,
          department: dept,
        }),
      },
    })
  }

  return {
    success: true,
    profile: {
      ...created,
      created_at: created.created_at.toISOString(),
      updated_at: created.updated_at.toISOString(),
    },
    message: 'Faculty Mentor successfully provisioned in department directory.',
  }
}

/**
 * Loads all students for admin directory
 */
export async function getAllStudentsForAdmin() {
  const students = await prisma.studentProfile.findMany({
    include: {
      profile: true,
      academic_records: true,
      mentor_assignments: {
        where: { is_active: true },
        include: { mentor: true },
      },
    },
    orderBy: { usn: 'asc' },
  })

  const mentors = await prisma.profile.findMany({
    where: { role: 'mentor' },
    orderBy: { full_name: 'asc' },
  })

  const mappedStudents = students.map((s) => {
    const activeMentor = s.mentor_assignments[0]?.mentor
    return {
      id: s.id,
      profile_id: s.profile_id,
      usn: s.usn,
      department: s.department,
      semester: s.semester,
      academic_batch: s.academic_batch,
      section: s.section,
      phone: s.phone,
      address: s.address,
      parent_name: s.parent_name,
      parent_phone: s.parent_phone,
      blood_group: s.blood_group,
      verification_status: s.verification_status,
      review_comment: s.review_comment,
      reviewed_at: s.reviewed_at?.toISOString(),
      created_at: s.created_at.toISOString(),
      updated_at: s.updated_at.toISOString(),
      profiles: {
        id: s.profile.id,
        user_id: s.profile.user_id || s.profile.id,
        role: s.profile.role,
        full_name: s.profile.full_name,
        email: s.profile.email,
        department: s.profile.department,
        phone_number: s.profile.phone_number,
      },
      activeMentor: activeMentor
        ? {
            id: activeMentor.id,
            full_name: activeMentor.full_name,
            email: activeMentor.email,
          }
        : null,
      academic_records: s.academic_records.map((ar) => ({
        id: ar.id,
        student_profile_id: ar.student_profile_id,
        semester: ar.semester,
        academic_year: ar.academic_year,
        course_code: ar.course_code,
        course_name: ar.course_name,
        credits: ar.credits,
        marks_obtained: ar.marks_obtained,
        max_marks: ar.max_marks,
        grade: ar.grade,
        grade_points: ar.grade_points,
        attendance_percentage: ar.attendance_percentage,
        is_backlog: ar.is_backlog,
        sgpa: ar.sgpa,
        cgpa: ar.cgpa,
        backlogs: ar.backlogs,
        created_at: ar.created_at.toISOString(),
      })),
    }
  })

  const mappedMentors = mentors.map((m) => ({
    id: m.id,
    user_id: m.user_id || m.id,
    role: m.role as any,
    full_name: m.full_name,
    email: m.email,
    department: m.department,
    phone_number: m.phone_number || undefined,
    created_at: m.created_at.toISOString(),
    updated_at: m.updated_at.toISOString(),
  }))

  return {
    students: mappedStudents,
    mentors: mappedMentors,
  }
}

/**
 * Loads student academic records for HOD review
 */
export async function getStudentAcademicRecords(studentProfileId: string) {
  const records = await prisma.academicRecord.findMany({
    where: { student_profile_id: studentProfileId },
    orderBy: { semester: 'asc' },
  })
  return records.map((r) => ({
    id: r.id,
    student_profile_id: r.student_profile_id,
    student_id: r.student_profile_id,
    semester: r.semester,
    academic_year: r.academic_year,
    course_code: r.course_code,
    course_name: r.course_name,
    credits: r.credits,
    marks_obtained: r.marks_obtained ?? undefined,
    max_marks: r.max_marks,
    grade: r.grade || undefined,
    grade_points: r.grade_points ?? undefined,
    attendance_percentage: r.attendance_percentage ?? undefined,
    is_backlog: r.is_backlog,
    sgpa: r.sgpa ?? undefined,
    cgpa: r.cgpa ?? undefined,
    backlogs: r.backlogs,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
  }))
}

/**
 * Loads all review workspace items for HOD
 */
export async function getReviewWorkspaceData() {
  const d = await getAdminDashboardData()

  const students = await prisma.studentProfile.findMany({
    include: { profile: true },
    orderBy: { usn: 'asc' },
  })

  const recs = await prisma.mentorRecommendation.findMany({
    include: {
      student_profile: { include: { profile: true } },
      mentor: true,
    },
    orderBy: { created_at: 'desc' },
  })

  const stdList = students.map((s) => ({
    id: s.id,
    profile_id: s.profile_id,
    usn: s.usn,
    department: s.department,
    semester: s.semester,
    academic_batch: s.academic_batch,
    verification_status: s.verification_status,
    review_comment: s.review_comment,
    reviewed_at: s.reviewed_at?.toISOString(),
    created_at: s.created_at.toISOString(),
    profiles: {
      id: s.profile.id,
      full_name: s.profile.full_name,
      email: s.profile.email,
    },
  }))

  const deptRecs = recs.map((r) => ({
    id: r.id,
    student_profile_id: r.student_profile_id,
    mentor_profile_id: r.mentor_profile_id,
    category: r.category,
    details: r.details,
    content: r.details,
    status: r.status,
    review_comment: r.review_comment,
    hod_comment: r.review_comment,
    reviewed_at: r.reviewed_at?.toISOString(),
    created_at: r.created_at.toISOString(),
    student: r.student_profile
      ? {
          id: r.student_profile.id,
          usn: r.student_profile.usn,
          semester: r.student_profile.semester,
          profiles: {
            id: r.student_profile.profile.id,
            full_name: r.student_profile.profile.full_name,
            email: r.student_profile.profile.email,
          },
        }
      : null,
    mentor: r.mentor
      ? {
          id: r.mentor.id,
          full_name: r.mentor.full_name,
          email: r.mentor.email,
        }
      : null,
  }))

  return {
    dashboardData: d,
    allSubmissions: stdList,
    allRecommendations: deptRecs,
  }
}

/**
 * Loads all recommendations for HOD review desk
 */
export async function getAllRecommendationsForAdmin() {
  const recs = await prisma.mentorRecommendation.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      student_profile: { include: { profile: true } },
      mentor: true,
    },
  })

  return recs.map((r) => ({
    id: r.id,
    student_profile_id: r.student_profile_id,
    mentor_profile_id: r.mentor_profile_id,
    category: r.category,
    details: r.details,
    content: r.details,
    status: r.status,
    review_comment: r.review_comment,
    hod_comment: r.review_comment,
    reviewed_at: r.reviewed_at?.toISOString(),
    created_at: r.created_at.toISOString(),
    student: r.student_profile
      ? {
          id: r.student_profile.id,
          usn: r.student_profile.usn,
          semester: r.student_profile.semester,
          profiles: {
            id: r.student_profile.profile.id,
            full_name: r.student_profile.profile.full_name,
            email: r.student_profile.profile.email,
          },
        }
      : null,
    mentor: r.mentor
      ? {
          id: r.mentor.id,
          full_name: r.mentor.full_name,
          email: r.mentor.email,
        }
      : null,
  }))
}

/**
 * Loads full assignments desk data including history for HOD
 */
export async function getAssignmentsPageData() {
  const mentors = await prisma.profile.findMany({
    where: { role: 'mentor' },
    orderBy: { full_name: 'asc' },
  })

  const students = await prisma.studentProfile.findMany({
    include: { profile: true },
    orderBy: { usn: 'asc' },
  })

  const dbAssignments = await prisma.mentorAssignment.findMany({
    orderBy: { assigned_at: 'desc' },
    include: {
      student_profile: { include: { profile: true } },
      mentor: true,
    },
  })

  const mappedAssignments = dbAssignments.map((a) => ({
    id: a.id,
    student_profile_id: a.student_profile_id,
    mentor_profile_id: a.mentor_profile_id,
    assigned_at: a.assigned_at.toISOString(),
    is_active: a.is_active,
    notes: a.notes,
    student: a.student_profile
      ? {
          id: a.student_profile.id,
          usn: a.student_profile.usn,
          semester: a.student_profile.semester,
          profiles: {
            id: a.student_profile.profile.id,
            full_name: a.student_profile.profile.full_name,
            email: a.student_profile.profile.email,
          },
        }
      : null,
    mentor: a.mentor
      ? {
          id: a.mentor.id,
          full_name: a.mentor.full_name,
          email: a.mentor.email,
        }
      : null,
  }))

  const mappedStudents = students.map((sp) => ({
    id: sp.id,
    profile_id: sp.profile_id,
    usn: sp.usn,
    department: sp.department,
    semester: sp.semester,
    academic_batch: sp.academic_batch,
    verification_status: sp.verification_status,
    profiles: {
      id: sp.profile.id,
      full_name: sp.profile.full_name,
      email: sp.profile.email,
    },
  }))

  const mappedMentors: Profile[] = mentors.map((m) => ({
    id: m.id,
    user_id: m.user_id || m.id,
    role: m.role as any,
    full_name: m.full_name,
    email: m.email,
    department: m.department,
    phone_number: m.phone_number || undefined,
    created_at: m.created_at.toISOString(),
    updated_at: m.updated_at.toISOString(),
  }))

  return {
    mentors: mappedMentors,
    students: mappedStudents,
    assignments: mappedAssignments,
  }
}

/**
 * Loads assignments data for HOD assignment desk
 */
export async function getAssignmentsDeskData() {
  const students = await prisma.studentProfile.findMany({
    include: {
      profile: true,
      mentor_assignments: {
        where: { is_active: true },
        include: { mentor: true },
      },
    },
    orderBy: { usn: 'asc' },
  })

  const mentors = await prisma.profile.findMany({
    where: { role: 'mentor' },
    include: {
      mentor_assignments: {
        where: { is_active: true },
      },
    },
    orderBy: { full_name: 'asc' },
  })

  const mappedStudents = students.map((s) => ({
    id: s.id,
    profile_id: s.profile_id,
    usn: s.usn,
    department: s.department,
    semester: s.semester,
    academic_batch: s.academic_batch,
    verification_status: s.verification_status,
    profiles: {
      id: s.profile.id,
      full_name: s.profile.full_name,
      email: s.profile.email,
    },
    activeAssignment: s.mentor_assignments[0]
      ? {
          id: s.mentor_assignments[0].id,
          mentor_profile_id: s.mentor_assignments[0].mentor_profile_id,
          assigned_at: s.mentor_assignments[0].assigned_at.toISOString(),
          notes: s.mentor_assignments[0].notes,
          mentor: s.mentor_assignments[0].mentor
            ? {
                id: s.mentor_assignments[0].mentor.id,
                full_name: s.mentor_assignments[0].mentor.full_name,
                email: s.mentor_assignments[0].mentor.email,
              }
            : null,
        }
      : null,
  }))

  const mappedMentors = mentors.map((m) => ({
    id: m.id,
    user_id: m.user_id || m.id,
    role: m.role as any,
    full_name: m.full_name,
    email: m.email,
    department: m.department,
    phone_number: m.phone_number || undefined,
    created_at: m.created_at.toISOString(),
    updated_at: m.updated_at.toISOString(),
    activeMenteeCount: m.mentor_assignments.length,
  }))

  return {
    students: mappedStudents,
    mentors: mappedMentors,
  }
}

/**
 * Loads all audit logs for HOD audit desk
 */
export async function getAuditLogsDeskData() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 100,
    include: { actor: true },
  })

  return logs.map((l) => ({
    id: l.id,
    actor_profile_id: l.actor_profile_id || undefined,
    actor_id: l.actor_profile_id || undefined,
    action: l.action,
    target_type: l.target_type,
    target_id: l.target_id,
    metadata: l.metadata ? JSON.parse(l.metadata) : undefined,
    created_at: l.created_at.toISOString(),
    actor: l.actor
      ? {
          id: l.actor.id,
          user_id: l.actor.user_id || l.actor.id,
          role: l.actor.role as any,
          full_name: l.actor.full_name,
          email: l.actor.email,
          department: l.actor.department,
          created_at: l.actor.created_at.toISOString(),
          updated_at: l.actor.updated_at.toISOString(),
        }
      : undefined,
  }))
}
