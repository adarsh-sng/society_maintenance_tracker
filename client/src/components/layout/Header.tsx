'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { LayoutDashboard, FileText, Megaphone, BarChart3, Settings, LogOut, Menu, X, Home } from 'lucide-react'
import { UserMenu } from '@/components/ui/Dropdown'

interface HeaderProps {
  user: {
    name: string
    email: string
    role: string
    avatar?: string
  }
  onLogout: () => void
  sidebarOpen: boolean
  onSidebarToggle: () => void
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

export function Header({ user, onLogout, sidebarOpen, onSidebarToggle }: HeaderProps) {
  const pathname = usePathname()
  const isAdmin = user.role === 'admin'
  const navItems = isAdmin ? adminNav : residentNav

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-[var(--z-sticky)] h-[var(--header-height)]',
      'bg-[var(--color-bg-card)] border-b border-[var(--color-border-light)]',
      'transition-all duration-300'
    )}>
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onSidebarToggle}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Link href={isAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-primary)] flex items-center justify-center">
              <Home className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold text-[var(--color-text-primary)] hidden sm:block">
              Society Tracker
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--color-accent-primary-light)] text-[var(--color-accent-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)]'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[var(--color-neutral-100)]">
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              isAdmin
                ? 'bg-[var(--color-accent-danger-light)] text-[var(--color-accent-danger)]'
                : 'bg-[var(--color-accent-primary-light)] text-[var(--color-accent-primary)]'
            )}>
              {isAdmin ? 'Admin' : 'Resident'}
            </span>
          </div>

          <UserMenu
            user={user}
            onProfileClick={() => {}}
            onLogoutClick={onLogout}
          />
        </div>
      </div>
    </header>
  )
}