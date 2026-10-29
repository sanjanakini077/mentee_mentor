-- ==============================================================================
-- Migration: 20241029000003_row_level_security.sql
-- Description: Explicit Granular Row Level Security (RLS) Policies
-- Covers: profiles, student_profiles, academic_records, mentor_assignments,
--         mentor_notes, mentor_recommendations, notifications, audit_logs
-- ==============================================================================

-- 1. Enable RLS on every application table
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs            ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLICIES: profiles
-- ==============================================================================

-- SELECT: Users read own profile; mentors read assigned students; admins read department; mentees read assigned mentor
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "profiles_select_admin_dept"
  ON public.profiles FOR SELECT
  USING (
    public.current_role() = 'administrator'
    AND department = public.current_department()
  );

CREATE POLICY "profiles_select_mentor_assigned_students"
  ON public.profiles FOR SELECT
  USING (
    public.current_role() = 'mentor'
    AND id IN (
      SELECT sp.profile_id
      FROM public.student_profiles sp
      JOIN public.mentor_assignments ma ON ma.student_profile_id = sp.id
      WHERE ma.mentor_profile_id = public.current_profile_id()
        AND ma.is_active = TRUE
    )
  );

CREATE POLICY "profiles_select_mentee_assigned_mentor"
  ON public.profiles FOR SELECT
  USING (
    public.current_role() = 'mentee'
    AND id IN (
      SELECT ma.mentor_profile_id
      FROM public.mentor_assignments ma
      JOIN public.student_profiles sp ON sp.id = ma.student_profile_id
      WHERE sp.profile_id = public.current_profile_id()
        AND ma.is_active = TRUE
    )
  );

-- INSERT: Authenticated user creates their own profile record upon sign-up
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users update own profile or admins update within department
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_admin_dept"
  ON public.profiles FOR UPDATE
  USING (
    public.current_role() = 'administrator'
    AND department = public.current_department()
  );

-- DELETE: Administrators only
CREATE POLICY "profiles_delete_admin_dept"
  ON public.profiles FOR DELETE
  USING (
    public.current_role() = 'administrator'
    AND department = public.current_department()
  );

-- ==============================================================================
-- POLICIES: student_profiles
-- ==============================================================================

-- SELECT: Mentees read own; mentors read assigned; admins read department
CREATE POLICY "student_profiles_select_mentee_own"
  ON public.student_profiles FOR SELECT
  USING (profile_id = public.current_profile_id());

CREATE POLICY "student_profiles_select_mentor_assigned"
  ON public.student_profiles FOR SELECT
  USING (
    public.current_role() = 'mentor'
    AND public.is_assigned_mentor(id) = TRUE
  );

CREATE POLICY "student_profiles_select_admin_dept"
  ON public.student_profiles FOR SELECT
  USING (
    public.current_role() = 'administrator'
    AND department = public.current_department()
  );

-- INSERT: Mentee creates own student record or admin creates within department
CREATE POLICY "student_profiles_insert_mentee_own"
  ON public.student_profiles FOR INSERT
  WITH CHECK (
    profile_id = public.current_profile_id()
    AND public.current_role() = 'mentee'
  );

CREATE POLICY "student_profiles_insert_admin_dept"
  ON public.student_profiles FOR INSERT
  WITH CHECK (
    public.current_role() = 'administrator'
    AND department = public.current_department()
  );

-- UPDATE: Mentee updates own demographic details; admin updates verification status and review feedback
CREATE POLICY "student_profiles_update_mentee_own"
  ON public.student_profiles FOR UPDATE
  USING (
    profile_id = public.current_profile_id()
    AND public.current_role() = 'mentee'
  )
  WITH CHECK (
    profile_id = public.current_profile_id()
    AND public.current_role() = 'mentee'
  );

CREATE POLICY "student_profiles_update_admin_dept"
  ON public.student_profiles FOR UPDATE
  USING (
    public.current_role() = 'administrator'
    AND department = public.current_department()
  );

-- DELETE: Administrator only
CREATE POLICY "student_profiles_delete_admin_dept"
  ON public.student_profiles FOR DELETE
  USING (
    public.current_role() = 'administrator'
    AND department = public.current_department()
  );

-- ==============================================================================
-- POLICIES: academic_records
-- ==============================================================================

CREATE POLICY "academic_records_select_mentee_own"
  ON public.academic_records FOR SELECT
  USING (public.is_assigned_mentee(student_profile_id) = TRUE);

CREATE POLICY "academic_records_select_mentor_assigned"
  ON public.academic_records FOR SELECT
  USING (
    public.current_role() = 'mentor'
    AND public.is_assigned_mentor(student_profile_id) = TRUE
  );

CREATE POLICY "academic_records_select_admin_dept"
  ON public.academic_records FOR SELECT
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

CREATE POLICY "academic_records_insert_mentee_own"
  ON public.academic_records FOR INSERT
  WITH CHECK (
    public.is_assigned_mentee(student_profile_id) = TRUE
    AND public.current_role() = 'mentee'
  );

