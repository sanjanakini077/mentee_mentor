-- ==============================================================================
-- Migration: 20241029000004_rls_security_tests.sql
-- Description: Automated Verification Test Harness for RLS & Access Matrix
-- Run this script in the Supabase SQL Editor to verify security enforcement.
-- ==============================================================================

DO $$
DECLARE
  -- Test user IDs
  v_uid_mentee_a CONSTANT UUID := '11111111-1111-4111-a111-111111111111';
  v_uid_mentee_b CONSTANT UUID := '22222222-2222-4222-a222-222222222222';
  v_uid_mentor_1 CONSTANT UUID := '33333333-3333-4333-a333-333333333333';
  v_uid_mentor_2 CONSTANT UUID := '44444444-4444-4444-a444-444444444444';
  v_uid_admin    CONSTANT UUID := '55555555-5555-4555-a555-555555555555';

  -- Profile IDs
  v_pid_mentee_a UUID;
  v_pid_mentee_b UUID;
  v_pid_mentor_1 UUID;
  v_pid_mentor_2 UUID;
  v_pid_admin    UUID;

  -- Student Profile IDs
  v_spid_mentee_a UUID;
  v_spid_mentee_b UUID;

  -- Artifact IDs
  v_note_id UUID;
  v_rec_id  UUID;
  v_count   INT;
  v_error_occurred BOOLEAN;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'STARTING MENTOR-MENTEE PLATFORM RLS SECURITY TEST SUITE';
  RAISE NOTICE '=============================================================';

  -- Clean up any previous test artifacts
  DELETE FROM auth.users WHERE id IN (v_uid_mentee_a, v_uid_mentee_b, v_uid_mentor_1, v_uid_mentor_2, v_uid_admin);

  -- 1. Setup Auth Users
  INSERT INTO auth.users (id, email)
  VALUES
    (v_uid_mentee_a, 'student.a@test.college.edu'),
    (v_uid_mentee_b, 'student.b@test.college.edu'),
    (v_uid_mentor_1, 'faculty.1@test.college.edu'),
    (v_uid_mentor_2, 'faculty.2@test.college.edu'),
    (v_uid_admin,    'admin.cse@test.college.edu');

  -- 2. Setup Profiles
  INSERT INTO public.profiles (user_id, role, full_name, email, department)
  VALUES
    (v_uid_mentee_a, 'mentee', 'Student A', 'student.a@test.college.edu', 'Computer Science and Engineering'),
    (v_uid_mentee_b, 'mentee', 'Student B', 'student.b@test.college.edu', 'Computer Science and Engineering'),
    (v_uid_mentor_1, 'mentor', 'Faculty One', 'faculty.1@test.college.edu', 'Computer Science and Engineering'),
    (v_uid_mentor_2, 'mentor', 'Faculty Two', 'faculty.2@test.college.edu', 'Computer Science and Engineering'),
    (v_uid_admin,    'administrator', 'HOD CSE', 'admin.cse@test.college.edu', 'Computer Science and Engineering')
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  SELECT id INTO v_pid_mentee_a FROM public.profiles WHERE user_id = v_uid_mentee_a;
  SELECT id INTO v_pid_mentee_b FROM public.profiles WHERE user_id = v_uid_mentee_b;
  SELECT id INTO v_pid_mentor_1 FROM public.profiles WHERE user_id = v_uid_mentor_1;
  SELECT id INTO v_pid_mentor_2 FROM public.profiles WHERE user_id = v_uid_mentor_2;
  SELECT id INTO v_pid_admin    FROM public.profiles WHERE user_id = v_uid_admin;

  -- 3. Setup Student Profiles
  INSERT INTO public.student_profiles (profile_id, usn, department, semester, academic_batch)
  VALUES
    (v_pid_mentee_a, '1MS21CS901', 'Computer Science and Engineering', 5, '2021-2025'),
    (v_pid_mentee_b, '1MS21CS902', 'Computer Science and Engineering', 5, '2021-2025')
  RETURNING id INTO v_spid_mentee_a;

  SELECT id INTO v_spid_mentee_b FROM public.student_profiles WHERE profile_id = v_pid_mentee_b;

  -- 4. Assign Mentor 1 to Student A (Student B remains unassigned to Mentor 1)
  INSERT INTO public.mentor_assignments (student_profile_id, mentor_profile_id, assigned_by_profile_id, is_active)
  VALUES (v_spid_mentee_a, v_pid_mentor_1, v_pid_admin, TRUE);

  -- ============================================================================
  -- TEST CASE 1: Mentee A can read own profile
  -- ============================================================================
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid_mentee_a::text)::text, true);
  SELECT count(*) INTO v_count FROM public.student_profiles WHERE profile_id = v_pid_mentee_a;
  IF v_count = 1 THEN
    RAISE NOTICE '[PASS] Test 1: Mentee can read own student profile.';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 1: Mentee could not read own student profile.';
  END IF;

  -- ============================================================================
  -- TEST CASE 2: Mentee A CANNOT read Student B profile
  -- ============================================================================
  SELECT count(*) INTO v_count FROM public.student_profiles WHERE profile_id = v_pid_mentee_b;
  IF v_count = 0 THEN
    RAISE NOTICE '[PASS] Test 2: Mentee A isolated from Student B profile (returned 0 rows).';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 2: Mentee A was able to read Student B profile!';
  END IF;

  -- ============================================================================
  -- TEST CASE 3: Mentee A CANNOT elevate their own role to administrator
  -- ============================================================================
  v_error_occurred := FALSE;
  BEGIN
    UPDATE public.profiles SET role = 'administrator' WHERE id = v_pid_mentee_a;
  EXCEPTION WHEN OTHERS THEN
    v_error_occurred := TRUE;
  END;

  IF v_error_occurred THEN
    RAISE NOTICE '[PASS] Test 3: Mentee self-role escalation rejected by defense trigger.';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 3: Mentee was able to update their role to administrator!';
  END IF;

  -- ============================================================================
  -- TEST CASE 4: Mentee A CANNOT self-approve verification status
  -- ============================================================================
  v_error_occurred := FALSE;
  BEGIN
    UPDATE public.student_profiles SET verification_status = 'approved' WHERE id = v_spid_mentee_a;
  EXCEPTION WHEN OTHERS THEN
    v_error_occurred := TRUE;
  END;

  IF v_error_occurred THEN
    RAISE NOTICE '[PASS] Test 4: Mentee self-approval rejected by verification integrity trigger.';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 4: Mentee was able to set verification_status to approved!';
  END IF;

  -- ============================================================================
  -- TEST CASE 5: Mentee A CANNOT insert a mentor assignment
  -- ============================================================================
  v_error_occurred := FALSE;
  BEGIN
    INSERT INTO public.mentor_assignments (student_profile_id, mentor_profile_id, is_active)
    VALUES (v_spid_mentee_b, v_pid_mentor_2, TRUE);
  EXCEPTION WHEN OTHERS THEN
    v_error_occurred := TRUE;
  END;

  IF v_error_occurred THEN
    RAISE NOTICE '[PASS] Test 5: Mentee unauthorized mentor assignment rejected.';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 5: Mentee was able to assign a mentor!';
  END IF;

  -- ============================================================================
  -- TEST CASE 6: Mentor 1 can read assigned Student A
  -- ============================================================================
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid_mentor_1::text)::text, true);
  SELECT count(*) INTO v_count FROM public.student_profiles WHERE id = v_spid_mentee_a;
  IF v_count = 1 THEN
    RAISE NOTICE '[PASS] Test 6: Mentor 1 can read assigned Student A.';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 6: Mentor 1 could not read assigned Student A.';
  END IF;

  -- ============================================================================
  -- TEST CASE 7: Mentor 1 CANNOT read unassigned Student B
  -- ============================================================================
  SELECT count(*) INTO v_count FROM public.student_profiles WHERE id = v_spid_mentee_b;
  IF v_count = 0 THEN
    RAISE NOTICE '[PASS] Test 7: Mentor 1 isolated from unassigned Student B (returned 0 rows).';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 7: Mentor 1 was able to read unassigned Student B!';
  END IF;

  -- ============================================================================
  -- TEST CASE 8: Mentor 1 can create a note for assigned Student A
  -- ============================================================================
  INSERT INTO public.mentor_notes (student_profile_id, mentor_profile_id, content, visibility)
  VALUES (v_spid_mentee_a, v_pid_mentor_1, 'Discussed algorithm problem sets.', 'shared_with_mentee')
  RETURNING id INTO v_note_id;

  IF v_note_id IS NOT NULL THEN
    RAISE NOTICE '[PASS] Test 8: Mentor 1 successfully logged note for assigned Student A.';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 8: Mentor 1 failed to log note.';
  END IF;

  -- ============================================================================
  -- TEST CASE 9: Mentor 1 can submit recommendation
  -- ============================================================================
  INSERT INTO public.mentor_recommendations (student_profile_id, mentor_profile_id, category, details)
  VALUES (v_spid_mentee_a, v_pid_mentor_1, 'internship', 'Nominated for college lab internship.')
  RETURNING id INTO v_rec_id;

  IF v_rec_id IS NOT NULL THEN
    RAISE NOTICE '[PASS] Test 9: Mentor 1 successfully submitted recommendation to HOD.';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 9: Mentor 1 failed to submit recommendation.';
  END IF;

  -- ============================================================================
  -- TEST CASE 10: Mentor 1 CANNOT approve own recommendation
  -- ============================================================================
  v_error_occurred := FALSE;
  BEGIN
    UPDATE public.mentor_recommendations SET status = 'approved' WHERE id = v_rec_id;
  EXCEPTION WHEN OTHERS THEN
    v_error_occurred := TRUE;
  END;

  IF v_error_occurred THEN
    RAISE NOTICE '[PASS] Test 10: Mentor self-approval of recommendation rejected.';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 10: Mentor was able to self-approve recommendation!';
  END IF;

  -- ============================================================================
  -- TEST CASE 11: Mentee A can read shared note from Mentor 1
  -- ============================================================================
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid_mentee_a::text)::text, true);
  SELECT count(*) INTO v_count FROM public.mentor_notes WHERE id = v_note_id;
  IF v_count = 1 THEN
    RAISE NOTICE '[PASS] Test 11: Mentee A can read shared mentor note.';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 11: Mentee A could not read shared mentor note.';
  END IF;

  -- ============================================================================
  -- TEST CASE 12: Administrator can verify and approve Student A
  -- ============================================================================
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid_admin::text)::text, true);
  UPDATE public.student_profiles
  SET verification_status = 'approved', review_comment = 'Verified with registry'
  WHERE id = v_spid_mentee_a;

  SELECT count(*) INTO v_count
  FROM public.student_profiles
  WHERE id = v_spid_mentee_a AND verification_status = 'approved';

  IF v_count = 1 THEN
    RAISE NOTICE '[PASS] Test 12: Administrator successfully verified and approved student profile.';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 12: Administrator verification failed.';
  END IF;

  -- ============================================================================
  -- TEST CASE 13: Administrator can approve mentor recommendation
  -- ============================================================================
  UPDATE public.mentor_recommendations
  SET status = 'approved', review_comment = 'Approved by department'
  WHERE id = v_rec_id;

  SELECT count(*) INTO v_count
  FROM public.mentor_recommendations
  WHERE id = v_rec_id AND status = 'approved';

  IF v_count = 1 THEN
    RAISE NOTICE '[PASS] Test 13: Administrator successfully approved mentor recommendation.';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 13: Administrator recommendation approval failed.';
  END IF;

  -- ============================================================================
  -- TEST CASE 14: Audit logs are strictly immutable (DELETE rejected)
  -- ============================================================================
  INSERT INTO public.audit_logs (actor_profile_id, action, target_type, target_id)
  VALUES (v_pid_admin, 'APPROVED_RECOMMENDATION', 'mentor_recommendations', v_rec_id);

  v_error_occurred := FALSE;
  BEGIN
    DELETE FROM public.audit_logs WHERE target_id = v_rec_id;
  EXCEPTION WHEN OTHERS THEN
    v_error_occurred := TRUE;
  END;

  IF v_error_occurred THEN
    RAISE NOTICE '[PASS] Test 14: Audit log deletion prohibited by immutability trigger.';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 14: Audit log record was deleted!';
  END IF;

  -- Clean up test records
  DELETE FROM auth.users WHERE id IN (v_uid_mentee_a, v_uid_mentee_b, v_uid_mentor_1, v_uid_mentor_2, v_uid_admin);

  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'ALL 14 RLS & RBAC SECURITY TESTS PASSED WITH 100%% SUCCESS!';
  RAISE NOTICE '=============================================================';
END $$;

