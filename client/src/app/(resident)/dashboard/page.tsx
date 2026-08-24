'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks'
import { useComplaints } from '@/hooks/useComplaints'
import { ResidentLayout } from '@/components/layout/ResidentLayout'
import { Card, CardContent, Button } from '@/components/ui'
import { Badge, StatusBadge, PriorityBadge } from '@/components/ui'
import { Skeleton, MetricCardSkeleton } from '@/components/ui'
import { FileText, Clock, CheckCircle, AlertTriangle, Plus, Eye } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

const statusOrder = { 'Open': 0, 'In Progress': 1, 'Resolved': 2 }

export default function ResidentDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { complaints, isLoading } = useComplaints({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })

  if (authLoading) {
    return (
      <ResidentLayout user={{ name: '', email: '', role: 'resident' }} onLogout={() => {}}>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => <MetricCardSkeleton key={i} />)}
        </div>
      </ResidentLayout>
    )
  }

  const stats = {
    open: complaints.filter((c) => c.status === 'Open').length,
    inProgress: complaints.filter((c) => c.status === 'In Progress').length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
    overdue: complaints.filter((c) => c.isOverdue).length,
  }

  const recentComplaints = [...complaints]
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <ResidentLayout user={user!} onLogout={() => {}}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Welcome back, {user?.name?.split(' ')[0] || 'Resident'}
            </h1>
            <p className="text-[var(--color-text-secondary)]">Here&apos;s an overview of your complaints</p>
          </div>
          <Link href="/complaints/new">
            <Button size="lg"><Plus className="h-4 w-4 mr-2" />New Complaint</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Overdue</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.overdue}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-danger-light)] flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-[var(--color-accent-danger)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="border-b border-[var(--color-border-light)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Recent Complaints</h2>
            </div>
            {isLoading ? (
              <div className="divide-y divide-[var(--color-border-light)]">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="text" lines={2} className="px-6 py-4" />
                ))}
              </div>
            ) : recentComplaints.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
                <p className="text-[var(--color-text-secondary)]">No complaints yet</p>
                <Link href="/complaints/new" className="mt-4 inline-block">
                  <Button variant="primary" size="sm"><Plus className="h-4 w-4 mr-2" />Submit Your First Complaint</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border-light)]">
                {recentComplaints.map((complaint) => (
                  <Link
                    key={complaint.id}
                    href={`/complaints/${complaint.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[var(--color-neutral-50)] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-medium text-[var(--color-text-primary)] truncate">{complaint.category}</h3>
                        <StatusBadge status={complaint.status} size="sm" />
                        <PriorityBadge priority={complaint.priority} size="sm" />
                        {complaint.isOverdue && (
                          <Badge variant="default" className="bg-[var(--color-accent-danger-light)] text-[var(--color-accent-danger)]">
                            <AlertTriangle className="h-3 w-3 mr-1" />Overdue
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)] truncate">{complaint.description}</p>
                      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                        Submitted {formatRelativeTime(complaint.createdAt)}
                      </p>
                    </div>
                    <Eye className="h-5 w-5 text-[var(--color-text-tertiary)] ml-4 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
            <div className="px-6 py-4 border-t border-[var(--color-border-light)]">
              <Link href="/complaints" className="text-sm text-[var(--color-text-link)] hover:underline font-medium">
                View all complaints →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResidentLayout>
  )
}