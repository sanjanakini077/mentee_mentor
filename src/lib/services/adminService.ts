import {
  getStore,
  saveStore,
  getCurrentUser,
} from '@/lib/storage/demoStore'
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
 * Loads HOD Administrator dashboard metrics and pending queue from demoStore
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const store = getStore()
  const currentUser = getCurrentUser()

  let adminProfile = store.profiles.find(
    (p) =>
      p.id === currentUser?.id ||
      p.email === currentUser?.email ||
      p.email === 'hod@demo.com' ||
      p.email === 'hod.ise@nmamit.in'
  )

  if (!adminProfile) {
    adminProfile =
      store.profiles.find((p) => p.role === 'administrator' || (p.role as string) === 'hod') ||
      store.profiles[0]
  }

  const dept = adminProfile.department || 'Information Science & Engineering'

  // Student list in department
  const deptStudents = store.studentProfiles
    .filter((sp) => !sp.department || sp.department === dept)
    .map((sp) => {
      const prof = store.profiles.find((p) => p.id === sp.profile_id)
      return {
        ...sp,
        profiles: prof,
      }
    })

  const totalStudents = deptStudents.length
  const awaitingReviewCount = deptStudents.filter(
    (s) => s.verification_status === 'submitted'
  ).length
  const approvedCount = deptStudents.filter(
    (s) => s.verification_status === 'approved'
  ).length
  const correctionNeededCount = deptStudents.filter(
    (s) => s.verification_status === 'correction_requested'
  ).length

  // Count active mentors in department
  const activeMentorsCount = store.profiles.filter(
    (p) => p.role === 'mentor' && (!p.department || p.department === dept)
  ).length

  // Pending recommendations in department
  const pendingRecommendations = store.recommendations
    .filter((r) => r.status === 'pending')
    .map((r) => {
      const sp = store.studentProfiles.find((s) => s.id === r.student_profile_id)
      const stProf = sp ? store.profiles.find((p) => p.id === sp.profile_id) : null
      const mentorProf = store.profiles.find((p) => p.id === r.mentor_profile_id)
      return {
        ...r,
        student: sp ? { ...sp, profiles: stProf } : null,
        mentor: mentorProf || null,
      }
    })

  const pendingStudentSubmissions = deptStudents.filter(
    (s) => s.verification_status === 'submitted'
  )

  // Recent audit logs
  const recentAuditLogs = store.auditLogs
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map((log) => {
      const actor = store.profiles.find((p) => p.id === log.actor_profile_id)
      return {
        ...log,
        actor,
      }
    })

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
  const store = getStore()
  const currentUser = getCurrentUser()
  const adminProf =
    store.profiles.find((p) => p.id === currentUser?.id || p.email === 'hod@demo.com') ||
    store.profiles.find((p) => p.role === 'administrator' || (p.role as string) === 'hod') ||
    store.profiles[0]

  const spIndex = store.studentProfiles.findIndex((s) => s.id === params.studentProfileId)
  if (spIndex < 0) {
    throw new Error('Student profile not found.')
  }

  const existingSp = store.studentProfiles[spIndex]
  store.studentProfiles[spIndex] = {
    ...existingSp,
    verification_status: finalStatus,
    reviewer_profile_id: adminProf.id,
    review_comment: finalComment.trim() || undefined,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const updatedSp = store.studentProfiles[spIndex]

  // Audit log
  store.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    actor_profile_id: adminProf.id,
    action: `STUDENT_VERIFICATION_${finalStatus.toUpperCase()}`,
    target_type: 'student_profiles',
    target_id: params.studentProfileId,
    metadata: {
      new_status: finalStatus,
      reviewer_comment: finalComment,
    },
    created_at: new Date().toISOString(),
  })

  // Notify student
  const statusMessages: Record<string, string> = {
    approved: 'Your academic profile and records have been officially verified and endorsed by the HOD.',
    rejected: `Your verification submission was rejected by the department. Reason: ${finalComment || 'Contact department desk.'}`,
    correction_requested: `Corrections requested on your profile by HOD: ${finalComment || 'Please update your details.'}`,
  }

  store.notifications.unshift({
    id: `notif-${Date.now()}`,
    recipient_profile_id: updatedSp.profile_id,
    title: `Profile Verification: ${finalStatus.replace('_', ' ').toUpperCase()}`,
    message: statusMessages[finalStatus] || 'Your verification status has been updated.',
    type: finalStatus === 'approved' ? 'success' : finalStatus === 'rejected' ? 'danger' : 'warning',
    related_entity_type: 'student_profiles',
    related_entity_id: params.studentProfileId,
    is_read: false,
    created_at: new Date().toISOString(),
  })

  saveStore(store)
  return updatedSp
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
  const store = getStore()
  const currentUser = getCurrentUser()
  const adminProf =
    store.profiles.find((p) => p.id === currentUser?.id || p.email === 'hod@demo.com') ||
    store.profiles.find((p) => p.role === 'administrator' || (p.role as string) === 'hod') ||
    store.profiles[0]

  const recIndex = store.recommendations.findIndex((r) => r.id === params.recommendationId)
  if (recIndex < 0) {
    throw new Error('Recommendation not found.')
  }

  const existingRec = store.recommendations[recIndex]
  store.recommendations[recIndex] = {
    ...existingRec,
    status: finalStatus,
    reviewer_profile_id: adminProf.id,
    review_comment: finalComment.trim() || undefined,
    hod_comment: finalComment.trim() || undefined,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const updatedRec = store.recommendations[recIndex]

  // Audit log
  store.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    actor_profile_id: adminProf.id,
    action: `RECOMMENDATION_${finalStatus.toUpperCase()}`,
    target_type: 'mentor_recommendations',
    target_id: params.recommendationId,
    metadata: {
      status: finalStatus,
      comment: finalComment,
    },
    created_at: new Date().toISOString(),
  })

  // Notify mentor
  if (updatedRec.mentor_profile_id) {
    store.notifications.unshift({
      id: `notif-${Date.now()}-1`,
      recipient_profile_id: updatedRec.mentor_profile_id,
      title: `Recommendation ${finalStatus.toUpperCase()}`,
      message: `Your ${updatedRec.category || ''} recommendation has been ${finalStatus} by Department HOD. ${finalComment ? `Feedback: "${finalComment}"` : ''}`,
      type: finalStatus === 'approved' ? 'success' : 'danger',
      related_entity_type: 'mentor_recommendations',
      related_entity_id: params.recommendationId,
      is_read: false,
      created_at: new Date().toISOString(),
    })
  }

  // Notify student if approved
  if (finalStatus === 'approved' && updatedRec.student_profile_id) {
    const sp = store.studentProfiles.find((s) => s.id === updatedRec.student_profile_id)
    if (sp) {
      store.notifications.unshift({
        id: `notif-${Date.now()}-2`,
        recipient_profile_id: sp.profile_id,
        title: `Faculty Recommendation Endorsed`,
        message: `A ${updatedRec.category || ''} recommendation from your faculty mentor has been approved by the HOD.`,
        type: 'success',
        related_entity_type: 'mentor_recommendations',
        related_entity_id: params.recommendationId,
        is_read: false,
        created_at: new Date().toISOString(),
      })
    }
  }

  saveStore(store)
  return updatedRec
}

