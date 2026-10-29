import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BreadcrumbItem } from '@/types'

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  showHome?: boolean
  className?: string
}

export function Breadcrumb({
  items,
  showHome = false,
  className,
}: BreadcrumbProps) {
  if (!items || items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-xs text-slate-500', className)}
    >
      <ol className="flex items-center space-x-1.5 flex-wrap">
        {showHome && (
          <li className="flex items-center">
            <Link
              href="/"
              className="text-slate-400 hover:text-slate-700 transition-colors flex items-center"
              aria-label="Home"
            >
              <Home size={13} />
            </Link>
            <ChevronRight size={12} className="mx-1 text-slate-300 shrink-0" />
          </li>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={item.label + index} className="flex items-center">
              {index > 0 && (
                <ChevronRight size={12} className="mx-1.5 text-slate-300 shrink-0" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-slate-800 transition-colors font-normal text-slate-500"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'font-medium truncate max-w-[200px]',
                    isLast ? 'text-slate-800' : 'text-slate-500'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
