'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, X } from 'lucide-react'
import { Avatar } from './Avatar'

interface DropdownItem {
  label: string
  onClick: () => void
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
}

interface DropdownMenuProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export function DropdownMenu({ trigger, items, align = 'right', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleItemClick = (onClick: () => void) => {
    onClick()
    setOpen(false)
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div
        onClick={() => setOpen(!open)}
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(!open)
          }
        }}
      >
        {trigger}
      </div>

      {open && (
        <div
          className={cn(
            'fixed z-[var(--z-dropdown)] mt-1 min-w-[160px] bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-lg shadow-[var(--shadow-lg)]',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
          role="menu"
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemClick(item.onClick)}
              disabled={item.disabled}
              role="menuitem"
              tabIndex={-1}
              className={cn(
                'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
                'transition-colors duration-150',
                'focus:outline-none focus:bg-[var(--color-neutral-100)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                item.danger
                  ? 'text-[var(--color-accent-danger)] hover:bg-[var(--color-accent-danger-light)]'
                  : 'text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)]'
              )}
            >
              {item.icon && <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface UserMenuProps {
  user: {
    name: string
    email: string
    role: string
    avatar?: string
  }
  onProfileClick: () => void
  onLogoutClick: () => void
}

export function UserMenu({ user, onProfileClick, onLogoutClick }: UserMenuProps) {
  return (
    <DropdownMenu
      trigger={
        <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-[var(--color-neutral-100)] transition-colors">
          <Avatar src={user.avatar} name={user.name} size="sm" />
          <span className="hidden sm:block font-medium text-[var(--color-text-primary)]">
            {user.name}
          </span>
          <ChevronDown className="h-4 w-4 text-[var(--color-text-tertiary)]" aria-hidden="true" />
        </button>
      }
      align="right"
      items={[
        {
          label: 'Profile',
          onClick: onProfileClick,
          icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
        },
        { label: 'Settings', onClick: () => {}, disabled: true },
        {
          label: 'Logout',
          onClick: onLogoutClick,
          icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
          danger: true,
        },
      ]}
    />
  )
}