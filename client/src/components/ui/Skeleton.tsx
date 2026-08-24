import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  lines?: number
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  lines,
  ...props
}: SkeletonProps) {
  if (variant === 'circular') {
    return (
      <div
        className={cn('rounded-full bg-[var(--color-neutral-200)] animate-pulse', className)}
        style={{ width, height }}
        {...props}
      />
    )
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={cn('rounded-lg bg-[var(--color-neutral-200)] animate-pulse', className)}
        style={{ width, height }}
        {...props}
      />
    )
  }

  if (lines && lines > 1) {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn('h-4 bg-[var(--color-neutral-200)] animate-pulse rounded', i === lines - 1 && 'w-3/4')}
            style={{ width: i === lines - 1 ? width : '100%' }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn('h-4 bg-[var(--color-neutral-200)] animate-pulse rounded', className)}
      style={{ width }}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-card)] p-6 animate-pulse">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" />
            <Skeleton width="60%" />
          </div>
        </div>
        <Skeleton lines={3} />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton variant="text" width={i === 0 ? '60%' : '80%'} />
        </td>
      ))}
    </tr>
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-card)] p-6 animate-pulse">
      <Skeleton width="40%" height={24} />
      <div className="mt-4 flex items-end gap-4">
        <Skeleton width="30%" height={32} />
        <Skeleton width="40%" height={20} />
      </div>
    </div>
  )
}