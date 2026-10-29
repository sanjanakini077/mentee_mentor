'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Calendar,
  Lock,
  Eye,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { SearchFilterBar } from '@/components/ui/SearchFilterBar'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  getMentorDashboardData,
  getMentorNotesData,
  createMentorNote,
  updateMentorNote,
  deleteMentorNote,
  type MentorStudentSummary,
} from '@/lib/services/mentorService'
import { formatDate } from '@/lib/utils'
import type { MentorNote, NoteVisibility } from '@/types'

export default function MentorNotesPage() {
  const { success, error: toastError } = useToast()

  const [notes, setNotes] = useState<MentorNote[]>([])
  const [assignedStudents, setAssignedStudents] = useState<MentorStudentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [studentFilter, setStudentFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState('all')

  // Note Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<MentorNote | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0])
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<NoteVisibility>('shared_with_mentee')
  const [isSaving, setIsSaving] = useState(false)

  // Delete State
  const [noteToDelete, setNoteToDelete] = useState<MentorNote | null>(null)

  const loadData = async () => {
    try {
      const dashboard = await getMentorDashboardData()
      setAssignedStudents(dashboard.assignedStudents)

      const notesData = await getMentorNotesData()
      setNotes(notesData.notes)
    } catch (err: any) {
      setError(err?.message || 'Failed to load mentoring session notes.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const studentName = n.student?.profiles?.full_name || ''
      const studentUsn = n.student?.usn || ''
      const matchesSearch =
        search === '' ||
        n.content.toLowerCase().includes(search.toLowerCase()) ||
        studentName.toLowerCase().includes(search.toLowerCase()) ||
        studentUsn.toLowerCase().includes(search.toLowerCase())

      const matchesStudent =
        studentFilter === 'all' || n.student_profile_id === studentFilter

      const matchesVisibility =
        visibilityFilter === 'all' || n.visibility === visibilityFilter

      return matchesSearch && matchesStudent && matchesVisibility
    })
  }, [notes, search, studentFilter, visibilityFilter])

  const openNewModal = () => {
    setEditingNote(null)
    setSelectedStudentId(assignedStudents[0]?.id || '')
    setNoteDate(new Date().toISOString().split('T')[0])
    setContent('')
    setVisibility('shared_with_mentee')
    setIsModalOpen(true)
  }

  const openEditModal = (note: MentorNote) => {
    setEditingNote(note)
    setSelectedStudentId(note.student_profile_id || note.student_id || '')
    setNoteDate(note.note_date)
    setContent(note.content)
    setVisibility(note.visibility || 'shared_with_mentee')
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!content.trim()) {
      toastError('Please enter note content.')
      return
    }

    if (!editingNote && !selectedStudentId) {
      toastError('Please select a student.')
      return
    }

    setIsSaving(true)
    try {
      if (editingNote) {
        await updateMentorNote({
          noteId: editingNote.id,
          content,
          noteDate,
          visibility,
        })
        success('Mentoring note updated.')
      } else {
        await createMentorNote({
          studentProfileId: selectedStudentId,
          content,
          noteDate,
          visibility,
        })
        success('Session advisory note logged in student dossier.')
      }
      setIsModalOpen(false)
      await loadData()
    } catch (err: any) {
      toastError(err?.message || 'Failed to save note.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirmed = async () => {
    if (!noteToDelete) return
    try {
      await deleteMentorNote(noteToDelete.id)
      success('Mentoring note deleted.')
      setNoteToDelete(null)
      await loadData()
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete note.')
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
        title="Mentoring Session Logs"
        description="Official record of student counseling, academic guidance, and periodic reviews."
        breadcrumbs={[
          { label: 'Faculty Portal', href: '/mentor/dashboard' },
          { label: 'Mentoring Notes' },
        ]}
        actions={
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={14} />}
            onClick={openNewModal}
            disabled={assignedStudents.length === 0}
          >
            Log Session Note
          </Button>
        }
      />

      {/* Filter Bar */}
      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search notes by keywords, student name, or USN..."
        resultsCount={filteredNotes.length}
        filters={[
          {
            key: 'student',
            label: 'Assigned Student',
            value: studentFilter,
            onChange: setStudentFilter,
            options: [
              { value: 'all', label: 'All Assigned Mentees' },
              ...assignedStudents.map((s) => ({
                value: s.id,
                label: `${s.fullName} (${s.usn})`,
              })),
            ],
          },
          {
            key: 'visibility',
            label: 'Visibility',
            value: visibilityFilter,
            onChange: setVisibilityFilter,
            options: [
              { value: 'all', label: 'All Visibilities' },
              { value: 'shared_with_mentee', label: 'Shared with Mentee' },
              { value: 'private_mentor_only', label: 'Private Faculty Note' },
            ],
          },
        ]}
        onResetFilters={() => {
          setSearch('')
          setStudentFilter('all')
          setVisibilityFilter('all')
        }}
      />

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="p-12 bg-white border border-slate-200 rounded-md text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              No Mentoring Notes Found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Document student interactions, periodic academic milestones, and remedial plans.
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
              Log First Session Note
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => {
            const student = note.student
            const isShared = note.visibility === 'shared_with_mentee'
            return (
              <div
                key={note.id}
                className="p-4 bg-white border border-slate-200 rounded-md shadow-xs space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/mentor/students/${note.student_profile_id || note.student_id}`}
                      className="font-bold text-slate-900 hover:text-accent flex items-center gap-1"
                    >
                      {student?.profiles?.full_name || 'Assigned Student'}
                      <ExternalLink size={11} className="text-slate-400" />
                    </Link>
                    <span className="text-slate-400 font-mono text-[11px]">
                      ({student?.usn || 'USN'})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-slate-600 font-mono">
                      <Calendar size={12} className="text-slate-400" />
                      {formatDate(note.note_date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isShared ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-medium">
                        <Eye size={10} /> Shared with Mentee
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
                        <Lock size={10} /> Private Faculty Note
                      </span>
                    )}

                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(note)}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-accent"
                        title="Edit note"
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setNoteToDelete(note)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                        title="Delete note"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Note Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNote ? 'Edit Mentoring Session Note' : 'Log Mentoring Session Note'}
        description="Official record of student counseling, continuous progress review, and suggested action items."
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
              {editingNote ? 'Update Note' : 'Save Session Note'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {!editingNote && (
            <FormField label="Assigned Student" htmlFor="nStudent" required>
              <Select
                id="nStudent"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                options={assignedStudents.map((st) => ({
                  value: st.id,
                  label: `${st.fullName} (${st.usn} • Sem ${st.semester})`,
                }))}
              />
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Session Date" htmlFor="nDate" required>
              <Input
                id="nDate"
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
              />
            </FormField>

            <FormField label="Visibility Rule" htmlFor="nVis" required>
              <Select
                id="nVis"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as NoteVisibility)}
                options={[
                  { value: 'shared_with_mentee', label: 'Shared with Mentee (Visible to Student)' },
                  { value: 'private_mentor_only', label: 'Private Faculty Note (Mentor Only)' },
                ]}
              />
            </FormField>
          </div>

          <FormField
            label="Guidance Observations & Discussion Points"
            htmlFor="nContent"
            required
            description="Record academic evaluation, semester coursework guidance, or behavioral counseling."
          >
            <Textarea
              id="nContent"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Discussed attendance shortage in Laboratory course. Advised student to submit pending assignments and schedule makeup lab sessions..."
            />
          </FormField>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(noteToDelete)}
        title="Delete Mentoring Note"
        message="Are you sure you want to delete this mentoring session note? This will remove the note from the student's official advisory history."
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onClose={() => setNoteToDelete(null)}
      />
    </div>
  )
}
