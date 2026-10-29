import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
  description?: React.ReactNode
  headerAction?: React.ReactNode
  footer?: React.ReactNode
  noPadding?: boolean
}

export function Card({
  title,
  description,
  headerAction,
  footer,
  noPadding = false,
  className,
  children,
  ...props
}: CardProps) {
  const hasHeader = title || description || headerAction

  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden',
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
          {headerAction && <div className="shrink-0 ml-4">{headerAction}</div>}
        </div>
      )}
      <div className={cn(!noPadding && 'p-5')}>{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          {footer}
        </div>
      )}
    </div>
  )
}
