import React from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  description?: string
}

export function Label({
  children,
  required,
  description,
  className,
  ...props
}: LabelProps) {
  return (
    <div className="mb-1.5">
      <label
        className={cn(
          'block text-xs font-semibold text-slate-700 tracking-tight',
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="text-red-500 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {description && (
        <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
      )}
    </div>
  )
}
