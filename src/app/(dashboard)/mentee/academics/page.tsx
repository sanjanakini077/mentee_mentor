'use client'

import React, { useState } from 'react'
import { Plus, BookOpen } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { PREVIEW_ACADEMIC_RECORDS } from '@/lib/preview-data'
import type { AcademicRecord } from '@/types'

export default function MenteeAcademicsPage() {
  const { success } = useToast()
  const [records, setRecords] = useState<AcademicRecord[]>(PREVIEW_ACADEMIC_RECORDS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newRecord, setNewRecord] = useState({
    semester: 6,
    academicYear: '2024-25',
    sgpa: '',
    cgpa: '',
    backlogs: '0',
    remarks: '',
  })

  const columns: ColumnDef<AcademicRecord>[] = [
    {
      key: 'semester',
      header: 'Semester',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-slate-800">
          Semester {row.semester}
        </span>
      ),
    },
    {
      key: 'academic_year',
      header: 'Academic Year',
      sortable: true,
      cell: (row) => <span className="font-mono text-xs">{row.academic_year}</span>,
    },
    {
      key: 'sgpa',
      header: 'SGPA',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="font-bold text-slate-900">{row.sgpa?.toFixed(2) || '—'}</span>
      ),
    },
    {
      key: 'cgpa',
      header: 'CGPA',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="font-bold text-accent">{row.cgpa?.toFixed(2) || '—'}</span>
      ),
    },
    {
      key: 'backlogs',
      header: 'Backlogs',
      sortable: true,
      align: 'center',
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${
            row.backlogs === 0
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-rose-50 text-rose-700'
          }`}
        >
          {row.backlogs}
        </span>
      ),
    },
    {
      key: 'remarks',
      header: 'Evaluation Remarks',
      cell: (row) => (
        <span className="text-slate-600 text-xs italic">
          {row.remarks || 'No remarks recorded'}
        </span>
      ),
    },
  ]

  const handleAddRecord = () => {
    if (!newRecord.sgpa || !newRecord.cgpa) return

    const record: AcademicRecord = {
      id: `ar-${Date.now()}`,
      student_id: 's-mentee-1',
      semester: Number(newRecord.semester),
      academic_year: newRecord.academicYear,
      sgpa: parseFloat(newRecord.sgpa),
      cgpa: parseFloat(newRecord.cgpa),
      backlogs: parseInt(newRecord.backlogs) || 0,
      remarks: newRecord.remarks || 'Student self-entry',
      created_at: new Date().toISOString(),
    }

    setRecords([...records, record])
    setIsModalOpen(false)
    success(`Semester ${record.semester} academic record submitted.`)
    setNewRecord({
      semester: records.length + 2,
      academicYear: '2024-25',
      sgpa: '',
      cgpa: '',
      backlogs: '0',
      remarks: '',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Performance Records"
        description="Official semester-wise SGPA, cumulative CGPA, and backlog tracking register."
        breadcrumbs={[
          { label: 'Student Portal', href: '/mentee' },
          { label: 'Academic Records' },
        ]}
        actions={
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Semester Record
          </Button>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Semesters Completed
          </p>
          <p className="text-xl font-bold text-slate-800 mt-1">{records.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Cumulative Grade Point Average (CGPA)
          </p>
          <p className="text-xl font-bold text-accent mt-1">
            {records[records.length - 1]?.cgpa || '8.47'}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Outstanding Backlogs
          </p>
          <p className="text-xl font-bold text-slate-800 mt-1">0</p>
        </div>
      </div>

      {/* Academic Table */}
      <Card
        title="Semester-wise Grade History"
        description="Grades submitted are verified against Controller of Examinations records."
      >
        <DataTable
          columns={columns as any}
          data={records as any}
          defaultSortKey="semester"
          defaultSortDirection="asc"
        />
      </Card>

      {/* Entry Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Semester Academic Record"
        description="Enter SGPA and backlog details from your official university marks card."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddRecord}>
              Submit Record
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Semester" required htmlFor="semInput">
              <Input
                id="semInput"
                type="number"
                min={1}
                max={8}
                value={newRecord.semester}
                onChange={(e) =>
                  setNewRecord({
                    ...newRecord,
                    semester: parseInt(e.target.value) || 1,
                  })
                }
              />
            </FormField>

            <FormField label="Academic Year" required htmlFor="yearInput">
              <Input
                id="yearInput"
                placeholder="2024-25"
                value={newRecord.academicYear}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, academicYear: e.target.value })
                }
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Semester SGPA" required htmlFor="sgpaInput">
              <Input
                id="sgpaInput"
                type="number"
                step="0.01"
                placeholder="8.50"
                value={newRecord.sgpa}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, sgpa: e.target.value })
                }
              />
            </FormField>

            <FormField label="Cumulative CGPA" required htmlFor="cgpaInput">
              <Input
                id="cgpaInput"
                type="number"
                step="0.01"
                placeholder="8.50"
                value={newRecord.cgpa}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, cgpa: e.target.value })
                }
              />
            </FormField>

            <FormField label="Backlogs" required htmlFor="backlogsInput">
              <Input
                id="backlogsInput"
                type="number"
                min={0}
                value={newRecord.backlogs}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, backlogs: e.target.value })
                }
              />
            </FormField>
          </div>

          <FormField label="Remarks / Electives Completed" htmlFor="remarksInput">
            <Textarea
              id="remarksInput"
              placeholder="e.g. Completed Cloud Computing elective with Grade A"
              value={newRecord.remarks}
              onChange={(e) =>
                setNewRecord({ ...newRecord, remarks: e.target.value })
              }
            />
          </FormField>
        </div>
      </Dialog>
    </div>
  )
}

