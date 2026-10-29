'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  User,
  BookOpen,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  getMenteeFullData,
  submitVerificationForReview,
  type MenteeFullData,
} from '@/lib/services/menteeService'
import { formatDate } from '@/lib/utils'

export default function MenteeVerificationPage() {
  const { success, error: toastError, warning } = useToast()

  const [data, setData] = useState<MenteeFullData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const full = await getMenteeFullData()
      setData(full)
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load verification status.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async () => {
    if (!data) return

    // Pre-flight validation
    if (data.missingFields.length > 0) {
      warning(`Please complete your profile before submitting. Missing: ${data.missingFields.join(', ')}`)
      return
    }

    if (data.academicRecords.length === 0) {
      warning('Please enter at least one academic course record before submitting for review.')
      return
    }

    setIsConfirmOpen(true)
  }

  const handleConfirmSubmit = async () => {
    if (!data) return
    setIsSubmitting(true)

    try {
      await submitVerificationForReview(data.studentProfile.id)
      success('Verification request submitted successfully to your faculty mentor and HOD.')
      setIsConfirmOpen(false)
      await loadData()
    } catch (err: any) {
      toastError(err?.message || 'Failed to submit verification request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (loadError || !data) {
    return (
      <div className="p-6 bg-white border border-rose-200 rounded-md space-y-3">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
          <ShieldAlert size={18} />
          <span>Error Loading Verification Status</span>
        </div>
        <p className="text-xs text-slate-600">{loadError || 'Unable to retrieve status.'}</p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  const { studentProfile, academicRecords, missingFields, completionRate } = data
  const status = studentProfile.verification_status

  const isSubmittable =
    (status === 'draft' || status === 'correction_requested' || status === 'rejected') &&
    missingFields.length === 0 &&
    academicRecords.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Information Verification Desk"
        description="Official review and institutional endorsement workflow for student records."
        breadcrumbs={[
          { label: 'Student Portal', href: '/mentee/dashboard' },
          { label: 'Verification Status' },
        ]}
        badge={<StatusBadge status={status} />}
        actions={
          status === 'draft' || status === 'correction_requested' || status === 'rejected' ? (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Send size={14} />}
              onClick={handleSubmit}
              disabled={missingFields.length > 0 || academicRecords.length === 0}
            >
              {status === 'correction_requested' || status === 'rejected'
                ? 'Resubmit for Review'
                : 'Submit for Review'}
            </Button>
          ) : undefined
        }
      />

      {/* Main Status Callout Banner */}
      <div className="bg-white border border-slate-200 rounded-md p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Department Verification Status
            </span>
            <div className="flex items-center gap-3 mt-1.5">
              <StatusBadge status={status} />
              <span className="text-xs text-slate-500 font-mono">
                USN: {studentProfile.usn} • Semester {studentProfile.semester}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs">
            <span className="text-slate-400 block text-[11px]">Last Updated</span>
            <span className="font-mono text-slate-700">
              {studentProfile.reviewed_at
                ? formatDate(studentProfile.reviewed_at)
                : studentProfile.updated_at
                ? formatDate(studentProfile.updated_at)
                : 'Initial Registration'}
            </span>
          </div>
        </div>

        {/* Dynamic Status Explanation Message */}
        {status === 'draft' && (
          <div className="flex items-start gap-3 text-xs text-slate-700">
            <Clock size={18} className="text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">
                Draft Record — Pending Student Submission
              </p>
              <p className="text-slate-500 leading-relaxed">
                Your profile information and academic records are currently in draft state.
                Please ensure all contact details and enrolled courses are accurately entered,
                then click <strong>&ldquo;Submit for Review&rdquo;</strong> to initiate official department review.
              </p>
            </div>
          </div>
        )}

        {status === 'submitted' && (
          <div className="flex items-start gap-3 text-xs text-blue-900 bg-blue-50/70 p-4 rounded border border-blue-100">
            <Clock size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-900">
                Under Official Department Review
              </p>
              <p className="text-blue-800 leading-relaxed">
                Your information has been formally submitted. It is now queued for evaluation by
                your assigned faculty mentor and final endorsement by the Head of Department.
                During this period, your profile and academic entries are locked.
              </p>
            </div>
          </div>
        )}

        {status === 'approved' && (
          <div className="flex items-start gap-3 text-xs text-emerald-900 bg-emerald-50/70 p-4 rounded border border-emerald-100">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-900">
                Official Verification Approved & Endorsed
              </p>
              <p className="text-emerald-800 leading-relaxed">
                Congratulations! Your student record and semester academic standing have been officially
                verified and endorsed for Academic Session 2024–2025.
              </p>
              {studentProfile.review_comment && (
                <div className="mt-2 pt-2 border-t border-emerald-200">
                  <span className="font-semibold text-[11px] block">Reviewer Endorsement Note:</span>
                  <p className="italic mt-0.5">&ldquo;{studentProfile.review_comment}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        )}

        {status === 'correction_requested' && (
          <div className="flex items-start gap-3 text-xs text-amber-900 bg-amber-50 p-4 rounded border border-amber-200">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-900">
                Changes Requested by Department Reviewer
              </p>
              <p className="text-amber-800 leading-relaxed">
                The reviewer has requested revisions before your record can be verified.
              </p>
              {studentProfile.review_comment && (
                <div className="p-3 bg-white/70 rounded border border-amber-200 mt-2">
                  <span className="font-semibold text-[11px] text-amber-900 block">
                    Reviewer Feedback:
                  </span>
                  <p className="italic text-amber-900 mt-0.5">&ldquo;{studentProfile.review_comment}&rdquo;</p>
                </div>
              )}
              <p className="text-[11px] text-amber-700 pt-1">
                Update the required items under &ldquo;My Profile&rdquo; or &ldquo;Academic Records&rdquo;, then click &ldquo;Resubmit for Review&rdquo;.
              </p>
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="flex items-start gap-3 text-xs text-rose-900 bg-rose-50 p-4 rounded border border-rose-200">
            <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-900">
                Verification Rejected
              </p>
              <p className="text-rose-800 leading-relaxed">
                Your submitted details were not approved by the departmental review committee.
              </p>
              {studentProfile.review_comment && (
                <div className="p-3 bg-white/70 rounded border border-rose-200 mt-2">
                  <span className="font-semibold text-[11px] text-rose-900 block">
                    Reason for Rejection:
                  </span>
                  <p className="italic text-rose-900 mt-0.5">&ldquo;{studentProfile.review_comment}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pre-submission Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Checklist 1: Demographic & Personal Records */}
        <Card
          title="Demographic Information Checklist"
          description="Institutional enrollment details & contact parameters"
          headerAction={
            <Link href="/mentee/profile">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                Edit Profile
              </Button>
            </Link>
          }
        >
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Full Legal Name</span>
              <span className="font-semibold text-slate-800">
                {data.profile.full_name ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertTriangle size={14} className="text-amber-500" />}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">University Seat Number (USN)</span>
              <span className="font-semibold text-slate-800 font-mono">
                {studentProfile.usn && studentProfile.usn !== 'UNASSIGNED' ? (
                  <CheckCircle2 size={14} className="text-emerald-600" />
                ) : (
                  <AlertTriangle size={14} className="text-amber-500" />
                )}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Student Mobile / Phone</span>
              <span>
                {data.profile.phone_number ? (
                  <CheckCircle2 size={14} className="text-emerald-600" />
                ) : (
                  <span className="text-amber-600 text-[11px]">Missing</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Emergency Parent / Guardian Contact</span>
              <span>
                {studentProfile.parent_phone ? (
                  <CheckCircle2 size={14} className="text-emerald-600" />
                ) : (
                  <span className="text-amber-600 text-[11px]">Missing</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-600">Permanent Residential Address</span>
              <span>
                {studentProfile.address ? (
                  <CheckCircle2 size={14} className="text-emerald-600" />
                ) : (
                  <span className="text-amber-600 text-[11px]">Missing</span>
                )}
              </span>
            </div>
          </div>
        </Card>

        {/* Checklist 2: Academic Coursework Records */}
        <Card
          title="Academic Records Checklist"
          description="Semester examination subjects and performance"
          headerAction={
            <Link href="/mentee/academics">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                Manage Records
              </Button>
            </Link>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Courses Entered for Verification</span>
              <span className="font-bold text-slate-900 font-mono">
                {academicRecords.length} Course{academicRecords.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Total Credits Claimed</span>
              <span className="font-bold text-slate-900 font-mono">
                {academicRecords.reduce((acc, r) => acc + (r.credits || 0), 0)} Credits
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-600">Attendance Register Status</span>
              <span className="text-emerald-700 font-medium">
                {academicRecords.length > 0 ? 'Recorded' : 'Incomplete'}
              </span>
            </div>

            {academicRecords.length === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px]">
                You must enter your course examination details before submitting for official verification.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Submit Record for Institutional Verification"
        message="Are you sure you want to submit your profile and academic records for verification? Once submitted, your profile will be locked for editing while your faculty mentor and HOD review the information."
        confirmText="Yes, Submit for Review"
        cancelText="Review Information Again"
        isLoading={isSubmitting}
        onConfirm={handleConfirmSubmit}
        onClose={() => setIsConfirmOpen(false)}
      />
    </div>
  )
}
