'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks'
import { Loader2, Building2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.push(user.role === 'admin' ? '/admin/dashboard' : '/dashboard')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-primary)] flex items-center justify-center mx-auto mb-6">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Society Maintenance Tracker</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">Redirecting to your dashboard...</p>
        <Loader2 className="h-8 w-8 mx-auto mt-6 text-[var(--color-accent-primary)] animate-spin" />
      </div>
    </div>
  )
}