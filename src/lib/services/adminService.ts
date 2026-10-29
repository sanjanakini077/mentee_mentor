import { createClient } from '@/lib/supabase/client'
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
 * Loads HOD Administrator dashboard metrics and pending queue within authorized department
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Authentication required for administrative access.')
  }

  // 2. Fetch administrator profile
  const { data: adminProfile, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<Profile>()

  if (profErr || !adminProfile) {
    throw new Error('Administrator profile record not found.')
  }

  const dept = adminProfile.department

  // 3. Count students in department by status
  const { data: deptStudents } = await supabase
    .from('student_profiles')
    .select(`
      id,
      usn,
      semester,
      verification_status,
      reviewed_at,
      profiles (
        id,
        full_name,
        email
      )
    `)
    .eq('department', dept)

  const studentsList: any[] = deptStudents || []

  const totalStudents = studentsList.length
  const awaitingReviewCount = studentsList.filter(
    (s) => s.verification_status === 'submitted'
  ).length
  const approvedCount = studentsList.filter(
    (s) => s.verification_status === 'approved'
  ).length
  const correctionNeededCount = studentsList.filter(
    (s) => s.verification_status === 'correction_requested'
  ).length

  // 4. Count active mentors in department
  const { count: activeMentorsCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('department', dept)
    .eq('role', 'mentor')

  // 5. Fetch pending mentor recommendations in department
  const { data: recs } = await supabase
    .from('mentor_recommendations')
    .select(`
      *,
      student:student_profiles (
        id,
        usn,
        semester,
        department,
        profiles (
          full_name
        )
      ),
      mentor:profiles!mentor_recommendations_mentor_profile_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Filter recommendations matching department
  const pendingRecs = (recs || []).filter(
    (r: any) => r.student?.department === dept
  )

  // 6. Fetch recent audit logs
  const { data: logs } = await supabase
    .from('audit_logs')
    .select(`
      *,
      actor:profiles (
        id,
        full_name,
        email,
        role
      )
    `)
    .order('created_at', { ascending: false })
    .limit(8)

  return {
    adminProfile,
    totalStudents,
    awaitingReviewCount,
    approvedCount,
    correctionNeededCount,
    pendingRecommendationsCount: pendingRecs.length,
    activeMentorsCount: activeMentorsCount || 0,
    pendingStudentSubmissions: studentsList.filter(
      (s) => s.verification_status === 'submitted'
    ),
    pendingRecommendations: pendingRecs,
    recentAuditLogs: (logs as any) || [],
  }
}

/**
 * Reviews a student profile (Approve, Reject, or Request Corrections)
 */
export async function reviewStudentProfile(params: {
  studentProfileId: string
  decision: 'approved' | 'rejected' | 'correction_requested'
  reviewComment?: string
}) {
  const supabase = createClient()

  if (
    (params.decision === 'rejected' || params.decision === 'correction_requested') &&
    (!params.reviewComment || params.reviewComment.trim().length === 0)
  ) {
    throw new Error('An explanatory review comment is required when rejecting or requesting corrections.')
  }

  // 1. Get current admin profile
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required.')

  const { data: adminProf } = await supabase
    .from('profiles')
    .select('id, full_name, department')
    .eq('user_id', user.id)
    .single()

  if (!adminProf) throw new Error('Administrator profile not found.')

  // 2. Update student_profiles record
  const { data: updatedSp, error: updateErr } = await supabase
    .from('student_profiles')
    .update({
      verification_status: params.decision,
      review_comment: params.reviewComment?.trim() || null,
      reviewer_profile_id: adminProf.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.studentProfileId)
    .select('profile_id, usn')
    .single()

  if (updateErr) {
    throw new Error(`Review decision failed: ${updateErr.message}`)
  }

  // 3. Append immutable audit log
  try {
    await supabase.from('audit_logs').insert({
      actor_profile_id: adminProf.id,
      action: `STUDENT_VERIFICATION_${params.decision.toUpperCase()}`,
      target_type: 'student_profiles',
      target_id: params.studentProfileId,
      metadata: {
        decision: params.decision,
        comment: params.reviewComment || '',
        student_usn: updatedSp?.usn,
      },
    })
  } catch (auditErr) {
    console.warn('Audit log write error:', auditErr)
  }

  // 4. Notify student
  try {
    await supabase.from('notifications').insert({
      recipient_profile_id: updatedSp.profile_id,
      title:
        params.decision === 'approved'
          ? 'Profile Verification Approved'
          : params.decision === 'correction_requested'
          ? 'Action Required: Corrections Requested'
          : 'Profile Verification Rejected',
      message:
        params.reviewComment ||
        `Your student profile verification was marked as ${params.decision} by the department head.`,
      type:
        params.decision === 'approved'
          ? 'success'
          : params.decision === 'correction_requested'
          ? 'warning'
          : 'danger',
      related_entity_type: 'student_profiles',
      related_entity_id: params.studentProfileId,
    })
  } catch (notifErr) {
    console.warn('Notification write error:', notifErr)
  }

  return true
}

/**
 * Reviews a faculty mentor recommendation (Approve or Reject)
 */
export async function reviewMentorRecommendation(params: {
  recommendationId: string
  decision: 'approved' | 'rejected'
  reviewComment?: string
}) {
  const supabase = createClient()

  if (
    params.decision === 'rejected' &&
    (!params.reviewComment || params.reviewComment.trim().length === 0)
  ) {
    throw new Error('An explanatory comment is required when rejecting a faculty recommendation.')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required.')

  const { data: adminProf } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!adminProf) throw new Error('Administrator profile not found.')

  // Update recommendation
  const { data: updatedRec, error: updateErr } = await supabase
    .from('mentor_recommendations')
    .update({
      status: params.decision,
      review_comment: params.reviewComment?.trim() || null,
      reviewer_profile_id: adminProf.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.recommendationId)
    .select('student_profile_id, mentor_profile_id, category')
    .single()

  if (updateErr) {
    throw new Error(`Recommendation review failed: ${updateErr.message}`)
  }

  // Append audit log
  try {
    await supabase.from('audit_logs').insert({
      actor_profile_id: adminProf.id,
      action: `RECOMMENDATION_${params.decision.toUpperCase()}`,
      target_type: 'mentor_recommendations',
      target_id: params.recommendationId,
      metadata: {
        decision: params.decision,
        comment: params.reviewComment || '',
        category: updatedRec?.category,
      },
    })
  } catch (auditErr) {
    console.warn('Audit log write error:', auditErr)
  }

  // Notify mentor
  if (updatedRec?.mentor_profile_id) {
    try {
      await supabase.from('notifications').insert({
        recipient_profile_id: updatedRec.mentor_profile_id,
        title: `Recommendation ${params.decision === 'approved' ? 'Endorsed' : 'Rejected'}`,
        message:
          params.reviewComment ||
          `Your faculty recommendation was ${params.decision} by the Department Head.`,
        type: params.decision === 'approved' ? 'success' : 'warning',
        related_entity_type: 'mentor_recommendations',
        related_entity_id: params.recommendationId,
      })
    } catch (notifErr) {
      console.warn('Notification write error for mentor:', notifErr)
    }
  }

  // Notify student if approved
  if (params.decision === 'approved' && updatedRec?.student_profile_id) {
    try {
      const { data: stProfile } = await supabase
        .from('student_profiles')
        .select('profile_id')
        .eq('id', updatedRec.student_profile_id)
        .single()

      if (stProfile?.profile_id) {
        await supabase.from('notifications').insert({
          recipient_profile_id: stProfile.profile_id,
          title: 'Faculty Recommendation Endorsed',
          message:
            params.reviewComment ||
            `A faculty recommendation for your academic portfolio has been approved and endorsed by the Department Head.`,
          type: 'success',
          related_entity_type: 'mentor_recommendations',
          related_entity_id: params.recommendationId,
        })
      }
    } catch (stNotifErr) {
      console.warn('Notification write error for student:', stNotifErr)
    }
  }

  return true
}

/**
 * Assigns or re-assigns a faculty mentor to a student
 */
export async function assignMentorToStudent(params: {
  studentProfileId: string
  mentorProfileId: string
  notes?: string
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required.')

  const { data: adminProf } = await supabase
    .from('profiles')
    .select('id, department')
    .eq('user_id', user.id)
    .single()

  if (!adminProf) throw new Error('Administrator profile not found.')

  // 1. Deactivate any existing active assignment for this student to prevent duplicate active assignments
  await supabase
    .from('mentor_assignments')
    .update({ is_active: false })
    .eq('student_profile_id', params.studentProfileId)
    .eq('is_active', true)

  // 2. Insert new active assignment
  const { data: newAssign, error: insertErr } = await supabase
    .from('mentor_assignments')
    .insert({
      student_profile_id: params.studentProfileId,
      mentor_profile_id: params.mentorProfileId,
      assigned_by_profile_id: adminProf.id,
      is_active: true,
      notes: params.notes?.trim() || 'Departmental faculty mentorship allocation',
    })
    .select('*')
    .single()

  if (insertErr) {
    throw new Error(`Mentor allocation failed: ${insertErr.message}`)
  }

  // 3. Log audit event
  try {
    await supabase.from('audit_logs').insert({
      actor_profile_id: adminProf.id,
      action: 'ASSIGNED_MENTOR',
      target_type: 'mentor_assignments',
      target_id: newAssign.id,
      metadata: {
        student_profile_id: params.studentProfileId,
        mentor_profile_id: params.mentorProfileId,
        notes: params.notes || '',
      },
    })
  } catch (auditErr) {
    console.warn('Audit log write error:', auditErr)
  }

  // 4. Notify mentor
  try {
    await supabase.from('notifications').insert({
      recipient_profile_id: params.mentorProfileId,
      title: 'New Student Allocated',
      message: 'A student has been officially allocated to your mentorship desk by the Department Head.',
      type: 'info',
      related_entity_type: 'mentor_assignments',
      related_entity_id: newAssign.id,
    })
  } catch (notifErr) {
    console.warn('Notification write error:', notifErr)
  }

  return true
}

