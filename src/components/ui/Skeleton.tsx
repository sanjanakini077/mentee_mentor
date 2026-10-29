import React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded bg-slate-200/80', className)}
      {...props}
    />
  )
}

export function TextSkeleton({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-3.5',
            i === lines - 1 ? 'w-2/3' : i === 0 ? 'w-full' : 'w-4/5'
          )}
        />
      ))}
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-5 bg-white border border-slate-200 rounded-md shadow-sm space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-3/4" />
      <div className="pt-2 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  )
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'w-full border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm',
        className
      )}
    >
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, c) => (
          <Skeleton key={`h-${c}`} className="h-3.5 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`r-${r}`} className="px-4 py-3.5 flex gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={`rc-${r}-${c}`} className="h-3 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

