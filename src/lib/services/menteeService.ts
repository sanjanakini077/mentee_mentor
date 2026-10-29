import { createClient } from '@/lib/supabase/client'
import type {
  Profile,
  StudentProfile,
  AcademicRecord,
  MentorNote,
  MentorRecommendation,
  AppNotification,
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
  completionRate: number
  missingFields: string[]
}

/**
 * Calculates profile completion percentage and identifies missing fields
 */
export function calculateProfileCompletion(
  profile: Profile | null,
  sp: StudentProfile | null
): { rate: number; missing: string[] } {
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
 * Loads or scaffolds the authenticated mentee's full record from Supabase
 */
export async function getMenteeFullData(): Promise<MenteeFullData> {
  const supabase = createClient()

  // 1. Get current authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('You must be signed in as a student to access this portal.')
  }

  // 2. Load user's profile by user_id or email fallback
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle<Profile>()

  if (!profile && user.email) {
    const { data: profileByEmail } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', user.email)
      .maybeSingle<Profile>()

    if (profileByEmail) {
      profile = profileByEmail
      // Automatically sync the user_id if it differs
      await supabase
        .from('profiles')
        .update({ user_id: user.id })
        .eq('id', profileByEmail.id)
    }
  }

  if (!profile) {
    // If not found in profiles, create initial profile entry
    const initialName =
      user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'
    const initialDept =
      user.user_metadata?.department || 'Information Science & Engineering'

    const { data: newProfile, error: createProfileErr } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          role: 'mentee',
          full_name: initialName,
          email: user.email!,
          department: initialDept,
          phone_number: user.user_metadata?.phone_number || null,
        },
        { onConflict: 'email' }
      )
      .select('*')
      .single<Profile>()

    if (createProfileErr || !newProfile) {
      console.error('Profile creation error:', createProfileErr)
      throw new Error(createProfileErr?.message || 'Unable to initialize user profile.')
    }
    profile = newProfile
  }

  // 3. Load or initialize student_profiles entry
  let { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('profile_id', profile.id)
    .maybeSingle<StudentProfile>()

  if (!studentProfile) {
    const rawUsn =
      user.user_metadata?.usn ||
      `USN${Math.floor(100000 + Math.random() * 900000)}`
    const { data: newSp, error: createSpErr } = await supabase
      .from('student_profiles')
      .insert({
        profile_id: profile.id,
        usn: rawUsn.toUpperCase().trim(),
        department: profile.department,
        semester: Number(user.user_metadata?.semester) || 1,
        academic_batch: '2024-2028',
        verification_status: 'draft',
      })
      .select('*')
      .single<StudentProfile>()

    if (createSpErr || !newSp) {
      console.warn('Could not auto-create student profile:', createSpErr)
      studentProfile = {
        id: profile.id,
        profile_id: profile.id,
        usn: rawUsn,
        department: profile.department,
        semester: 1,
        academic_batch: '2024-2028',
        verification_status: 'draft',
      }
    } else {
      studentProfile = newSp
    }
  }

  // Attach profiles object
  studentProfile.profiles = profile

  // 4. Fetch assigned mentor
  let assignedMentor: Profile | null = null
  let mentorAssignmentDate: string | undefined = undefined

  const { data: assignment } = await supabase
    .from('mentor_assignments')
    .select('mentor_profile_id, assigned_at')
    .eq('student_profile_id', studentProfile.id)
    .eq('is_active', true)
    .maybeSingle()

  if (assignment?.mentor_profile_id) {
    mentorAssignmentDate = assignment.assigned_at
    const { data: mentorProf } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', assignment.mentor_profile_id)
      .maybeSingle<Profile>()

    if (mentorProf) {
      assignedMentor = mentorProf
    }
  }

  // 5. Fetch academic records
  const { data: academicRecords } = await supabase
    .from('academic_records')
    .select('*')
    .eq('student_profile_id', studentProfile.id)
    .order('semester', { ascending: true })
    .order('course_code', { ascending: true })

  // 6. Fetch mentor notes shared with this student
  const { data: mentorNotes } = await supabase
    .from('mentor_notes')
    .select('*')
    .eq('student_profile_id', studentProfile.id)
    .eq('visibility', 'shared_with_mentee')
    .order('note_date', { ascending: false })

  // 7. Fetch mentor recommendations for this student
  const { data: recommendations } = await supabase
    .from('mentor_recommendations')
    .select('*')
    .eq('student_profile_id', studentProfile.id)
    .order('created_at', { ascending: false })

  // 8. Fetch notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_profile_id', profile.id)
    .order('created_at', { ascending: false })

  const { rate, missing } = calculateProfileCompletion(profile, studentProfile)

  return {
    profile,
    studentProfile,
    assignedMentor,
    mentorAssignmentDate,
    academicRecords: (academicRecords as any) || [],
    mentorNotes: (mentorNotes as any) || [],
    recommendations: (recommendations as any) || [],
    notifications: (notifications as any) || [],
    completionRate: rate,
    missingFields: missing,
  }
}

