# College Mentor–Mentee Management System (MMS)

A production-minded, college ERP-style Mentor–Mentee Management System designed for higher education institutions. Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL with Row Level Security & Auth)**.

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js App Router (14.2)                       │
│  ┌─────────────────────────┐  ┌───────────────────┐  ┌───────────────┐ │
│  │     Mentee Portal       │  │   Mentor Portal   │  │  HOD / Admin  │ │
│  │   /mentee/* (Student)   │  │  /mentor/* (Staff)│  │    /admin/*   │ │
│  └───────────┬─────────────┘  └─────────┬─────────┘  └───────┬───────┘ │
│              └────────────────────┬─────┴────────────────────┘         │
│                                   ▼                                    │
│                 Edge Middleware (src/middleware.ts)                    │
│                 - Session Refresh (@supabase/ssr)                      │
│                 - Role-Based Access Control (RBAC)                     │
│                 - Open-Redirect Defense Matrix                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │  Anon Key & User JWT
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Supabase PostgreSQL (15+)                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Row Level Security (RLS)                      │  │
│  │  - Non-recursive Security Definer Functions                     │  │
│  │  - Cross-tenant & Cross-role Boundary Isolation                 │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  Integrity Defense Triggers                      │  │
│  │  - Self-Role Escalation Blocker                                  │  │
│  │  - Self-Approval Prevention (Verification & Recommendations)     │  │
│  │  - Immutable Audit Register (Append-Only)                        │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                  │
│   profiles • student_profiles • academic_records • mentor_assignments   │
│   mentor_notes • mentor_recommendations • notifications • audit_logs    │
└────────────────────────────────────────────────────────────────────────┘
```

### Institutional Design Philosophy
- **Restrained College ERP Visuals**: Standardized high-contrast slate surfaces, institutional blue accents (`#2563eb`), clear tabular rosters, and no distracting animations or glassmorphism.
- **Defense-in-Depth**: Role restrictions are enforced at both the Edge middleware boundary and the database Row Level Security (RLS) layer. Client-side requests cannot bypass PostgreSQL policies even if client code is manipulated.

---

## 2. Prerequisites & Installation

### Requirements
- **Node.js**: `v18.17.0+` (Tested on `v20` and `v24`)
- **Package Manager**: `npm` (or `pnpm`/`yarn`)
- **Supabase Account**: A PostgreSQL instance (Hosted on Supabase or local via Supabase CLI)

### Installation
```bash
# 1. Clone repository
git clone <repo-url>
cd "Mentor - Mentee platform"

# 2. Install dependencies
npm install
```

---

## 3. Environment Variables

Create `.env.local` in the project root:

```env
# Required for Next.js Client & Server components
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# REQUIRED ONLY FOR LOCAL SEED / ADMIN PROVISIONING SCRIPTS
# NEVER EXPOSE IN CLIENT CODE OR COMMIT TO VERSION CONTROL
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

---

## 4. Database Setup & Migrations

The database foundation resides in `supabase/migrations/`:

| Migration File | Description |
| :--- | :--- |
| [`20241029000001_initial_schema.sql`](supabase/migrations/20241029000001_initial_schema.sql) | 8 relational tables, ENUM types, unique constraints, and B-tree performance indexes. |
| [`20241029000002_helper_functions_and_triggers.sql`](supabase/migrations/20241029000002_helper_functions_and_triggers.sql) | `SECURITY DEFINER` non-recursive lookups, anti-escalation triggers, and audit immutability triggers. |
| [`20241029000003_row_level_security.sql`](supabase/migrations/20241029000003_row_level_security.sql) | Comprehensive, granular RLS policies for all 8 tables. |
| [`20241029000004_rls_security_tests.sql`](supabase/migrations/20241029000004_rls_security_tests.sql) | Automated 14-test PL/pgSQL test harness validating tenant isolation and attack resistance. |

### Running Migrations via Supabase CLI
```bash
supabase link --project-ref your-project-ref
supabase db push
```

*Or paste the migration files in order (1 through 3) directly into the Supabase Dashboard SQL Editor.*

---

## 5. Creating Initial Accounts Securely

Due to the institutional security architecture, **public sign-ups are strictly constrained to the `mentee` role**. Users cannot elevate their own role to `mentor` or `administrator` during registration.

### Step 1: Create the First Administrator (HOD)
Run the following SQL in your Supabase SQL Editor to establish the Department Head:

```sql
-- 1. Create the auth user in Supabase Auth
-- (Alternatively, sign up via /auth/sign-up with admin.cse@college.edu)
-- 2. Elevate user to administrator inside public.profiles
UPDATE public.profiles
SET role = 'administrator',
    department = 'Computer Science and Engineering',
    full_name = 'Dr. Rajesh Rao (HOD)'
WHERE email = 'admin.cse@college.edu';
```

### Step 2: Create a Faculty Mentor
Sign up the faculty member via `/auth/sign-up` or Auth Admin API, then designate them as faculty:
```sql
UPDATE public.profiles
SET role = 'mentor',
    department = 'Computer Science and Engineering',
    full_name = 'Prof. Ananya Sharma'
WHERE email = 'mentor.cse@college.edu';
```

### Step 3: Create Student Accounts
Students register directly via `/auth/sign-up`. Their account automatically initializes with the `mentee` role and prompts them to set their institutional USN, semester, and batch upon first sign-in.

---

## 6. Running Locally & Verification

```bash
# Start Next.js development server
npm run dev

# Run automated workflow & security test suite (Node native test runner)
npm test

# Run ESLint validation
npm run lint

# Run TypeScript typecheck
npx tsc --noEmit

# Compile production build
npm run build
```

---

## 7. Main Workflows & Testing Guide

### 1. Student Profile Submission & Verification
1. Log in as a student (`mentee`) at `/auth/sign-in`.
2. Go to **My Profile** (`/mentee/profile`) and update demographics. USN is locked once saved.
3. Add course records in **Academic Records** (`/mentee/academics`).
4. Go to **Verification Desk** (`/mentee/verification`) and submit for departmental review.
5. Notice that the profile enters `submitted` status and fields lock.
6. The HOD receives an in-app notification in their Topbar.

### 2. HOD Review & Decision
1. Log in as the HOD (`administrator`).
2. Go to **Review Workspace** (`/admin/reviews`).
3. Inspect the student's submission.
4. Click **Request Corrections** and submit feedback (e.g., *"Upload correct SGPA for Semester 4"*).
5. The student receives an in-app notification; their profile unlocks to `correction_requested` for edits.
6. Once the student resubmits, the HOD approves it. The profile transitions to `approved`.

### 3. Mentor Allocation & Guidance
1. As HOD, navigate to **Mentor Allocation** (`/admin/assignments`).
2. Select an unassigned student and assign them to an active faculty mentor.
3. Log in as the assigned mentor (`mentor`).
4. Go to **Assigned Students** (`/mentor/students`) to view the student dossier.
5. In the student detail page (`/mentor/students/[id]`), add a private or shared mentoring note.
6. Submit an institutional recommendation (e.g., internship nomination).
7. The recommendation appears in the HOD review queue for approval/endorsement.

---

## 8. Security Auditing & Verification Report

| Security Requirement | Status | Verification Mechanism |
| :--- | :--- | :--- |
| **Student Record Isolation** | Verified | RLS `is_assigned_mentee()` prevents cross-student reads. Confirmed by Test 2 in migration 4. |
| **Mentor Assignment Boundary** | Verified | Mentors can only query students where `is_assigned_mentor()` is true. Confirmed by Test 7 in migration 4. |
| **Route Protection & RBAC** | Verified | Edge middleware redirects mismatched roles to `/unauthorized` and unauthenticated sessions to `/auth/sign-in`. |
| **Anti-Self-Approval** | Verified | Database triggers reject mentors approving their own recommendations and mentees verifying themselves. |
| **Privilege Escalation Defense** | Verified | Trigger `prevent_profile_tampering` rejects non-admin updates to `role` on `profiles`. |
| **Append-Only Audit Log** | Verified | PostgreSQL triggers `trg_audit_logs_no_update` and `trg_audit_logs_no_delete` throw on any `UPDATE` or `DELETE`. |
| **Secret Leakage Prevention** | Verified | `SUPABASE_SERVICE_ROLE_KEY` is completely absent from all client bundles and application source code. |

---

## 9. Known Considerations & Future Enhancements

1. **Email / SMS Delivery Integration**: Notifications are currently stored and delivered in-app in real-time via PostgreSQL and Topbar polling. In production, connect an external transactional email provider (e.g., Resend or SendGrid) to the notification triggers.
2. **Bulk CSV Enrollment**: Student directory provides individual creation and batch review; a bulk CSV ingestion pipeline with transaction rollbacks can be added to `/admin/students` for semester-start onboarding.
