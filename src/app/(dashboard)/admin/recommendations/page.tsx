'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ThumbsUp,
  Check,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { reviewMentorRecommendation } from '@/lib/services/adminService'
import { getStore } from '@/lib/storage/demoStore'
import { formatDate } from '@/lib/utils'

export default function AdminRecommendationsPage() {
  const { success, error: toastError, warning } = useToast()

  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Decision Modal State
  const [activeRec, setActiveRec] = useState<any | null>(null)
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
  const [comment, setComment] = useState('')
  const [isCommitting, setIsCommitting] = useState(false)

    const loadData = () => {
      try {
        const store = getStore()
        const deptRecs = store.recommendations.map((r) => {
          const sp = store.studentProfiles.find((s) => s.id === r.student_profile_id)
          const stProf = sp ? store.profiles.find((p) => p.id === sp.profile_id) : null
          const mentor = store.profiles.find((p) => p.id === r.mentor_profile_id)
          return {
            ...r,
            student: sp ? { ...sp, profiles: stProf } : null,
            mentor: mentor || null,
          }
        })
        setRecommendations(deptRecs)
      } catch (err: any) {
        setError(err?.message || 'Failed to load recommendations.')
      } finally {
        setIsLoading(false)
      }
    }

    useEffect(() => {
      loadData()
      window.addEventListener('mms-store-changed', loadData)
      return () => window.removeEventListener('mms-store-changed', loadData)
    }, [])

  const handleDecisionSubmit = async () => {
    if (!activeRec || !decision) return

    if (decision === 'rejected' && !comment.trim()) {
      warning('Please provide an explanatory reason for rejection.')
      return
    }

    setIsCommitting(true)
    try {
      await reviewMentorRecommendation({
        recommendationId: activeRec.id,
        decision,
        reviewComment: comment,
      })

      if (decision === 'approved') {
        success('Faculty recommendation approved and officially endorsed.')
      } else {
        warning('Faculty recommendation rejected.')
      }

      setActiveRec(null)
      setDecision(null)
      setComment('')
      await loadData()
    } catch (err: any) {
      toastError(err?.message || 'Failed to submit decision.')
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Recommendations Review Desk"
        description="Review, endorse, or reject student recommendations submitted by departmental faculty mentors."
        breadcrumbs={[
          { label: 'Administration', href: '/admin/dashboard' },
          { label: 'Recommendations' },
        ]}
      />

                    {recommendations.length === 0 ? (
                      <div className="p-12 bg-white border border-slate-200 rounded-md text-center space-y-2 shadow-xs">
                        <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
                        <p className="text-xs font-bold text-slate-800">
                          No Faculty Recommendations on Record
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Recommendations submitted by faculty mentors will appear here for HOD decision.
                        </p>
                      </div>
                    ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const isPending = rec.status === 'pending'
            return (
              <Card key={rec.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {rec.student?.profiles?.full_name}
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">
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

                  {isPending ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveRec(rec)
                          setDecision('rejected')
                          setComment('')
                        }}
                        className="text-xs h-7 text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setActiveRec(rec)
                          setDecision('approved')
                          setComment('Approved and endorsed for institutional sanction.')
                        }}
                        className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                      >
                        Approve Recommendation
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="py-3 text-xs text-slate-700 leading-relaxed">
                  <span className="font-semibold text-slate-900 block mb-1">
                    Faculty Justification:
                  </span>
                  {rec.details}
                </div>

                {rec.review_comment ? (
                          <div className="p-3 bg-blue-50/70 rounded border border-blue-100 text-xs text-blue-900 mt-2">
                            <span className="font-bold block text-[11px] mb-0.5">
                              HOD Official Decision & Endorsement:
                            </span>
                            &ldquo;{rec.review_comment}&rdquo;
                            {rec.reviewed_at && (
                              <span className="block text-[10px] text-blue-600 mt-1 font-mono">
                                Decided on {formatDate(rec.reviewed_at)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 font-mono pt-1">
                            Pending review
                          </div>
                        )}
              </Card>
              )
          })}
            </div>
      )}

            {/* Decision Dialog */}
            {activeRec && decision && (
              <Dialog
                isOpen={Boolean(activeRec && decision)}
                onClose={() => {
                  setActiveRec(null)
                  setDecision(null)
                }}
                title={
                  decision === 'approved'
                    ? `Endorse Recommendation — ${activeRec.student?.profiles?.full_name}`
                    : `Reject Recommendation — ${activeRec.student?.profiles?.full_name}`
                }
                description={`Submitted by mentor ${activeRec.mentor?.full_name} on ${formatDate(activeRec.created_at)}`}
                footer={
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveRec(null)
                          setDecision(null)
                        }}
                        disabled={isCommitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant={decision === 'approved' ? 'primary' : 'danger'}
                        size="sm"
                        onClick={handleDecisionSubmit}
                        isLoading={isCommitting}
                      >
                        {decision === 'approved'
                          ? 'Confirm Approval'
                          : 'Confirm Rejection'}
                      </Button>
                  </div>
          }
        >
                  <div className="space-y-4 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded text-xs text-slate-700">
                      <span className="font-semibold block mb-1">Recommendation Content:</span>
                      {activeRec.details}
                    </div>

                    <FormField
                      label="HOD Official Endorsement / Review Comment"
                      required={decision === 'rejected'}
                      htmlFor="hodRecComment"
                      description="This endorsement will be permanently attached to the student's departmental record."
                    >
                      <Textarea
                        id="hodRecComment"
                        rows={3}
                        placeholder={
                          decision === 'approved'
                            ? 'e.g. Approved. Forwarded to Dean of Academics for sanction...'
                            : 'Reason for rejection...'
                        }
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </FormField>
                  </div>
              </Dialog>
            )}
          </div>
        )
}
