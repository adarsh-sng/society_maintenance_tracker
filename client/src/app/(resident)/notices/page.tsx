'use client'

import { useAuth } from '@/hooks'
import { useNotices } from '@/hooks/useNotices'
import { ResidentLayout } from '@/components/layout/ResidentLayout'
import { Card, CardContent } from '@/components/ui'
import { Badge, Avatar } from '@/components/ui'
import { Skeleton } from '@/components/ui'
import { Megaphone, Clock, Pin, AlertTriangle } from 'lucide-react'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'

export default function NoticesPage() {
  const { user } = useAuth()
  const { notices, isLoading } = useNotices({ page: 1, limit: 20 })

  return (
    <ResidentLayout user={user!} onLogout={() => {}}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-primary-light)] flex items-center justify-center">
            <Megaphone className="h-6 w-6 text-[var(--color-accent-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Notice Board</h1>
            <p className="text-[var(--color-text-secondary)]">Announcements from society management</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <Skeleton lines={3} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Megaphone className="h-12 w-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No notices yet</h3>
              <p className="text-[var(--color-text-secondary)]">Check back later for announcements from management</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <Card key={notice.id} variant={notice.isImportant ? 'elevated' : 'outlined'}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--color-neutral-100)] flex items-center justify-center">
                      {notice.isImportant ? (
                        <AlertTriangle className="h-5 w-5 text-[var(--color-accent-danger)]" />
                      ) : (
                        <Megaphone className="h-5 w-5 text-[var(--color-text-tertiary)]" />
                      )}
                    </div>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ResidentLayout>
  )
}