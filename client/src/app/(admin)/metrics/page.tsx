'use client'

import { useAuth } from '@/hooks'
import { useMetrics } from '@/hooks/useAdmin'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent } from '@/components/ui'
import { Skeleton, MetricCardSkeleton } from '@/components/ui'
import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, Users, Building2, BarChart3 } from 'lucide-react'
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

export default function AdminMetricsPage() {
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
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Metrics & Analytics</h1>
          <p className="text-[var(--color-text-secondary)]">Detailed analytics for society maintenance operations</p>
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
              <div className="space-y-4">
                {statusData.length > 0 ? (
                  statusData.map((item) => {
                    const colors = statusColors[item.status as keyof typeof statusColors] || { bg: 'bg-[var(--color-neutral-100)]', text: 'text-[var(--color-text-secondary)]', icon: FileText }
                    const Icon = colors.icon
                    const percentage = stats.total > 0 ? ((item.count / stats.total) * 100).toFixed(1) : '0'
                    return (
                      <div key={item.status} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.bg)}>
                              <Icon className={cn('h-4 w-4', colors.text)} />
                            </div>
                            <span className="font-medium text-[var(--color-text-primary)]">{item.status}</span>
                          </div>
                          <span className="text-sm text-[var(--color-text-secondary)]">{percentage}%</span>
                        </div>
                        <div className="h-2 bg-[var(--color-neutral-200)] rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500', colors.bg.replace('bg-', ''))}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
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
              <div className="space-y-4">
                {categoryData.length > 0 ? (
                  categoryData.map((item) => {
                    const percentage = stats.total > 0 ? ((item.count / stats.total) * 100).toFixed(1) : '0'
                    return (
                      <div key={item.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[var(--color-text-primary)]">{item.category}</span>
                          <span className="text-sm text-[var(--color-text-secondary)]">{percentage}%</span>
                        </div>
                        <div className="h-2 bg-[var(--color-neutral-200)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--color-accent-primary)] transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-[var(--color-text-secondary)] text-center py-4">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Resolution Rate</h2>
              <div className="space-y-4">
                {stats.total > 0 ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-success-light)] flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-[var(--color-accent-success)]" />
                          </div>
                          <span className="font-medium text-[var(--color-text-primary)]">Resolved</span>
                        </div>
                        <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                          {((stats.resolved / stats.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 bg-[var(--color-neutral-200)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--color-accent-success)] transition-all duration-500"
                          style={{ width: `${((stats.resolved / stats.total) * 100).toFixed(1)}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-primary-light)] flex items-center justify-center">
                            <Clock className="h-4 w-4 text-[var(--color-accent-primary)]" />
                          </div>
                          <span className="font-medium text-[var(--color-text-primary)]">Open</span>
                        </div>
                        <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                          {((stats.open / stats.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 bg-[var(--color-neutral-200)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--color-accent-primary)] transition-all duration-500"
                          style={{ width: `${((stats.open / stats.total) * 100).toFixed(1)}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-warning-light)] flex items-center justify-center">
                            <Clock className="h-4 w-4 text-[var(--color-accent-warning)]" />
                          </div>
                          <span className="font-medium text-[var(--color-text-primary)]">In Progress</span>
                        </div>
                        <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                          {((stats.inProgress / stats.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 bg-[var(--color-neutral-200)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--color-accent-warning)] transition-all duration-500"
                          style={{ width: `${((stats.inProgress / stats.total) * 100).toFixed(1)}%` }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[var(--color-text-secondary)] text-center py-4">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Overdue Analysis</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--color-accent-danger-light)] border border-[var(--color-accent-danger)]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-danger)] flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">Overdue Complaints</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">Require immediate attention</p>
                      </div>
                    </div>
                    <span className="text-4xl font-bold text-[var(--color-accent-danger)]">{stats.overdue}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-[var(--color-neutral-50)]">
                    <p className="text-sm text-[var(--color-text-secondary)]">Overdue Rate</p>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                      {stats.total > 0 ? ((stats.overdue / stats.total) * 100).toFixed(1) : '0'}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-[var(--color-neutral-50)]">
                    <p className="text-sm text-[var(--color-text-secondary)]">Resolution Rate</p>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                      {stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : '0'}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}