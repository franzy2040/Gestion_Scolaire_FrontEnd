import React from 'react'
import { cn } from '@/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', shadow = 'md', children, ...props }, ref) => {
    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    }

    const shadows = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-xl border border-gray-200',
          paddings[padding],
          shadows[shadow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>
)

export const CardTitle = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <h3 className={cn('text-lg font-semibold text-gray-900', className)}>{children}</h3>
)

export const CardContent = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn('', className)}>{children}</div>
)
