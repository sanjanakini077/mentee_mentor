import React from 'react'
import {
  UserCheck,
  Mail,
  Phone,
  Building,
  Calendar,
  FileText,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import {
  PREVIEW_PROFILES,
  PREVIEW_MENTORING_NOTES,
  PREVIEW_RECOMMENDATIONS,
} from '@/lib/preview-data'
import { formatDate } from '@/lib/utils'

export default function MenteeMentorPage() {
  const mentor = PREVIEW_PROFILES.mentor
  const notes = PREVIEW_MENTORING_NOTES.filter(
    (n) => n.student_id === 's-mentee-1'
  )
  const recommendations = PREVIEW_RECOMMENDATIONS.filter(
    (r) => r.student_id === 's-mentee-1'
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Faculty Mentor"
        description="Official mentor assignment, session interaction notes, and career recommendations."
        breadcrumbs={[
          { label: 'Student Portal', href: '/mentee' },
          { label: 'My Mentor' },
        ]}
      />

      {/* Mentor Profile Overview Card */}
      <Card title="Mentor Identification & Contact">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-accent-light border border-accent/20 flex items-center justify-center text-accent text-lg font-bold shrink-0">
              KV
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {mentor.full_name}
              </h2>
              <p className="text-xs font-semibold text-accent mt-0.5">
                Associate Professor
              </p>
              <p className="text-xs text-slate-500">
                Department of Computer Science & Engineering
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-600 mt-3">
                <span className="flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400" />
                  <span className="font-mono">{mentor.email}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Building size={13} className="text-slate-400" />
                  <span>Cabin CSB-304, Academic Block 2</span>
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs min-w-[200px] space-y-1">
            <p className="font-semibold text-slate-800">Mentorship Hours</p>
            <p className="text-slate-600">Tuesday: 3:00 PM – 5:00 PM</p>
            <p className="text-slate-600">Thursday: 3:00 PM – 5:00 PM</p>
          </div>
        </div>
      </Card>

      {/* Recommendations & Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mentor Recommendations */}
        <Card
          title="Mentor Recommendations & Endorsements"
          description="Official recommendations submitted to the Head of Department (HOD)."
        >
          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No recommendations recorded yet.
              </p>
            ) : (
              recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 border border-slate-200 rounded-md bg-white text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      Recommendation
                    </span>
                    <StatusBadge status={rec.status} />
                  </div>
                  <p className="text-slate-700 leading-relaxed">{rec.content}</p>
                  {rec.hod_comment && (
                    <div className="p-2 bg-blue-50/60 rounded border border-blue-100 text-[11px] text-blue-900">
                      <strong>HOD Remark:</strong> {rec.hod_comment}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Recorded on {formatDate(rec.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Mentoring Session Notes */}
        <Card
          title="Mentoring Session Logs"
          description="Dated counseling notes and guidance recorded by your mentor."
        >
          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No session notes logged yet.
              </p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3.5 border border-slate-200 rounded-md bg-white text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      Session Date: {formatDate(note.note_date)}
                    </span>
                    <span className="text-[10px] font-mono">
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed pt-1">
                    {note.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

