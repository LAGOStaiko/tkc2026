import { useMutation, useQuery } from '@tanstack/react-query'

const SITE_STALE_MS = 5 * 60 * 1000
const CONTENT_STALE_MS = 5 * 60 * 1000
const SCHEDULE_STALE_MS = 60 * 1000
const RESULTS_STALE_MS = 60 * 1000
const SONGS_STALE_MS = 30 * 1000
const SONG_POOLS_STALE_MS = 30 * 1000
const PERSIST_PREFIX = 'tkc2026:api-cache:v1:'

type ApiResponse<T> = {
  ok: boolean
  data?: T
  error?: string
}

type PersistedCache<T> = {
  data: T
  updatedAt: number
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readPersistedCache<T>(key: string): PersistedCache<T> | null {
  if (!canUseStorage()) return null

  try {
    const raw = window.localStorage.getItem(`${PERSIST_PREFIX}${key}`)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<PersistedCache<T>>
    if (!parsed || typeof parsed.updatedAt !== 'number' || !('data' in parsed)) {
      return null
    }

    return {
      data: parsed.data as T,
      updatedAt: parsed.updatedAt,
    }
  } catch {
    return null
  }
}

function writePersistedCache<T>(key: string, data: T) {
  if (!canUseStorage()) return

  try {
    const payload: PersistedCache<T> = {
      data,
      updatedAt: Date.now(),
    }
    window.localStorage.setItem(`${PERSIST_PREFIX}${key}`, JSON.stringify(payload))
  } catch {
    // Ignore storage quota/private mode errors.
  }
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
  const persisted = readPersistedCache<T>('site')

  return useQuery({
    queryKey: ['site'],
    queryFn: async () => {
      const data = await apiGet<T>('/api/site')
      writePersistedCache('site', data)
      return data
    },
    initialData: persisted?.data,
    initialDataUpdatedAt: persisted?.updatedAt,
    staleTime: SITE_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useSchedule<T = unknown>() {
  const persisted = readPersistedCache<T>('schedule')

  return useQuery({
    queryKey: ['schedule'],
    queryFn: async () => {
      const data = await apiGet<T>('/api/schedule')
      writePersistedCache('schedule', data)
      return data
    },
    initialData: persisted?.data,
    initialDataUpdatedAt: persisted?.updatedAt,
    staleTime: SCHEDULE_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useResults<T = unknown>() {
  const persisted = readPersistedCache<T>('results')

  return useQuery({
    queryKey: ['results'],
    queryFn: async () => {
      const data = await apiGet<T>('/api/results')
      writePersistedCache('results', data)
      return data
    },
    initialData: persisted?.data,
    initialDataUpdatedAt: persisted?.updatedAt,
    staleTime: RESULTS_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useContent<T = unknown>(
  page: 'home' | 'console' | 'arcade' | 'contact'
) {
  const params = new URLSearchParams({ page })
  const persisted = readPersistedCache<T>(`content:${page}`)

  return useQuery({
    queryKey: ['content', page],
    queryFn: async () => {
      const data = await apiGet<T>(`/api/content?${params.toString()}`)
      writePersistedCache(`content:${page}`, data)
      return data
    },
    initialData: persisted?.data,
    initialDataUpdatedAt: persisted?.updatedAt,
    staleTime: CONTENT_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useSongs<T = unknown>() {
  const persisted = readPersistedCache<T>('songs')

  return useQuery({
    queryKey: ['songs'],
    queryFn: async () => {
      const data = await apiGet<T>('/api/songs')
      writePersistedCache('songs', data)
      return data
    },
    initialData: persisted?.data,
    initialDataUpdatedAt: persisted?.updatedAt,
    staleTime: SONGS_STALE_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export function useSongPools<T = unknown>() {
  const persisted = readPersistedCache<T>('songPools')

  return useQuery({
    queryKey: ['songPools'],
    queryFn: async () => {
      const data = await apiGet<T>('/api/song-pools')
      writePersistedCache('songPools', data)
      return data
    },
    initialData: persisted?.data,
    initialDataUpdatedAt: persisted?.updatedAt,
    staleTime: SONG_POOLS_STALE_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export function useRegister<T = unknown, TBody = unknown>() {
  return useMutation({
    mutationFn: (body: TBody) => apiPost<T>('/api/register', body),
  })
}
