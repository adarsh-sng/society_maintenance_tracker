'use client'

import { useState, useEffect } from 'react'
import { ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils'

interface ResidentLayoutProps {
  children: ReactNode
  user: {
    name: string
    email: string
    role: string
    avatar?: string
  }
  onLogout: () => void
}

export function ResidentLayout({ children, user, onLogout }: ResidentLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <div className="fixed top-0 left-0 right-0 h-[var(--header-height)] bg-[var(--color-bg-card)] border-b border-[var(--color-border-light)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} userRole="resident" />
      <Header
        user={user}
        onLogout={onLogout}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main
        className={cn(
          'pt-[var(--header-height)] min-h-screen transition-all duration-300',
          'lg:pl-[var(--sidebar-width)]'
        )}
        id="main-content"
        role="main"
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-[var(--container-max)] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}