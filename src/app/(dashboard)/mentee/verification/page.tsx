'use client'

import React, { useState } from 'react'
import { CheckCircle2, Clock, Send, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import {
  PREVIEW_CURRENT_STUDENT,
  PREVIEW_VERIFICATION_REQUESTS,
} from '@/lib/preview-data'
import { formatDate } from '@/lib/utils'

export default function MenteeVerificationPage() {
  const { success } = useToast()
  const student = PREVIEW_CURRENT_STUDENT
  const requests = PREVIEW_VERIFICATION_REQUESTS

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitVerification = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsConfirmOpen(false)
      success('Verification request submitted to Faculty Mentor & HOD.')
    }, 500)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Information Verification Status"
        description="Official approval status of your student record and semester submission."
        breadcrumbs={[
          { label: 'Student Portal', href: '/mentee' },
          { label: 'Verification Status' },
        ]}
        badge={<StatusBadge status={student.verification_status} />}
        actions={
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Send size={14} />}
            onClick={() => setIsConfirmOpen(true)}
          >
            Submit for Verification
          </Button>
        }
      />

      {/* Status Summary Banner */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current Status
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <StatusBadge status={student.verification_status} />
              <span className="text-xs text-slate-500">
                Submitted on {formatDate('2024-10-18T10:30:00Z')}
              </span>
            </div>
            <p className="text-xs text-slate-600 pt-1">
              Your profile and latest semester academic record are being reviewed by
              the Head of Department (HOD) for semester exam clearance.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 min-w-[220px]">
            <p className="font-semibold text-slate-800">Verification Steps:</p>
            <ol className="list-decimal list-inside space-y-1 mt-1 text-[11px] text-slate-600">
              <li className="text-emerald-700 font-medium">Student Submission ✓</li>
              <li className="text-blue-700 font-medium">Mentor Endorsement (Current)</li>
              <li className="text-slate-400">HOD Final Approval</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Historical Submission Timeline */}
      <Card
        title="Verification History & Review Decisions"
        description="Audit log of previous verification cycles and department remarks."
      >
        <div className="space-y-4">
          {requests.map((req, idx) => (
            <div
              key={req.id}
              className="p-4 border border-slate-200 rounded-md bg-white flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">
                    Cycle #{requests.length - idx}
                  </span>
                  <StatusBadge status={req.status} />
                  <span className="text-slate-400 font-mono text-[11px]">
                    {formatDate(req.submitted_at)}
                  </span>
                </div>
                {req.review_comment ? (
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-slate-700 text-xs">
                    <span className="font-semibold text-slate-900 block text-[11px] mb-0.5">
                      Reviewer Feedback:
                    </span>
                    &ldquo;{req.review_comment}&rdquo;
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px]">
                    Pending department committee decision.
                  </p>
                )}
              </div>

              {req.reviewed_at && (
                <div className="text-right shrink-0 text-slate-400 text-[11px]">
                  Decided: {formatDate(req.reviewed_at)}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSubmitVerification}
        title="Submit Profile for HOD Verification"
        message="Are you sure you want to lock your details and submit your record for faculty endorsement and HOD verification?"
        confirmText="Confirm Submission"
        isLoading={isSubmitting}
      />
    </div>
  )
}

