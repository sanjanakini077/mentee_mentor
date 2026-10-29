'use client'

import React, { useEffect, useState } from 'react'
import {
  UserCheck,
  Mail,
  Phone,
  Building,
  Calendar,
  FileText,
  ThumbsUp,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  Award,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import {
  getMenteeFullData,
  type MenteeFullData,
} from '@/lib/services/menteeService'
import { formatDate } from '@/lib/utils'

export default function MenteeMentorPage() {
  const [data, setData] = useState<MenteeFullData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        const full = await getMenteeFullData()
        if (isMounted) setData(full)
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Failed to load mentor information.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-white border border-rose-200 rounded-md space-y-3">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
          <AlertCircle size={18} />
          <span>Error Loading Mentorship Desk</span>
        </div>
        <p className="text-xs text-slate-600">{error || 'Unable to access mentor details.'}</p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  const { assignedMentor, mentorAssignmentDate, mentorNotes, recommendations } = data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Faculty Mentor"
        description="Official mentor assignment, session guidance notes, and career recommendations."
        breadcrumbs={[
          { label: 'Student Portal', href: '/mentee/dashboard' },
          { label: 'My Mentor' },
        ]}
      />

      {/* Mentor Profile Overview Card */}
      {assignedMentor ? (
        <Card title="Mentor Identification & Institutional Contact">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-accent-light border border-accent/20 flex items-center justify-center text-accent text-xl font-bold shrink-0 shadow-xs">
                {assignedMentor.full_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('') || 'FM'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {assignedMentor.full_name}
                  </h2>
                  <span className="text-[11px] bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded border border-blue-200">
                    Faculty Mentor
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {assignedMentor.department}
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-2">
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" />
                    <a
                      href={`mailto:${assignedMentor.email}`}
                      className="font-mono text-accent hover:underline text-[11px]"
                    >
                      {assignedMentor.email}
                    </a>
                  </span>
                  {assignedMentor.phone_number && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      <span>{assignedMentor.phone_number}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1.5 sm:text-right shrink-0">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                Mentorship Status
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Active Assignment
              </span>
              {mentorAssignmentDate && (
                <span className="block text-[10px] text-slate-400 font-mono mt-1">
                  Allocated: {formatDate(mentorAssignmentDate)}
                </span>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="p-8 bg-white border border-slate-200 rounded-md text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <UserCheck size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              No Faculty Mentor Currently Allocated
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              The Department Head will allocate your faculty mentor during the departmental
              allocation window. Once assigned, your mentor&rsquo;s details and session notes will appear here.
            </p>
          </div>
        </div>
      )}

      {/* Grid: Session Notes & Official Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Mentoring Session Guidance Notes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Session Notes & Advisory Log ({mentorNotes.length})
              </h3>
            </div>
          </div>

          {mentorNotes.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-md text-center text-xs text-slate-500">
              <p>No mentoring notes have been logged for your profile yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Notes created by your mentor during 1-on-1 reviews will be displayed here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mentorNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 bg-white border border-slate-200 rounded-md shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      Session Date: {formatDate(note.note_date)}
                    </span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono">
                      Shared Advisory
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Mentor Career & Academic Recommendations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Faculty Endorsements & Recommendations ({recommendations.length})
              </h3>
            </div>
          </div>

          {recommendations.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-md text-center text-xs text-slate-500">
              <p>No recommendations have been submitted for your profile yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Recommendations for internships, scholarships, and special academic tracks will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 bg-white border border-slate-200 rounded-md shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100">
                    <div>
                      <span className="font-semibold text-xs text-slate-900 capitalize">
                        {rec.category ? rec.category.replace('_', ' ') : 'General'} Endorsement
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Submitted: {formatDate(rec.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={rec.status} />
                  </div>

                  <div className="text-xs text-slate-700 leading-relaxed">
                    <span className="font-semibold block text-[11px] text-slate-500 mb-0.5">
                      Mentor Recommendation:
                    </span>
                    {rec.details || rec.content}
                  </div>

                  {rec.review_comment && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 space-y-1">
                      <span className="font-bold text-[11px] text-slate-700 block">
                        HOD Official Endorsement:
                      </span>
                      <p className="italic text-slate-700">&ldquo;{rec.review_comment}&rdquo;</p>
                      {rec.reviewed_at && (
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                          Decided on {formatDate(rec.reviewed_at)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
