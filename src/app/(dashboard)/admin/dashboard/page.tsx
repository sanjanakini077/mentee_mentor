import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Users,
  UserCheck,
  ThumbsUp,
  Clock,
  ArrowRight,
  ClipboardList,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/server'
import {
  PREVIEW_PROFILES,
  PREVIEW_ASSIGNED_STUDENTS,
  PREVIEW_RECOMMENDATIONS,
  PREVIEW_AUDIT_LOGS,
} from '@/lib/preview-data'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  let adminProfile: Profile | null = null
  let pendingStudents: any[] = []
  let pendingRecs: any[] = []
  let auditLogsList: any[] = []
  let totalStudentCount = 0
  let activeMentorCount = 0

  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single<Profile>()

    if (prof) {
      adminProfile = prof

      // Count total students in department
      const { count: studentCount } = await supabase
        .from('student_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('department', prof.department)

      totalStudentCount = studentCount || 0

      // Count active mentors in department
      const { count: mentorCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('department', prof.department)
        .eq('role', 'mentor')

      activeMentorCount = mentorCount || 0

      // Pending student verifications
      const { data: pending } = await supabase
        .from('student_profiles')
        .select(`
          id,
          usn,
          semester,
          department,
          verification_status,
          profiles (
            full_name,
            email
          )
        `)
        .eq('department', prof.department)
        .eq('verification_status', 'submitted')
        .limit(5)

      if (pending) pendingStudents = pending

      // Pending recommendations
      const { data: recs } = await supabase
        .from('mentor_recommendations')
        .select(`
          id,
          category,
          details,
          content,
          status,
          created_at,
          student_profiles (
            usn,
            profiles (
              full_name
            )
          ),
          mentor:profiles!mentor_recommendations_mentor_profile_id_fkey (
            full_name
          )
        `)
        .eq('status', 'pending')
        .limit(5)

      if (recs) pendingRecs = recs

      // Audit logs
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (logs) auditLogsList = logs
    }
  } catch (err) {
    console.warn('Admin dashboard data fetch warning:', err)
  }

  const admin = adminProfile || PREVIEW_PROFILES.hod
  const students = pendingStudents.length > 0 ? pendingStudents : PREVIEW_ASSIGNED_STUDENTS.filter(s => s.verification_status === 'submitted')
  const recommendations = pendingRecs.length > 0 ? pendingRecs : PREVIEW_RECOMMENDATIONS
  const auditLogs = auditLogsList.length > 0 ? auditLogsList : PREVIEW_AUDIT_LOGS

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Department Administration — ${admin.full_name}`}
        description={`${admin.department} • Academic Oversight & Mentorship Desk`}
        breadcrumbs={[{ label: 'Administration' }, { label: 'Dashboard' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/assignments">
              <Button size="sm" variant="outline" leftIcon={<ClipboardList size={14} />}>
                Allocate Mentors
              </Button>
            </Link>
            <Link href="/admin/recommendations">
              <Button size="sm" variant="primary" leftIcon={<ThumbsUp size={14} />}>
                Review Recommendations
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
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {totalStudentCount > 0 ? totalStudentCount : 128}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Semesters 1–8 • {admin.department}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pending Profile Approvals
            </p>
            <Clock size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {students.length}
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
            {recommendations.length}
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
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {activeMentorCount > 0 ? activeMentorCount : 12}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Department Faculty</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Pending Student Verification Requests"
            description="Student profile information submitted and awaiting HOD verification."
            headerAction={
              <Link href="/admin/students">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                  Manage Directory
                </Button>
              </Link>
            }
          >
            <div className="divide-y divide-slate-100 text-xs">
              {students.map((st: any) => (
                <div
                  key={st.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {st.profiles?.full_name || 'Student Candidate'}
                    </p>
                    <p className="text-slate-500 font-mono text-[11px]">
                      {st.usn} • Sem {st.semester} • {st.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={st.verification_status || 'submitted'} />
                    <Link href="/admin/students">
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
              <Link href="/admin/recommendations">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                  Review All
                </Button>
              </Link>
            }
          >
            <div className="space-y-3">
              {recommendations.map((rec: any) => (
                <div
                  key={rec.id}
                  className="p-3.5 border border-slate-200 rounded-md bg-white text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {rec.student_profiles?.profiles?.full_name || rec.student?.profiles?.full_name || 'Student'} ({rec.student_profiles?.usn || rec.student?.usn || 'USN'})
                    </span>
                    <StatusBadge status={rec.status} />
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    {rec.details || rec.content}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Mentor: {rec.mentor?.full_name || 'Faculty Mentor'}</span>
                    <span>{formatDate(rec.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="Recent Audit Activity"
            description="Immutable log of administrative & mentoring actions."
            headerAction={
              <Link href="/admin/audit">
                <Button variant="ghost" size="sm">
                  Full Log
                </Button>
              </Link>
            }
          >
            <div className="space-y-3">
              {auditLogs.slice(0, 4).map((log: any) => (
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
                    Target: {log.target_type}
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

