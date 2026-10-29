'use client'

import React, { useState } from 'react'
import { ThumbsUp, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import {
  PREVIEW_RECOMMENDATIONS,
  PREVIEW_ASSIGNED_STUDENTS,
} from '@/lib/preview-data'
import { formatDate } from '@/lib/utils'
import type { Recommendation } from '@/types'

export default function MentorRecommendationsPage() {
  const { success } = useToast()
  const [recommendations, setRecommendations] = useState<Recommendation[]>(
    PREVIEW_RECOMMENDATIONS
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [studentId, setStudentId] = useState(PREVIEW_ASSIGNED_STUDENTS[0].id)
  const [content, setContent] = useState('')

  const handleCreateRecommendation = () => {
    if (!content.trim()) return

    const student = PREVIEW_ASSIGNED_STUDENTS.find((s) => s.id === studentId)

    const newRec: Recommendation = {
      id: `rec-${Date.now()}`,
      mentor_id: 'p-mentor-1',
      student_id: studentId,
      content,
      status: 'pending',
      created_at: new Date().toISOString(),
      student: student as any,
    }

    setRecommendations([newRec, ...recommendations])
    setIsModalOpen(false)
    setContent('')
    success('Recommendation submitted for HOD review & endorsement.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mentor Recommendations for HOD Review"
        description="Formal faculty recommendations for research internships, remedial tutorials, merit certificates, and institutional scholarships."
        breadcrumbs={[
          { label: 'Faculty Portal', href: '/mentor' },
          { label: 'Recommendations' },
        ]}
        actions={
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={14} />}
            onClick={() => setIsModalOpen(true)}
          >
            Submit Recommendation
          </Button>
        }
      />

      {/* Recommendations Cards */}
      <Card
        title="Submitted Recommendations Register"
        description="Track HOD approval decisions, remarks, and endorsements."
      >
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 border border-slate-200 rounded-md bg-white space-y-2 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm">
                    {rec.student?.profiles?.full_name || 'Rohan Sharma'}
                  </span>
                  <span className="text-slate-400 font-mono text-xs">
                    ({rec.student?.usn || '1MS21CS084'} • Sem{' '}
                    {rec.student?.semester || 5})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={rec.status} />
                  <span className="text-slate-400 text-[11px]">
                    {formatDate(rec.created_at)}
                  </span>
                </div>
              </div>

              <div className="text-slate-700 leading-relaxed text-xs">
                {rec.content}
              </div>

              {rec.hod_comment && (
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded text-xs text-blue-900 mt-2">
                  <span className="font-bold text-[11px] block text-blue-950 mb-0.5">
                    HOD Review Decision & Endorsement:
                  </span>
                  &ldquo;{rec.hod_comment}&rdquo;
                  {rec.reviewed_at && (
                    <span className="block text-[10px] text-blue-600 mt-1 font-mono">
                      Decided on {formatDate(rec.reviewed_at)}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Create Recommendation Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Faculty Recommendation to HOD"
        description="Recommend an assigned mentee for department honors, special remedial attention, or scholarships."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateRecommendation}>
              Submit to HOD
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Select Student" required htmlFor="recStudentSelect">
            <Select
              id="recStudentSelect"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              options={PREVIEW_ASSIGNED_STUDENTS.map((s) => ({
                value: s.id,
                label: `${s.profiles?.full_name} (${s.usn} - Sem ${s.semester})`,
              }))}
            />
          </FormField>

          <FormField
            label="Recommendation Details & Justification"
            required
            htmlFor="recContent"
            description="Clearly outline the reason for recommendation, relevant academic or project achievements, and requested action."
          >
            <Textarea
              id="recContent"
              rows={4}
              placeholder="e.g. Recommended for Department Research Internship on distributed systems based on 8.5+ CGPA and top ranking in Algorithms..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </FormField>
        </div>
      </Dialog>
    </div>
  )
}

