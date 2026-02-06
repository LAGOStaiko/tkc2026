import { useMutation, useQuery } from '@tanstack/react-query'

const SITE_STALE_MS = 5 * 60 * 1000
const CONTENT_STALE_MS = 5 * 60 * 1000
const SCHEDULE_STALE_MS = 60 * 1000
const RESULTS_STALE_MS = 20 * 1000

type ApiResponse<T> = {
  ok: boolean
  data?: T
  error?: string
}

async function parseResponse<T>(
  response: Response
): Promise<ApiResponse<T> | null> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as ApiResponse<T>
  } catch {
    throw new Error('Invalid JSON response')
  }
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const response = await fetch(path, { ...init, headers })
  const payload = await parseResponse<T>(response)

  if (!response.ok) {
    const message =
      payload?.error ?? `${response.status} ${response.statusText}`.trim()
    throw new Error(message || 'Request failed')
  }

  if (!payload) {
    throw new Error('Empty response')
  }

  if (!payload.ok) {
    throw new Error(payload.error ?? 'Request failed')
  }

  return payload.data as T
}

function apiGet<T>(path: string) {
  return apiRequest<T>(path, { method: 'GET' })
}

function apiPost<T>(path: string, body: unknown) {
  return apiRequest<T>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

export function useSite<T = unknown>() {
  return useQuery({
    queryKey: ['site'],
    queryFn: () => apiGet<T>('/api/site'),
    staleTime: SITE_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useSchedule<T = unknown>() {
  return useQuery({
    queryKey: ['schedule'],
    queryFn: () => apiGet<T>('/api/schedule'),
    staleTime: SCHEDULE_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useResults<T = unknown>() {
  return useQuery({
    queryKey: ['results'],
    queryFn: () => apiGet<T>('/api/results'),
    staleTime: RESULTS_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useContent<T = unknown>(
  page: 'home' | 'console' | 'arcade' | 'contact'
) {
  const params = new URLSearchParams({ page })
  return useQuery({
    queryKey: ['content', page],
    queryFn: () => apiGet<T>(`/api/content?${params.toString()}`),
    staleTime: CONTENT_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useRegister<T = unknown, TBody = unknown>() {
  return useMutation({
    mutationFn: (body: TBody) => apiPost<T>('/api/register', body),
  })
}