CREATE POLICY "academic_records_insert_admin_dept"
  ON public.academic_records FOR INSERT
  WITH CHECK (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

CREATE POLICY "academic_records_update_mentee_own"
  ON public.academic_records FOR UPDATE
  USING (
    public.is_assigned_mentee(student_profile_id) = TRUE
    AND public.current_role() = 'mentee'
  );

CREATE POLICY "academic_records_update_admin_dept"
  ON public.academic_records FOR UPDATE
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

CREATE POLICY "academic_records_delete_mentee_own"
  ON public.academic_records FOR DELETE
  USING (
    public.is_assigned_mentee(student_profile_id) = TRUE
    AND public.current_role() = 'mentee'
  );

CREATE POLICY "academic_records_delete_admin_dept"
  ON public.academic_records FOR DELETE
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

-- ==============================================================================
-- POLICIES: mentor_assignments
-- ==============================================================================

-- SELECT: Mentors see own assignments; mentees see assigned mentor; admins see department
CREATE POLICY "mentor_assignments_select_mentor_own"
  ON public.mentor_assignments FOR SELECT
  USING (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
  );

CREATE POLICY "mentor_assignments_select_mentee_own"
  ON public.mentor_assignments FOR SELECT
  USING (
    public.current_role() = 'mentee'
    AND public.is_assigned_mentee(student_profile_id) = TRUE
  );

CREATE POLICY "mentor_assignments_select_admin_dept"
  ON public.mentor_assignments FOR SELECT
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

-- INSERT / UPDATE / DELETE: Strictly administrators only
CREATE POLICY "mentor_assignments_insert_admin_only"
  ON public.mentor_assignments FOR INSERT
  WITH CHECK (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

CREATE POLICY "mentor_assignments_update_admin_only"
  ON public.mentor_assignments FOR UPDATE
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

CREATE POLICY "mentor_assignments_delete_admin_only"
  ON public.mentor_assignments FOR DELETE
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

-- ==============================================================================
-- POLICIES: mentor_notes
-- ==============================================================================

CREATE POLICY "mentor_notes_select_mentor_own"
  ON public.mentor_notes FOR SELECT
  USING (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
  );

CREATE POLICY "mentor_notes_select_mentee_shared"
  ON public.mentor_notes FOR SELECT
  USING (
    public.current_role() = 'mentee'
    AND public.is_assigned_mentee(student_profile_id) = TRUE
    AND visibility = 'shared_with_mentee'
  );

CREATE POLICY "mentor_notes_select_admin_dept"
  ON public.mentor_notes FOR SELECT
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
    AND visibility <> 'private_mentor_only'
  );

CREATE POLICY "mentor_notes_insert_mentor_only"
  ON public.mentor_notes FOR INSERT
  WITH CHECK (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
    AND public.is_assigned_mentor(student_profile_id) = TRUE
  );

CREATE POLICY "mentor_notes_update_mentor_author"
  ON public.mentor_notes FOR UPDATE
  USING (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
  );

CREATE POLICY "mentor_notes_delete_mentor_author"
  ON public.mentor_notes FOR DELETE
  USING (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
  );

-- ==============================================================================
-- POLICIES: mentor_recommendations
-- ==============================================================================

CREATE POLICY "mentor_recommendations_select_mentor_own"
  ON public.mentor_recommendations FOR SELECT
  USING (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
  );

CREATE POLICY "mentor_recommendations_select_mentee_own"
  ON public.mentor_recommendations FOR SELECT
  USING (
    public.current_role() = 'mentee'
    AND public.is_assigned_mentee(student_profile_id) = TRUE
  );

CREATE POLICY "mentor_recommendations_select_admin_dept"
  ON public.mentor_recommendations FOR SELECT
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

CREATE POLICY "mentor_recommendations_insert_mentor_only"
  ON public.mentor_recommendations FOR INSERT
  WITH CHECK (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
    AND public.is_assigned_mentor(student_profile_id) = TRUE
    AND status = 'pending'
  );

CREATE POLICY "mentor_recommendations_update_mentor_pending"
  ON public.mentor_recommendations FOR UPDATE
  USING (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
    AND status = 'pending'
  );

CREATE POLICY "mentor_recommendations_update_admin_decision"
  ON public.mentor_recommendations FOR UPDATE
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

CREATE POLICY "mentor_recommendations_delete_mentor_pending"
  ON public.mentor_recommendations FOR DELETE
  USING (
    public.current_role() = 'mentor'
    AND mentor_profile_id = public.current_profile_id()
    AND status = 'pending'
  );

CREATE POLICY "mentor_recommendations_delete_admin_dept"
  ON public.mentor_recommendations FOR DELETE
  USING (
    public.current_role() = 'administrator'
    AND public.get_student_department(student_profile_id) = public.current_department()
  );

-- ==============================================================================
-- POLICIES: notifications
-- ==============================================================================

CREATE POLICY "notifications_select_recipient_own"
  ON public.notifications FOR SELECT
  USING (recipient_profile_id = public.current_profile_id());

CREATE POLICY "notifications_insert_authenticated"
  ON public.notifications FOR INSERT
  WITH CHECK (public.current_profile_id() IS NOT NULL);

CREATE POLICY "notifications_update_recipient_read"
  ON public.notifications FOR UPDATE
  USING (recipient_profile_id = public.current_profile_id())
  WITH CHECK (recipient_profile_id = public.current_profile_id());

CREATE POLICY "notifications_delete_recipient_own"
  ON public.notifications FOR DELETE
  USING (recipient_profile_id = public.current_profile_id());

-- ==============================================================================
-- POLICIES: audit_logs (Append-Only / Immutable)
-- ==============================================================================

CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  USING (public.current_role() = 'administrator');

CREATE POLICY "audit_logs_select_actor_own"
  ON public.audit_logs FOR SELECT
  USING (actor_profile_id = public.current_profile_id());

CREATE POLICY "audit_logs_insert_actor_own"
  ON public.audit_logs FOR INSERT
  WITH CHECK (actor_profile_id = public.current_profile_id());

-- Explicitly NO UPDATE OR DELETE policies for audit_logs (Strict Immutability)

-- ==============================================================================
-- SCHEMA GRANTS
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

