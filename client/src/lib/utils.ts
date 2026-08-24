import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(d)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length).trim() + '...'
}

export function getStatusColor(status: string): { bg: string; text: string; dot: string } {
  switch (status) {
    case 'Open':
      return {
        bg: 'bg-[var(--color-status-open-bg)]',
        text: 'text-[var(--color-status-open)]',
        dot: 'bg-[var(--color-status-open)]',
      }
    case 'In Progress':
      return {
        bg: 'bg-[var(--color-status-in-progress-bg)]',
        text: 'text-[var(--color-status-in-progress)]',
        dot: 'bg-[var(--color-status-in-progress)]',
      }
    case 'Resolved':
      return {
        bg: 'bg-[var(--color-status-resolved-bg)]',
        text: 'text-[var(--color-status-resolved)]',
        dot: 'bg-[var(--color-status-resolved)]',
      }
    default:
      return {
        bg: 'bg-[var(--color-neutral-100)]',
        text: 'text-[var(--color-neutral-600)]',
        dot: 'bg-[var(--color-neutral-400)]',
      }
  }
}

export function getPriorityColor(priority: string): { bg: string; text: string } {
  switch (priority) {
    case 'Low':
      return {
        bg: 'bg-[var(--color-priority-low-bg)]',
        text: 'text-[var(--color-priority-low)]',
      }
    case 'Medium':
      return {
        bg: 'bg-[var(--color-priority-medium-bg)]',
        text: 'text-[var(--color-priority-medium)]',
      }
    case 'High':
      return {
        bg: 'bg-[var(--color-priority-high-bg)]',
        text: 'text-[var(--color-priority-high)]',
      }
    default:
      return {
        bg: 'bg-[var(--color-neutral-100)]',
        text: 'text-[var(--color-neutral-600)]',
      }
  }
}