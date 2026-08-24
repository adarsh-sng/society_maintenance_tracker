'use client'

import { useAuth } from '@/hooks'
import { useMetrics } from '@/hooks/useAdmin'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent } from '@/components/ui'
import { Skeleton, MetricCardSkeleton } from '@/components/ui'
import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, Users, Building2, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusColors = {
  Open: { bg: 'bg-[var(--color-accent-primary-light)]', text: 'text-[var(--color-accent-primary)]', icon: FileText },
  'In Progress': { bg: 'bg-[var(--color-accent-warning-light)]', text: 'text-[var(--color-accent-warning)]', icon: Clock },
  Resolved: { bg: 'bg-[var(--color-accent-success-light)]', text: 'text-[var(--color-accent-success)]', icon: CheckCircle },
}

const priorityColors = {
  Low: { bg: 'bg-[var(--color-accent-success-light)]', text: 'text-[var(--color-accent-success)]' },
  Medium: { bg: 'bg-[var(--color-accent-warning-light)]', text: 'text-[var(--color-accent-warning)]' },
  High: { bg: 'bg-[var(--color-accent-danger-light)]', text: 'text-[var(--color-accent-danger)]' },
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const { metrics, isLoading } = useMetrics()

  if (isLoading) {
    return (
      <AdminLayout user={user!} onLogout={() => {}}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <MetricCardSkeleton key={i} />)}
          </div>
        </div>
      </AdminLayout>
    )
  }

  const stats = {
    total: metrics?.totalComplaints ?? 0,
    open: metrics?.byStatus.find((s) => s.status === 'Open')?.count ?? 0,
    inProgress: metrics?.byStatus.find((s) => s.status === 'In Progress')?.count ?? 0,
    resolved: metrics?.byStatus.find((s) => s.status === 'Resolved')?.count ?? 0,
    overdue: metrics?.overdueCount ?? 0,
  }

  const statusData = metrics?.byStatus ?? []
  const categoryData = metrics?.byCategory ?? []

  return (
    <AdminLayout user={user!} onLogout={() => {}}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Admin Dashboard</h1>
          <p className="text-[var(--color-text-secondary)]">Overview of society maintenance operations</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Total Complaints</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[var(--color-neutral-100)] flex items-center justify-center">
                  <FileText className="h-6 w-6 text-[var(--color-text-secondary)]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Open</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.open}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-primary-light)] flex items-center justify-center">
                  <FileText className="h-6 w-6 text-[var(--color-accent-primary)]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">In Progress</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.inProgress}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-warning-light)] flex items-center justify-center">
                  <Clock className="h-6 w-6 text-[var(--color-accent-warning)]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Resolved</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.resolved}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-success-light)] flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-[var(--color-accent-success)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">By Status</h2>
                <span className="text-sm text-[var(--color-accent-danger)]">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  {stats.overdue} Overdue
                </span>
              </div>
              <div className="space-y-3">
                {statusData.length > 0 ? (
                  statusData.map((item) => {
                    const colors = statusColors[item.status as keyof typeof statusColors] || { bg: 'bg-[var(--color-neutral-100)]', text: 'text-[var(--color-text-secondary)]', icon: FileText }
                    const Icon = colors.icon
                    return (
                      <div key={item.status} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-neutral-50)]">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.bg)}>
                            <Icon className={cn('h-4 w-4', colors.text)} />
                          </div>
                          <span className="font-medium text-[var(--color-text-primary)]">{item.status}</span>
                        </div>
                        <span className="text-2xl font-bold text-[var(--color-text-primary)]">{item.count}</span>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-[var(--color-text-secondary)] text-center py-4">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">By Category</h2>
              <div className="space-y-3">
                {categoryData.length > 0 ? (
                  categoryData.map((item) => (
                    <div key={item.category} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-neutral-50)]">
                      <span className="font-medium text-[var(--color-text-primary)]">{item.category}</span>
                      <span className="text-2xl font-bold text-[var(--color-text-primary)]">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[var(--color-text-secondary)] text-center py-4">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <a href="/admin/complaints" className="p-4 rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-light)] transition-colors text-center">
                <FileText className="h-8 w-8 text-[var(--color-accent-primary)] mx-auto mb-2" />
                <p className="font-medium text-[var(--color-text-primary)]">All Complaints</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Manage & update</p>
              </a>
              <a href="/admin/notices/new" className="p-4 rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-light)] transition-colors text-center">
                <Megaphone className="h-8 w-8 text-[var(--color-accent-primary)] mx-auto mb-2" />
                <p className="font-medium text-[var(--color-text-primary)]">Post Notice</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Announce to residents</p>
              </a>
              <a href="/admin/metrics" className="p-4 rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-light)] transition-colors text-center">
                <TrendingUp className="h-8 w-8 text-[var(--color-accent-primary)] mx-auto mb-2" />
                <p className="font-medium text-[var(--color-text-primary)]">Detailed Metrics</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Full analytics</p>
              </a>
              <a href="/admin/complaints" className="p-4 rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-light)] transition-colors text-center">
                <Users className="h-8 w-8 text-[var(--color-accent-primary)] mx-auto mb-2" />
                <p className="font-medium text-[var(--color-text-primary)]">Residents</p>
                <p className="text-sm text-[var(--color-text-secondary)]">View all users</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}