import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-dark active:bg-blue-800 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 border border-transparent shadow-sm',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 shadow-sm',
  outline:
    'bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 border border-transparent shadow-sm',
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-2.5 text-xs rounded-sm gap-1.5',
  md: 'h-9 px-3.5 text-sm rounded-md gap-2',
  lg: 'h-10 px-4 text-sm font-medium rounded-md gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors select-none outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  )
}
