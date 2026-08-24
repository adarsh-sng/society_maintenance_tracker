'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks'
import { useComplaints } from '@/hooks/useComplaints'
import { ResidentLayout } from '@/components/layout/ResidentLayout'
import { Card, CardContent, Button } from '@/components/ui'
import { Input, Select, Badge, StatusBadge, PriorityBadge } from '@/components/ui'
import { Skeleton, TableRowSkeleton } from '@/components/ui'
import { Plus, Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
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

export default function ComplaintsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showFilters, setShowFilters] = useState(false)

  const page = Number(searchParams.get('page')) || 1
  const status = (searchParams.get('status') as 'Open' | 'In Progress' | 'Resolved') || undefined
  const category = searchParams.get('category') || undefined
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined

  const { complaints, pagination, isLoading } = useComplaints({
    page,
    limit: 10,
    status,
    category,
    startDate,
    endDate,
    sortBy: 'createdAt',
    sortOrder: 'desc',
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
    router.push(`/complaints?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/complaints')
  }

  const hasFilters = status || category || startDate || endDate

  return (
    <ResidentLayout user={user!} onLogout={() => {}}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">My Complaints</h1>
            <p className="text-[var(--color-text-secondary)]">Track and manage all your maintenance requests</p>
          </div>
          <Link href="/complaints/new">
            <Button size="lg"><Plus className="h-4 w-4 mr-2" />New Complaint</Button>
          </Link>
        </div>

        <Card variant="outlined">
          <CardContent className="p-4">
            <div className={cn('space-y-4', showFilters ? '' : 'hidden')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
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
                {[1, 2, 3, 4, 5].map((i) => <TableRowSkeleton key={i} columns={5} />)}
              </div>
            ) : complaints.length === 0 ? (
              <div className="p-12 text-center">
                <Search className="h-12 w-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
                <p className="text-[var(--color-text-secondary)]">No complaints found</p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  {hasFilters ? 'Try adjusting your filters' : 'Get started by creating your first complaint'}
                </p>
                {!hasFilters && (
                  <Link href="/complaints/new" className="mt-4 inline-block">
                    <Button variant="primary" size="sm"><Plus className="h-4 w-4 mr-2" />New Complaint</Button>
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[var(--color-neutral-50)] border-b border-[var(--color-border-light)]">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Complaint</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider hidden md:table-cell">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider hidden lg:table-cell">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider hidden lg:table-cell">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-light)]">
                      {complaints.map((complaint) => (
                        <tr key={complaint.id} className="hover:bg-[var(--color-neutral-50)] transition-colors">
                          <td className="px-6 py-4">
                            <Link href={`/complaints/${complaint.id}`} className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-text-link)]">
                              {complaint.category}
                            </Link>
                            <p className="text-sm text-[var(--color-text-secondary)] truncate max-w-xs mt-1">{complaint.description}</p>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <Badge variant="default" className="bg-[var(--color-neutral-100)] text-[var(--color-text-secondary)]">
                              {complaint.category}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <StatusBadge status={complaint.status} size="sm" />
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <PriorityBadge priority={complaint.priority} size="sm" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-[var(--color-text-secondary)]">{formatRelativeTime(complaint.createdAt)}</div>
                            <div className="text-xs text-[var(--color-text-tertiary)]">
                              {new Date(complaint.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/complaints/${complaint.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
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
                        onClick={() => router.push(`/complaints?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.page - 1) }).toString()}`)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => router.push(`/complaints?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.page + 1) }).toString()}`)}
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
    </ResidentLayout>
  )
}