/**
 * Updates mentee demographic and contact details
 */
export async function updateMenteeProfile(params: {
  profileId: string
  studentProfileId: string
  fullName: string
  phoneNumber?: string
  usn?: string
  semester: number
  bloodGroup?: string
  address?: string
  parentName?: string
  parentPhone?: string
  currentStatus: VerificationStatus
}) {
  const supabase = createClient()

  // Verify status permits modification
  if (params.currentStatus === 'submitted') {
    throw new Error('Your profile is currently under official review and cannot be modified until reviewed.')
  }
  if (params.currentStatus === 'approved') {
    throw new Error('Verified student profiles are locked. Please contact the department HOD to request corrections.')
  }

  // 1. Update profiles table
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      full_name: params.fullName.trim(),
      phone_number: params.phoneNumber?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.profileId)

  if (profileErr) {
    throw new Error(`Failed to update profile: ${profileErr.message}`)
  }

  // 2. Update student_profiles table
  const spPayload: Record<string, unknown> = {
    semester: Number(params.semester),
    blood_group: params.bloodGroup?.trim() || null,
    address: params.address?.trim() || null,
    parent_name: params.parentName?.trim() || null,
    parent_phone: params.parentPhone?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  // Allow USN edit only in draft mode
  if (params.currentStatus === 'draft' && params.usn) {
    spPayload.usn = params.usn.trim().toUpperCase()
  }

  const { error: spErr } = await supabase
    .from('student_profiles')
    .update(spPayload)
    .eq('id', params.studentProfileId)

  if (spErr) {
    throw new Error(`Failed to update student profile: ${spErr.message}`)
  }

  return true
}

/**
 * Adds or updates an academic record
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
  const supabase = createClient()

  if (params.currentVerificationStatus === 'submitted') {
    throw new Error('Cannot add or edit academic records while your verification submission is under review.')
  }
  if (params.currentVerificationStatus === 'approved') {
    throw new Error('Academic records have been officially approved. Contact your mentor or HOD to request changes.')
  }

  const payload = {
    student_profile_id: params.studentProfileId,
    academic_year: params.academicYear.trim(),
    semester: Number(params.semester),
    course_code: params.courseCode.trim().toUpperCase(),
    course_name: params.courseName.trim(),
    credits: Number(params.credits) || 3,
    marks_obtained: params.marksObtained !== undefined ? Number(params.marksObtained) : null,
    max_marks: params.maxMarks ? Number(params.maxMarks) : 100,
    grade: params.grade?.trim().toUpperCase() || null,
    grade_points: params.gradePoints !== undefined ? Number(params.gradePoints) : null,
    attendance_percentage:
      params.attendancePercentage !== undefined ? Number(params.attendancePercentage) : null,
    is_backlog: Boolean(params.isBacklog),
    remarks: params.remarks?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  if (params.id) {
    const { data, error } = await supabase
      .from('academic_records')
      .update(payload)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data
  } else {
    const { data, error } = await supabase
      .from('academic_records')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data
  }
}

/**
 * Deletes an academic record
 */
export async function deleteAcademicRecord(
  recordId: string,
  verificationStatus: VerificationStatus
) {
  const supabase = createClient()

  if (verificationStatus === 'submitted' || verificationStatus === 'approved') {
    throw new Error('Cannot delete records while verification is under review or already approved.')
  }

  const { error } = await supabase
    .from('academic_records')
    .delete()
    .eq('id', recordId)

  if (error) {
    throw new Error(`Failed to delete record: ${error.message}`)
  }

  return true
}

