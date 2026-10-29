import React from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  actionSlot?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionSlot,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-300 rounded-md bg-slate-50/50',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
        {icon || <FolderOpen size={20} />}
      </div>
      <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {actionSlot ? (
        actionSlot
      ) : actionLabel && onAction ? (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

