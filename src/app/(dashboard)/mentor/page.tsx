import React from 'react'
import Link from 'next/link'
import {
  Users,
  FileText,
  ThumbsUp,
  Clock,
  ArrowRight,
  Plus,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  PREVIEW_PROFILES,
  PREVIEW_ASSIGNED_STUDENTS,
  PREVIEW_MENTORING_NOTES,
  PREVIEW_RECOMMENDATIONS,
} from '@/lib/preview-data'
import { formatDate } from '@/lib/utils'

export default function MentorDashboardPage() {
  const mentor = PREVIEW_PROFILES.mentor
  const students = PREVIEW_ASSIGNED_STUDENTS
  const notes = PREVIEW_MENTORING_NOTES
  const recommendations = PREVIEW_RECOMMENDATIONS

  const pendingVerificationCount = students.filter(
    (s) => s.verification_status === 'submitted'
  ).length
  const pendingRecCount = recommendations.filter(
    (r) => r.status === 'pending'
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Faculty Mentorship Desk — ${mentor.full_name}`}
        description="Assigned student counseling, academic performance monitoring, and institutional recommendations."
        breadcrumbs={[{ label: 'Faculty Portal' }, { label: 'Overview' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/mentor/notes">
              <Button size="sm" variant="outline" leftIcon={<Plus size={14} />}>
                Record Session Note
              </Button>
            </Link>
            <Link href="/mentor/recommendations">
              <Button size="sm" variant="primary" leftIcon={<ThumbsUp size={14} />}>
                New Recommendation
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Assigned Students
            </p>
            <Users size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{students.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Semesters 3 & 5 • Dept of CSE
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pending Endorsements
            </p>
            <Clock size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {pendingVerificationCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Student profile submissions
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Session Notes Recorded
            </p>
            <FileText size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{notes.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Academic Year 2024–25</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Recommendations
            </p>
            <ThumbsUp size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {recommendations.length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {pendingRecCount} awaiting HOD review
          </p>
        </div>
      </div>

      {/* Main Grid: Student Roster preview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Assigned Students Table Preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Assigned Students Roster"
            description="Students allocated under your faculty mentorship for this academic cycle."
            headerAction={
              <Link href="/mentor/students">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                  View All Students
                </Button>
              </Link>
            }
          >
            <div className="divide-y divide-slate-100 text-xs">
              {students.map((st) => (
                <div
                  key={st.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">
                      {st.profiles?.full_name}
                    </p>
                    <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                      {st.usn} • Sem {st.semester} • CGPA: {st.cgpa}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={st.verification_status} />
                    <Link href={`/mentor/students`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (1 col): Recent Session Notes */}
        <div className="space-y-6">
          <Card
            title="Recent Mentoring Notes"
            description="Latest documented counseling sessions."
            headerAction={
              <Link href="/mentor/notes">
                <Button variant="ghost" size="sm">
                  Log Note
                </Button>
              </Link>
            }
          >
            <div className="space-y-3">
              {notes.slice(0, 3).map((n) => (
                <div
                  key={n.id}
                  className="p-3 bg-slate-50/60 rounded border border-slate-100 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {n.student?.profiles?.full_name || 'Student'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDate(n.note_date)}
                    </span>
                  </div>
                  <p className="text-slate-600 line-clamp-2 text-[11px]">
                    {n.content}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
