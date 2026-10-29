import { createClient } from '@/lib/supabase/client'
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
 * Loads the mentor dashboard overview data from real Supabase records
 */
export async function getMentorDashboardData(): Promise<MentorDashboardData> {
  const supabase = createClient()

  // 1. Get current authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('You must be signed in as faculty to view the Mentor Desk.')
  }

  // 2. Fetch mentor's profile
  const { data: mentorProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<Profile>()

  if (profileErr || !mentorProfile) {
    throw new Error('Faculty profile record not found.')
  }

  // 3. Fetch active mentor assignments
  const { data: assignments, error: assignErr } = await supabase
    .from('mentor_assignments')
    .select(`
      student_profile_id,
      assigned_at,
      student_profiles (
        id,
        profile_id,
        usn,
        department,
        semester,
        academic_batch,
        verification_status,
        profiles (
          id,
          full_name,
          email,
          phone_number
        )
      )
    `)
    .eq('mentor_profile_id', mentorProfile.id)
    .eq('is_active', true)

  if (assignErr) {
    console.error('Error fetching assignments:', assignErr)
  }

  const assignedStudentProfiles: any[] = (assignments || [])
    .map((a: any) => a.student_profiles)
    .filter(Boolean)

  const studentProfileIds = assignedStudentProfiles.map((s) => s.id)

  // 4. Fetch academic records for assigned students
  let allAcademicRecords: AcademicRecord[] = []
  if (studentProfileIds.length > 0) {
    const { data: records } = await supabase
      .from('academic_records')
      .select('*')
      .in('student_profile_id', studentProfileIds)

    allAcademicRecords = (records as any) || []
  }

  // 5. Fetch mentor's authored notes
  const { data: notes } = await supabase
    .from('mentor_notes')
    .select(`
      *,
      student:student_profiles(
        id,
        usn,
        profiles(full_name)
      )
    `)
    .eq('mentor_profile_id', mentorProfile.id)
    .order('note_date', { ascending: false })

  const mentorNotes = (notes as any) || []

  // 6. Fetch recommendations
  const { data: recs } = await supabase
    .from('mentor_recommendations')
    .select(`
      *,
      student:student_profiles(
        id,
        usn,
        profiles(full_name)
      )
    `)
    .eq('mentor_profile_id', mentorProfile.id)
    .order('created_at', { ascending: false })

  const mentorRecommendations = (recs as any) || []

  // 7. Compute student summaries and follow-up flags
  const studentSummaries: MentorStudentSummary[] = assignedStudentProfiles.map((sp) => {
    const studentRecords = allAcademicRecords.filter(
      (r) => r.student_profile_id === sp.id
    )
    const totalCredits = studentRecords.reduce((sum, r) => sum + (r.credits || 0), 0)
    const activeBacklogs = studentRecords.filter((r) => r.is_backlog).length
    const attendanceSum = studentRecords.reduce(
      (sum, r) => sum + (r.attendance_percentage || 0),
      0
    )
    const avgAttendance =
      studentRecords.length > 0
        ? Math.round(attendanceSum / studentRecords.length)
        : undefined

    const studentNotes = mentorNotes.filter((n: MentorNote) => n.student_profile_id === sp.id)
    const lastNoteDate = studentNotes[0]?.note_date

    // Determine if student needs attention
    let needsAttention = false
    let attentionReason = ''

    if (sp.verification_status === 'submitted') {
      needsAttention = true
      attentionReason = 'Submission awaiting verification review'
    } else if (activeBacklogs > 0) {
      needsAttention = true
      attentionReason = `${activeBacklogs} active backlog course(s)`
    } else if (avgAttendance !== undefined && avgAttendance < 75) {
      needsAttention = true
      attentionReason = `Low average attendance (${avgAttendance}%)`
    } else if (!lastNoteDate) {
      needsAttention = true
      attentionReason = 'No initial mentoring session logged'
    }

    return {
      id: sp.id,
      profileId: sp.profile_id,
      usn: sp.usn,
      fullName: sp.profiles?.full_name || 'Student',
      email: sp.profiles?.email || '',
      department: sp.department,
      semester: sp.semester,
      academicBatch: sp.academic_batch,
      verificationStatus: sp.verification_status,
      phone: sp.profiles?.phone_number,
      totalCourses: studentRecords.length,
      totalCredits,
      activeBacklogs,
      avgAttendance,
      lastNoteDate,
      needsAttention,
      attentionReason,
    }
  })

  // 8. Fetch mentor notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_profile_id', mentorProfile.id)
    .order('created_at', { ascending: false })

  return {
    mentorProfile,
    assignedStudentsCount: studentSummaries.length,
    pendingVerificationCount: studentSummaries.filter(
      (s) => s.verificationStatus === 'submitted'
    ).length,
    pendingRecommendationsCount: mentorRecommendations.filter(
      (r: MentorRecommendation) => r.status === 'pending'
    ).length,
    recentNotes: mentorNotes.slice(0, 5),
    studentsRequiringFollowUp: studentSummaries.filter((s) => s.needsAttention),
    assignedStudents: studentSummaries,
    notifications: (notifications as any) || [],
  }
}

