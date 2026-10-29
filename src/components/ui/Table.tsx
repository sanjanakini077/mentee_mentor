import React from 'react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
}

interface TableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  className?: string
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = 'No records found.',
  className,
}: TableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  'border-b border-slate-100 hover:bg-slate-50 transition-colors',
                  rowIndex % 2 === 1 && 'bg-slate-50/60'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-2.5 text-slate-700 whitespace-nowrap"
                  >
                    {col.render
                      ? col.render(row)
                      : String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
