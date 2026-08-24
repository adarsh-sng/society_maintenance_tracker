import { cn } from '@/lib/utils'
import { getStatusColor, getPriorityColor } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'status' | 'priority'
  status?: 'Open' | 'In Progress' | 'Resolved'
  priority?: 'Low' | 'Medium' | 'High'
  size?: 'sm' | 'md'
  dot?: boolean
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
}

export function Badge({
  className,
  variant = 'default',
  status,
  priority,
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  let colorClasses = 'bg-[var(--color-neutral-100)] text-[var(--color-text-secondary)]'
  let dotColor = 'bg-[var(--color-neutral-400)]'

  if (variant === 'status' && status) {
    const colors = getStatusColor(status)
    colorClasses = `${colors.bg} ${colors.text}`
    dotColor = colors.dot
  } else if (variant === 'priority' && priority) {
    const colors = getPriorityColor(priority)
    colorClasses = `${colors.bg} ${colors.text}`
    dotColor = colors.text
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        sizes[size],
        colorClasses,
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} aria-hidden="true" />}
      {children}
    </span>
  )
}

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'Open' | 'In Progress' | 'Resolved'
}

export function StatusBadge({ status, size = 'md', dot = true, className, ...props }: StatusBadgeProps) {
  return <Badge variant="status" status={status} size={size} dot={dot} className={className} {...props} />
}

interface PriorityBadgeProps extends Omit<BadgeProps, 'variant'> {
  priority: 'Low' | 'Medium' | 'High'
}

export function PriorityBadge({ priority, size = 'md', className, ...props }: PriorityBadgeProps) {
  return <Badge variant="priority" priority={priority} size={size} className={className} {...props} />
}