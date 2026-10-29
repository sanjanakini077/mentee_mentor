'use client'

import React, { useState } from 'react'
import { Plus, Calendar, User, FileText } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import {
  PREVIEW_MENTORING_NOTES,
  PREVIEW_ASSIGNED_STUDENTS,
} from '@/lib/preview-data'
import { formatDate } from '@/lib/utils'
import type { MentoringNote } from '@/types'

export default function MentorNotesPage() {
  const { success } = useToast()
  const [notes, setNotes] = useState<MentoringNote[]>(PREVIEW_MENTORING_NOTES)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [studentId, setStudentId] = useState(PREVIEW_ASSIGNED_STUDENTS[0].id)
  const [noteDate, setNoteDate] = useState('2024-10-29')
  const [content, setContent] = useState('')

  const handleCreateNote = () => {
    if (!content.trim()) return

    const selectedStudent = PREVIEW_ASSIGNED_STUDENTS.find(
      (s) => s.id === studentId
    )

    const newNote: MentoringNote = {
      id: `mn-${Date.now()}`,
      mentor_id: 'p-mentor-1',
      student_id: studentId,
      note_date: noteDate,
      content,
      created_at: new Date().toISOString(),
      student: selectedStudent as any,
    }

    setNotes([newNote, ...notes])
    setIsModalOpen(false)
    setContent('')
    success('Mentoring note recorded in official institutional register.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mentoring Session Logs"
        description="Official record of student counseling, academic guidance, and periodic reviews."
        breadcrumbs={[
          { label: 'Faculty Portal', href: '/mentor' },
          { label: 'Mentoring Notes' },
        ]}
        actions={
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={14} />}
            onClick={() => setIsModalOpen(true)}
          >
            Record New Session Note
          </Button>
        }
      />

      {/* Notes List */}
      <Card
        title="Session Notes History"
        description="Dated and authenticated mentoring notes for assigned students."
      >
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 border border-slate-200 rounded-md bg-white hover:border-slate-300 transition-colors space-y-2 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm">
                    {note.student?.profiles?.full_name || 'Rohan Sharma'}
                  </span>
                  <span className="text-slate-400 font-mono text-xs">
                    ({note.student?.usn || '1MS21CS084'} • Sem{' '}
                    {note.student?.semester || 5})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Calendar size={13} className="text-slate-400" />
                  <span>Session Date: {formatDate(note.note_date)}</span>
                </div>
              </div>

              <p className="text-slate-700 leading-relaxed text-xs">
                {note.content}
              </p>

              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Recorded by Dr. K. S. Venkatesh (Associate Professor)</span>
                <span className="font-mono">Logged: {formatDate(note.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Record Note Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Mentoring Session Note"
        description="Document academic advisory or attendance counseling for an assigned mentee."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateNote}>
              Save Note
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Select Student" required htmlFor="studentSelect">
            <Select
              id="studentSelect"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              options={PREVIEW_ASSIGNED_STUDENTS.map((s) => ({
                value: s.id,
                label: `${s.profiles?.full_name} (${s.usn} - Sem ${s.semester})`,
              }))}
            />
          </FormField>

          <FormField label="Session Date" required htmlFor="sessionDate">
            <Input
              id="sessionDate"
              type="date"
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
            />
          </FormField>

          <FormField
            label="Mentoring Session Observations & Guidance"
            required
            htmlFor="noteContent"
            description="Detail academic progress, attendance concerns, project advisory, or remedial steps."
          >
            <Textarea
              id="noteContent"
              rows={4}
              placeholder="e.g. Reviewed 2nd internal test scores. Advised extra practice on graph algorithms..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </FormField>
        </div>
      </Dialog>
    </div>
  )
}

