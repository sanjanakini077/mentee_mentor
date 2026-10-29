'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  UserPlus,
  CheckSquare,
  ThumbsUp,
  Clock,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ScrollText,
  Eye,
  Check,
  X,
  MessageSquare,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
getAdminDashboardData,
  reviewStudentProfile,
  reviewMentorRecommendation,
  type AdminDashboardData,
} from '@/lib/services/adminService'
import { formatDate, formatDateTime } from '@/lib/utils'

  export default function AdminDashboardPage() {
    const { success, error: toastError, warning } = useToast()

    const [data, setData] = useState<AdminDashboardData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

      // Quick Decision Modal State
      const [activeItem, setActiveItem] = useState<{
        type: 'student' | 'recommendation'
        id: string
        title: string
        subtitle: string
      } | null>(null)
      const [decision, setDecision] = useState<'approved' | 'rejected' | 'correction_requested' | null>(null)
      const [reviewComment, setReviewComment] = useState('')
      const [isCommitting, setIsCommitting] = useState(false)

      const loadData = async () => {
        try {
          const d = await getAdminDashboardData()
          setData(d)
        } catch (err: any) {
          setError(err?.message || 'Failed to load administration dashboard.')
        } finally {
          setIsLoading(false)
        }
      }

      useEffect(() => {
        loadData()
      }, [])

        const handleDecisionSubmit = async () => {
          if (!activeItem || !decision) return

            if (
              (decision === 'rejected' || decision === 'correction_requested') &&
              !reviewComment.trim()
            ) {
              warning('Please provide an explanatory comment for rejection or requested corrections.')
              return
            }

            setIsCommitting(true)
            try {
              if (activeItem.type === 'student') {
                await reviewStudentProfile({
                  studentProfileId: activeItem.id,
                  decision,
                  reviewComment,
                })
                success(`Student profile decision committed: ${decision}.`)
              } else {
                await reviewMentorRecommendation({
                  recommendationId: activeItem.id,
                  decision: decision === 'approved' ? 'approved' : 'rejected',
                  reviewComment,
                })
                success(`Faculty recommendation marked as ${decision}.`)
              }
              setActiveItem(null)
              setDecision(null)
              setReviewComment('')
              await loadData()
            } catch (err: any) {
              toastError(err?.message || 'Failed to record administrative decision.')
            } finally {
              setIsCommitting(false)
            }
          }

          if (isLoading) {
            return (
              <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
                <Skeleton className="h-96 w-full" />
              </div>
            )
          }

        if (error || !data) {
          return (
            <div className="p-6 bg-white border border-rose-200 rounded-md space-y-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertCircle size={18} />
                <span>Error Loading Department Administration</span>
              </div>
              <p className="text-xs text-slate-600">{error || 'Unable to access administration records.'}</p>
              <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          )
        }

        const {
          adminProfile,
          totalStudents,
          awaitingReviewCount,
          approvedCount,
          correctionNeededCount,
          pendingRecommendationsCount,
          activeMentorsCount,
          pendingStudentSubmissions,
          pendingRecommendations,
          recentAuditLogs,
        } = data

        return (
          <div className="space-y-6">
            <PageHeader
              title={`Head of Department Administration — ${adminProfile.department}`}
              description={`HOD: ${adminProfile.full_name} • Institutional Oversight & Review Desk`}
              breadcrumbs={[{ label: 'Administration' }, { label: 'Dashboard' }]}
              actions={
                <div className="flex items-center gap-2">
                  <Link href="/admin/faculty">
                    <Button size="sm" variant="secondary" leftIcon={<UserPlus size={14} />}>
                      Faculty Directory
                    </Button>
                  </Link>
                  <Link href="/admin/reviews">
                    <Button size="sm" variant="primary" leftIcon={<CheckSquare size={14} />}>
                      Open Review Queue ({awaitingReviewCount + pendingRecommendationsCount})
                    </Button>
                  </Link>
                </div>
              }
      />

                          {/* Useful Metrics Row: 5 Small Informative Summary Cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                            <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                                Department Students
                              </span>
                              <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
                                {totalStudents}
                              </p>
                              <span className="text-[11px] text-slate-500 mt-0.5 block">
                                {activeMentorsCount} Faculty Mentors
                              </span>
                            </div>

                                <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs">
                                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                                    Awaiting Review
                                  </span>
                                  <p className="text-xl font-bold text-blue-600 mt-1 font-mono">
                                    {awaitingReviewCount}
                                  </p>
                                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                                      Pending verification
                                    </span>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs">
                                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                                    Approved Profiles
                                  </span>
                                  <p className="text-xl font-bold text-emerald-600 mt-1 font-mono">
                                    {approvedCount}
                                  </p>
                                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                                    Officially endorsed
                                  </span>
                                </div>

                                    <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs">
                                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                                        Corrections Needed
                                      </span>
                                      <p className="text-xl font-bold text-amber-600 mt-1 font-mono">
                                        {correctionNeededCount}
                                      </p>
                                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                                        Returned to students
                                      </span>
                                    </div>

                                        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs col-span-2 sm:col-span-1">
                                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                                            Recommendations
                                          </span>
                                          <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
                                            {pendingRecommendationsCount}
                                          </p>
                                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                                            Awaiting HOD decision
                                          </span>
                                        </div>
                                    </div>

                                    {/* Main Layout: 2 Columns */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                      {/* Left Column (2 Cols): Pending Review Queue with Action Controls */}
                                      <div className="lg:col-span-2 space-y-6">
                                        {/* Pending Student Profiles Queue */}
                                        <Card
                                          title={`Pending Student Verification Queue (${pendingStudentSubmissions.length})`}
                                          description="Student submissions awaiting departmental verification and official endorsement."
                                          headerAction={
                                              <Link href="/admin/reviews">
                                                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                                                  Review Workspace
                                                </Button>
                                              </Link>
            }
          >
                                                          {pendingStudentSubmissions.length === 0 ? (
                                                            <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                                                              <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
                                                              <p className="font-semibold text-slate-700">All student profile submissions reviewed.</p>
                                                              <p className="text-slate-400">New submissions will appear here as students complete their coursework entries.</p>
                                                            </div>
                                                          ) : (
                                                            <div className="divide-y divide-slate-100">
                                                              {pendingStudentSubmissions.slice(0, 5).map((st: any) => (
                                                                <div
                                                                  key={st.id}
                                                                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                                                >
                                                                  <div>
                                                                    <div className="flex items-center gap-2">
                                                                      <span className="font-bold text-slate-900">
                                                                        {st.profiles?.full_name || 'Student'}
                                                                      </span>
                                                                      <span className="font-mono text-slate-500 text-[11px]">
                                                                        ({st.usn} • Sem {st.semester})
                                                                      </span>
                                                                      <StatusBadge status={st.verification_status} />
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                                      {st.profiles?.email} • Department of {adminProfile.department}
                                                                    </p>
                                                                  </div>

                                                                  <div className="flex items-center gap-1.5 shrink-0">
                                                                    <Button
                                                                      size="sm"
                                                                      variant="outline"
                                                                      onClick={() => {
                                                                        setActiveItem({
                                                                          type: 'student',
                                                                          id: st.id,
                                                                          title: `Review Student — ${st.profiles?.full_name}`,
                                                                          subtitle: `USN: ${st.usn} • Semester ${st.semester}`,
                                                                        })
                                                                        setDecision('correction_requested')
                                                                        setReviewComment('')
                                                                      }}
                                                                      className="h-7 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                                                                    >
                                                                      Request Changes
                                                                    </Button>
                                                                  <Button
                                                                    size="sm"
                                                                    variant="primary"
                                                                    onClick={() => {
                                                                      setActiveItem({
                                                                        type: 'student',
                                                                        id: st.id,
                                                                        title: `Endorse Student — ${st.profiles?.full_name}`,
                                                                        subtitle: `USN: ${st.usn} • Semester ${st.semester}`,
                                                                      })
                                                                      setDecision('approved')
                                                                      setReviewComment('Approved after departmental verification.')
                                                                    }}
                                                                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                                                  >
                                                                    Approve
                                                                  </Button>
                                                                </div>
                  </div>
                ))}
                                                  </div>
                                                )}
                                              </Card>

                                              {/* Pending Recommendations Queue */}
                                              <Card
                                                title={`Faculty Recommendations for HOD Endorsement (${pendingRecommendations.length})`}
                                                description="Formal faculty mentor endorsements for research internships, remedial tracks, and scholarships."
                                                headerAction={
                                                  <Link href="/admin/recommendations">
                                                    <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                                                      View All
                                                    </Button>
                                                  </Link>
                                                }
                                              >
                                                        {pendingRecommendations.length === 0 ? (
                                                          <div className="py-6 text-center text-xs text-slate-400">
                                                            No faculty recommendations currently pending review.
                                                          </div>
                                                        ) : (
                                                          <div className="divide-y divide-slate-100">
                                                            {pendingRecommendations.slice(0, 3).map((rec: any) => (
                  <div key={rec.id} className="py-3 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-semibold text-slate-900">
                          {rec.student?.profiles?.full_name} ({rec.student?.usn})
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Submitted by Mentor: <strong>{rec.mentor?.full_name}</strong> •{' '}
                          <span className="capitalize">{rec.category} Recommendation</span>
                        </p>
                      </div>
                      <StatusBadge status={rec.status} />
                    </div>

                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                      {rec.details}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveItem({
                            type: 'recommendation',
                            id: rec.id,
                            title: `Reject Recommendation — ${rec.student?.profiles?.full_name}`,
                            subtitle: `Submitted by ${rec.mentor?.full_name}`,
                          })
                          setDecision('rejected')
                          setReviewComment('')
                        }}
                        className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setActiveItem({
                            type: 'recommendation',
                            id: rec.id,
                            title: `Endorse Recommendation — ${rec.student?.profiles?.full_name}`,
                            subtitle: `Submitted by ${rec.mentor?.full_name}`,
                          })
                          setDecision('approved')
                          setReviewComment('Approved. Forwarded for institutional sanction.')
                        }}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                      >
                        Endorse & Approve
                      </Button>
                    </div>
                  </div>
                ))}
                                                    </div>
                                                  )}
                                              </Card>
                                            </div>

        {/* Right Column (1 Col): Recent Administrative Decisions & Fast Shortcuts */}
        <div className="space-y-6">
                                          {/* Recent Audit Decisions */}
                                          <Card
                                            title="Recent Administrative Decisions"
                                            description="Immutable audit trail of departmental actions"
                                            headerAction={
                                                  <Link href="/admin/audit-log">
                                                    <Button variant="ghost" size="sm" className="text-xs">
                                                      Audit Log
                                                    </Button>
                                                  </Link>
            }
          >
                                                          {recentAuditLogs.length === 0 ? (
                                                            <div className="py-6 text-center text-xs text-slate-400">
                                                              No recent administrative actions recorded.
                                                            </div>
                                                          ) : (
                                                            <div className="divide-y divide-slate-100">
                                                              {recentAuditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="py-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          log.action.includes('APPROVED')
                            ? 'success'
                            : log.action.includes('ASSIGNED')
                            ? 'primary'
                            : log.action.includes('REJECTED')
                            ? 'danger'
                            : 'default'
                        }
                        className="font-mono text-[9px]"
                      >
                        {log.action}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-mono truncate">
                      Target: {log.target_type} ({log.target_id.slice(0, 8)}...)
                    </p>
                  </div>
                ))}
                                                        </div>
            )}
                                                      </Card>

          {/* Quick Management Links */ }
                                                      < Card title = "Administrative Navigation" >
                                                      <div className="space-y-2">
                                                        <Link href="/admin/reviews" className="block">
                                                          <Button variant="outline" size="sm" className="w-full justify-start text-xs" leftIcon={<CheckSquare size={14} />}>
                                                            Dedicated Review Queue Workspace
                                                          </Button>
                                                        </Link>
                                                        <Link href="/admin/students" className="block">
                                                          <Button variant="outline" size="sm" className="w-full justify-start text-xs" leftIcon={<Users size={14} />}>
                                                            Department Student Directory
                                                          </Button>
                                                        </Link>
                                                        <Link href="/admin/assignments" className="block">
                                                          <Button variant="outline" size="sm" className="w-full justify-start text-xs" leftIcon={<ClipboardList size={14} />}>
                                                            Mentor Allocation & Reassignment
                                                          </Button>
                                                        </Link>
                                                        <Link href="/admin/audit-log" className="block">
                                                          <Button variant="outline" size="sm" className="w-full justify-start text-xs" leftIcon={<ScrollText size={14} />}>
                                                            Institutional Immutable Audit Trail
                                                          </Button>
                                                        </Link>
                                                      </div>
          </Card>
                                                </div>
                                              </div>

      {/* Decision Confirmation Dialog */}
                                            {activeItem && decision && (
                                              <Dialog
                                                isOpen={Boolean(activeItem && decision)}
                                                onClose={() => {
                                                  setActiveItem(null)
                                                  setDecision(null)
                                                }}
                                                title={activeItem.title}
                                                description={activeItem.subtitle}
                                                footer={
                                                  <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => {
                                                        setActiveItem(null)
                                                        setDecision(null)
                                                      }}
                                                      disabled={isCommitting}
                                                    >
                                                      Cancel
                                                    </Button>
                                                    <Button
                                                      variant={decision === 'approved' ? 'primary' : decision === 'rejected' ? 'danger' : 'outline'}
                                                      size="sm"
                                                      onClick={handleDecisionSubmit}
                                                      isLoading={isCommitting}
                                                    >
                                                      {decision === 'approved'
                                                        ? 'Confirm Approval'
                                                        : decision === 'rejected'
                                                          ? 'Confirm Rejection'
                                                          : 'Confirm Changes Requested'}
                                                    </Button>
                                                  </div>
                                                }
                                              >
                                                <div className="space-y-4 text-xs">
                                                  <FormField
                                                    label="Official HOD Decision Comment / Reason"
                                                    required={decision === 'rejected' || decision === 'correction_requested'}
                                                    htmlFor="hodDecisionComment"
                                                    description={
                                                      decision === 'approved'
                                                        ? 'Official endorsement attached to student record.'
                                                        : 'Provide specific feedback explaining why corrections are requested or why rejected.'
                                                    }
                                                  >
                                                    <Textarea
                                                      id="hodDecisionComment"
                                                      rows={3}
                                                      value={reviewComment}
                                                      onChange={(e) => setReviewComment(e.target.value)}
                                                      placeholder={
                                                        decision === 'approved'
                                                          ? 'e.g. Approved. Academic standing verified with Examination Cell...'
                                                          : 'e.g. Please re-upload laboratory marksheet for Semester 5...'
                                                      }
                                                    />
                                                  </FormField>
                                                </div>
                                              </Dialog>
                                            )}
    </div>
                                        )
}