/**
 * Loads full detailed information for an assigned student.
 * If the student is not assigned to the calling mentor, throws an authorization error.
 */
export async function getAssignedStudentDetail(studentProfileId: string): Promise<StudentFullDetail> {
  const supabase = createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Authentication required.')
  }

  // 2. Query mentor profile
  const { data: mentorProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!mentorProfile) {
    throw new Error('Mentor profile not found.')
  }

  // 3. Verify active assignment check
  const { data: assignment, error: assignErr } = await supabase
    .from('mentor_assignments')
    .select('assigned_at')
    .eq('mentor_profile_id', mentorProfile.id)
    .eq('student_profile_id', studentProfileId)
    .eq('is_active', true)
    .maybeSingle()

  if (assignErr || !assignment) {
    throw new Error('Access denied: You are not authorized to view this student profile. Only assigned faculty mentors may access student records.')
  }

  // 4. Fetch student profile and related profile
  const { data: studentProfile, error: spErr } = await supabase
    .from('student_profiles')
    .select('*, profiles(*)')
    .eq('id', studentProfileId)
    .single<StudentProfile & { profiles: Profile }>()

  if (spErr || !studentProfile) {
    throw new Error('Student profile record could not be retrieved.')
  }

  // 5. Fetch academic records
  const { data: academicRecords } = await supabase
    .from('academic_records')
    .select('*')
    .eq('student_profile_id', studentProfileId)
    .order('semester', { ascending: true })
    .order('course_code', { ascending: true })

  // 6. Fetch mentor notes for this student (all author's notes)
  const { data: notes } = await supabase
    .from('mentor_notes')
    .select('*')
    .eq('student_profile_id', studentProfileId)
    .eq('mentor_profile_id', mentorProfile.id)
    .order('note_date', { ascending: false })

  // 7. Fetch recommendations for this student
  const { data: recommendations } = await supabase
    .from('mentor_recommendations')
    .select('*')
    .eq('student_profile_id', studentProfileId)
    .eq('mentor_profile_id', mentorProfile.id)
    .order('created_at', { ascending: false })

  return {
    studentProfile,
    profile: studentProfile.profiles || ({} as Profile),
    academicRecords: (academicRecords as any) || [],
    mentorNotes: (notes as any) || [],
    recommendations: (recommendations as any) || [],
    assignmentDate: assignment.assigned_at,
  }
}

/**
 * Creates a new mentoring session note with author and visibility controls
 */
export async function createMentorNote(params: {
  studentProfileId: string
  content: string
  noteDate: string
  visibility: NoteVisibility
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Authentication required.')

  const { data: mentorProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!mentorProfile) throw new Error('Mentor profile not found.')

  const { data, error } = await supabase
    .from('mentor_notes')
    .insert({
      student_profile_id: params.studentProfileId,
      mentor_profile_id: mentorProfile.id,
      content: params.content.trim(),
      note_date: params.noteDate,
      visibility: params.visibility,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Updates an existing mentor note
 */
export async function updateMentorNote(params: {
  noteId: string
  content: string
  noteDate: string
  visibility: NoteVisibility
}) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('mentor_notes')
    .update({
      content: params.content.trim(),
      note_date: params.noteDate,
      visibility: params.visibility,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.noteId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Deletes a mentor note
 */
export async function deleteMentorNote(noteId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('mentor_notes').delete().eq('id', noteId)
  if (error) throw new Error(error.message)
  return true
}

/**
 * Creates and submits a formal recommendation to the HOD
 */
export async function createMentorRecommendation(params: {
  studentProfileId: string
  category: RecommendationCategory
  details: string
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Authentication required.')

  const { data: mentorProfile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!mentorProfile) throw new Error('Mentor profile not found.')

  const { data, error } = await supabase
    .from('mentor_recommendations')
    .insert({
      student_profile_id: params.studentProfileId,
      mentor_profile_id: mentorProfile.id,
      category: params.category,
      details: params.details.trim(),
      status: 'pending',
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Updates a pending recommendation
 */
export async function updateMentorRecommendation(params: {
  recommendationId: string
  category: RecommendationCategory
  details: string
}) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('mentor_recommendations')
    .update({
      category: params.category,
      details: params.details.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.recommendationId)
    .eq('status', 'pending')
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Deletes a pending recommendation
 */
export async function deleteMentorRecommendation(recommendationId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('mentor_recommendations')
    .delete()
    .eq('id', recommendationId)
    .eq('status', 'pending')

  if (error) throw new Error(error.message)
  return true
}
