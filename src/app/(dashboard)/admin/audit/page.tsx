'use client'

import React, { useState, useMemo } from 'react'
import { Eye } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchFilterBar } from '@/components/ui/SearchFilterBar'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { PREVIEW_AUDIT_LOGS } from '@/lib/preview-data'
import { formatDateTime } from '@/lib/utils'
import type { AuditLog } from '@/types'

export default function AdminAuditPage() {
  const [logs] = useState<AuditLog[]>(PREVIEW_AUDIT_LOGS)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        search === '' ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.target_type.toLowerCase().includes(search.toLowerCase()) ||
        log.actor?.full_name?.toLowerCase().includes(search.toLowerCase())

      const matchesAction =
        actionFilter === 'all' || log.action === actionFilter

      return matchesSearch && matchesAction
    })
  }, [logs, search, actionFilter])

  const columns: ColumnDef<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-[11px] text-slate-600">
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.actor?.full_name}</p>
          <span className="text-[10px] text-slate-400 font-mono uppercase">
            {row.actor?.role}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Administrative Action',
      sortable: true,
      cell: (row) => (
        <Badge
          variant={
            row.action.includes('APPROVED')
              ? 'success'
              : row.action.includes('ASSIGNED')
              ? 'primary'
              : 'default'
          }
          className="font-mono text-[10px]"
        >
          {row.action}
        </Badge>
      ),
    },
    {
      key: 'target_type',
      header: 'Target Entity',
      sortable: true,
      cell: (row) => (
        <span className="text-slate-600 font-mono text-xs">
          {row.target_type}
        </span>
      ),
    },
    {
      key: 'metadata',
      header: 'Metadata Summary',
      cell: (row) => (
        <span className="text-slate-500 text-xs font-mono truncate max-w-xs block">
          {JSON.stringify(row.metadata || {})}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Details',
      align: 'right',
      cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Eye size={12} />}
          onClick={() => setSelectedLog(row)}
          className="h-7 text-xs"
        >
          Inspect
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Audit Trail"
        description="Immutable administrative activity register tracking verifications, recommendations, and mentor assignments."
        breadcrumbs={[
          { label: 'Administration', href: '/admin' },
          { label: 'Audit Log' },
        ]}
      />

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search audit logs by action or actor..."
        resultsCount={filteredLogs.length}
        filters={[
          {
            key: 'action',
            label: 'Action Filter',
            value: actionFilter,
            onChange: setActionFilter,
            options: [
              { value: 'all', label: 'All Logged Actions' },
              {
                value: 'APPROVED_RECOMMENDATION',
                label: 'APPROVED_RECOMMENDATION',
              },
              {
                value: 'SUBMITTED_RECOMMENDATION',
                label: 'SUBMITTED_RECOMMENDATION',
              },
              {
                value: 'VERIFIED_STUDENT_PROFILE',
                label: 'VERIFIED_STUDENT_PROFILE',
              },
              { value: 'ASSIGNED_MENTOR', label: 'ASSIGNED_MENTOR' },
              { value: 'ADDED_MENTORING_NOTE', label: 'ADDED_MENTORING_NOTE' },
            ],
          },
        ]}
        onResetFilters={() => {
          setSearch('')
          setActionFilter('all')
        }}
      />

      <DataTable
        columns={columns as any}
        data={filteredLogs as any}
        defaultSortKey="created_at"
        defaultSortDirection="desc"
        pageSize={10}
      />

      {/* Metadata Inspector Modal */}
      {selectedLog && (
        <Dialog
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Audit Log Record — ${selectedLog.action}`}
          description={`Logged at ${formatDateTime(selectedLog.created_at)}`}
          footer={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedLog(null)}
            >
              Close
            </Button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Actor:</span>
                <span className="font-semibold text-slate-800">
                  {selectedLog.actor?.full_name} ({selectedLog.actor?.role})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action:</span>
                <span className="font-mono text-slate-800">
                  {selectedLog.action}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Type:</span>
                <span className="font-mono text-slate-800">
                  {selectedLog.target_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target ID:</span>
                <span className="font-mono text-slate-800">
                  {selectedLog.target_id}
                </span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block mb-1">
                Parsed Action Metadata:
              </span>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded text-[11px] font-mono overflow-x-auto">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}