/**
 * Assigns or reassigns a faculty mentor to a student
 */
export async function assignMentorToStudent(params: {
  studentProfileId: string
  mentorProfileId: string
  notes?: string
}) {
  const store = getStore()
  const currentUser = getCurrentUser()
  const adminProf =
    store.profiles.find((p) => p.id === currentUser?.id || p.email === 'hod@demo.com') ||
    store.profiles.find((p) => p.role === 'administrator' || (p.role as string) === 'hod') ||
    store.profiles[0]

  // Deactivate existing active assignment for this student
  store.mentorAssignments.forEach((a) => {
    if (a.student_profile_id === params.studentProfileId && a.is_active) {
      a.is_active = false
    }
  })

  // Create new active assignment
  const newAssign: MentorAssignment = {
    id: `asg-${Date.now()}`,
    student_profile_id: params.studentProfileId,
    mentor_profile_id: params.mentorProfileId,
    assigned_by_profile_id: adminProf.id,
    assigned_at: new Date().toISOString(),
    is_active: true,
    notes: params.notes?.trim() || 'Assigned by Department HOD.',
  }

  store.mentorAssignments.push(newAssign)

  const sp = store.studentProfiles.find((s) => s.id === params.studentProfileId)
  const stProf = sp ? store.profiles.find((p) => p.id === sp.profile_id) : null
  const mentorProf = store.profiles.find((p) => p.id === params.mentorProfileId)

  // Audit log
  store.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    actor_profile_id: adminProf.id,
    action: 'ASSIGNED_MENTOR_TO_STUDENT',
    target_type: 'mentor_assignments',
    target_id: newAssign.id,
    metadata: {
      student_profile_id: params.studentProfileId,
      mentor_profile_id: params.mentorProfileId,
      notes: params.notes,
    },
    created_at: new Date().toISOString(),
  })

  // Notify mentor
  store.notifications.unshift({
    id: `notif-${Date.now()}-1`,
    recipient_profile_id: params.mentorProfileId,
    title: 'New Mentee Assigned',
    message: `You have been designated as faculty mentor for ${stProf?.full_name || 'a student'} (${sp?.usn || ''}).`,
    type: 'info',
    related_entity_type: 'mentor_assignments',
    related_entity_id: newAssign.id,
    is_read: false,
    created_at: new Date().toISOString(),
  })

  // Notify student
  if (sp) {
    store.notifications.unshift({
      id: `notif-${Date.now()}-2`,
      recipient_profile_id: sp.profile_id,
      title: 'Mentor Allocated',
      message: `${mentorProf?.full_name || 'A faculty mentor'} has been officially allocated as your faculty mentor.`,
      type: 'info',
      related_entity_type: 'mentor_assignments',
      related_entity_id: newAssign.id,
      is_read: false,
      created_at: new Date().toISOString(),
    })
  }

  saveStore(store)
  return newAssign
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
  const store = getStore()
  const currentUser = getCurrentUser()
  const adminProf =
    store.profiles.find((p) => p.id === currentUser?.id || p.email === 'hod@demo.com') ||
    store.profiles.find((p) => p.role === 'administrator' || (p.role as string) === 'hod') ||
    store.profiles[0]

  const dept = adminProf.department || 'Information Science & Engineering'

  const mentors = store.profiles
    .filter((p) => p.role === 'mentor' && (!p.department || p.department === dept))
    .map((m) => {
      const activeStudentCount = store.mentorAssignments.filter(
        (a) => a.mentor_profile_id === m.id && a.is_active
      ).length

      return {
        ...m,
        activeStudentCount,
        phone: m.phone_number,
      }
    })

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
 * Provisions a new faculty mentor in localStorage
 */
