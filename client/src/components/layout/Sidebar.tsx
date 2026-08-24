'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FileText, Megaphone, BarChart3, Settings, Home, ChevronLeft, ChevronRight } from 'lucide-react'

interface SidebarProps {
  open: boolean
  onToggle: () => void
  userRole: 'resident' | 'admin'
}

const residentNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/complaints', label: 'My Complaints', icon: FileText },
  { href: '/notices', label: 'Notices', icon: Megaphone },
]

const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/complaints', label: 'All Complaints', icon: FileText },
  { href: '/admin/notices', label: 'Notices', icon: Megaphone },
  { href: '/admin/metrics', label: 'Metrics', icon: BarChart3 },
]

export function Sidebar({ open, onToggle, userRole }: SidebarProps) {
  const pathname = usePathname()
  const navItems = userRole === 'admin' ? adminNav : residentNav

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[var(--z-fixed)] bg-black/50 transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onToggle}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed top-0 left-0 z-[var(--z-sticky)] h-screen',
          'bg-[var(--color-bg-card)] border-r border-[var(--color-border-light)]',
          'transition-all duration-300 ease-in-out',
          'flex flex-col',
          open ? 'w-[var(--sidebar-width)]' : 'w-[var(--sidebar-collapsed-width)]',
          'lg:translate-x-0'
        )}
        role="navigation"
        aria-label="Sidebar navigation"
      >
        <div className="flex h-[var(--header-height)] items-center justify-between px-4 border-b border-[var(--color-border-light)]">
          <Link
            href={userRole === 'admin' ? '/admin/dashboard' : '/dashboard'}
            className="flex items-center gap-2"
            aria-label="Society Tracker Home"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-primary)] flex items-center justify-center flex-shrink-0">
              <Home className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className={cn(
              'text-xl font-bold text-[var(--color-text-primary)] transition-opacity duration-200',
              open ? 'opacity-100' : 'opacity-0 invisible'
            )}>
              Society Tracker
            </span>
          </Link>

          <button
            onClick={onToggle}
            className={cn(
              'p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-neutral-100)] transition-colors',
              'flex-shrink-0'
            )}
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={open}
          >
            {open ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  'relative overflow-hidden',
                  isActive
                    ? 'bg-[var(--color-accent-primary-light)] text-[var(--color-accent-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)]',
                  !open && 'justify-center'
                )}
                aria-current={isActive ? 'page' : undefined}
                title={!open ? item.label : undefined}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0', !open && 'mx-auto')} aria-hidden="true" />
                <span className={cn('transition-opacity duration-200', !open && 'opacity-0 invisible absolute')}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-[var(--color-border-light)]">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-secondary)]',
              'hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] transition-colors',
              !open && 'justify-center'
            )}
            title={!open ? 'Settings' : undefined}
          >
            <Settings className={cn('h-5 w-5 flex-shrink-0', !open && 'mx-auto')} aria-hidden="true" />
            <span className={cn('transition-opacity duration-200', !open && 'opacity-0 invisible absolute')}>
              Settings
            </span>
          </Link>
        </div>
      </aside>
    </>
  )
}