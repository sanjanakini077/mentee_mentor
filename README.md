# College Mentor–Mentee Management System (MMS) — Local Demo

An institutional college ERP platform designed for higher education institutions to manage, monitor, and streamline mentorship workflows between students, faculty mentors, and Department Heads (HODs).

This project runs as a **self-contained local demonstration application** powered by **Next.js 14/16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Browser `localStorage`**. No Supabase account, database migrations, API keys, or external backend services are required.

---

## Table of Contents

- [1. Introduction & Problem Solved](#1-introduction--problem-solved)
- [2. Quick Start (1-Minute Setup)](#2-quick-start-1-minute-setup)
- [3. Demo User Accounts & Access](#3-demo-user-accounts--access)
- [4. Role Features & Portals](#4-role-features--portals)
  - [Student Portal (Mentee)](#student-portal-mentee)
  - [Faculty Portal (Mentor)](#faculty-portal-mentor)
  - [HOD Administration Portal](#hod-administration-portal)
- [5. Interconnected Demonstration Workflows](#5-interconnected-demonstration-workflows)
- [6. LocalStorage Data Store Architecture](#6-localstorage-data-store-architecture)
- [7. Resetting Demo Data](#7-resetting-demo-data)
- [8. Technology Stack](#8-technology-stack)
- [9. Available Scripts](#9-available-scripts)
- [10. Browser Isolation & Demo Notes](#10-browser-isolation--demo-notes)

---

## 1. Introduction & Problem Solved

In universities and engineering colleges, academic mentorship is often tracked using fragmented spreadsheets, paper diaries, or disconnected emails.

This platform unifies the three core academic roles into a single portal:
1. **Students (Mentees)**: Manage USN, semester, contact information, semester-wise course grades, attendance, submission tracking, and view assigned mentor guidance notes.
2. **Faculty Mentors**: Monitor their assigned student cohort, record dated mentoring notes (with visibility control: shared or private), and submit formal recommendations (internship, merit award, remedial) to the HOD.
3. **Department Heads (HODs)**: Inspect department-wide student and faculty directories, verify student profile submissions (approve, reject, or request corrections with feedback), allocate and reassign mentors, and review faculty recommendations.

---

## 2. Quick Start (1-Minute Setup)

### Prerequisites
- **Node.js**: v18.17.0+ or v20+
- **npm** (included with Node.js)
- **Git**

### Installation & Launch

```bash
# 1. Clone repository
git clone <YOUR_REPOSITORY_URL>
cd "Mentor - Mentee platform"

# 2. Install dependencies (zero external backend setup needed)
npm install

# 3. Start development server
npm run dev
```

Open **`http://localhost:3000`** (or `http://localhost:3001` if port 3000 is occupied) in your browser.

> **Zero Configuration Required**: You do **not** need `.env.local` keys, Supabase credentials, or SQL migrations. The application automatically initializes with realistic department seed data on first load.

---

## 3. Demo User Accounts & Access

The login page (`/auth/sign-in`) provides **instant 1-click portal entry** and pre-configured demo credentials:

| Role | Demo Email | Demo Password | Default Name & Department |
| :--- | :--- | :--- | :--- |
| **Student** | `student@demo.com` | `demo123` | Gaurav B. Shet • ISE (Sem 6) |
| **Faculty Mentor** | `mentor@demo.com` | `demo123` | Dr. K. S. Venkatesh • ISE |
| **Department HOD** | `hod@demo.com` | `demo123` | Dr. Balasubramani R • HOD ISE |

You can also switch active roles on the fly using the **Demo Role Switch** buttons in the top-right profile dropdown.

---

## 4. Role Features & Portals

### Student Portal (Mentee)
- **Dashboard (`/mentee/dashboard`)**: Profile completion gauge, assigned mentor card, verification progress status, recent academic performance, and institutional alerts.
- **My Profile (`/mentee/profile`)**: Edit full name, contact phone, semester, blood group, permanent address, and guardian contact details.
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
- **Faculty Directory (`/admin/faculty`)**: Department mentor roster with assigned mentee ratios and in-app provisioning modal to add new faculty mentors.
- **Review Workspace (`/admin/reviews`)**: Dedicated decision desk to inspect student submissions and approve, reject, or request corrections with explanatory comments.
- **Mentor Allocation (`/admin/assignments`)**: Interactive mentor assignment desk to assign or reallocate students to faculty mentors.
- **Recommendation Endorsements (`/admin/recommendations`)**: Review and sanction faculty recommendations with official remarks.
- **Audit Trail (`/admin/audit-log`)**: Log of all administrative actions, submissions, and status changes.

---

## 5. Interconnected Demonstration Workflows

All portals interact through the shared browser store in real time:

1. **Student Profile Verification Flow**:
   - Log in as **Student** (`student@demo.com`).
   - Go to **Verification Desk** $\rightarrow$ Click **Submit Records for Verification**.
   - Switch to **HOD** (`hod@demo.com`) $\rightarrow$ Open **Review Workspace** (`/admin/reviews`).
   - The student's submission appears in the queue.
   - Click **Review** $\rightarrow$ Choose **Approve** or **Request Corrections** with remarks.
   - Switch back to **Student** $\rightarrow$ Status immediately reflects the HOD's decision and comments!

2. **Mentor Recommendation & Endorsement Flow**:
   - Log in as **Mentor** (`mentor@demo.com`).
   - Go to **Recommendations** $\rightarrow$ Click **New Recommendation** (e.g. IISc Summer Internship).
   - Switch to **HOD** $\rightarrow$ Open **Recommendations** (`/admin/recommendations`).
   - Review and click **Approve Recommendation**.
   - The mentor's dashboard and student notifications update with the approved endorsement.

3. **Mentor Allocation Flow**:
   - As **HOD**, open **Mentor Allocation** (`/admin/assignments`).
   - Allocate an unassigned student to a faculty mentor.
   - Log in as that **Faculty Mentor** $\rightarrow$ The student immediately appears in their assigned cohort.

---

## 6. LocalStorage Data Store Architecture

The demo data store (`src/lib/storage/demoStore.ts`) provides:
- **Zero Server Setup**: All state is stored locally under the `MMS_DEMO_DATA_V1` key.
- **SSR Safe**: Guarded with `typeof window !== 'undefined'` and hydration-safe initial states to prevent Next.js SSR mismatch warnings.
- **Reactive Updates**: Dispatches `mms-store-changed` custom browser events so all active components and navigation badges re-render immediately upon changes.
- **State Persistence**: Changes (e.g., edited profile, added course, new note) persist across page refreshes.

---

## 7. Resetting Demo Data

To return the entire demo back to the clean default seed state at any time:
1. Click **Reset Demo Data** in the top navigation bar (or inside the user profile dropdown).
2. Confirm the prompt dialog.
3. The store resets to default student, mentor, and HOD records.

---

## 8. Technology Stack

- **Framework**: Next.js (App Router, React 18, Webpack compilation)
- **Language**: TypeScript (Strict typing)
- **Styling**: Tailwind CSS (Restrained institutional palette: Slate, White, Institutional Blue)
- **Icons**: Lucide React
- **Storage**: Browser `localStorage` (Zero-config demo data layer)
- **Testing**: Node.js native test runner (`node:test`)

---

## 9. Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server |
| `npm run build` | Builds optimized production bundle |
| `npm run start` | Starts production server |
| `npm test` | Runs security, verification state machine, and validation test suite |

---

## 10. Browser Isolation & Demo Notes

> [!IMPORTANT]
> **Data Scope**: Because data is stored in the browser's `localStorage`:
> - Changes made in Chrome will not appear in Safari or Firefox (each browser maintains its own local store).
> - Using an Incognito / Private window will use a fresh store that resets when the window closes.
> - To demonstrate multi-role workflows simultaneously, you can use tabs within the same browser or use the **Demo Role Switch** pill in the top-right corner.
