'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  CheckSquare,
  ThumbsUp,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Check,
  X,
  MessageSquare,
  BookOpen,
  Filter,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  getAdminDashboardData,
  reviewStudentProfile,
  reviewMentorRecommendation,
  type AdminDashboardData,
} from '@/lib/services/adminService'
import { getStore } from '@/lib/storage/demoStore'
import { formatDate } from '@/lib/utils'
import type { AcademicRecord } from '@/types'

export default function AdminReviewWorkspacePage() {
  const { success, error: toastError, warning } = useToast()

  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [allSubmissions, setAllSubmissions] = useState<any[]>([])
  const [allRecommendations, setAllRecommendations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeQueue, setActiveQueue] = useState<'students' | 'recommendations'>('students')

  // Review Dialog State
  const [activeItem, setActiveItem] = useState<{
    type: 'student' | 'recommendation'
    id: string
    title: string
    subtitle: string
    details?: string
    studentProfileId?: string
  } | null>(null)

  const [decision, setDecision] = useState<'approved' | 'rejected' | 'correction_requested' | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const [isCommitting, setIsCommitting] = useState(false)

  // Inspection Academics State
  const [inspectAcademics, setInspectAcademics] = useState<AcademicRecord[]>([])
  const [loadingAcademics, setLoadingAcademics] = useState(false)

    const loadData = useCallback(async () => {
      try {
        const d = await getAdminDashboardData()
        setData(d)

        const store = getStore()
        const stdList = store.studentProfiles.map((s) => ({
          ...s,
          profiles: store.profiles.find((p) => p.id === s.profile_id),
        }))

        setAllSubmissions(stdList)

        const deptRecs = store.recommendations.map((r) => {
          const sp = store.studentProfiles.find((s) => s.id === r.student_profile_id)
          const stProf = sp ? store.profiles.find((p) => p.id === sp.profile_id) : null
          const mentorProf = store.profiles.find((p) => p.id === r.mentor_profile_id)
          return {
            ...r,
            student: sp ? { ...sp, profiles: stProf } : null,
            mentor: mentorProf || null,
          }
        })
        setAllRecommendations(deptRecs)
      } catch (err: any) {
        toastError(err?.message || 'Failed to load review workspace.')
      } finally {
        setIsLoading(false)
      }
  }, [toastError])

    useEffect(() => {
      loadData()
      window.addEventListener('mms-store-changed', loadData)
      return () => window.removeEventListener('mms-store-changed', loadData)
}, [loadData])

// Open Inspection & Decision Dialog
const openDecisionDialog = async (item: {
  type: 'student' | 'recommendation'
  id: string
  title: string
  subtitle: string
  details?: string
  studentProfileId?: string
  defaultDecision: 'approved' | 'rejected' | 'correction_requested'
}) => {
  setActiveItem(item)
  setDecision(item.defaultDecision)
  setReviewComment(
    item.defaultDecision === 'approved'
      ? item.type === 'student'
        ? 'Approved after departmental verification and academic check.'
        : 'Approved and endorsed for institutional sanction.'
      : ''
  )

  if (item.type === 'student') {
    setLoadingAcademics(true)
    try {
      const store = getStore()
      const records = store.academicRecords
        .filter((r) => r.student_profile_id === item.id || r.student_id === item.id)
        .sort((a, b) => a.semester - b.semester)

      setInspectAcademics(records)
    } catch (err) {
      console.warn('Could not load academic records for review:', err)
    } finally {
      setLoadingAcademics(false)
    }
  }
}

const handleCommitReview = async () => {
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
    toastError(err?.message || 'Failed to commit decision.')
  } finally {
    setIsCommitting(false)
  }
}

if (isLoading) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

const pendingStudents = allSubmissions.filter(
  (s) => s.verification_status === 'submitted'
)
const pendingRecs = allRecommendations.filter((r) => r.status === 'pending')

