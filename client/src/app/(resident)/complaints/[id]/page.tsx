'use client'

import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks'
import { useComplaint } from '@/hooks/useComplaints'
import { ResidentLayout } from '@/components/layout/ResidentLayout'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import { Badge, StatusBadge, PriorityBadge, Avatar } from '@/components/ui'
import { Skeleton, CardSkeleton } from '@/components/ui'
import { ArrowLeft, Image, Clock, User, MessageSquare, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'

export default function ComplaintDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const complaintId = Number(params.id)
  const { complaint, isLoading, isError } = useComplaint(complaintId)

  if (isLoading) {
    return (
      <ResidentLayout user={user!} onLogout={() => {}}>
        <div className="max-w-3xl mx-auto space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </ResidentLayout>
    )
  }

  if (isError || !complaint) {
    return (
      <ResidentLayout user={user!} onLogout={() => {}}>
        <div className="max-w-3xl mx-auto text-center py-12">
          <AlertTriangle className="h-12 w-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Complaint not found</h1>
          <p className="text-[var(--color-text-secondary)] mt-2">The complaint you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/complaints" className="mt-4 inline-block">
            <Button variant="primary"><ArrowLeft className="h-4 w-4 mr-2" />Back to Complaints</Button>
          </Link>
        </div>
      </ResidentLayout>
    )
  }

  return (
    <ResidentLayout user={user!} onLogout={() => {}}>
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/complaints" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Complaints
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{complaint.category}</h1>
                  <StatusBadge status={complaint.status} />
                  <PriorityBadge priority={complaint.priority} />
                  {complaint.isOverdue && (
                    <Badge variant="default" className="bg-[var(--color-accent-danger-light)] text-[var(--color-accent-danger)]">
                      <AlertTriangle className="h-3 w-3 mr-1" />Overdue
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Submitted {formatRelativeTime(complaint.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {complaint.resident?.name || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-[var(--color-neutral-50)] rounded-lg">
              <h3 className="font-medium text-[var(--color-text-primary)] mb-2">Description</h3>
              <p className="text-[var(--color-text-secondary)] whitespace-pre-wrap">{complaint.description}</p>
            </div>

            {complaint.photoUrl && (
              <div>
                <h3 className="font-medium text-[var(--color-text-primary)] mb-2">Attached Photo</h3>
                <a href={complaint.photoUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={complaint.photoUrl}
                    alt="Complaint photo"
                    className="max-w-full h-auto rounded-lg border border-[var(--color-border-light)] cursor-zoom-in"
                  />
                  <p className="mt-1 text-sm text-[var(--color-text-tertiary)] flex items-center gap-1">
                    <Image className="h-4 w-4" /> Click to view full size
                  </p>
                </a>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Status History</h3>
              {complaint.history && complaint.history.length > 0 ? (
                <div className="space-y-4">
                  {complaint.history.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="relative pl-6 pb-4 border-l-2 border-[var(--color-border-light)] last:border-0"
                    >
                      <div className="absolute left-[-6px] top-0 w-3 h-3 rounded-full bg-[var(--color-accent-primary)] border-2 border-[var(--color-bg-card)]" />
                      <div className="flex items-start gap-3">
                        <Avatar
                          name={entry.actor?.name || 'Unknown'}
                          size="sm"
                          src={entry.actor?.avatar}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-[var(--color-text-primary)]">
                              {entry.actor?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-[var(--color-text-tertiary)]">
                              {entry.actor?.role === 'admin' ? 'Admin' : 'Resident'}
                            </span>
                            <StatusBadge status={entry.newStatus} size="sm" />
                          </div>
                          <div className="mt-1 text-sm text-[var(--color-text-secondary)]">
                            {formatDateTime(entry.timestamp)}
                          </div>
                          {entry.note && (
                            <div className="mt-2 p-3 bg-[var(--color-neutral-50)] rounded-lg">
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                <span className="font-medium text-[var(--color-text-primary)]">Note:</span>{' '}
                                {entry.note}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--color-text-secondary)]">No history available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ResidentLayout>
  )
}