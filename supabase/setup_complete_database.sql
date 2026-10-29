-- ==============================================================================
-- CLEAN SCHEMA UPGRADE & MIGRATION SCRIPT (WITH IF NOT EXISTS & POLICY DROPS)
-- Mentor–Mentee Management System (NMAMIT)
-- ==============================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop old conflicting tables (safe with CASCADE, preserves auth.users & profiles)
DROP TABLE IF EXISTS public.academic_records CASCADE;
DROP TABLE IF EXISTS public.mentor_assignments CASCADE;
DROP TABLE IF EXISTS public.mentor_notes CASCADE;
DROP TABLE IF EXISTS public.mentoring_notes CASCADE;
DROP TABLE IF EXISTS public.recommendations CASCADE;
DROP TABLE IF EXISTS public.mentor_recommendations CASCADE;
DROP TABLE IF EXISTS public.verification_requests CASCADE;
DROP TABLE IF EXISTS public.student_profiles CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- 3. Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ==============================================================================
-- 4. TABLE CREATIONS
-- ==============================================================================

-- TABLE: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'mentee',
  full_name    TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  department   TEXT NOT NULL DEFAULT 'Information Science & Engineering',
  phone_number TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Information Science & Engineering';

-- Relax check constraint to allow all portal roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('mentee', 'student', 'mentor', 'faculty', 'administrator', 'hod'));

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TABLE: student_profiles
CREATE TABLE public.student_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  usn                 TEXT NOT NULL UNIQUE,
  department          TEXT NOT NULL DEFAULT 'Information Science & Engineering',
  semester            INT NOT NULL DEFAULT 1,
  academic_batch      TEXT NOT NULL DEFAULT '2024-2028',
  section             TEXT,
  blood_group         TEXT,
  address             TEXT,
  parent_name         TEXT,
  parent_phone        TEXT,
  verification_status TEXT NOT NULL DEFAULT 'draft',
  reviewer_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_comment      TEXT,
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TABLE: academic_records
CREATE TABLE public.academic_records (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id    UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  academic_year         TEXT NOT NULL,
  semester              INT NOT NULL,
  course_code           TEXT NOT NULL,
  course_name           TEXT NOT NULL,
  credits               INT NOT NULL DEFAULT 3,
  marks_obtained        NUMERIC(5,2),
  max_marks             NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  grade                 TEXT,
  grade_points          NUMERIC(4,2),
  attendance_percentage NUMERIC(5,2),
  is_backlog            BOOLEAN NOT NULL DEFAULT FALSE,
  remarks               TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_academic_records_student_course UNIQUE (student_profile_id, semester, course_code, academic_year)
);

CREATE TRIGGER trg_academic_records_updated_at
  BEFORE UPDATE ON public.academic_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TABLE: mentor_assignments
CREATE TABLE public.mentor_assignments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id     UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  mentor_profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  notes                  TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_mentor_per_student
  ON public.mentor_assignments (student_profile_id)
  WHERE (is_active = TRUE);

-- TABLE: mentor_notes
CREATE TABLE public.mentor_notes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  mentor_profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  content            TEXT NOT NULL,
  visibility         TEXT NOT NULL DEFAULT 'shared_with_mentee',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_mentor_notes_updated_at
  BEFORE UPDATE ON public.mentor_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TABLE: mentor_recommendations
CREATE TABLE public.mentor_recommendations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id  UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  mentor_profile_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category            TEXT NOT NULL,
  details             TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending',
  reviewer_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_comment      TEXT,
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_mentor_recommendations_updated_at
  BEFORE UPDATE ON public.mentor_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TABLE: notifications
CREATE TABLE public.notifications (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  message              TEXT NOT NULL,
  type                 TEXT NOT NULL DEFAULT 'info',
  related_entity_type  TEXT,
  related_entity_id    UUID,
  is_read              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: audit_logs
CREATE TABLE public.audit_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action           TEXT NOT NULL,
  target_type      TEXT NOT NULL,
  target_id        UUID NOT NULL,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. PERFORMANCE INDEXES (ALL WITH IF NOT EXISTS)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);

CREATE INDEX IF NOT EXISTS idx_student_profiles_profile_id ON public.student_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_usn ON public.student_profiles(usn);
CREATE INDEX IF NOT EXISTS idx_student_profiles_dept_sem ON public.student_profiles(department, semester);

CREATE INDEX IF NOT EXISTS idx_academic_records_student_sem ON public.academic_records(student_profile_id, semester);
CREATE INDEX IF NOT EXISTS idx_academic_records_year ON public.academic_records(academic_year);

CREATE INDEX IF NOT EXISTS idx_mentor_assignments_mentor ON public.mentor_assignments(mentor_profile_id, is_active);
CREATE INDEX IF NOT EXISTS idx_mentor_assignments_student ON public.mentor_assignments(student_profile_id, is_active);

CREATE INDEX IF NOT EXISTS idx_mentor_notes_student ON public.mentor_notes(student_profile_id);
CREATE INDEX IF NOT EXISTS idx_mentor_notes_mentor ON public.mentor_notes(mentor_profile_id);

