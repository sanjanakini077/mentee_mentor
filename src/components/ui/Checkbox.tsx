import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
  description?: string
  error?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, checked, ...props }, ref) => {
    return (
      <div className="flex items-start gap-2.5">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            id={id}
            ref={ref}
            type="checkbox"
            checked={checked}
            className={cn(
              'peer h-4 w-4 appearance-none rounded border border-slate-300 bg-white cursor-pointer transition-colors',
              'checked:bg-accent checked:border-accent',
              'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500',
              className
            )}
            {...props}
          />
          <Check
            size={12}
            className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
            strokeWidth={3}
          />
        </div>
        {(label || description) && (
          <div className="text-xs">
            {label && (
              <label
                htmlFor={id}
                className="font-medium text-slate-700 cursor-pointer select-none"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-slate-500 mt-0.5 select-none">{description}</p>
            )}
            {error && <p className="text-red-600 mt-0.5 font-medium">{error}</p>}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

