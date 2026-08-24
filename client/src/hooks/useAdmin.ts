'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'
import type { MetricsData, Complaint, ComplaintListResponse, ComplaintFilters, UpdateComplaintInput } from '@/types'

const fetcher = (url: string) => api.get(url).then((res) => res.data)

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  return searchParams.toString()
}

export function useAdminComplaints(filters: ComplaintFilters = {}) {
  const query = buildQueryString(filters)
  const { data, error, isLoading, mutate } = useSWR<ComplaintListResponse>(
    `/admin/complaints?${query}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  )

  return {
    complaints: data?.complaints ?? [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  }
}

export function useAdminComplaint(id: number) {
  const { data, error, isLoading, mutate } = useSWR<{ complaint: Complaint }>(
    id ? `/admin/complaints/${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    complaint: data?.complaint,
    isLoading,
    isError: !!error,
    mutate,
  }
}

export function useAdminUpdateComplaint() {
  const updateComplaint = async (id: number, input: UpdateComplaintInput) => {
    const response = await api.patch<{ message: string; complaint: Complaint }>(`/admin/complaints/${id}`, input)
    return response.data
  }

  return { updateComplaint }
}

export function useAdminFlagOverdue() {
  const flagOverdue = async (id: number) => {
    const response = await api.post<{ message: string; complaint: Complaint }>(`/admin/complaints/${id}/flag-overdue`)
    return response.data
  }

  return { flagOverdue }
}

export function useMetrics() {
  const { data, error, isLoading, mutate } = useSWR<MetricsData>(
    '/admin/metrics',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  return {
    metrics: data,
    isLoading,
    isError: !!error,
    mutate,
  }
}