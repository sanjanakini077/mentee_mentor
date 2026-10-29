import {
  getStore,
  saveStore,
  getCurrentUser,
} from '@/lib/storage/demoStore'
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
 * Loads the mentor dashboard overview data from demoStore
 */
export async function getMentorDashboardData(): Promise<MentorDashboardData> {
  const store = getStore()
  const currentUser = getCurrentUser()

  let mentorProfile = store.profiles.find(
    (p) =>
      p.id === currentUser?.id ||
      p.email === currentUser?.email ||
      p.email === 'mentor@demo.com'
  )

  if (!mentorProfile) {
    mentorProfile = store.profiles.find((p) => p.role === 'mentor') || store.profiles[0]
  }

  // Active assignments for this mentor
  const assignments = store.mentorAssignments.filter(
    (a) => a.mentor_profile_id === mentorProfile!.id && a.is_active
  )

  const assignedStudentIds = assignments.map((a) => a.student_profile_id)

  const studentSummaries: MentorStudentSummary[] = []

  for (const spId of assignedStudentIds) {
    const sp = store.studentProfiles.find((s) => s.id === spId)
    if (!sp) continue

    const prof = store.profiles.find((p) => p.id === sp.profile_id)
    const records = store.academicRecords.filter(
      (r) => r.student_profile_id === sp.id || r.student_id === sp.id
    )
    const notes = store.mentorNotes.filter(
      (n) => n.student_profile_id === sp.id || n.student_id === sp.id
    )

    const totalCourses = records.length
    const totalCredits = records.reduce((acc, r) => acc + (r.credits || 0), 0)
    const activeBacklogs = records.filter((r) => r.is_backlog).length

    const validAtt = records.filter((r) => r.attendance_percentage !== undefined)
    const avgAttendance =
      validAtt.length > 0
        ? Math.round(
            validAtt.reduce((acc, r) => acc + (r.attendance_percentage || 0), 0) /
              validAtt.length
          )
        : undefined

    const sortedNotes = [...notes].sort(
      (a, b) => new Date(b.note_date).getTime() - new Date(a.note_date).getTime()
    )
    const lastNoteDate = sortedNotes[0]?.note_date

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
      academicBatch: sp.academic_batch || '2021-2025',
      verificationStatus: sp.verification_status,
      phone: prof?.phone_number || sp.phone,
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

  const pendingRecommendationsCount = store.recommendations.filter(
    (r) => r.mentor_profile_id === mentorProfile!.id && r.status === 'pending'
  ).length

  const recentNotes = store.mentorNotes
    .filter((n) => n.mentor_profile_id === mentorProfile!.id)
    .sort((a, b) => new Date(b.created_at || b.note_date).getTime() - new Date(a.created_at || a.note_date).getTime())
    .slice(0, 10)

  // Attach student details to notes
  recentNotes.forEach((n) => {
    const sp = store.studentProfiles.find((s) => s.id === n.student_profile_id)
    if (sp) {
      const prof = store.profiles.find((p) => p.id === sp.profile_id)
      n.student = { ...sp, profiles: prof }
    }
  })

  const studentsRequiringFollowUp = studentSummaries.filter((s) => s.needsAttention)

  const notifications = store.notifications
    .filter((n) => n.recipient_profile_id === mentorProfile!.id)
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())

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
  const store = getStore()
  const studentProfile = store.studentProfiles.find((sp) => sp.id === studentProfileId)

  if (!studentProfile) {
    throw new Error('Student profile not found.')
  }

  const profile =
    store.profiles.find((p) => p.id === studentProfile.profile_id) || {
      id: studentProfile.profile_id,
      user_id: studentProfile.profile_id,
      role: 'mentee' as const,
      full_name: 'Student',
      email: '',
      department: studentProfile.department || 'Information Science & Engineering',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

  const academicRecords = store.academicRecords
    .filter((r) => r.student_profile_id === studentProfileId || r.student_id === studentProfileId)
    .sort((a, b) => a.semester - b.semester)

  const mentorNotes = store.mentorNotes
    .filter((n) => n.student_profile_id === studentProfileId || n.student_id === studentProfileId)
    .sort((a, b) => new Date(b.note_date).getTime() - new Date(a.note_date).getTime())

  const recommendations = store.recommendations
    .filter((r) => r.student_profile_id === studentProfileId || r.student_id === studentProfileId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const assignment = store.mentorAssignments.find(
    (a) => a.student_profile_id === studentProfileId && a.is_active
  )

  return {
    studentProfile,
    profile,
    academicRecords,
    mentorNotes,
    recommendations,
    assignmentDate: assignment?.assigned_at,
  }
}

/**
 * Creates a new mentor guidance note
 */
export async function createMentorNote(params: {
  studentProfileId: string
  content: string
  noteDate?: string
  visibility?: NoteVisibility
}) {
  const store = getStore()
  const currentUser = getCurrentUser()
  const mentor =
    store.profiles.find((p) => p.id === currentUser?.id || p.email === 'mentor@demo.com') ||
    store.profiles.find((p) => p.role === 'mentor') ||
    store.profiles[0]

  const newNote: MentorNote = {
    id: `note-${Date.now()}`,
    student_profile_id: params.studentProfileId,
    student_id: params.studentProfileId,
    mentor_profile_id: mentor.id,
    mentor_id: mentor.id,
    note_date: params.noteDate || new Date().toISOString().split('T')[0],
    content: params.content.trim(),
    visibility: params.visibility || 'shared_with_mentee',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  store.mentorNotes.unshift(newNote)

  // Notify student if shared
  if (newNote.visibility === 'shared_with_mentee') {
    const sp = store.studentProfiles.find((s) => s.id === params.studentProfileId)
    if (sp) {
      store.notifications.push({
        id: `notif-${Date.now()}`,
        recipient_profile_id: sp.profile_id,
        title: 'New Mentoring Note',
        message: `${mentor.full_name} added guidance to your student record.`,
        type: 'info',
        related_entity_type: 'mentor_notes',
        related_entity_id: newNote.id,
        is_read: false,
        created_at: new Date().toISOString(),
      })
    }
  }

  // Audit log
  store.auditLogs.push({
    id: `aud-${Date.now()}`,
    actor_profile_id: mentor.id,
    action: 'CREATED_MENTOR_NOTE',
    target_type: 'mentor_notes',
    target_id: newNote.id,
    metadata: {
      student_profile_id: params.studentProfileId,
      visibility: newNote.visibility,
    },
    created_at: new Date().toISOString(),
  })

  saveStore(store)
  return newNote
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
  const store = getStore()
  const index = store.mentorNotes.findIndex((n) => n.id === params.noteId)

  if (index < 0) {
    throw new Error('Mentor note not found.')
  }

  store.mentorNotes[index] = {
    ...store.mentorNotes[index],
    content: params.content.trim(),
    note_date: params.noteDate || store.mentorNotes[index].note_date,
    visibility: params.visibility || store.mentorNotes[index].visibility,
    updated_at: new Date().toISOString(),
  }

  saveStore(store)
  return store.mentorNotes[index]
}

/**
 * Deletes a mentor note
 */
export async function deleteMentorNote(noteId: string) {
  const store = getStore()
  store.mentorNotes = store.mentorNotes.filter((n) => n.id !== noteId)
  saveStore(store)
  return true
}

/**
 * Submits a new mentor recommendation to HOD
 */
export async function createMentorRecommendation(params: {
  studentProfileId: string
  category: RecommendationCategory
  details: string
}) {
  const store = getStore()
  const currentUser = getCurrentUser()
  const mentor =
    store.profiles.find((p) => p.id === currentUser?.id || p.email === 'mentor@demo.com') ||
    store.profiles.find((p) => p.role === 'mentor') ||
    store.profiles[0]

  const newRec: MentorRecommendation = {
    id: `rec-${Date.now()}`,
    student_profile_id: params.studentProfileId,
    student_id: params.studentProfileId,
    mentor_profile_id: mentor.id,
    mentor_id: mentor.id,
    category: params.category,
    details: params.details.trim(),
    content: params.details.trim(),
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  store.recommendations.unshift(newRec)

  // Notify HOD
  const sp = store.studentProfiles.find((s) => s.id === params.studentProfileId)
  const studentUser = sp ? store.profiles.find((p) => p.id === sp.profile_id) : null
  const studentName = studentUser?.full_name || 'Student'

  const hod = store.profiles.find(
    (p) => p.role === 'administrator' || (p.role as string) === 'hod'
  )
  if (hod) {
    store.notifications.push({
      id: `notif-${Date.now()}`,
      recipient_profile_id: hod.id,
      title: 'Mentor Recommendation Submitted',
      message: `${mentor.full_name} submitted a ${params.category} recommendation for ${studentName}.`,
      type: 'warning',
      related_entity_type: 'mentor_recommendations',
      related_entity_id: newRec.id,
      is_read: false,
      created_at: new Date().toISOString(),
    })
  }

  // Audit log
  store.auditLogs.push({
    id: `aud-${Date.now()}`,
    actor_profile_id: mentor.id,
    action: 'SUBMITTED_RECOMMENDATION',
    target_type: 'mentor_recommendations',
    target_id: newRec.id,
    metadata: {
      category: params.category,
      student_profile_id: params.studentProfileId,
    },
    created_at: new Date().toISOString(),
  })

  saveStore(store)
  return newRec
}

/**
 * Updates a mentor recommendation
 */
export async function updateMentorRecommendation(params: {
  recommendationId: string
  category: RecommendationCategory
  details: string
}) {
  const store = getStore()
  const index = store.recommendations.findIndex((r) => r.id === params.recommendationId)

  if (index < 0) {
    throw new Error('Recommendation not found.')
  }

  store.recommendations[index] = {
    ...store.recommendations[index],
    category: params.category,
    details: params.details.trim(),
    content: params.details.trim(),
    updated_at: new Date().toISOString(),
  }

  saveStore(store)
  return store.recommendations[index]
}

/**
 * Deletes a mentor recommendation
 */
export async function deleteMentorRecommendation(recommendationId: string) {
  const store = getStore()
  store.recommendations = store.recommendations.filter((r) => r.id !== recommendationId)
  saveStore(store)
  return true
}
