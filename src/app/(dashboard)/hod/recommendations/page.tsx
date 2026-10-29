'use client'

import React, { useState } from 'react'
import { ThumbsUp, Check, X, MessageSquare, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { PREVIEW_RECOMMENDATIONS } from '@/lib/preview-data'
import { formatDate } from '@/lib/utils'
import type { Recommendation } from '@/types'

export default function HodRecommendationsPage() {
  const { success, warning } = useToast()
  const [recommendations, setRecommendations] = useState<Recommendation[]>(
    PREVIEW_RECOMMENDATIONS
  )
  const [activeRec, setActiveRec] = useState<Recommendation | null>(null)
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
  const [comment, setComment] = useState('')

  const handleDecisionSubmit = () => {
    if (!activeRec || !decision) return

    setRecommendations((prev) =>
      prev.map((r) =>
        r.id === activeRec.id
          ? {
              ...r,
              status: decision,
              hod_comment: comment,
              reviewed_at: new Date().toISOString(),
            }
          : r
      )
    )

    if (decision === 'approved') {
      success('Faculty recommendation approved and endorsed.')
    } else {
      warning('Recommendation rejected.')
    }

    setActiveRec(null)
    setDecision(null)
    setComment('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Recommendations Review Desk"
        description="Review, endorse, or reject student recommendations submitted by departmental faculty mentors."
        breadcrumbs={[
          { label: 'Administration', href: '/hod' },
          { label: 'Recommendations' },
        ]}
      />

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <Card key={rec.id} className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">
                    {rec.student?.profiles?.full_name}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    ({rec.student?.usn} • Sem {rec.student?.semester})
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitted by Mentor:{' '}
                  <strong className="text-slate-700">Dr. K. S. Venkatesh</strong>{' '}
                  • {formatDate(rec.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={rec.status} />
              </div>
            </div>

            <div className="py-3 text-xs text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900 block mb-1">
                Faculty Justification:
              </span>
              {rec.content}
            </div>

            {rec.hod_comment ? (
              <div className="p-3 bg-blue-50/70 rounded border border-blue-100 text-xs text-blue-900">
                <span className="font-bold block text-[11px] mb-0.5">
                  Department Decision:
                </span>
                &ldquo;{rec.hod_comment}&rdquo;
                {rec.reviewed_at && (
                  <span className="block text-[10px] text-blue-600 mt-1 font-mono">
                    Endorsed: {formatDate(rec.reviewed_at)}
                  </span>
                )}
              </div>
            ) : (
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveRec(rec)
                    setDecision('rejected')
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
                  }}
                  className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                >
                  Approve Recommendation
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

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
          description={`Submitted by mentor Dr. K. S. Venkatesh on ${formatDate(activeRec.created_at)}`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveRec(null)
                  setDecision(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant={decision === 'approved' ? 'primary' : 'danger'}
                size="sm"
                onClick={handleDecisionSubmit}
              >
                {decision === 'approved'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded text-xs text-slate-700">
              <span className="font-semibold block mb-1">Recommendation:</span>
              {activeRec.content}
            </div>

            <FormField
              label="HOD Official Endorsement / Review Comment"
              required
              htmlFor="hodRecComment"
              description="This endorsement will be attached to the student's official departmental record."
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