/**
 * Submits the mentee's profile and academic records for verification
 */
export async function submitVerificationForReview(studentProfileId: string) {
  const supabase = createClient()

  // 1. Fetch current status and profile info
  const { data: sp, error: fetchErr } = await supabase
    .from('student_profiles')
    .select('id, verification_status, profile_id, usn, department, profiles(full_name)')
    .eq('id', studentProfileId)
    .single()

  if (fetchErr || !sp) {
    throw new Error('Student profile record could not be found.')
  }

  if (sp.verification_status === 'submitted') {
    throw new Error('Your records are already submitted and pending review.')
  }
  if (sp.verification_status === 'approved') {
    throw new Error('Your records have already been approved by the department.')
  }

  // 2. Update status to 'submitted'
  const { error: updateErr } = await supabase
    .from('student_profiles')
    .update({
      verification_status: 'submitted',
      reviewed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentProfileId)

  if (updateErr) {
    throw new Error(`Verification submission failed: ${updateErr.message}`)
  }

  const studentName = (sp as any).profiles?.full_name || 'Student'

  // 3. Create a confirmation notification for the mentee
  try {
    await supabase.from('notifications').insert({
      recipient_profile_id: sp.profile_id,
      title: 'Verification Request Submitted',
      message: 'Your profile and academic records have been submitted for faculty mentor review and HOD endorsement.',
      type: 'info',
      related_entity_type: 'student_profiles',
      related_entity_id: studentProfileId,
    })
  } catch (notifErr) {
    console.warn('Could not create student notification log:', notifErr)
  }

  // 4. Notify the relevant Department Administrator / HOD
  try {
    const { data: hods } = await supabase
      .from('profiles')
      .select('id')
      .eq('department', sp.department)
      .eq('role', 'administrator')

    if (hods && hods.length > 0) {
      for (const hod of hods) {
        await supabase.from('notifications').insert({
          recipient_profile_id: hod.id,
          title: `New Student Submission — ${sp.usn}`,
          message: `${studentName} (${sp.usn}) has submitted their profile and coursework for departmental verification.`,
          type: 'info',
          related_entity_type: 'student_profiles',
          related_entity_id: studentProfileId,
        })
      }
    }
  } catch (hodNotifErr) {
    console.warn('Could not notify HOD of submission:', hodNotifErr)
  }

  // 5. Notify the student's assigned faculty mentor if active
  try {
    const { data: assignment } = await supabase
      .from('mentor_assignments')
      .select('mentor_profile_id')
      .eq('student_profile_id', studentProfileId)
      .eq('is_active', true)
      .maybeSingle()

    if (assignment?.mentor_profile_id) {
      await supabase.from('notifications').insert({
        recipient_profile_id: assignment.mentor_profile_id,
        title: `Mentee Profile Submitted — ${studentName}`,
        message: `${studentName} (${sp.usn}) submitted profile information for verification review.`,
        type: 'info',
        related_entity_type: 'student_profiles',
        related_entity_id: studentProfileId,
      })
    }
  } catch (mentorNotifErr) {
    console.warn('Could not notify mentor of submission:', mentorNotifErr)
  }

  // 6. Record in immutable audit log
  try {
    await supabase.from('audit_logs').insert({
      actor_profile_id: sp.profile_id,
      action: 'SUBMITTED_STUDENT_PROFILE',
      target_type: 'student_profiles',
      target_id: studentProfileId,
      metadata: {
        usn: sp.usn,
        student_name: studentName,
        department: sp.department,
      },
    })
  } catch (auditErr) {
    console.warn('Audit log write error:', auditErr)
  }

  return true
}

/**
 * Marks a notification as read
 */
export async function markNotificationRead(notificationId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) throw new Error(error.message)
  return true
}

/**
 * Marks all notifications as read for current user
 */
export async function markAllNotificationsRead(recipientProfileId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_profile_id', recipientProfileId)
    .eq('is_read', false)

  if (error) throw new Error(error.message)
  return true
}

