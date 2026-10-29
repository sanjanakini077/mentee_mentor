import React from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'

export interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, { badge: string; dot: string }> = {
  default: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
  },
  primary: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-600',
  },
  success: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-600',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-600',
  },
  danger: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-600',
  },
  info: {
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-600',
  },
  purple: {
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-600',
  },
}

export function Badge({
  variant = 'default',
  children,
  className,
  dot = false,
}: BadgeProps) {
  const styles = variantStyles[variant] || variantStyles.default
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border tracking-wide select-none',
        styles.badge,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', styles.dot)} />}
      <span>{children}</span>
    </span>
  )
}

export type StatusString =
  | 'approved'
  | 'verified'
  | 'submitted'
  | 'pending'
  | 'rejected'
  | 'correction_requested'
  | 'draft'
  | 'active'
  | 'inactive'
  | string

export function statusToVariant(status: StatusString): BadgeVariant {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'verified':
    case 'active':
      return 'success'
    case 'submitted':
    case 'in_review':
    case 'pending_review':
      return 'info'
    case 'pending':
      return 'warning'
    case 'correction_requested':
    case 'changes_requested':
      return 'warning'
    case 'rejected':
      return 'danger'
    case 'draft':
    case 'inactive':
    default:
      return 'default'
  }
}

export function formatStatusLabel(status: StatusString): string {
  switch (status.toLowerCase()) {
    case 'correction_requested':
    case 'changes_requested':
      return 'Changes Requested'
    case 'submitted':
    case 'pending_review':
      return 'Pending Review'
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    case 'draft':
      return 'Draft'
    case 'pending':
      return 'Pending'
    default:
      return status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
  }
}

export function StatusBadge({
  status,
  dot = true,
  className,
}: {
  status: StatusString
  dot?: boolean
  className?: string
}) {
  const variant = statusToVariant(status)
  const label = formatStatusLabel(status)
  return (
    <Badge variant={variant} dot={dot} className={className}>
      {label}
    </Badge>
  )
}
