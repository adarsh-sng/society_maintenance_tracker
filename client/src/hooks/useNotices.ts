'use client'

import useSWR, { mutate } from 'swr'
import { api } from '@/lib/api'
import type { Notice, NoticeFilters, PaginatedResponse, CreateNoticeInput, UpdateNoticeInput } from '@/types'

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

export function useNotices(filters: NoticeFilters = {}) {
  const query = buildQueryString(filters)
  const { data, error, isLoading, mutate: mutateNotices } = useSWR<PaginatedResponse<Notice>>(
    `/notices?${query}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  )

  return {
    notices: data?.data ?? [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate: mutateNotices,
  }
}

export function useCreateNotice() {
  const createNotice = async (input: CreateNoticeInput) => {
    const response = await api.post<{ message: string; notice: Notice }>('/notices', input)
    await mutate('/notices')
    return response.data
  }

  return { createNotice }
}

export function useUpdateNotice() {
  const updateNotice = async (id: number, input: UpdateNoticeInput) => {
    const response = await api.patch<{ message: string; notice: Notice }>(`/notices/${id}`, input)
    await mutate('/notices')
    return response.data
  }

  return { updateNotice }
}

export function useDeleteNotice() {
  const deleteNotice = async (id: number) => {
    await api.delete(`/notices/${id}`)
    await mutate('/notices')
  }

  return { deleteNotice }
}