'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  FileText,
  ThumbsUp,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ExternalLink,
  BookOpen,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  getMentorDashboardData,
  type MentorDashboardData,
} from '@/lib/services/mentorService'
import { formatDate } from '@/lib/utils'

export default function MentorDashboardPage() {
  const [data, setData] = useState<MentorDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const d = await getMentorDashboardData()
        if (isMounted) setData(d)
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Failed to load mentor dashboard.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-white border border-rose-200 rounded-md space-y-3">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
          <AlertCircle size={18} />
          <span>Error Loading Faculty Portal</span>
        </div>
        <p className="text-xs text-slate-600">{error || 'Unable to access mentor data.'}</p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  const {
    mentorProfile,
    assignedStudentsCount,
    pendingVerificationCount,
    pendingRecommendationsCount,
    recentNotes,
    studentsRequiringFollowUp,
    assignedStudents,
  } = data

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Faculty Mentorship Desk — ${mentorProfile.full_name}`}
        description={`${mentorProfile.department} • Academic Guidance & Periodic Mentoring Desk`}
        breadcrumbs={[{ label: 'Faculty Portal' }, { label: 'Dashboard' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/mentor/students">
              <Button size="sm" variant="outline" leftIcon={<Users size={14} />}>
                Assigned Students ({assignedStudentsCount})
              </Button>
            </Link>
          </div>
        }
      />

      {/* Practical ERP Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Assigned Students */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Assigned Mentees
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {assignedStudentsCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Active departmental allocation
          </p>
        </div>

        {/* Metric 2: Awaiting Review / Verification */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Submissions Under Review
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-2xl font-bold font-mono ${
                pendingVerificationCount > 0 ? 'text-blue-600' : 'text-slate-900'
              }`}
            >
              {pendingVerificationCount}
            </span>
            <span className="text-xs text-slate-500">Student Profile{pendingVerificationCount === 1 ? '' : 's'}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {pendingVerificationCount > 0
              ? 'Awaiting mentor verification check'
              : 'All submissions reviewed'}
          </p>
        </div>

        {/* Metric 3: Pending Recommendations */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Pending Recommendations
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {pendingRecommendationsCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Submitted for HOD endorsement
          </p>
        </div>

        {/* Metric 4: Follow-up Alerts */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Follow-Up Attention
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-2xl font-bold font-mono ${
                studentsRequiringFollowUp.length > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {studentsRequiringFollowUp.length}
            </span>
            <span className="text-xs text-slate-500">Mentees</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {studentsRequiringFollowUp.length > 0
              ? 'Attendance / backlogs / review alerts'
              : 'All mentees in good standing'}
          </p>
        </div>
      </div>

      {/* Main 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Students Requiring Follow-Up & All Assigned Mentees Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Compact List of Students Requiring Follow-Up */}
          <Card
            title="Mentees Requiring Attention or Follow-up"
            description="Students flagged for low attendance (<75%), uncleared backlogs, or pending submissions."
            headerAction={
              <Link href="/mentor/students">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                  Full Student Roster
                </Button>
              </Link>
            }
          >
            {studentsRequiringFollowUp.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
                <p className="font-semibold text-slate-700">No active student alerts.</p>
                <p className="text-slate-400">All your assigned students meet attendance and performance thresholds.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {studentsRequiringFollowUp.map((student) => (
                  <div
                    key={student.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/mentor/students/${student.id}`}
                          className="font-bold text-slate-900 hover:text-accent flex items-center gap-1"
                        >
                          {student.fullName}
                          <ExternalLink size={12} className="text-slate-400" />
                        </Link>
                        <span className="font-mono text-slate-500 text-[11px]">
                          ({student.usn})
                        </span>
                        <StatusBadge status={student.verificationStatus} />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>Sem {student.semester}</span>
                        {student.avgAttendance !== undefined && (
                          <span
                            className={
                              student.avgAttendance < 75
                                ? 'text-rose-600 font-semibold'
                                : 'text-slate-600'
                            }
                          >
                            Attendance: {student.avgAttendance}%
                          </span>
                        )}
                        {student.activeBacklogs > 0 && (
                          <span className="text-rose-600 font-semibold">
                            {student.activeBacklogs} Backlog(s)
                          </span>
                        )}
                      </div>
                      {student.attentionReason && (
                        <p className="text-[11px] text-amber-700 mt-0.5 flex items-center gap-1">
                          <AlertTriangle size={12} className="shrink-0" />
                          <span>{student.attentionReason}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/mentor/students/${student.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          Review Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Section: Quick Assigned Mentees Directory Overview */}
          <Card
            title={`Assigned Students Directory (${assignedStudents.length})`}
            description="Official departmental mentorship cohort under your supervision."
            headerAction={
              <Link href="/mentor/students">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                  Manage All
                </Button>
              </Link>
            }
          >
            {assignedStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                <p>No students currently allocated to your mentor profile.</p>
                <p className="text-slate-400">The department HOD manages mentor-student allocations.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {assignedStudents.slice(0, 5).map((st) => (
                  <div
                    key={st.id}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/mentor/students/${st.id}`}
                          className="font-semibold text-slate-900 hover:text-accent"
                        >
                          {st.fullName}
                        </Link>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {st.usn}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Sem {st.semester} • {st.totalCourses} Courses ({st.totalCredits} Credits)
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <StatusBadge status={st.verificationStatus} />
                      <Link href={`/mentor/students/${st.id}`}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 Col): Recent Mentoring Logs & Quick Action Links */}
        <div className="space-y-6">
          {/* Recent Mentoring Activity */}
          <Card
            title="Recent Mentoring Activity"
            description="Latest advisory notes and student counseling sessions."
            headerAction={
              <Link href="/mentor/notes">
                <Button variant="ghost" size="sm" className="text-xs">
                  All Notes
                </Button>
              </Link>
            }
          >
            {recentNotes.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No session notes logged yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentNotes.map((note) => (
                  <div key={note.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-800">
                        {note.student?.profiles?.full_name || 'Assigned Student'}
                      </span>
                      <span className="font-mono">{formatDate(note.note_date)}</span>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span className="font-mono uppercase">
                        {note.visibility === 'shared_with_mentee' ? 'Shared with Mentee' : 'Private Faculty Note'}
                      </span>
                      {note.student_profile_id && (
                        <Link
                          href={`/mentor/students/${note.student_profile_id}`}
                          className="text-accent hover:underline"
                        >
                          Open Dossier →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Institutional Fast Actions */}
          <Card title="Mentor Quick Actions">
            <div className="space-y-2.5">
              <Link href="/mentor/notes" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs" leftIcon={<FileText size={14} />}>
                  Log Mentoring Session Note
                </Button>
              </Link>
              <Link href="/mentor/recommendations" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs" leftIcon={<ThumbsUp size={14} />}>
                  Submit Recommendation to HOD
                </Button>
              </Link>
              <Link href="/mentor/students" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs" leftIcon={<Users size={14} />}>
                  Search & Filter Assigned Students
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
