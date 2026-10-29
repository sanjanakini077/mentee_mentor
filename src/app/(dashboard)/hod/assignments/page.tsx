'use client'

import React, { useState } from 'react'
import { UserCheck, Users, Plus, ArrowRight, Check } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { PREVIEW_ASSIGNED_STUDENTS } from '@/lib/preview-data'

export default function HodAssignmentsPage() {
  const { success } = useToast()
  const [students, setStudents] = useState(PREVIEW_ASSIGNED_STUDENTS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState(students[0].id)
  const [selectedMentor, setSelectedMentor] = useState('Dr. K. S. Venkatesh')

  const mentorsList = [
    { name: 'Dr. K. S. Venkatesh', designation: 'Associate Professor', load: 5 },
    { name: 'Prof. Rajeshwari N.', designation: 'Assistant Professor', load: 6 },
    { name: 'Dr. Ramesh Kumar', designation: 'Professor', load: 4 },
    { name: 'Prof. Sunita Patil', designation: 'Assistant Professor', load: 5 },
  ]

  const handleReassign = () => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === selectedStudentId ? { ...s, mentorName: selectedMentor } : s
      )
    )
    setIsModalOpen(false)
    success(`Mentor re-allocation recorded: assigned to ${selectedMentor}.`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty–Student Mentorship Allocation"
        description="Allocate faculty mentors to student cohorts, manage mentoring loads, and update assignments."
        breadcrumbs={[
          { label: 'Administration', href: '/hod' },
          { label: 'Mentor Assignments' },
        ]}
        actions={
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={14} />}
            onClick={() => setIsModalOpen(true)}
          >
            Allocate / Reassign Mentor
          </Button>
        }
      />

      {/* Mentor Load Cards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Faculty Mentoring Load
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mentorsList.map((m) => (
            <div
              key={m.name}
              className="bg-white border border-slate-200 rounded-md p-4 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{m.name}</h4>
                  <p className="text-[11px] text-slate-500">{m.designation}</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold">
                  {m.load}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                <span>Allocated Cohort:</span>
                <span className="font-semibold text-slate-700">
                  {m.load} Mentees
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Allocations Table */}
      <Card
        title="Active Student Allocations"
        description="Current mentor–mentee assignments for Semester 3 and 5 batches."
      >
        <div className="divide-y divide-slate-100 text-xs">
          {students.map((st) => (
            <div
              key={st.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded bg-slate-100 font-mono text-xs font-bold text-slate-700 flex items-center justify-center shrink-0">
                  S{st.semester}
                </span>
                <div>
                  <p className="font-semibold text-slate-800">
                    {st.profiles?.full_name}
                  </p>
                  <p className="text-slate-500 font-mono text-[11px]">
                    {st.usn} • CGPA: {st.cgpa}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-slate-800 text-xs">
                    {st.mentorName}
                  </p>
                  <p className="text-[11px] text-slate-400">Faculty Mentor</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedStudentId(st.id)
                    setSelectedMentor(st.mentorName)
                    setIsModalOpen(true)
                  }}
                  className="h-7 text-xs"
                >
                  Change
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Reassign Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Allocate Faculty Mentor"
        description="Select a student and assign an available faculty mentor from Department of CSE."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleReassign}>
              Confirm Allocation
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Target Student" required htmlFor="assignStudent">
            <Select
              id="assignStudent"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              options={students.map((s) => ({
                value: s.id,
                label: `${s.profiles?.full_name} (${s.usn} - Sem ${s.semester})`,
              }))}
            />
          </FormField>

          <FormField label="Assign Faculty Mentor" required htmlFor="assignMentor">
            <Select
              id="assignMentor"
              value={selectedMentor}
              onChange={(e) => setSelectedMentor(e.target.value)}
              options={mentorsList.map((m) => ({
                value: m.name,
                label: `${m.name} (${m.designation} - ${m.load} students)`,
              }))}
            />
          </FormField>
        </div>
      </Dialog>
    </div>
  )
}

