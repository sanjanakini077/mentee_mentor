# College Mentor–Mentee Management System (MMS) — SQLite & Prisma

An institutional college ERP platform designed for higher education institutions to manage, monitor, and streamline mentorship workflows between students, faculty mentors, and Department Heads (HODs).

This project runs as a **self-contained local demonstration application** powered by **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and a local **SQLite database** (`prisma/dev.db`). No cloud accounts, Supabase credentials, or external API keys are required.

---

## Table of Contents

- [1. Introduction & Overview](#1-introduction--overview)
- [2. Quick Start (1-Minute Setup)](#2-quick-start-1-minute-setup)
- [3. Demo User Accounts & Access](#3-demo-user-accounts--access)
- [4. Role Portals & Capabilities](#4-role-portals--capabilities)
  - [Student Portal (Mentee)](#student-portal-mentee)
  - [Faculty Portal (Mentor)](#faculty-portal-mentor)
  - [HOD Administration Portal](#hod-administration-portal)
- [5. Interconnected Demonstration Workflows](#5-interconnected-demonstration-workflows)
- [6. Database Architecture (SQLite & Prisma)](#6-database-architecture-sqlite--prisma)
- [7. Available Scripts](#7-available-scripts)
- [8. Academic Demonstration Notes](#8-academic-demonstration-notes)

---

## 1. Introduction & Overview

In universities and engineering colleges, academic mentorship is often tracked using fragmented spreadsheets, paper diaries, or disconnected emails.

This platform unifies the three core academic roles into a single portal with authoritative SQLite persistence:
1. **Students (Mentees)**: Manage USN, semester, contact information, semester-wise course grades, attendance, submission tracking, and view assigned mentor guidance notes.
2. **Faculty Mentors**: Monitor their assigned student cohort, record dated mentoring notes (with visibility control: shared or private), and submit formal recommendations (internship, merit award, remedial) to the HOD.
3. **Department Heads (HODs)**: Inspect department-wide student and faculty directories, verify student profile submissions (approve, reject, or request corrections with feedback), allocate and reassign mentors, and review faculty recommendations.

---

## 2. Quick Start (1-Minute Setup)

### Prerequisites
- **Node.js**: v18.17.0+ or v20+ / v24+
- **npm** (included with Node.js)
- **Git**

### Installation & Launch Command Order

A fresh clone initializes its own database in three simple steps:

```bash
# 1. Install dependencies
npm install

# 2. Push Prisma schema & generate client (creates local prisma/dev.db)
npm run prisma:migrate

# 3. Seed demo accounts (Sanjana Kini, Dr. Jason Elroy Martis, Dr. Ashwini B)
npm run db:seed

# 4. Start development server
npm run dev
```

Open **`http://localhost:3000`** in your browser.

> **Local SQLite Database**: The database file is created automatically at `prisma/dev.db`. All records persist across server restarts without losing data.

---

## 3. Demo User Accounts & Access

The login page (`/auth/sign-in`) provides **instant 1-click portal entry** and pre-configured demo credentials:

| Role | Demo Email | Demo Password | Default Name & Department |
| :--- | :--- | :--- | :--- |
| **Student** | `student@demo.com` | `demo123` | Sanjana Kini • Information Science & Engineering (Sem 6) |
| **Faculty Mentor** | `mentor@demo.com` | `demo123` | Dr. Jason Elroy Martis, Associate Professor • ISE |
| **Department HOD** | `hod@demo.com` | `demo123` | Dr. Ashwini B • Department Head, ISE |

You can also switch active roles on the fly using the **Demo Role Switch** buttons in the top-right profile dropdown.

---

## 4. Role Portals & Capabilities

### Student Portal (Mentee)
- **Student Self-Registration (`/auth/sign-up`)**: Public student registration with field validations (Name, USN, Institutional Email, Department, Semester, Phone, Password confirmation) and automatic `mentee` role assignment with cryptographic scrypt password hashing.
- **Dashboard (`/mentee/dashboard`)**: Profile completion gauge, assigned mentor card, verification progress status, recent academic performance, and institutional alerts.
- **My Profile (`/mentee/profile`)**:
  - **Profile Details**: View USN and email; edit full name, phone number, department, semester, blood group, address, parent name, and parent phone with immediate SQLite persistence.
  - **Academic Documents**: Upload, manage, preview, download, and delete academic records (Marks Cards, Transcripts, Certificates) stored securely in `uploads/documents/` on the server filesystem.
- **Academic Records (`/mentee/academics`)**: View and add semester-by-semester courses, grades, credits, attendance percentage, and backlog tracking.
- **My Mentor (`/mentee/mentor`)**: Contact details of assigned mentor and chronological guidance session notes.
- **Verification Desk (`/mentee/verification`)**: Submit profile for departmental verification and inspect official reviewer feedback comments.
- **Notifications (`/mentee/notifications`)**: Real-time alerts on mentoring notes and HOD verification decisions.

### Faculty Portal (Mentor)
- **Mentor Dashboard (`/mentor/dashboard`)**: Metrics on assigned mentees, low attendance flags, active backlogs, pending verification count, and quick notes.
- **Assigned Students (`/mentor/students`)**: Searchable roster of assigned mentees with academic summaries.
- **Student Profile Inspector (`/mentor/students/[id]`)**: Detailed view of student coursework, grades, attendance, and private mentoring history.
- **Mentoring Notes (`/mentor/notes`)**: Create, edit, and delete guidance notes with visibility flags (`shared_with_mentee` or `private_mentor_only`).
- **Recommendations (`/mentor/recommendations`)**: Submit formal proposals to the HOD (Internship, Remedial Support, Merit Award, Scholarship) and monitor review outcomes.

### HOD Administration Portal
- **HOD Dashboard (`/admin/dashboard`)**: Departmental metrics, pending verification queue, mentor distribution, and recent audit logs.
- **Student Directory (`/admin/students`)**: Search and filter department students by USN, semester, verification status, and assigned mentor. Includes modal student academic inspection.
- **Faculty Directory (`/admin/faculty`)**: Department mentor roster with assigned mentee ratios.
- **Register Faculty Mentor (`/admin/faculty/register`)**: Dedicated HOD administration page to provision new faculty mentors with Employee ID, Department, Contact Phone, and initial credentials (role is strictly enforced as `mentor`).
- **Review Workspace (`/admin/reviews`)**: Dedicated decision desk to inspect student submissions and approve, reject, or request corrections with explanatory comments.
- **Mentorship Allotment (`/admin/assignments`)**: Active cohort allocation desk to assign or reassign students to faculty mentors.
- **Recommendations Desk (`/admin/recommendations`)**: Review and endorse faculty mentor recommendations.
- **Audit Logs (`/admin/audit-log`)**: Department governance log tracking profile submissions, reviews, mentor assignments, and recommendations.
- **Faculty Directory (`/admin/faculty`)**: Department mentor roster with assigned mentee ratios and in-app provisioning modal to add new faculty mentors.
- **Review Workspace (`/admin/reviews`)**: Dedicated decision desk to inspect student submissions and approve, reject, or request corrections with explanatory comments.
- **Mentorship Allotment (`/admin/assignments`)**: Active cohort allocation desk to assign or reassign students to faculty mentors.
- **Recommendations Desk (`/admin/recommendations`)**: Review and endorse faculty mentor recommendations.
- **Audit Logs (`/admin/audit-log`)**: Department governance log tracking profile submissions, reviews, mentor assignments, and recommendations.

---

## 5. Interconnected Demonstration Workflows

Because all data is centrally stored in SQLite and managed through Next.js Server Actions:

1. **Profile Verification Workflow**:
   - Sanjana Kini edits her profile and clicks **Submit for Department Verification** on `/mentee/verification`.
   - The status updates to `submitted` in SQLite.
   - Dr. Ashwini B (HOD) logs in, sees Sanjana's pending profile in `/admin/reviews`, and approves it or requests corrections with feedback.
   - Sanjana logs back in and immediately sees the updated verification badge and HOD remarks.

2. **Mentor Recommendation Workflow**:
   - Dr. Jason Elroy Martis submits an Internship Recommendation for Sanjana on `/mentor/recommendations`.
   - Dr. Ashwini B views it in `/admin/recommendations` and approves it.
   - Dr. Jason and Sanjana both receive in-app notifications and see the approved status.

3. **Mentor Assignment Workflow**:
   - HOD reassigns a student to a faculty mentor in `/admin/assignments`.
   - The mentor's dashboard roster instantly reflects the new mentee.

---

## 6. Database Architecture (SQLite & Prisma)

The database schema is defined in `prisma/schema.prisma` with relational models:
- **`Profile`**: User accounts (roles: `mentee`, `mentor`, `administrator`), hashed credentials, contact information.
- **`StudentProfile`**: USN, semester, batch, verification status (`draft`, `submitted`, `approved`, `rejected`, `correction_requested`), HOD comments.
- **`StudentDocument`**: Uploaded student academic records (Marks Cards, Transcripts, Certificates) with safe stored filenames, relative filesystem paths, file sizes, and MIME types.
- **`AcademicRecord`**: Semester coursework, credits, marks, grades, attendance, backlog status, SGPA/CGPA.
- **`MentorAssignment`**: Student-mentor relationships, active status, assignment timestamps.
- **`MentorNote`**: Dated guidance logs with visibility control (`shared_with_mentee`, `private_mentor_only`).
- **`MentorRecommendation`**: Formal proposals (`internship`, `remedial`, `scholarship`, `merit_award`) with review outcomes.
- **`Notification`**: In-app role notifications.
- **`AuditLog`**: Tamper-evident governance logs for administrative actions.

---

## 7. Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server at `http://localhost:3000` |
| `npm run prisma:migrate` | Syncs Prisma schema with local SQLite database (`dev.db`) |
| `npm run prisma:generate` | Generates the strongly-typed Prisma client |
| `npm run db:seed` | Seeds demo accounts, coursework, assignments, and notes |
| `npm test` | Runs the automated test suite |
| `npm run build` | Builds the optimized production bundle |

---

## 8. Academic Demonstration Notes

- **Zero Cloud Dependencies**: Supabase and cloud auth have been completely replaced with a local SQLite database (`prisma/dev.db`).
- **Demo Security**: Authentication uses server-signed HTTP-only session cookies (`mms_session`). Intended for local demonstration and academic evaluation.
- **Resetting Demo Data**: Click **Reset Demo Data** in the top navigation bar or run `npm run db:seed` at any time to restore the default records.
