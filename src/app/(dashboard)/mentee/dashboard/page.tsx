'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  User,
  BookOpen,
  CheckSquare,
  UserCheck,
  ArrowRight,
  GraduationCap,
  Mail,
  Phone,
  Building,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bell,
  FileText,
  Calendar,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  getMenteeFullData,
  type MenteeFullData,
} from '@/lib/services/menteeService'
import { formatDate } from '@/lib/utils'

export default function MenteeDashboardPage() {
  const [data, setData] = useState<MenteeFullData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        const fullData = await getMenteeFullData()
        if (isMounted) {
          setData(fullData)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load dashboard data.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-white border border-rose-200 rounded-md shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
          <AlertCircle size={18} />
          <span>Error Loading Student Dashboard</span>
        </div>
        <p className="text-xs text-slate-600">{error || 'Unable to retrieve your student information.'}</p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  const {
    profile,
    studentProfile,
    assignedMentor,
    academicRecords,
    mentorNotes,
    recommendations,
    notifications,
    completionRate,
    missingFields,
  } = data

  const status = studentProfile.verification_status
  const totalCredits = academicRecords.reduce((sum, r) => sum + (r.credits || 0), 0)
  const latestRecord = academicRecords[academicRecords.length - 1]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Welcome, ${profile.full_name?.split(' ')[0] || 'Student'}!`}
        description="Institutional Student Mentorship & Academic Progress Portal"
        breadcrumbs={[{ label: 'Student Portal' }, { label: 'Dashboard' }]}
        badge={<StatusBadge status={status} />}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/mentee/verification">
              <Button size="sm" variant="outline" leftIcon={<CheckSquare size={14} />}>
                Check Submission Status
              </Button>
            </Link>
          </div>
        }
      />

      {/* Verification Status Alert Banner */}
      {status === 'submitted' && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-md p-4 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Clock size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">
                Verification Submission Under Official Review
              </p>
              <p className="text-blue-700 mt-0.5">
                Your submitted details and academic records for Semester {studentProfile.semester} are awaiting
                endorsement by your assigned faculty mentor and departmental HOD approval.
              </p>
            </div>
          </div>
          <Link href="/mentee/verification">
            <Button size="sm" variant="secondary" className="whitespace-nowrap">
              View Status Details
            </Button>
          </Link>
        </div>
      )}

      {status === 'correction_requested' && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                Corrections Requested by Reviewer
              </p>
              <p className="text-amber-800 mt-0.5">
                {studentProfile.review_comment ? (
                  <span className="italic">&ldquo;{studentProfile.review_comment}&rdquo;</span>
                ) : (
                  'Please update the requested fields and resubmit your profile.'
                )}
              </p>
            </div>
          </div>
          <Link href="/mentee/profile">
            <Button size="sm" variant="primary" className="whitespace-nowrap bg-amber-600 hover:bg-amber-700">
              Update Profile Now
            </Button>
          </Link>
        </div>
      )}

      {status === 'approved' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 text-xs text-emerald-900 flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-900">
              Department Verified & Endorsed
            </p>
            <p className="text-emerald-700 text-[11px] mt-0.5">
              Your profile demographic and academic records are officially approved for Academic Session 2024–2025.
            </p>
          </div>
        </div>
      )}

      {/* Missing Information / Completion Rate Banner */}
      {completionRate < 100 && status !== 'approved' && (
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Profile Completion: {completionRate}%
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  ({missingFields.length} field{missingFields.length > 1 ? 's' : ''} remaining)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Complete your details before submitting for official verification.
              </p>
            </div>
            <Link href="/mentee/profile">
              <Button size="sm" variant="outline" className="h-7 text-xs">
                Complete Profile
              </Button>
            </Link>
          </div>

          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-accent h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            {missingFields.length > 0 && (
              <p className="text-[11px] text-slate-500 mt-2">
                <strong className="text-slate-700">Missing fields:</strong> {missingFields.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Overview Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* USN & Semester */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            University Seat No.
          </p>
          <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
            {studentProfile.usn}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Semester {studentProfile.semester} • {studentProfile.department}
          </p>
        </div>

        {/* Verification Status */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Submission Status
          </p>
          <div className="mt-1.5">
            <StatusBadge status={status} />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {studentProfile.reviewed_at
              ? `Reviewed on ${formatDate(studentProfile.reviewed_at)}`
              : 'Awaiting submission'}
          </p>
        </div>

        {/* Academic Performance */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Academic Standing
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold text-slate-900">
              {academicRecords.length > 0
                ? `${academicRecords.length} Course${academicRecords.length > 1 ? 's' : ''}`
                : 'No records'}
            </span>
            <span className="text-xs text-slate-500">({totalCredits} Credits)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {academicRecords.some((r) => r.is_backlog) ? (
              <span className="text-rose-600 font-medium">Backlogs recorded</span>
            ) : (
              <span className="text-emerald-600 font-medium">All registered courses active</span>
            )}
          </p>
        </div>

        {/* Assigned Mentor */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Assigned Faculty Mentor
          </p>
          {assignedMentor ? (
            <>
              <p className="text-sm font-bold text-slate-900 mt-1 truncate">
                {assignedMentor.full_name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {assignedMentor.department}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-amber-700 mt-1">
                Pending Allocation
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                HOD will allocate faculty
              </p>
            </>
          )}
        </div>
      </div>

      {/* Main Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Quick Action Shortcuts & Academic Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick ERP Shortcuts */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Essential Student Actions
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
                    Update Profile & Contacts
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Maintain phone, blood group, address, and emergency contact details.
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
                    Manage Academic Records
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Add courses, examination marks, grade points, and attendance.
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
                    Submit for Verification
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Submit your profile to mentor and HOD for official institutional endorsement.
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
                    Faculty Mentorship Desk
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Review official mentor remarks, meeting notes, and career endorsements.
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Academic Records Table Summary */}
          <Card
            title={`Semester ${studentProfile.semester} Courses & Performance`}
            description="Verified course enrollment and continuous evaluation records"
            headerAction={
              <Link href="/mentee/academics">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                  View All Records
                </Button>
              </Link>
            }
          >
            {academicRecords.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 space-y-2">
                <p>No academic records entered yet for Semester {studentProfile.semester}.</p>
                <Link href="/mentee/academics">
                  <Button size="sm" variant="outline">
                    Add First Course
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {academicRecords.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-900">
                          {r.course_code}
                        </span>
                        <span className="text-slate-700">{r.course_name}</span>
                        {r.is_backlog && (
                          <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
                            Backlog
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Sem {r.semester} • {r.credits} Credits • {r.academic_year}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-slate-800">
                        {r.grade ? `Grade: ${r.grade}` : `${r.marks_obtained || 0}/${r.max_marks || 100}`}
                      </p>
                      {r.attendance_percentage !== null && (
                        <p className="text-[11px] text-slate-500">
                          Att: {r.attendance_percentage}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 Col): Mentor & Recent Updates */}
        <div className="space-y-6">
          {/* Assigned Faculty Mentor Card */}
          <Card title="Assigned Faculty Mentor">
            {assignedMentor ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-accent-light border border-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                    {assignedMentor.full_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('') || 'FM'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {assignedMentor.full_name}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {assignedMentor.department}
                    </p>
                  </div>
                </div>

                <div className="text-xs space-y-2 pt-2 border-t border-slate-100 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px] truncate">{assignedMentor.email}</span>
                  </div>
                  {assignedMentor.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span>{assignedMentor.phone_number}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Link href="/mentee/mentor" className="w-full block">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      View Guidance & Notes
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 space-y-2">
                <p>No mentor is currently assigned to your student profile.</p>
                <p className="text-[11px] text-slate-400">
                  The department HOD will assign your faculty mentor during the semester allocation window.
                </p>
              </div>
            )}
          </Card>

          {/* Recent Mentor Feedback / Notes */}
          <Card
            title="Recent Feedback & Notes"
            headerAction={
              <Link href="/mentee/mentor">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                </Button>
              </Link>
            }
          >
            {mentorNotes.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No session notes shared yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {mentorNotes.slice(0, 2).map((note) => (
                  <div key={note.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar size={11} /> {formatDate(note.note_date)}
                      </span>
                      <span className="font-semibold text-slate-700">Mentoring Session</span>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Notifications */}
          <Card
            title="Recent Alerts & Notices"
            headerAction={
              <Link href="/mentee/notifications">
                <Button variant="ghost" size="sm" className="text-xs">
                  Notifications
                </Button>
              </Link>
            }
          >
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No active notifications.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.slice(0, 3).map((notif) => (
                  <div key={notif.id} className="py-2.5 text-xs">
                    <p className="font-semibold text-slate-800">{notif.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      {formatDate(notif.created_at || '')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
