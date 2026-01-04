import { useMutation, useQuery } from '@tanstack/react-query'

export type ApiResponse<T> = {
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

async function apiRequest<T>(
  path: string,
  init: RequestInit
): Promise<T> {
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

export function apiGet<T>(path: string) {
  return apiRequest<T>(path, { method: 'GET' })
}

export function apiPost<T>(path: string, body: unknown) {
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
  })
}

export function useSchedule<T = unknown>() {
  return useQuery({
    queryKey: ['schedule'],
    queryFn: () => apiGet<T>('/api/schedule'),
  })
}

export function useResults<T = unknown>() {
  return useQuery({
    queryKey: ['results'],
    queryFn: () => apiGet<T>('/api/results'),
  })
}

export function useContent<T = unknown>(
  page: 'home' | 'console' | 'arcade' | 'contact'
) {
  const params = new URLSearchParams({ page })
  return useQuery({
    queryKey: ['content', page],
    queryFn: () => apiGet<T>(`/api/content?${params.toString()}`),
  })
}

export function useRegister<T = unknown, TBody = unknown>() {
  return useMutation({
    mutationFn: (body: TBody) => apiPost<T>('/api/register', body),
  })
}
