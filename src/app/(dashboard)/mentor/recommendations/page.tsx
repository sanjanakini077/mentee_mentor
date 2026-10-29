'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ThumbsUp,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Lock,
  ExternalLink,
  MessageSquare,
  FileCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  getMentorDashboardData,
  createMentorRecommendation,
  updateMentorRecommendation,
  deleteMentorRecommendation,
  type MentorStudentSummary,
} from '@/lib/services/mentorService'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { MentorRecommendation, RecommendationCategory } from '@/types'

export default function MentorRecommendationsPage() {
  const { success, error: toastError } = useToast()

  const [recommendations, setRecommendations] = useState<MentorRecommendation[]>([])
  const [assignedStudents, setAssignedStudents] = useState<MentorStudentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRec, setEditingRec] = useState<MentorRecommendation | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [category, setCategory] = useState<RecommendationCategory>('internship')
  const [details, setDetails] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Delete State
  const [recToDelete, setRecToDelete] = useState<MentorRecommendation | null>(null)

  const loadData = async () => {
    try {
      const dashboard = await getMentorDashboardData()
      setAssignedStudents(dashboard.assignedStudents)

      const supabase = createClient()
      const { data: recs, error: recErr } = await supabase
        .from('mentor_recommendations')
        .select(`
          *,
          student:student_profiles (
            id,
            usn,
            semester,
            profiles (
              full_name,
              email
            )
          )
        `)
        .eq('mentor_profile_id', dashboard.mentorProfile.id)
        .order('created_at', { ascending: false })

      if (recErr) throw new Error(recErr.message)
      setRecommendations((recs as any) || [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load recommendations.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openNewModal = () => {
    setEditingRec(null)
    setSelectedStudentId(assignedStudents[0]?.id || '')
    setCategory('internship')
    setDetails('')
    setIsModalOpen(true)
  }

  const openEditModal = (rec: MentorRecommendation) => {
    setEditingRec(rec)
    setSelectedStudentId(rec.student_profile_id || rec.student_id || '')
    setCategory(rec.category || 'internship')
    setDetails(rec.details || rec.content || '')
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!details.trim()) {
      toastError('Please enter recommendation details and justification.')
      return
    }

    if (!editingRec && !selectedStudentId) {
      toastError('Please select a student.')
      return
    }

    setIsSaving(true)
    try {
      if (editingRec) {
        await updateMentorRecommendation({
          recommendationId: editingRec.id,
          category,
          details,
        })
        success('Recommendation updated.')
      } else {
        await createMentorRecommendation({
          studentProfileId: selectedStudentId,
          category,
          details,
        })
        success('Recommendation submitted to Department Head for review.')
      }
      setIsModalOpen(false)
      await loadData()
    } catch (err: any) {
      toastError(err?.message || 'Failed to save recommendation.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirmed = async () => {
    if (!recToDelete) return
    try {
      await deleteMentorRecommendation(recToDelete.id)
      success('Recommendation deleted.')
      setRecToDelete(null)
      await loadData()
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete recommendation.')
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
        title="Mentor Recommendations for HOD Review"
        description="Formal faculty recommendations for research internships, remedial tutorials, merit certificates, and institutional scholarships."
        breadcrumbs={[
          { label: 'Faculty Portal', href: '/mentor/dashboard' },
          { label: 'Recommendations' },
        ]}
        actions={
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={14} />}
            onClick={openNewModal}
            disabled={assignedStudents.length === 0}
          >
            New Recommendation
          </Button>
        }
      />

      {recommendations.length === 0 ? (
        <div className="p-12 bg-white border border-slate-200 rounded-md text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ThumbsUp size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              No Faculty Recommendations on Record
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Submit formal recommendations to the Head of Department for deserving mentees.
              Endorsements are permanently tracked in the departmental review register.
            </p>
          </div>
          <div className="pt-2">
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus size={14} />}
              onClick={openNewModal}
              disabled={assignedStudents.length === 0}
            >
              Submit First Recommendation
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const student = rec.student
            const isPending = rec.status === 'pending'
            return (
              <Card key={rec.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/mentor/students/${rec.student_profile_id || rec.student_id}`}
                        className="text-sm font-bold text-slate-900 hover:text-accent flex items-center gap-1.5"
                      >
                        {student?.profiles?.full_name || 'Assigned Student'}
                        <ExternalLink size={12} className="text-slate-400" />
                      </Link>
                      <span className="text-xs text-slate-400 font-mono">
                        ({student?.usn || 'USN'} • Sem {student?.semester || '—'})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Category:{' '}
                      <strong className="text-slate-700 capitalize">
                        {rec.category ? rec.category.replace('_', ' ') : 'General'} Endorsement
                      </strong>{' '}
                      • Submitted on {formatDate(rec.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={rec.status} />
                    {isPending && (
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(rec)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-accent"
                          title="Edit pending recommendation"
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRecToDelete(rec)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                          title="Delete recommendation"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="py-3 text-xs text-slate-700 leading-relaxed">
                  <span className="font-semibold text-slate-900 block mb-1">
                    Faculty Justification:
                  </span>
                  {rec.details || rec.content}
                </div>

                {rec.review_comment ? (
                  <div className="p-3 bg-blue-50/70 rounded border border-blue-100 text-xs text-blue-900 mt-2">
                    <span className="font-bold block text-[11px] mb-0.5">
                      HOD Official Decision & Comments:
                    </span>
                    &ldquo;{rec.review_comment}&rdquo;
                    {rec.reviewed_at && (
                      <span className="block text-[10px] text-blue-600 mt-1 font-mono">
                        Decided: {formatDate(rec.reviewed_at)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 pt-2 flex items-center gap-1 font-mono">
                    <Clock size={12} /> Awaiting HOD review and department endorsement
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Recommendation Form Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRec ? 'Edit Recommendation' : 'Submit Recommendation to HOD'}
        description="Formal faculty endorsement for student academic opportunities, research internships, or scholarship awards."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
            >
              {editingRec ? 'Update Recommendation' : 'Submit to HOD'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {!editingRec && (
            <FormField label="Select Assigned Student" htmlFor="recStudent" required>
              <Select
                id="recStudent"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                options={assignedStudents.map((st) => ({
                  value: st.id,
                  label: `${st.fullName} (${st.usn} • Sem ${st.semester})`,
                }))}
              />
            </FormField>
          )}

          <FormField label="Recommendation Category" htmlFor="recCategory" required>
            <Select
              id="recCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value as RecommendationCategory)}
              options={[
                { value: 'internship', label: 'Industry Internship / Research Assistantship' },
                { value: 'scholarship', label: 'Institutional / Merit Scholarship' },
                { value: 'merit_award', label: 'Department Academic Excellence Award' },
                { value: 'remedial', label: 'Remedial Tutorial / Learning Support' },
                { value: 'general', label: 'General Administrative Recommendation' },
              ]}
            />
          </FormField>

          <FormField
            label="Faculty Recommendation Justification"
            htmlFor="recDetails"
            required
            description="Detail academic merits, specific opportunity details, and why this student should be endorsed."
          >
            <Textarea
              id="recDetails"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Student has maintained excellent performance in Laboratory assignments and demonstrates high proficiency in Embedded Systems..."
            />
          </FormField>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(recToDelete)}
        title="Delete Recommendation"
        message="Are you sure you want to delete this pending recommendation? Once removed, it will no longer be visible on the HOD review desk."
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onClose={() => setRecToDelete(null)}
      />
    </div>
  )
}
