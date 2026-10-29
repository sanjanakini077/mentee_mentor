import React from 'react'
import Link from 'next/link'
import {
  Users,
  UserCheck,
  ThumbsUp,
  Clock,
  ArrowRight,
  ShieldAlert,
  ClipboardList,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  PREVIEW_PROFILES,
  PREVIEW_ASSIGNED_STUDENTS,
  PREVIEW_RECOMMENDATIONS,
  PREVIEW_AUDIT_LOGS,
} from '@/lib/preview-data'
import { formatDate } from '@/lib/utils'

export default function HodDashboardPage() {
  const hod = PREVIEW_PROFILES.hod
  const students = PREVIEW_ASSIGNED_STUDENTS
  const recommendations = PREVIEW_RECOMMENDATIONS
  const auditLogs = PREVIEW_AUDIT_LOGS

  const pendingVerificationCount = students.filter(
    (s) => s.verification_status === 'submitted'
  ).length
  const pendingRecCount = recommendations.filter(
    (r) => r.status === 'pending'
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Head of Department Administration — ${hod.full_name}`}
        description="Department of Computer Science & Engineering • Academic Oversight & Faculty Mentorship Management"
        breadcrumbs={[{ label: 'Administration' }, { label: 'Overview' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/hod/assignments">
              <Button size="sm" variant="outline" leftIcon={<ClipboardList size={14} />}>
                Allocate Mentors
              </Button>
            </Link>
            <Link href="/hod/recommendations">
              <Button size="sm" variant="primary" leftIcon={<ThumbsUp size={14} />}>
                Review Recommendations ({pendingRecCount})
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
              Department Students
            </p>
            <Users size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">128</p>
          <p className="text-xs text-slate-500 mt-0.5">Across Semesters 1–8</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pending Profile Approvals
            </p>
            <Clock size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {pendingVerificationCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Require HOD examination clearance
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pending Recommendations
            </p>
            <ThumbsUp size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {pendingRecCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Submitted by faculty</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Active Faculty Mentors
            </p>
            <UserCheck size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">12</p>
          <p className="text-xs text-slate-500 mt-0.5">All batches allocated</p>
        </div>
      </div>

      {/* Main Grid: Pending Action Items & Recent Audit History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Pending Verifications & Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Pending Student Verification Requests"
            description="Student profile information submitted and awaiting HOD verification."
            headerAction={
              <Link href="/hod/students">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                  Manage Directory
                </Button>
              </Link>
            }
          >
            <div className="divide-y divide-slate-100 text-xs">
              {students
                .filter((s) => s.verification_status === 'submitted')
                .map((st) => (
                  <div
                    key={st.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {st.profiles?.full_name}
                      </p>
                      <p className="text-slate-500 font-mono text-[11px]">
                        {st.usn} • Sem {st.semester} • CGPA: {st.cgpa}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={st.verification_status} />
                      <Link href="/hod/students">
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          <Card
            title="Faculty Recommendations Under Review"
            description="Recommendations submitted by faculty mentors awaiting approval or endorsement."
            headerAction={
              <Link href="/hod/recommendations">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                  Review All
                </Button>
              </Link>
            }
          >
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 border border-slate-200 rounded-md bg-white text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {rec.student?.profiles?.full_name} ({rec.student?.usn})
                    </span>
                    <StatusBadge status={rec.status} />
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    {rec.content}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Mentor: Dr. K. S. Venkatesh</span>
                    <span>{formatDate(rec.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (1 col): Audit Trail preview */}
        <div className="space-y-6">
          <Card
            title="Recent Audit Activity"
            description="Immutable log of administrative & mentoring actions."
            headerAction={
              <Link href="/hod/audit">
                <Button variant="ghost" size="sm">
                  Full Log
                </Button>
              </Link>
            }
          >
            <div className="space-y-3">
              {auditLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-slate-50/70 border border-slate-100 rounded text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-[11px] font-mono">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    By {log.actor?.full_name} ({log.actor?.role})
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
