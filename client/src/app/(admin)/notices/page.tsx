'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks'
import { useNotices, useCreateNotice, useUpdateNotice, useDeleteNotice } from '@/hooks/useNotices'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent } from '@/components/ui'
import { Button, Input, Badge, Select, Textarea } from '@/components/ui'
import { Skeleton } from '@/components/ui'
import { Plus, Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Edit, Trash2, Pin, PinOff, Megaphone, Save } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const sortOptions = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'isImportant', label: 'Importance' },
]

export default function AdminNoticesPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showFilters, setShowFilters] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const page = Number(searchParams.get('page')) || 1
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const { notices, pagination, isLoading, mutate } = useNotices({ page, limit: 20 })
  const { createNotice } = useCreateNotice()
  const { updateNotice } = useUpdateNotice()
  const { deleteNotice } = useDeleteNotice()

  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editIsImportant, setEditIsImportant] = useState(false)

  const updateFilters = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    params.set('page', '1')
    router.push(`/admin/notices?${params.toString()}`)
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const content = formData.get('content') as string
    const isImportant = formData.get('isImportant') === 'on'

    setIsCreating(true)
    try {
      await createNotice({ content, isImportant })
      toast.success('Notice created successfully!')
      mutate()
      ;(e.target as HTMLFormElement).reset()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || 'Failed to create notice.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdate = async (id: number) => {
    try {
      await updateNotice(id, { content: editContent, isImportant: editIsImportant })
      toast.success('Notice updated!')
      mutate()
      setEditingId(null)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || 'Failed to update notice.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this notice?')) return
    setDeletingId(id)
    try {
      await deleteNotice(id)
      toast.success('Notice deleted')
      mutate()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || 'Failed to delete notice.')
    } finally {
      setDeletingId(null)
    }
  }

  const startEdit = (notice: { id: number; content: string; isImportant: boolean }) => {
    setEditingId(notice.id)
    setEditContent(notice.content)
    setEditIsImportant(notice.isImportant)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
    setEditIsImportant(false)
  }

  return (
    <AdminLayout user={user!} onLogout={() => {}}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Notices</h1>
            <p className="text-[var(--color-text-secondary)]">Manage announcements for residents</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Create New Notice</h3>
              <Textarea
                name="content"
                placeholder="Write your announcement here..."
                rows={3}
                required
                className="min-h-[100px]"
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isImportant"
                    className="rounded border-[var(--color-border-medium)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    Mark as important (pins to top & sends email to all residents)
                  </span>
                </label>
                <Button type="submit" loading={isCreating}>
                  <Plus className="h-4 w-4 mr-2" />Publish Notice
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full sm:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Sort' : 'Sort Options'}
              </Button>
              <div className="flex items-center gap-2">
                <Select
                  value={sortBy}
                  onChange={(value) => updateFilters({ sortBy: value })}
                  options={sortOptions}
                  className="w-auto"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilters({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
                >
                  {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y divide-[var(--color-border-light)]">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="text" lines={2} className="p-6" />
                ))}
              </div>
            ) : notices.length === 0 ? (
              <div className="p-12 text-center">
                <Megaphone className="h-12 w-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
                <p className="text-[var(--color-text-secondary)]">No notices yet</p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">Create your first announcement above</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border-light)]">
                {notices.map((notice) => (
                  <div key={notice.id} className="p-6 hover:bg-[var(--color-neutral-50)] transition-colors">
                    {editingId === notice.id ? (
                      <div className="space-y-4">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="min-h-[100px]"
                        />
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editIsImportant}
                              onChange={(e) => setEditIsImportant(e.target.checked)}
                              className="rounded border-[var(--color-border-medium)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                            />
                            <span className="text-sm text-[var(--color-text-secondary)]">Important</span>
                          </label>
                          <Button size="sm" onClick={() => handleUpdate(notice.id)}>
                            <Save className="h-4 w-4 mr-2" />Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {notice.isImportant && (
                              <Badge variant="default" className="bg-[var(--color-accent-danger-light)] text-[var(--color-accent-danger)]">
                                <Pin className="h-3 w-3 mr-1" />Pinned
                              </Badge>
                            )}
                            <span className="text-sm text-[var(--color-text-tertiary)]">
                              {formatRelativeTime(notice.createdAt)}
                            </span>
                          </div>
                          <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">{notice.content}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(notice)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notice.id)}
                            disabled={deletingId === notice.id}
                            loading={deletingId === notice.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {pagination && pagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-[var(--color-border-light)] flex items-center justify-between">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} notices
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page === 1}
                        onClick={() => router.push(`/admin/notices?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.page - 1) }).toString()}`)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => router.push(`/admin/notices?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.page + 1) }).toString()}`)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}