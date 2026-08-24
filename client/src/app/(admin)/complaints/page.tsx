'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks'
import { useAdminComplaints } from '@/hooks/useAdmin'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent } from '@/components/ui'
import { Button, Input, Select, Badge, StatusBadge, PriorityBadge, DropdownMenu, Avatar } from '@/components/ui'
import { Skeleton, TableRowSkeleton } from '@/components/ui'
import { Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MoreVertical, Flag, Edit } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'Open', label: 'Open' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
]

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Carpentry', label: 'Carpentry' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'Cleaning', label: 'Cleaning' },
  { value: 'Security', label: 'Security' },
  { value: 'Other', label: 'Other' },
]

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
]

const sortOptions = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'isOverdue', label: 'Overdue' },
]

export default function AdminComplaintsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showFilters, setShowFilters] = useState(false)

  const page = Number(searchParams.get('page')) || 1
  const status = (searchParams.get('status') as 'Open' | 'In Progress' | 'Resolved') || undefined
  const category = searchParams.get('category') || undefined
  const priority = (searchParams.get('priority') as 'Low' | 'Medium' | 'High') || undefined
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined
  const isOverdue = searchParams.get('isOverdue') ? searchParams.get('isOverdue') === 'true' : undefined
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const { complaints, pagination, isLoading } = useAdminComplaints({
    page,
    limit: 20,
    status,
    category,
    priority,
    startDate,
    endDate,
    isOverdue,
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
  })

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
    router.push(`/admin/complaints?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/admin/complaints')
  }

  const hasFilters = status || category || priority || startDate || endDate || isOverdue

  const statusItems = [
    { label: 'Open', value: 'Open' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Resolved', value: 'Resolved' },
  ]

  const priorityItems = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
  ]

  return (
    <AdminLayout user={user!} onLogout={() => {}}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">All Complaints</h1>
            <p className="text-[var(--color-text-secondary)]">Manage and track all maintenance requests</p>
          </div>
        </div>

        <Card variant="outlined">
          <CardContent className="p-4">
            <div className={cn('space-y-4', showFilters ? '' : 'hidden')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Select
                  value={status}
                  onChange={(value) => updateFilters({ status: value })}
                  options={statusOptions}
                  placeholder="Filter by status"
                />
                <Select
                  value={category}
                  onChange={(value) => updateFilters({ category: value })}
                  options={categoryOptions}
                  placeholder="Filter by category"
                />
                <Select
                  value={priority}
                  onChange={(value) => updateFilters({ priority: value })}
                  options={priorityOptions}
                  placeholder="Filter by priority"
                />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => updateFilters({ startDate: e.target.value })}
                  placeholder="From date"
                  label="Start Date"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => updateFilters({ endDate: e.target.value })}
                  placeholder="To date"
                  label="End Date"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOverdue === true}
                    onChange={(e) => updateFilters({ isOverdue: e.target.checked ? 'true' : '' })}
                    className="rounded border-[var(--color-border-medium)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)]">Show only overdue</span>
                </label>
                <Select
                  value={sortBy}
                  onChange={(value) => updateFilters({ sortBy: value })}
                  options={sortOptions}
                  placeholder="Sort by"
                  className="w-auto"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilters({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
                >
                  {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full sm:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y divide-[var(--color-border-light)]">
                {[1, 2, 3, 4, 5].map((i) => <TableRowSkeleton key={i} columns={7} />)}
              </div>
            ) : complaints.length === 0 ? (
              <div className="p-12 text-center">
                <Search className="h-12 w-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
                <p className="text-[var(--color-text-secondary)]">No complaints found</p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  {hasFilters ? 'Try adjusting your filters' : 'No complaints submitted yet'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[var(--color-neutral-50)] border-b border-[var(--color-border-light)]">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Resident</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider hidden md:table-cell">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider hidden lg:table-cell">Priority</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider hidden lg:table-cell">Overdue</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-light)]">
                      {complaints.map((complaint) => (
                        <tr
                          key={complaint.id}
                          className={cn(
                            'hover:bg-[var(--color-neutral-50)] transition-colors',
                            complaint.isOverdue && 'bg-[var(--color-accent-danger-light)]/30'
                          )}
                        >
                          <td className="px-4 py-3 font-mono text-sm text-[var(--color-text-primary)]">#{complaint.id}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={complaint.resident?.name || 'Unknown'} size="sm" src={complaint.resident?.avatar} />
                              <div>
                                <p className="font-medium text-[var(--color-text-primary)]">{complaint.resident?.name || 'Unknown'}</p>
                                <p className="text-xs text-[var(--color-text-tertiary)]">{complaint.resident?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <Badge variant="default" className="bg-[var(--color-neutral-100)] text-[var(--color-text-secondary)]">
                              {complaint.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <DropdownMenu
                              trigger={
                                <StatusBadge status={complaint.status} size="sm" className="cursor-pointer" />
                              }
                              align="right"
                              items={statusItems.map((item) => ({
                                label: item.label,
                                onClick: () => updateComplaintStatus(complaint.id, item.value as any),
                              }))}
                            />
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <DropdownMenu
                              trigger={
                                <PriorityBadge priority={complaint.priority} size="sm" className="cursor-pointer" />
                              }
                              align="right"
                              items={priorityItems.map((item) => ({
                                label: item.label,
                                onClick: () => updateComplaintPriority(complaint.id, item.value as any),
                              }))}
                            />
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {complaint.isOverdue ? (
                              <Badge variant="default" className="bg-[var(--color-accent-danger-light)] text-[var(--color-accent-danger)]">
                                <Flag className="h-3 w-3 mr-1" />Yes
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-[var(--color-accent-success-light)] text-[var(--color-accent-success)]">No</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                            {formatRelativeTime(complaint.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu
                              trigger={
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              }
                              align="right"
                              items={[
                                {
                                  label: 'View Details',
                                  onClick: () => router.push(`/admin/complaints/${complaint.id}`),
                                  icon: <Edit className="h-4 w-4" />,
                                },
                                {
                                  label: complaint.isOverdue ? 'Remove Overdue Flag' : 'Flag as Overdue',
                                  onClick: () => flagOverdue(complaint.id),
                                  icon: <Flag className="h-4 w-4" />,
                                  danger: !complaint.isOverdue,
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-[var(--color-border-light)] flex items-center justify-between">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} complaints
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page === 1}
                        onClick={() => router.push(`/admin/complaints?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.page - 1) }).toString()}`)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => router.push(`/admin/complaints?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.page + 1) }).toString()}`)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )

  function updateComplaintStatus(id: number, status: 'Open' | 'In Progress' | 'Resolved') {
    // This would call the update API
    // For now, we'll just navigate to detail page
    router.push(`/admin/complaints/${id}`)
  }

  function updateComplaintPriority(id: number, priority: 'Low' | 'Medium' | 'High') {
    router.push(`/admin/complaints/${id}`)
  }

  function flagOverdue(id: number) {
    router.push(`/admin/complaints/${id}`)
  }
}