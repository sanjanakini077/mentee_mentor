import React from 'react'
import Link from 'next/link'
import {
  User,
  BookOpen,
  CheckSquare,
  UserCheck,
  ArrowRight,
  GraduationCap,
  Award,
  Phone,
  Mail,
  Building,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  PREVIEW_CURRENT_STUDENT,
  PREVIEW_ACADEMIC_RECORDS,
  PREVIEW_PROFILES,
} from '@/lib/preview-data'

export default function MenteeDashboardPage() {
  const student = PREVIEW_CURRENT_STUDENT
  const mentor = PREVIEW_PROFILES.mentor
  const records = PREVIEW_ACADEMIC_RECORDS
  const latestRecord = records[records.length - 1]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${student.profiles?.full_name?.split(' ')[0] || 'Student'}`}
        description="Student Academic & Mentorship Information Portal"
        breadcrumbs={[{ label: 'Student Portal' }, { label: 'Overview' }]}
        badge={<StatusBadge status={student.verification_status} />}
        actions={
          <Link href="/mentee/verification">
            <Button size="sm" variant="outline">
              Check Verification Status
            </Button>
          </Link>
        }
      />

      {/* Verification Notice Banner */}
      {student.verification_status === 'submitted' && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-md p-4 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-accent font-bold mt-0.5">
              i
            </div>
            <div>
              <p className="font-semibold text-blue-900">
                Profile Verification Under Review
              </p>
              <p className="text-blue-700 mt-0.5">
                Your submitted details for Semester {student.semester} are awaiting
                endorsement by your mentor and HOD verification.
              </p>
            </div>
          </div>
          <Link href="/mentee/verification">
            <Button size="sm" variant="secondary" className="whitespace-nowrap">
              View Request Log
            </Button>
          </Link>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            University Seat No.
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {student.usn}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Semester {student.semester} • CSE
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Current CGPA
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900">
              {latestRecord?.cgpa || '8.47'}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">
              Scale 10.0
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Latest SGPA: {latestRecord?.sgpa || '8.35'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Active Backlogs
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {latestRecord?.backlogs || 0}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-0.5">
            Clear academic standing
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Assigned Mentor
          </p>
          <p className="text-sm font-bold text-slate-900 mt-1 truncate">
            {mentor.full_name}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            Associate Professor, CSE
          </p>
        </div>
      </div>

      {/* Main Grid: Student Information & Academic Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Academic Progress & Quick Navigation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Semester Progress Overview */}
          <Card
            title="Academic Performance Summary"
            description="Official semester grade record verified by Department Examination Cell"
            headerAction={
              <Link href="/mentee/academics">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                  Detailed Records
                </Button>
              </Link>
            }
          >
            <div className="divide-y divide-slate-100">
              {records.map((r) => (
                <div
                  key={r.semester}
                  className="py-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded bg-slate-100 font-semibold text-slate-700 flex items-center justify-center text-xs">
                      S{r.semester}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">
                        Semester {r.semester} ({r.academic_year})
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {r.remarks || 'Completed'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">SGPA: {r.sgpa}</p>
                    <p className="text-[11px] text-slate-500">CGPA: {r.cgpa}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Portal Navigation Tiles */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Student Modules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/mentee/profile"
                className="p-4 bg-white border border-slate-200 rounded-md hover:border-accent hover:shadow-xs transition-all flex items-start gap-3 group"
              >
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-accent transition-colors">
                  <User size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 group-hover:text-accent">
                    Personal & Contact Profile
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    View and update address, phone, and parent emergency details.
                  </p>
                </div>
              </Link>

              <Link
                href="/mentee/academics"
                className="p-4 bg-white border border-slate-200 rounded-md hover:border-accent hover:shadow-xs transition-all flex items-start gap-3 group"
              >
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-accent transition-colors">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 group-hover:text-accent">
                    Academic Records Entry
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Submit semester SGPA, backlogs, and examination history.
                  </p>
                </div>
              </Link>

              <Link
                href="/mentee/verification"
                className="p-4 bg-white border border-slate-200 rounded-md hover:border-accent hover:shadow-xs transition-all flex items-start gap-3 group"
              >
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-accent transition-colors">
                  <CheckSquare size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 group-hover:text-accent">
                    Verification Status
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Track approval decisions and feedback comments from HOD.
                  </p>
                </div>
              </Link>

              <Link
                href="/mentee/mentor"
                className="p-4 bg-white border border-slate-200 rounded-md hover:border-accent hover:shadow-xs transition-all flex items-start gap-3 group"
              >
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-accent transition-colors">
                  <UserCheck size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 group-hover:text-accent">
                    My Assigned Mentor
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Consult guidance notes, meeting logs, and recommendations.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Mentor Info & Contact Card */}
        <div className="space-y-6">
          <Card title="Assigned Faculty Mentor">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-accent-light border border-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                  KV
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {mentor.full_name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Dept. of Computer Science & Engineering
                  </p>
                  <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                    Cabin: CSB-304 • Block B
                  </span>
                </div>
              </div>

              <div className="text-xs space-y-2 pt-2 border-t border-slate-100 text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-slate-400" />
                  <span className="font-mono text-[11px]">{mentor.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400" />
                  <span>+91 80 2360 0822 (Ext. 402)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building size={13} className="text-slate-400" />
                  <span>Office Hours: Tue & Thu, 3:00 PM – 5:00 PM</span>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/mentee/mentor" className="w-full block">
                  <Button variant="outline" size="sm" className="w-full">
                    View Mentor Notes & Guidance
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Quick Profile Summary */}
          <Card title="Student Identification">
            <dl className="text-xs space-y-2.5">
              <div className="flex justify-between">
                <dt className="text-slate-500">Student Name</dt>
                <dd className="font-semibold text-slate-800">
                  {student.profiles?.full_name}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Department</dt>
                <dd className="font-semibold text-slate-800">CSE</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Academic Status</dt>
                <dd>
                  <StatusBadge status="approved" />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-mono text-slate-800">{student.phone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Blood Group</dt>
                <dd className="font-semibold text-slate-800">
                  {student.blood_group}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  )
}
