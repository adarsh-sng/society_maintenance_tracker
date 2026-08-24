'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/hooks'
import { useAdminComplaint, useAdminUpdateComplaint, useAdminFlagOverdue } from '@/hooks/useAdmin'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Button, Input, Textarea, Select, Badge, StatusBadge, PriorityBadge, Avatar } from '@/components/ui'
import { Skeleton, CardSkeleton } from '@/components/ui'
import { ArrowLeft, Clock, User, MessageSquare, AlertTriangle, Flag, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime, formatRelativeTime, getStatusColor, getPriorityColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

const updateSchema = z.object({
  status: z.enum(['Open', 'In Progress', 'Resolved']).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  isOverdue: z.boolean().optional(),
  note: z.string().max(1000).optional(),
})

type UpdateForm = z.infer<typeof updateSchema>

export default function AdminComplaintDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const complaintId = Number(params.id)
  const { complaint, isLoading, isError, mutate } = useAdminComplaint(complaintId)
  const { updateComplaint } = useAdminUpdateComplaint()
  const { flagOverdue } = useAdminFlagOverdue()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showNote, setShowNote] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      status: undefined,
      priority: undefined,
      isOverdue: false,
      note: '',
    },
  })

  const watchedStatus = watch('status')
  const watchedPriority = watch('priority')
  const watchedOverdue = watch('isOverdue')

  const onSubmit = async (data: UpdateForm) => {
    if (!isDirty) return

    setIsUpdating(true)
    try {
      await updateComplaint(complaintId, data)
      toast.success('Complaint updated successfully!')
      mutate()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || 'Failed to update complaint.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleFlagOverdue = async () => {
    setIsUpdating(true)
    try {
      await flagOverdue(complaintId)
      toast.success('Complaint flagged as overdue')
      mutate()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || 'Failed to flag as overdue.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout user={user!} onLogout={() => {}}>
        <div className="max-w-3xl mx-auto space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </AdminLayout>
    )
  }

  if (isError || !complaint) {
    return (
      <AdminLayout user={user!} onLogout={() => {}}>
        <div className="max-w-3xl mx-auto text-center py-12">
          <AlertTriangle className="h-12 w-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Complaint not found</h1>
          <Link href="/admin/complaints" className="mt-4 inline-block">
            <Button variant="primary"><ArrowLeft className="h-4 w-4 mr-2" />Back to Complaints</Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const handleStatusChange = (status: 'Open' | 'In Progress' | 'Resolved') => {
    setValue('status', status)
    setShowNote(true)
  }

  const handlePriorityChange = (priority: 'Low' | 'Medium' | 'High') => {
    setValue('priority', priority)
  }

  const handleOverdueToggle = () => {
    setValue('isOverdue', !watchedOverdue)
  }

  return (
    <AdminLayout user={user!} onLogout={() => {}}>
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/admin/complaints" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
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
                      <Flag className="h-3 w-3 mr-1" />Overdue
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
                </a>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="border-t border-[var(--color-border-light)] pt-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Update Complaint</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {(['Open', 'In Progress', 'Resolved'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusChange(status)}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            watchedStatus === status || (!watchedStatus && complaint.status === status)
                              ? 'ring-2 ring-[var(--color-border-focus)]'
                              : 'bg-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-200)]'
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Priority</label>
                    <div className="flex flex-wrap gap-2">
                      {(['Low', 'Medium', 'High'] as const).map((priority) => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => handlePriorityChange(priority)}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            watchedPriority === priority || (!watchedPriority && complaint.priority === priority)
                              ? 'ring-2 ring-[var(--color-border-focus)]'
                              : 'bg-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-200)]'
                          )}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={watchedOverdue || complaint.isOverdue}
                      onChange={handleOverdueToggle}
                      className="rounded border-[var(--color-border-medium)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                    />
                    <span className="text-sm text-[var(--color-text-secondary)]">Mark as Overdue</span>
                  </label>
                </div>

                {showNote && (
                  <Textarea
                    {...register('note')}
                    label="Admin Note (Optional)"
                    placeholder="Add a note about this update..."
                    rows={3}
                  />
                )}

                <div className="flex gap-3 pt-4 border-t border-[var(--color-border-light)]">
                  <Button type="submit" disabled={!isDirty || isUpdating} loading={isUpdating}>
                    {isUpdating ? (
                      <> <Loader2 className="h-4 w-4" /> Saving...</>
                    ) : (
                      <> <Save className="h-4 w-4 mr-2" />Save Changes</>
                    )}
                  </Button>
                  {complaint.status !== 'Resolved' && !complaint.isOverdue && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleFlagOverdue}
                      disabled={isUpdating}
                      loading={isUpdating}
                    >
                      <Flag className="h-4 w-4 mr-2" />Flag as Overdue
                    </Button>
                  )}
                </div>
              </div>
            </form>

            <div className="border-t border-[var(--color-border-light)] pt-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Status History</h3>
              {complaint.history && complaint.history.length > 0 ? (
                <div className="space-y-4">
                  {complaint.history.map((entry) => (
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
    </AdminLayout>
  )
}