CREATE INDEX IF NOT EXISTS idx_mentor_recommendations_student ON public.mentor_recommendations(student_profile_id);
CREATE INDEX IF NOT EXISTS idx_mentor_recommendations_mentor ON public.mentor_recommendations(mentor_profile_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_profile_id, is_read);

-- ==============================================================================
-- 6. SECURITY DEFINER HELPER FUNCTIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_department()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT department FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_mentor(p_student_profile_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mentor_assignments ma
    WHERE ma.mentor_profile_id = public.current_profile_id()
      AND ma.student_profile_id = p_student_profile_id
      AND ma.is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_mentee(p_student_profile_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = p_student_profile_id
      AND sp.profile_id = public.current_profile_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.get_student_department(p_student_profile_id UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT department FROM public.student_profiles WHERE id = p_student_profile_id LIMIT 1;
$$;

-- ==============================================================================
-- 7. AUTO-PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role TEXT := 'mentee';
  v_full_name TEXT;
  v_department TEXT;
  v_profile_id UUID;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));
  v_department := COALESCE(NEW.raw_user_meta_data->>'department', 'Information Science & Engineering');
  
  INSERT INTO public.profiles (user_id, role, full_name, email, department, phone_number)
  VALUES (NEW.id, v_role, v_full_name, NEW.email, v_department, NEW.raw_user_meta_data->>'phone_number')
  ON CONFLICT (email) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      full_name = EXCLUDED.full_name
  RETURNING id INTO v_profile_id;

  IF v_role = 'mentee' THEN
    INSERT INTO public.student_profiles (
      profile_id,
      usn,
      department,
      semester,
      academic_batch
    ) VALUES (
      v_profile_id,
      UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'usn', 'USN' || SUBSTRING(NEW.id::text, 1, 8)))),
      v_department,
      COALESCE((NEW.raw_user_meta_data->>'semester')::INT, 1),
      COALESCE(NEW.raw_user_meta_data->>'academic_batch', '2024-2028')
    ) ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs            ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (user_id = auth.uid() OR public.current_role() IN ('administrator', 'hod'));

DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
CREATE POLICY "profiles_insert_all" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "student_profiles_select_all" ON public.student_profiles;
CREATE POLICY "student_profiles_select_all" ON public.student_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "student_profiles_insert_all" ON public.student_profiles;
CREATE POLICY "student_profiles_insert_all" ON public.student_profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "student_profiles_update_all" ON public.student_profiles;
CREATE POLICY "student_profiles_update_all" ON public.student_profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "academic_records_select_all" ON public.academic_records;
CREATE POLICY "academic_records_select_all" ON public.academic_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "academic_records_modify_all" ON public.academic_records;
CREATE POLICY "academic_records_modify_all" ON public.academic_records FOR ALL USING (true);

DROP POLICY IF EXISTS "mentor_assignments_all" ON public.mentor_assignments;
CREATE POLICY "mentor_assignments_all" ON public.mentor_assignments FOR ALL USING (true);

DROP POLICY IF EXISTS "mentor_notes_all" ON public.mentor_notes;
CREATE POLICY "mentor_notes_all" ON public.mentor_notes FOR ALL USING (true);

DROP POLICY IF EXISTS "mentor_recommendations_all" ON public.mentor_recommendations;
CREATE POLICY "mentor_recommendations_all" ON public.mentor_recommendations FOR ALL USING (true);

DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "audit_logs_all" ON public.audit_logs;
CREATE POLICY "audit_logs_all" ON public.audit_logs FOR ALL USING (true);

-- ==============================================================================
-- 9. SCAFFOLD STUDENT PROFILES FOR EXISTING MENTEE PROFILES
-- ==============================================================================
INSERT INTO public.student_profiles (profile_id, usn, department, semester, academic_batch)
SELECT 
  id, 
  '4NM24IS' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 3, '0'),
  department, 
  1, 
  '2024-2028'
FROM public.profiles
WHERE role IN ('mentee', 'student')
ON CONFLICT (profile_id) DO NOTHING;

-- ==============================================================================
-- 10. PROVISION HOD ISE ACCOUNT
-- ==============================================================================
INSERT INTO public.profiles (user_id, role, full_name, email, department)
SELECT id, 'hod', 'Dr. Balasubramani R (HOD ISE)', email, 'Information Science & Engineering'
FROM auth.users
WHERE email = 'hod.ise@nmamit.in'
ON CONFLICT (email) DO UPDATE
SET role = 'hod',
    user_id = EXCLUDED.user_id,
    department = 'Information Science & Engineering',
    full_name = 'Dr. Balasubramani R (HOD ISE)';

-- Clean up any accidental student profile created for HOD
DELETE FROM public.student_profiles 
WHERE profile_id IN (SELECT id FROM public.profiles WHERE email = 'hod.ise@nmamit.in');

-- ==============================================================================
-- 11. RELOAD SUPABASE POSTGREST SCHEMA CACHE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
