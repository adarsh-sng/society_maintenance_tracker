'use client'

import useSWR, { mutate } from 'swr'
import { api } from '@/lib/api'
import type { Complaint, ComplaintFilters, PaginatedResponse, CreateComplaintInput, UpdateComplaintInput } from '@/types'

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

export function useComplaints(filters: ComplaintFilters = {}) {
  const query = buildQueryString(filters)
  const { data, error, isLoading, mutate: mutateComplaints } = useSWR<PaginatedResponse<Complaint>>(
    `/complaints?${query}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  )

  return {
    complaints: data?.data ?? [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate: mutateComplaints,
  }
}

export function useComplaint(id: number) {
  const { data, error, isLoading, mutate: mutateComplaint } = useSWR<{ complaint: Complaint }>(
    id ? `/complaints/${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    complaint: data?.complaint,
    isLoading,
    isError: !!error,
    mutate: mutateComplaint,
  }
}

export function useCreateComplaint() {
  const createComplaint = async (input: CreateComplaintInput) => {
    const formData = new FormData()
    formData.append('category', input.category)
    formData.append('description', input.description)
    if (input.photo) {
      formData.append('photo', input.photo)
    }

    const response = await api.post<{ message: string; complaint: Complaint }>('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    await mutate('/complaints')
    return response.data
  }

  return { createComplaint }
}

export function useUpdateComplaint() {
  const updateComplaint = async (id: number, input: UpdateComplaintInput) => {
    const response = await api.patch<{ message: string; complaint: Complaint }>(`/admin/complaints/${id}`, input)
    await mutate('/complaints')
    await mutate(`/complaints/${id}`)
    return response.data
  }

  return { updateComplaint }
}

export function useFlagOverdue() {
  const flagOverdue = async (id: number) => {
    const response = await api.post<{ message: string; complaint: Complaint }>(`/admin/complaints/${id}/flag-overdue`)
    await mutate('/complaints')
    await mutate(`/complaints/${id}`)
    return response.data
  }

  return { flagOverdue }
}