export async function provisionFacultyMentor(params: {
  email: string
  fullName: string
  phone?: string
  password?: string
}) {
  const store = getStore()
  const currentUser = getCurrentUser()
  const adminProf =
    store.profiles.find((p) => p.id === currentUser?.id || p.email === 'hod@demo.com') ||
    store.profiles.find((p) => p.role === 'administrator' || (p.role as string) === 'hod') ||
    store.profiles[0]

  const dept = adminProf.department || 'Information Science & Engineering'
  const email = params.email.trim().toLowerCase()

  const existing = store.profiles.find((p) => p.email.toLowerCase() === email)
  if (existing) {
    existing.role = 'mentor'
    existing.full_name = params.fullName.trim()
    existing.phone_number = params.phone?.trim() || existing.phone_number
    saveStore(store)
    return {
      success: true,
      profile: existing,
      message: 'Existing user elevated to Faculty Mentor.',
    }
  }

  const newFaculty: Profile = {
    id: `p-mentor-${Date.now()}`,
    user_id: `u-mentor-${Date.now()}`,
    role: 'mentor',
    full_name: params.fullName.trim(),
    email,
    department: dept,
    phone_number: params.phone?.trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  store.profiles.push(newFaculty)

  // Audit log
  store.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    actor_profile_id: adminProf.id,
    action: 'PROVISIONED_FACULTY_MENTOR',
    target_type: 'profiles',
    target_id: newFaculty.id,
    metadata: { email, full_name: params.fullName, department: dept },
    created_at: new Date().toISOString(),
  })

  saveStore(store)
  return {
    success: true,
    profile: newFaculty,
    message: 'Faculty Mentor successfully provisioned in department directory.',
  }
}
