import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'circle' | 'square'
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
}

const shapes = {
  circle: 'rounded-full',
  square: 'rounded-lg',
}

export function Avatar({ className, src, alt, name, size = 'md', shape = 'circle', ...props }: AvatarProps) {
  const initials = name ? getInitials(name) : '?'

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center font-medium bg-[var(--color-neutral-100)] text-[var(--color-text-secondary)]',
        'overflow-hidden bg-cover bg-center',
        sizes[size],
        shapes[shape],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  )
}

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: Array<{ src?: string; name: string; alt?: string }>
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export function AvatarGroup({ className, avatars, max = 5, size = 'md', ...props }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  return (
    <div className={cn('flex -space-x-2', className)} {...props}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          alt={avatar.alt}
          size={size}
          className="border-2 border-[var(--color-bg-card)] ring-1 ring-[var(--color-border-light)]"
        />
      ))}
      {remainingCount > 0 && (
        <Avatar
          name={`${remainingCount}+`}
          size={size}
          className="border-2 border-[var(--color-bg-card)] ring-1 ring-[var(--color-border-light)] bg-[var(--color-neutral-200)]"
        />
      )}
    </div>
  )
}