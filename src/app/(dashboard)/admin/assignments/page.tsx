'use client'

import React, { useEffect, useState } from 'react'
import {
  Plus,
  Users,
  ClipboardList,
  UserCheck,
  History,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { assignMentorToStudent } from '@/lib/services/adminService'
import { getStore } from '@/lib/storage/demoStore'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types'

export default function AdminAssignmentsPage() {
  const { success, error: toastError } = useToast()

  const [mentors, setMentors] = useState<Profile[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Allocation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedMentorId, setSelectedMentorId] = useState('')
  const [allocationNotes, setAllocationNotes] = useState('Departmental faculty mentorship allocation')
  const [isSaving, setIsSaving] = useState(false)

  // Tab State: active vs history
  const [viewTab, setViewTab] = useState<'active' | 'history'>('active')

  const loadData = async () => {
      try {
        const store = getStore()

        // 1. Fetch department mentors
        const mentorList = store.profiles.filter((p) => p.role === 'mentor')
        setMentors(mentorList)

        // 2. Fetch department students
        const studentList = store.studentProfiles.map((sp) => ({
          ...sp,
          profiles: store.profiles.find((p) => p.id === sp.profile_id),
        }))
        setStudents(studentList)

        // 3. Fetch all mentor_assignments
        const assignList = store.mentorAssignments.map((a) => {
          const sp = store.studentProfiles.find((s) => s.id === a.student_profile_id)
          const stProf = sp ? store.profiles.find((p) => p.id === sp.profile_id) : null
          const mentor = store.profiles.find((p) => p.id === a.mentor_profile_id)
          return {
            ...a,
            student: sp ? { ...sp, profiles: stProf } : null,
            mentor: mentor || null,
          }
        })
        setAssignments(assignList)
      } catch (err: any) {
        setError(err?.message || 'Failed to load mentorship allocations.')
      } finally {
        setIsLoading(false)
      }
    }

    useEffect(() => {
      loadData()
      window.addEventListener('mms-store-changed', loadData)
      return () => window.removeEventListener('mms-store-changed', loadData)
    }, [])

    const openAllocateModal = (studentId?: string) => {
      setSelectedStudentId(studentId || students[0]?.id || '')
      setSelectedMentorId(mentors[0]?.id || '')
      setAllocationNotes('Departmental faculty mentorship allocation')
      setIsModalOpen(true)
    }

    const handleSaveAllocation = async () => {
      if (!selectedStudentId || !selectedMentorId) {
        toastError('Please select both a student and a faculty mentor.')
        return
      }

      setIsSaving(true)
      try {
        await assignMentorToStudent({
          studentProfileId: selectedStudentId,
          mentorProfileId: selectedMentorId,
          notes: allocationNotes,
        })

        const assignedMentor = mentors.find((m) => m.id === selectedMentorId)
        success(`Faculty mentor allocated successfully: ${assignedMentor?.full_name}.`)
        setIsModalOpen(false)
        await loadData()
      } catch (err: any) {
        toastError(err?.message || 'Failed to assign mentor.')
      } finally {
        setIsSaving(false)
      }
    }

    if (isLoading) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      )
    }

    const activeAssignments = assignments.filter((a) => a.is_active)
    const historyAssignments = assignments.filter((a) => !a.is_active)

    // Mentor Load calculation
    const mentorLoads = mentors.map((m) => {
      const count = activeAssignments.filter((a) => a.mentor?.id === m.id).length
      return {
        ...m,
        loadCount: count,
      }
    })

    // Columns for Active Allocation Table
    const activeColumns: ColumnDef<any>[] = [
      {
        key: 'usn',
        header: 'USN',
        sortable: true,
        cell: (row) => (
          <span className="font-mono font-bold text-slate-900 text-xs">
            {row.student?.usn}
          </span>
        ),
      },
      {
        key: 'student',
        header: 'Student Name',
        sortable: true,
        cell: (row) => (
          <div>
            <p className="font-semibold text-slate-900 text-xs">
              {row.student?.profiles?.full_name}
            </p>
            <span className="text-[11px] text-slate-400 font-mono">
              {row.student?.profiles?.email} • Sem {row.student?.semester}
            </span>
          </div>
        ),
      },
      {
        key: 'mentor',
        header: 'Assigned Faculty Mentor',
        sortable: true,
        cell: (row) => (
          <div>
            <p className="font-semibold text-slate-900 text-xs">
              {row.mentor?.full_name}
            </p>
            <span className="text-[11px] text-slate-500 font-mono">
              {row.mentor?.email}
            </span>
          </div>
        ),
      },
      {
        key: 'assigned_at',
        header: 'Assigned On',
        sortable: true,
        cell: (row) => (
          <span className="text-slate-600 font-mono text-xs">
            {formatDate(row.assigned_at)}
          </span>
        ),
      },
      {
        key: 'assigned_by',
        header: 'Allocated By',
        cell: (row) => (
          <span className="text-slate-500 text-xs">
            {row.assigned_by?.full_name || 'HOD Office'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        cell: (row) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openAllocateModal(row.student?.id)}
            className="h-7 text-xs"
          >
            Reassign Mentor
          </Button>
        ),
      },
    ]

    // Columns for Inactive / Previous Assignment History
    const historyColumns: ColumnDef<any>[] = [
      {
        key: 'usn',
        header: 'USN',
        sortable: true,
        cell: (row) => (
          <span className="font-mono font-bold text-slate-700 text-xs">
            {row.student?.usn}
          </span>
        ),
      },
      {
        key: 'student',
        header: 'Student Name',
        cell: (row) => (
          <span className="font-semibold text-slate-800 text-xs">
            {row.student?.profiles?.full_name}
          </span>
        ),
      },
      {
        key: 'mentor',
        header: 'Previous Faculty Mentor',
        cell: (row) => (
          <span className="text-slate-700 text-xs">
            {row.mentor?.full_name}
          </span>
        ),
      },
      {
        key: 'assigned_at',
        header: 'Assignment Date',
        sortable: true,
        cell: (row) => (
          <span className="text-slate-500 font-mono text-xs">
            {formatDate(row.assigned_at)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cell: () => (
          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Superseded / Inactive
          </span>
        ),
      },
    ]

    return (
      <div className="space-y-6">
        <PageHeader
          title="Faculty–Student Mentorship Allocation"
          description="Allocate faculty mentors to student cohorts, manage mentoring loads, and record reassignments."
          breadcrumbs={[
            { label: 'Administration', href: '/admin/dashboard' },
            { label: 'Mentor Allocation' },
          ]}
          actions={
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus size={14} />}
              onClick={() => openAllocateModal()}
              disabled={students.length === 0 || mentors.length === 0}
            >
              Allocate / Reassign Mentor
            </Button>
          }
        />

        {/* Faculty Load Overview Cards */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Department Faculty Mentoring Load
          </h3>
                    {mentors.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No faculty mentors on record.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {mentorLoads.map((m) => (
              <div
                key={m.id}
                className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 truncate">
                    {m.full_name}
                  </span>
                  <span className="font-mono text-xs font-bold text-accent bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {m.loadCount} Mentees
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  {m.email}
                </p>
              </div>
            ))}
                </div>
        )}
              </div>

                    {/* Active vs History Tabs */}
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                      <button
                        onClick={() => setViewTab('active')}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded transition-colors ${viewTab === 'active'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        <UserCheck size={13} />
                        Active Mentor Allocations ({activeAssignments.length})
                      </button>
                      <button
                        onClick={() => setViewTab('history')}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded transition-colors ${viewTab === 'history'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        <History size={13} />
                        Assignment History ({historyAssignments.length})
                      </button>
                    </div>

          {/* Allocation DataTable */}
          {viewTab === 'active' ? (
            <DataTable
              columns={activeColumns as any}
              data={activeAssignments as any}
              defaultSortKey="usn"
              defaultSortDirection="asc"
              pageSize={10}
              emptyTitle="No active mentorship allocations"
              emptyDescription="Click 'Allocate / Reassign Mentor' above to assign students to faculty mentors."
            />
          ) : (
            <DataTable
              columns={historyColumns as any}
              data={historyAssignments as any}
              defaultSortKey="assigned_at"
              defaultSortDirection="desc"
              pageSize={10}
              emptyTitle="No historical reassignments"
              emptyDescription="Superseded mentor assignment records will appear in this history audit."
            />
          )}

          {/* Allocation / Reassignment Modal */}
          <Dialog
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Allocate or Reassign Faculty Mentor"
            description="Select student and designated departmental faculty mentor. Prior active assignments will be cleanly superseded."
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
                      onClick={handleSaveAllocation}
                      isLoading={isSaving}
                    >
                      Confirm Allocation
                    </Button>
                </div>
        }
      >
                    <div className="space-y-4 text-xs">
                      <FormField label="Select Student" htmlFor="alStudent" required>
                        <Select
                          id="alStudent"
                          value={selectedStudentId}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                            options={
                              students.map((st) => ({
                                value: st.id,
                                label: `${st.profiles?.full_name} (${st.usn} • Sem ${st.semester})`,
                              }))
                            }
                            />
          </FormField>

                        <FormField label="Select Designated Faculty Mentor" htmlFor="alMentor" required>
                          <Select
                              id="alMentor"
              value={ selectedMentorId }
              onChange={(e) => setSelectedMentorId(e.target.value)}
                          options={mentorLoads.map((m) => ({
                            value: m.id,
                            label: `${m.full_name} (Current load: ${m.loadCount} mentees)`,
                          }))}
            />
                        </FormField>

                        <FormField
                          label="Allocation Justification / Administrative Note"
                          htmlFor="alNotes"
                          description="Institutional remark logged with this mentor allocation."
                        >
                          <Textarea
                            id="alNotes"
                            rows={2}
                            value={allocationNotes}
                            onChange={(e) => setAllocationNotes(e.target.value)}
                            placeholder="e.g. Assigned for Semester 5 mentoring cycle..."
                          />
                        </FormField>
                    </div>
                  </Dialog>
                </div>
                )
}