return (
  <div className="space-y-6">
    <PageHeader
      title="Institutional Review Workspace"
      description="Official review queue for student profile verifications and faculty mentor recommendations."
      breadcrumbs={[
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Review Queue' },
      ]}
    />

    {/* Queue Switcher Tabs */}
    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
      <button
        onClick={() => setActiveQueue('students')}
        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded transition-colors ${activeQueue === 'students'
          ? 'bg-slate-900 text-white'
          : 'text-slate-600 hover:bg-slate-100'
          }`}
      >
        <User size={13} />
        Student Submissions ({pendingStudents.length} Pending)
      </button>
      <button
        onClick={() => setActiveQueue('recommendations')}
        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded transition-colors ${activeQueue === 'recommendations'
          ? 'bg-slate-900 text-white'
          : 'text-slate-600 hover:bg-slate-100'
          }`}
      >
        <ThumbsUp size={13} />
        Faculty Recommendations ({pendingRecs.length} Pending)
      </button>
    </div>

    {/* Queue 1: Student Verification Queue */}
    {activeQueue === 'students' && (
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>
            Showing {pendingStudents.length} student submission(s) awaiting official verification decision.
          </span>
        </div>

        {pendingStudents.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-md text-center space-y-2 shadow-xs">
            <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-slate-800">
              All Student Verification Submissions Cleared
            </p>
            <p className="text-[11px] text-slate-400">
              No students currently have pending verification requests.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingStudents.map((st) => (
              <Card key={st.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {st.profiles?.full_name}
                      </h3>
                      <span className="font-mono text-xs text-slate-500">
                        ({st.usn} • Sem {st.semester})
                      </span>
                      <StatusBadge status={st.verification_status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {st.profiles?.email} • {st.profiles?.phone_number || 'No phone'} • Batch {st.academic_batch}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        openDecisionDialog({
                          type: 'student',
                          id: st.id,
                          title: `Request Corrections — ${st.profiles?.full_name}`,
                          subtitle: `USN: ${st.usn} • Semester ${st.semester}`,
                          defaultDecision: 'correction_requested',
                        })
                      }
                      className="text-xs h-7 text-amber-700 border-amber-200 hover:bg-amber-50"
                    >
                      Request Corrections
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        openDecisionDialog({
                          type: 'student',
                          id: st.id,
                          title: `Reject Verification — ${st.profiles?.full_name}`,
                          subtitle: `USN: ${st.usn} • Semester ${st.semester}`,
                          defaultDecision: 'rejected',
                        })
                      }
                      className="text-xs h-7 text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        openDecisionDialog({
                          type: 'student',
                          id: st.id,
                          title: `Approve & Endorse — ${st.profiles?.full_name}`,
                          subtitle: `USN: ${st.usn} • Semester ${st.semester}`,
                          defaultDecision: 'approved',
                        })
                      }
                      className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                    >
                      Approve Profile
                    </Button>
                  </div>
                </div>

                <div className="pt-3 text-xs text-slate-600 flex justify-between items-center">
                  <span>
                    Submitted for official departmental review and semester verification endorsement.
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      openDecisionDialog({
                        type: 'student',
                        id: st.id,
                        title: `Inspect Dossier & Decide — ${st.profiles?.full_name}`,
                        subtitle: `USN: ${st.usn} • Semester ${st.semester}`,
                        defaultDecision: 'approved',
                      })
                    }
                    className="text-xs h-7 text-accent"
                  >
                    Inspect Coursework & Decide →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )}

    {/* Queue 2: Recommendations Queue */}
    {activeQueue === 'recommendations' && (
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>
            Showing {pendingRecs.length} faculty recommendation(s) awaiting HOD endorsement.
          </span>
        </div>

        {pendingRecs.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-md text-center space-y-2 shadow-xs">
            <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-slate-800">
              All Faculty Recommendations Processed
            </p>
            <p className="text-[11px] text-slate-400">
              No mentor recommendations currently awaiting review.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRecs.map((rec) => (
              <Card key={rec.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {rec.student?.profiles?.full_name}
                      </h3>
                      <span className="font-mono text-xs text-slate-500">
                        ({rec.student?.usn} • Sem {rec.student?.semester})
                      </span>
                      <StatusBadge status={rec.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Submitted by Mentor: <strong>{rec.mentor?.full_name}</strong> •{' '}
                      <span className="capitalize">{rec.category} Recommendation</span> •{' '}
                      {formatDate(rec.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        openDecisionDialog({
                          type: 'recommendation',
                          id: rec.id,
                          title: `Reject Recommendation — ${rec.student?.profiles?.full_name}`,
                          subtitle: `Submitted by ${rec.mentor?.full_name}`,
                          details: rec.details,
                          defaultDecision: 'rejected',
                        })
                      }
                      className="text-xs h-7 text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        openDecisionDialog({
                          type: 'recommendation',
                          id: rec.id,
                          title: `Endorse Recommendation — ${rec.student?.profiles?.full_name}`,
                          subtitle: `Submitted by ${rec.mentor?.full_name}`,
                          details: rec.details,
                          defaultDecision: 'approved',
                        })
                      }
                      className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                    >
                      Endorse & Approve
                    </Button>
                  </div>
                </div>

                <div className="py-3 text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded mt-2 border border-slate-100">
                  <span className="font-semibold block text-[11px] text-slate-800 mb-0.5">
                    Faculty Justification:
                  </span>
                  {rec.details}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )}

    {/* Unified Review & Decision Commit Dialog */}
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
              onClick={handleCommitReview}
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
          {/* Show Academic Coursework if reviewing a student */}
          {activeItem.type === 'student' && (
            <div>
              <span className="font-bold text-slate-800 block mb-1">
                Submitted Coursework Records ({inspectAcademics.length})
              </span>
              {loadingAcademics ? (
                <Skeleton className="h-20 w-full" />
              ) : inspectAcademics.length === 0 ? (
                <p className="text-slate-400 text-xs italic py-2">No academic records entered.</p>
              ) : (
                <div className="border border-slate-200 rounded max-h-36 overflow-y-auto divide-y divide-slate-100">
                  {inspectAcademics.map((r) => (
                    <div key={r.id} className="p-2 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{r.course_code}</span> — {r.course_name}
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {r.credits} Credits • Att: {r.attendance_percentage ?? '—'}%
                        </span>
                      </div>
                      <span className="font-bold text-slate-800">
                        {r.grade ? `Grade ${r.grade}` : `${r.marks_obtained}/${r.max_marks}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeItem.type === 'recommendation' && activeItem.details && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="font-semibold block mb-0.5 text-slate-700">Submitted Content:</span>
              <p className="text-slate-800">{activeItem.details}</p>
            </div>
          )}

          {/* Decision Selector */}
          <FormField label="Official Administrative Decision" htmlFor="revDecision" required>
            <Select
              id="revDecision"
              value={decision || 'approved'}
              onChange={(e: any) => setDecision(e.target.value as any)}
              options={
                activeItem.type === 'student'
                  ? [
                    { value: 'approved', label: 'Approve & Officially Endorse' },
                    { value: 'correction_requested', label: 'Request Changes / Send Back' },
                    { value: 'rejected', label: 'Reject Verification' },
                  ]
                  : [
                    { value: 'approved', label: 'Approve & Endorse Recommendation' },
                    { value: 'rejected', label: 'Reject Recommendation' },
                  ]
              }
            />
          </FormField>

          {/* Review Comment */}
          <FormField
            label="Official Review Comment / Endorsement Note"
            required={decision === 'rejected' || decision === 'correction_requested'}
            htmlFor="revComment"
            description={
              decision === 'approved'
                ? 'Official note attached to the permanent record.'
                : 'Specify exact feedback so the student or faculty mentor can take corrective action.'
            }
          >
            <Textarea
              id="revComment"
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={
                decision === 'approved'
                  ? 'e.g. Approved and verified with university examination roll...'
                  : 'e.g. Please update laboratory coursework marks before verification...'
              }
            />
          </FormField>
        </div>
      </Dialog>
    )}
  </div>
)
}