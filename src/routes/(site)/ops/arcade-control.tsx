import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  SWISS_SONG_POOL,
  buildSongOptions,
  parseSongOption,
  parseSongTitle,
} from '@/content/swiss-song-pool'
import {
  buildCurrentFinalMatchDraft,
  buildCurrentSwissMatchDraft,
  buildFinalsProgress,
  buildInitialDraft,
  buildNextFinalMatchDraft,
  buildNextSwissMatchDraft,
  buildOpsUpsertPayload,
  buildRegionParticipants,
  buildRegionFinalRanking,
  buildRegionWeekStatuses,
  buildSwissProgress,
  OPS_STAGE_DEFINITIONS,
  type OpsProgressMatch,
  type OpsRegionKey,
  type OpsStageKey,
} from '@/lib/arcade-ops'
import {
  getRegionByKey,
  resolveArcadeSeasonArchive,
} from '@/lib/arcade-results-archive'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export const Route = createFileRoute('/(site)/ops/arcade-control')({
  component: ArcadeOpsControlPage,
})

/* ──────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────── */

const DEFAULT_SEASON = '2026'
const DEFAULT_REGION: OpsRegionKey = 'seoul'
const REFRESH_MS = 5000
const RETRYABLE_HTTP_STATUS = new Set([429, 500, 502, 503, 504])
const READ_ONLY_POST_PATHS = new Set([
  '/api/ops/validate',
  '/api/ops/snapshots',
  '/api/ops/publish-log',
])

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })

const OPS_STAGE_ORDER: OpsStageKey[] = [
  'online',
  'swissMatch',
  'swissStanding',
  'decider',
  'seeding',
  'qualifier',
  'finalA',
  'finalB',
  'finalMatch',
]

type ApiEnvelope = {
  ok?: boolean
  data?: unknown
  error?: string
}

type OpsPanel = 'validate' | 'rollback' | 'log' | 'utility' | null

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

function isAbortError(err: unknown) {
  if (!err || typeof err !== 'object') return false
  if (!('name' in err)) return false
  return String((err as { name?: unknown }).name) === 'AbortError'
}

async function requestOpsApi(
  path: string,
  method: 'GET' | 'POST',
  body: unknown,
  operatorKey: string,
  options?: { signal?: AbortSignal }
) {
  const basePath = path.split('?')[0] || path
  const isReadOnly =
    method === 'GET' ||
    (method === 'POST' && READ_ONLY_POST_PATHS.has(basePath))

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (method !== 'GET') headers['Content-Type'] = 'application/json'
  if (operatorKey.trim()) headers['X-OPS-Key'] = operatorKey.trim()

  const maxAttempts = isReadOnly ? 2 : 1
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(path, {
        method,
        headers,
        body: method === 'GET' ? undefined : JSON.stringify(body),
        signal: options?.signal,
      })
      const payload = (await response
        .json()
        .catch(() => null)) as ApiEnvelope | null

      if (response.ok && payload?.ok) {
        return payload.data
      }

      const statusLabel = `${response.status} ${response.statusText}`.trim()
      const payloadMessage = payload?.error ? String(payload.error).trim() : ''
      const message = payloadMessage
        ? `${payloadMessage} (${statusLabel})`
        : statusLabel

      if (attempt < maxAttempts && RETRYABLE_HTTP_STATUS.has(response.status)) {
        await wait(250 * attempt)
        continue
      }

      throw new Error(message)
    } catch (err) {
      if (isAbortError(err)) throw err
      if (attempt < maxAttempts) {
        await wait(250 * attempt)
        continue
      }
      throw err instanceof Error ? err : new Error('Request failed')
    }
  }

  throw new Error('Request failed')
}

function matchShort(match?: OpsProgressMatch) {
  if (!match) return '없음'
  return match.label
}

type BulkSwissSeedRow = {
  table: number
  p1EntryId: string
  p2EntryId?: string
  note?: string
}

function parseBulkSwissLines(source: string): BulkSwissSeedRow[] {
  const rows: BulkSwissSeedRow[] = []
  const usedTables = new Set<number>()

  source.split(/\r?\n/g).forEach((line, index) => {
    const text = line.trim()
    if (!text || text.startsWith('#')) return

    const parts = (text.includes(',') ? text.split(',') : text.split(/\s+/g))
      .map((part) => part.trim())
      .filter((part) => part.length > 0)

    if (parts.length < 3) {
      throw new Error(
        `Invalid line ${index + 1}. Use: table,p1EntryId,p2EntryId[,note]`
      )
    }

    const table = Number(parts[0])
    if (!Number.isInteger(table) || table <= 0) {
      throw new Error(`Invalid table number at line ${index + 1}`)
    }
    if (usedTables.has(table)) {
      throw new Error(`Duplicate table ${table} in pre-draw lines`)
    }
    usedTables.add(table)

    const p1EntryId = parts[1]
    const p2Token = parts[2]
    const isBye = p2Token === '-' || p2Token.toLowerCase() === 'bye'

    rows.push({
      table,
      p1EntryId,
      p2EntryId: isBye ? undefined : p2Token,
      note: parts.length > 3 ? parts.slice(3).join(', ') : undefined,
    })
  })

  if (rows.length === 0) {
    throw new Error('No pre-draw lines found')
  }

  return rows.sort((a, b) => a.table - b.table)
}

/* ──────────────────────────────────────────────
   Ops Combobox (searchable dropdown)
   ────────────────────────────────────────────── */

function OpsCombobox({
  displayValue,
  options,
  onSelect,
  placeholder = '선택',
  searchPlaceholder = '검색...',
  emptyLabel = '결과 없음',
  priorityOptions,
  priorityLabel,
}: {
  displayValue: string
  options: { value: string; label: string }[]
  onSelect: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyLabel?: string
  priorityOptions?: { value: string; label: string }[]
  priorityLabel?: string
}) {
  const [open, setOpen] = useState(false)

  const hasPriority = priorityOptions && priorityOptions.length > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className={`flex min-h-[44px] w-full items-center justify-between rounded-md border border-white/[0.12] bg-transparent px-3 text-left text-base transition-colors hover:bg-white/[0.04] ${
            displayValue ? 'text-white' : 'text-white/30'
          }`}
        >
          <span className='truncate'>{displayValue || placeholder}</span>
          <span className='ml-2 shrink-0 text-xs text-white/20'>▾</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[var(--radix-popover-trigger-width)] p-0'
        align='start'
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className='text-base' />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            {hasPriority ? (
              <>
                <CommandGroup heading={priorityLabel || '선수 선곡'}>
                  {priorityOptions.map((opt) => (
                    <CommandItem
                      key={`pri-${opt.value}`}
                      value={opt.label}
                      onSelect={() => {
                        onSelect(opt.value)
                        setOpen(false)
                      }}
                      className='min-h-[40px]'
                    >
                      <span className='mr-1.5 text-[#ff2a00]'>★</span>
                      {opt.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading='전체 곡 풀'>
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => {
                        onSelect(opt.value)
                        setOpen(false)
                      }}
                      className='min-h-[40px]'
                    >
                      {opt.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : (
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => {
                      onSelect(opt.value)
                      setOpen(false)
                    }}
                    className='min-h-[40px]'
                  >
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/* ──────────────────────────────────────────────
   Swiss Song Card
   ────────────────────────────────────────────── */

function SwissSongCard({
  badge,
  songField,
  levelField,
  p1ScoreField,
  p2ScoreField,
  p1Label,
  p2Label,
  draft,
  setDraftField,
  dim,
  songOptions,
  prioritySongs,
  priorityLabel,
}: {
  badge: string
  songField: string
  levelField: string
  p1ScoreField: string
  p2ScoreField: string
  p1Label: string
  p2Label: string
  draft: Record<string, string>
  setDraftField: (name: string, value: string) => void
  dim?: boolean
  songOptions?: { value: string; label: string }[]
  prioritySongs?: { value: string; label: string }[]
  priorityLabel?: string
}) {
  const hasContent =
    draft[songField]?.trim() ||
    draft[p1ScoreField]?.trim() ||
    draft[p2ScoreField]?.trim()
  const isDim = dim && !hasContent

  return (
    <div
      className={`rounded-xl border border-white/[0.08] bg-black/25 p-4 transition-opacity ${isDim ? 'opacity-30 focus-within:opacity-100' : ''}`}
    >
      <div className='mb-3.5 space-y-2'>
        <div className='flex items-center gap-2.5'>
          <span className='flex-shrink-0 rounded-md border border-[#ff2a00]/15 bg-[#ff2a00]/10 px-2.5 py-1.5 text-xs font-bold text-[#ff2a00]'>
            {badge}
          </span>
          {draft[levelField] ? (
            <span className='font-mono text-xs text-white/30'>
              ★{draft[levelField]}
            </span>
          ) : null}
        </div>
        {songOptions && songOptions.length > 0 ? (
          <OpsCombobox
            displayValue={draft[songField] ?? ''}
            options={songOptions}
            onSelect={(val) => {
              const opt = parseSongOption(val)
              if (opt) {
                setDraftField(songField, opt.title)
                setDraftField(levelField, String(opt.level))
              }
            }}
            placeholder='곡 검색...'
            searchPlaceholder='곡명으로 검색'
            priorityOptions={prioritySongs}
            priorityLabel={priorityLabel}
          />
        ) : (
          <div className='flex items-center gap-2.5'>
            <Input
              value={draft[songField] ?? ''}
              onChange={(e) => setDraftField(songField, e.target.value)}
              placeholder='곡명'
              className='min-h-[44px] flex-1 text-base'
            />
            <Input
              value={draft[levelField] ?? ''}
              onChange={(e) => setDraftField(levelField, e.target.value)}
              placeholder='Lv'
              className='min-h-[44px] w-16 text-center text-base'
            />
          </div>
        )}
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1.5'>
          <span className='text-[11px] font-semibold text-white/25'>
            {p1Label}
          </span>
          <Input
            type='number'
            inputMode='numeric'
            value={draft[p1ScoreField] ?? ''}
            onChange={(e) => setDraftField(p1ScoreField, e.target.value)}
            placeholder='—'
            className='min-h-[48px] text-right font-mono text-lg font-medium'
          />
        </div>
        <div className='space-y-1.5'>
          <span className='text-[11px] font-semibold text-white/25'>
            {p2Label}
          </span>
          <Input
            type='number'
            inputMode='numeric'
            value={draft[p2ScoreField] ?? ''}
            onChange={(e) => setDraftField(p2ScoreField, e.target.value)}
            placeholder='—'
            className='min-h-[48px] text-right font-mono text-lg font-medium'
          />
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */

function ArcadeOpsControlPage() {
  /* ── core state ── */
  const [operatorKey, setOperatorKey] = useState('')
  const [season, setSeason] = useState(DEFAULT_SEASON)
  const [region, setRegion] = useState<OpsRegionKey>(DEFAULT_REGION)
  const [stage, setStage] = useState<OpsStageKey>('swissMatch')
  const [draft, setDraft] = useState<Record<string, string>>(
    buildInitialDraft('swissMatch')
  )

  /* ── UI state ── */
  const [showSettings, setShowSettings] = useState(false)
  const [opsPanel, setOpsPanel] = useState<OpsPanel>(null)

  /* ── action flags ── */
  const [isSaving, setIsSaving] = useState(false)
  const [isInitRunning, setIsInitRunning] = useState(false)
  const [isGuideRunning, setIsGuideRunning] = useState(false)
  const [exportReplaceMode, setExportReplaceMode] = useState(false)

  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    errors: { sheet: string; rule: string; message: string; row?: number }[]
    warnings: { sheet: string; rule: string; message: string; row?: number }[]
    summary: { sheet: string; target: string; rows: number }[]
  } | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [snapshots, setSnapshots] = useState<
    {
      snapshotId: string
      createdAt: string
      publishId: string
      totalRows: number
      sheets: { sheet: string; rows: number }[]
    }[]
  >([])
  const [selectedSnapshotId, setSelectedSnapshotId] = useState('')
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false)
  const [isBulkSeeding, setIsBulkSeeding] = useState(false)

  const [bulkRound, setBulkRound] = useState('1')
  const [bulkSong1, setBulkSong1] = useState('')
  const [bulkLevel1, setBulkLevel1] = useState('')
  const [bulkSong2, setBulkSong2] = useState('')
  const [bulkLevel2, setBulkLevel2] = useState('')
  const [bulkSong3, setBulkSong3] = useState('')
  const [bulkLevel3, setBulkLevel3] = useState('')
  const [bulkLines, setBulkLines] = useState('')

  const [infoMessage, setInfoMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [feedRaw, setFeedRaw] = useState<unknown>(null)
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedError, setFeedError] = useState('')
  const [lastFeedAt, setLastFeedAt] = useState('')
  const feedRequestIdRef = useRef(0)
  const feedInFlightRef = useRef(false)
  const feedAbortRef = useRef<AbortController | null>(null)
  const feedErrorStreakRef = useRef(0)
  const nextFeedRetryAtRef = useRef(0)

  const [publishMeta, setPublishMeta] = useState<{
    lastPublishId: string
    lastPublishedAt: string
    lastCommitId: string
    lastCommittedAt: string
  } | null>(null)
  const [publishLog, setPublishLog] = useState<Record<string, unknown>[]>([])
  const [isLoadingLog, setIsLoadingLog] = useState(false)

  /* ── derived ── */
  const stageDef = OPS_STAGE_DEFINITIONS[stage]

  const archive = useMemo(() => resolveArcadeSeasonArchive(feedRaw), [feedRaw])
  const weekStatuses = useMemo(
    () => buildRegionWeekStatuses(archive),
    [archive]
  )
  const regionArchive = useMemo(
    () => getRegionByKey(archive, region),
    [archive, region]
  )
  const swissProgress = useMemo(
    () => buildSwissProgress(regionArchive),
    [regionArchive]
  )
  const finalsProgress = useMemo(() => buildFinalsProgress(archive), [archive])
  const regionParticipants = useMemo(
    () => buildRegionParticipants(regionArchive),
    [regionArchive]
  )

  const participantByEntryId = useMemo(() => {
    return new Map(
      regionParticipants.map(
        (participant) => [participant.entryId, participant] as const
      )
    )
  }, [regionParticipants])

  const finalRanking = useMemo(() => {
    if (!regionArchive) return []
    return buildRegionFinalRanking(regionArchive).map((row) => ({
      ...row,
      cardNo: participantByEntryId.get(row.entryId)?.cardNo,
    }))
  }, [regionArchive, participantByEntryId])

  const songOptions = useMemo(() => buildSongOptions(SWISS_SONG_POOL), [])

  const playerOptions = useMemo(
    () =>
      regionParticipants.map((p) => ({
        value: p.entryId,
        label: `${p.nickname}${p.cardNo ? ` · 북${p.cardNo}` : ''} (${p.entryId})${p.seed != null ? ` #${p.seed}` : ''}`,
      })),
    [regionParticipants]
  )

  const buildPlayerSongPriority = useCallback(
    (entryId?: string) => {
      if (!entryId) return []
      const p = participantByEntryId.get(entryId.trim())
      if (!p?.offlineSongs || p.offlineSongs.length === 0) return []
      // Try exact match first (title|difficulty|level), then fallback to title-only match
      const songSet = new Set(p.offlineSongs)
      const titleSet = new Set(p.offlineSongs.map(parseSongTitle))
      return songOptions.filter(
        (opt) => songSet.has(opt.value) || titleSet.has(opt.title)
      )
    },
    [participantByEntryId, songOptions]
  )

  const p1SongPriority = useMemo(
    () => buildPlayerSongPriority(draft.p1EntryId),
    [buildPlayerSongPriority, draft.p1EntryId]
  )
  const p2SongPriority = useMemo(
    () => buildPlayerSongPriority(draft.p2EntryId),
    [buildPlayerSongPriority, draft.p2EntryId]
  )

  const isSequentialStage = stage === 'swissMatch' || stage === 'finalMatch'
  const stageCurrent =
    stage === 'swissMatch'
      ? swissProgress.current
      : stage === 'finalMatch'
        ? finalsProgress.current
        : undefined
  const stageNext =
    stage === 'swissMatch'
      ? swissProgress.next
      : stage === 'finalMatch'
        ? finalsProgress.next
        : undefined
  const stagePrevious =
    stage === 'swissMatch'
      ? swissProgress.previous
      : stage === 'finalMatch'
        ? finalsProgress.previous
        : undefined
  const currentSwissRound = useMemo(() => {
    if (!regionArchive || regionArchive.swissMatches.length === 0) return null
    const unresolved = regionArchive.swissMatches.find(
      (match) => !match.winnerEntryId
    )
    if (unresolved) return unresolved.round
    const rounds = regionArchive.swissMatches.map((match) => match.round)
    return rounds.length > 0 ? Math.max(...rounds) : null
  }, [regionArchive])

  const winnerOptions = useMemo(() => {
    if (stage === 'swissMatch') {
      return [
        {
          entryId: draft.p1EntryId?.trim() ?? '',
          nickname: draft.p1Nickname?.trim() ?? draft.p1EntryId?.trim() ?? '',
        },
        {
          entryId: draft.p2EntryId?.trim() ?? '',
          nickname: draft.p2Nickname?.trim() ?? draft.p2EntryId?.trim() ?? '',
        },
      ].filter((row) => row.entryId)
    }
    if (stage === 'finalMatch') {
      return [
        {
          entryId: draft.leftEntryId?.trim() ?? '',
          nickname:
            draft.leftNickname?.trim() ?? draft.leftEntryId?.trim() ?? '',
        },
        {
          entryId: draft.rightEntryId?.trim() ?? '',
          nickname:
            draft.rightNickname?.trim() ?? draft.rightEntryId?.trim() ?? '',
        },
      ].filter((row) => row.entryId)
    }
    return []
  }, [draft, stage])

  const broadcastUrl = useMemo(
    () =>
      `/ops/arcade-broadcast?season=${encodeURIComponent(season)}&region=${region}`,
    [season, region]
  )

  /* ── draft helpers ── */
  const setDraftField = (name: string, value: string) => {
    setDraft((prev) => ({ ...prev, [name]: value }))
  }

  const handlePlayerSelect = (prefix: 'p1' | 'p2', entryId: string) => {
    const p = participantByEntryId.get(entryId)
    if (!p) return
    setDraft((prev) => {
      const next = { ...prev }
      next[`${prefix}EntryId`] = p.entryId
      next[`${prefix}Nickname`] = p.nickname
      if (p.seed != null) next[`${prefix}Seed`] = String(p.seed)
      if (p.cardNo) next[`${prefix}CardNo`] = p.cardNo
      if (p.qualifierRegion) next[`${prefix}QualRegion`] = p.qualifierRegion
      const otherPrefix = prefix === 'p1' ? 'p2' : 'p1'
      const otherEntryId = next[`${otherPrefix}EntryId`]?.trim()
      if (otherEntryId) {
        const other = participantByEntryId.get(otherEntryId)
        const thisSeed = p.seed ?? Number.MAX_SAFE_INTEGER
        const otherSeed = other?.seed ?? Number.MAX_SAFE_INTEGER
        next.highSeedEntryId = thisSeed <= otherSeed ? p.entryId : otherEntryId
      } else {
        next.highSeedEntryId = p.entryId
      }
      return next
    })
  }

  const applyTemplate = useCallback(
    (template: Record<string, string>) => {
      setDraft({
        ...buildInitialDraft(stage),
        ...template,
      })
    },
    [stage]
  )

  const resetDraft = useCallback(() => {
    setDraft(buildInitialDraft(stage))
  }, [stage])

  useEffect(() => {
    setDraft(buildInitialDraft(stage))
  }, [stage])

  useEffect(() => {
    if (stage !== 'swissMatch') return
    if (bulkRound.trim().length > 0) return
    setBulkRound(String(currentSwissRound ?? 1))
  }, [bulkRound, currentSwissRound, stage])

  /* ── feed polling ── */
  const fetchFeed = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force === true
      const key = operatorKey.trim()
      const now = Date.now()

      if (!key) {
        if (force) {
          setFeedError('운영자 키를 입력해야 피드를 조회할 수 있습니다.')
        }
        return null
      }

      if (feedInFlightRef.current) {
        if (!force) return null
        feedAbortRef.current?.abort()
      }
      if (!force && now < nextFeedRetryAtRef.current) return null

      feedInFlightRef.current = true
      const requestId = (feedRequestIdRef.current += 1)
      const controller = new AbortController()
      feedAbortRef.current = controller

      try {
        setFeedLoading(true)
        setFeedError('')

        const params = new URLSearchParams({
          season: season.trim() || DEFAULT_SEASON,
          region,
        })

        const data = await requestOpsApi(
          `/api/ops/feed?${params.toString()}`,
          'GET',
          null,
          key,
          { signal: controller.signal }
        )

        if (feedRequestIdRef.current !== requestId) return null

        setFeedRaw(data ?? null)
        setLastFeedAt(new Date().toLocaleTimeString('ko-KR', { hour12: false }))
        const feedData = data as Record<string, unknown> | null
        if (feedData?.publishMeta) {
          setPublishMeta(
            feedData.publishMeta as {
              lastPublishId: string
              lastPublishedAt: string
              lastCommitId: string
              lastCommittedAt: string
            }
          )
        }

        feedErrorStreakRef.current = 0
        nextFeedRetryAtRef.current = 0
        return data
      } catch (err) {
        if (feedRequestIdRef.current !== requestId) return null
        if (isAbortError(err)) return null

        feedErrorStreakRef.current += 1
        const backoffMs = Math.min(
          30000,
          1000 * 2 ** Math.min(feedErrorStreakRef.current, 4)
        )
        nextFeedRetryAtRef.current = Date.now() + backoffMs

        const baseMessage =
          err instanceof Error ? err.message : '송출 데이터 조회 실패'
        setFeedError(
          `${baseMessage} (자동 재시도 ${Math.ceil(backoffMs / 1000)}초 후)`
        )
        return null
      } finally {
        if (feedRequestIdRef.current === requestId) {
          feedAbortRef.current = null
          feedInFlightRef.current = false
          setFeedLoading(false)
        }
      }
    },
    [operatorKey, region, season]
  )

  useEffect(() => {
    if (!operatorKey.trim()) return
    void fetchFeed({ force: true })
    const timer = window.setInterval(() => {
      void fetchFeed()
    }, REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [fetchFeed, operatorKey])

  /* ── handlers ── */
  const validateRequiredFields = () => {
    for (const field of stageDef.fields) {
      if (!field.required) continue
      const value = draft[field.name]
      if (!value || value.trim().length === 0) {
        throw new Error(`필수 항목 누락: ${field.label}`)
      }
    }
  }

  const handleLoadCurrentMatch = () => {
    if (stage === 'swissMatch') {
      const template = buildCurrentSwissMatchDraft(regionArchive)
      if (!template) {
        setErrorMessage('현재 진행중인 Swiss 경기가 없습니다.')
        return
      }
      applyTemplate(template)
      setInfoMessage('현재 Swiss 경기 정보를 입력폼에 불러왔습니다.')
      setErrorMessage('')
      return
    }
    if (stage === 'finalMatch') {
      const template = buildCurrentFinalMatchDraft(archive)
      if (!template) {
        setErrorMessage('현재 진행중인 Top8 경기가 없습니다.')
        return
      }
      applyTemplate(template)
      setInfoMessage('현재 Top8 경기 정보를 입력폼에 불러왔습니다.')
      setErrorMessage('')
    }
  }

  const handleLoadNextMatch = () => {
    if (stage === 'swissMatch') {
      applyTemplate(buildNextSwissMatchDraft(regionArchive))
      setInfoMessage('다음 Swiss 경기 입력 슬롯을 불러왔습니다.')
      setErrorMessage('')
      return
    }
    if (stage === 'finalMatch') {
      applyTemplate(buildNextFinalMatchDraft(archive))
      setInfoMessage('다음 Top8 경기 입력 슬롯을 불러왔습니다.')
      setErrorMessage('')
    }
  }

  const handlePrefillRoundLines = () => {
    if (!regionArchive) {
      setErrorMessage('No regional feed data loaded yet')
      return
    }
    const round = Number(bulkRound)
    if (!Number.isInteger(round) || round <= 0) {
      setErrorMessage('Round must be a positive integer')
      return
    }
    const matches = regionArchive.swissMatches
      .filter((match) => match.round === round)
      .sort((a, b) => (a.table ?? 0) - (b.table ?? 0))
    if (matches.length === 0) {
      setErrorMessage(`No existing round ${round} matches found`)
      return
    }
    const lines = matches.map((match) => {
      const table = match.table ?? 0
      const p1 = match.player1.entryId || '-'
      const p2 = match.player2?.entryId || (match.bye ? 'BYE' : '-')
      const note = match.note ? `,${match.note}` : ''
      return `${table},${p1},${p2}${note}`
    })
    const first = matches[0]
    const game1 = first.games[0]
    const game2 = first.games[1]
    const game3 = first.games[2]
    setBulkRound(String(round))
    if (game1?.song) setBulkSong1(game1.song)
    if (game1?.level) setBulkLevel1(game1.level)
    if (game2?.song) setBulkSong2(game2.song)
    if (game2?.level) setBulkLevel2(game2.level)
    if (game3?.song) setBulkSong3(game3.song)
    if (game3?.level) setBulkLevel3(game3.level)
    setBulkLines(lines.join('\n'))
    setErrorMessage('')
    setInfoMessage(`Loaded ${matches.length} table rows for round ${round}`)
  }

  const handleGenerateSeedOrderLines = () => {
    const activePlayers = regionParticipants
      .filter((player) => player.status !== 'eliminated')
      .sort((a, b) => {
        const aSeed =
          typeof a.seed === 'number' ? a.seed : Number.MAX_SAFE_INTEGER
        const bSeed =
          typeof b.seed === 'number' ? b.seed : Number.MAX_SAFE_INTEGER
        if (aSeed !== bSeed) return aSeed - bSeed
        return a.entryId.localeCompare(b.entryId)
      })
    if (activePlayers.length < 2) {
      setErrorMessage('Need at least two players to auto-generate pairings')
      return
    }
    const lines: string[] = []
    for (let i = 0; i < activePlayers.length; i += 2) {
      const table = Math.floor(i / 2) + 1
      const p1 = activePlayers[i]
      const p2 = activePlayers[i + 1]
      lines.push(`${table},${p1.entryId},${p2 ? p2.entryId : 'BYE'}`)
    }
    const suggestedRound = currentSwissRound ?? 1
    setBulkRound(String(suggestedRound))
    setBulkLines(lines.join('\n'))
    setErrorMessage('')
    setInfoMessage(
      `Generated ${lines.length} tables from current participant list`
    )
  }

  const handleBulkSeedRound = async () => {
    try {
      setIsBulkSeeding(true)
      setErrorMessage('')
      setInfoMessage('')
      const round = Number(bulkRound)
      if (!Number.isInteger(round) || round <= 0) {
        throw new Error('Round must be a positive integer')
      }
      if (!bulkSong1.trim() || !bulkSong2.trim()) {
        throw new Error('song1 and song2 are required for round pre-draw')
      }
      const rows = parseBulkSwissLines(bulkLines)
      const normalizedSeason = season.trim() || DEFAULT_SEASON
      for (const row of rows) {
        const p1 = participantByEntryId.get(row.p1EntryId)
        const p2 = row.p2EntryId
          ? participantByEntryId.get(row.p2EntryId)
          : undefined
        const bye = !row.p2EntryId
        const p1Seed = p1?.seed
        const p2Seed = p2?.seed
        let highSeedEntryId = row.p1EntryId
        if (!bye && typeof p1Seed === 'number' && typeof p2Seed === 'number') {
          highSeedEntryId = p1Seed <= p2Seed ? row.p1EntryId : row.p2EntryId!
        }
        const payload = {
          stage: 'swissMatch' as const,
          season: normalizedSeason,
          region,
          keyFields: ['season', 'region', 'round', 'table'],
          row: {
            season: normalizedSeason,
            region,
            round,
            table: row.table,
            highSeedEntryId,
            p1EntryId: row.p1EntryId,
            p1Nickname: p1?.nickname || row.p1EntryId,
            p1Seed: typeof p1Seed === 'number' ? p1Seed : '',
            p2EntryId: row.p2EntryId ?? '',
            p2Nickname: p2?.nickname || row.p2EntryId || '',
            p2Seed: typeof p2Seed === 'number' ? p2Seed : '',
            song1: bulkSong1.trim(),
            level1: bulkLevel1.trim(),
            p1Score1: '',
            p2Score1: '',
            song2: bulkSong2.trim(),
            level2: bulkLevel2.trim(),
            p1Score2: '',
            p2Score2: '',
            song3: bulkSong3.trim(),
            level3: bulkLevel3.trim(),
            p1Score3: '',
            p2Score3: '',
            winnerEntryId: bye ? row.p1EntryId : '',
            tieBreakerSong: '',
            bye,
            note: row.note || `pre-draw round ${round}`,
          },
        }
        await requestOpsApi('/api/ops/upsert', 'POST', payload, operatorKey)
      }
      const fresh = await fetchFeed({ force: true })
      const nextArchive = resolveArcadeSeasonArchive(fresh)
      const nextRegion = getRegionByKey(nextArchive, region)
      applyTemplate(
        buildCurrentSwissMatchDraft(nextRegion) ??
          buildNextSwissMatchDraft(nextRegion)
      )
      setInfoMessage(`Round ${round} pre-draw saved (${rows.length} tables)`)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Round pre-draw save failed'
      )
    } finally {
      setIsBulkSeeding(false)
    }
  }

  const handleSaveRow = async () => {
    try {
      setIsSaving(true)
      setErrorMessage('')
      setInfoMessage('')
      validateRequiredFields()
      const payload = buildOpsUpsertPayload({ stage, season, region, draft })
      await requestOpsApi('/api/ops/upsert', 'POST', payload, operatorKey)
      setValidationResult(null)
      const fresh = await fetchFeed({ force: true })
      if (stage === 'swissMatch') {
        const nextArchive = resolveArcadeSeasonArchive(fresh)
        const nextRegion = getRegionByKey(nextArchive, region)
        applyTemplate(buildNextSwissMatchDraft(nextRegion))
      } else if (stage === 'finalMatch') {
        const nextArchive = resolveArcadeSeasonArchive(fresh)
        applyTemplate(buildNextFinalMatchDraft(nextArchive))
      }
      setInfoMessage(`${stageDef.label} 입력 완료`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '입력 저장 실패')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInitOpsTabs = async () => {
    try {
      setIsInitRunning(true)
      setErrorMessage('')
      setInfoMessage('')
      await requestOpsApi(
        '/api/ops/init',
        'POST',
        { scope: 'ops' },
        operatorKey
      )
      setInfoMessage('운영 DB 탭 초기화 완료')
      await fetchFeed({ force: true })
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'DB 탭 초기화 실패')
    } finally {
      setIsInitRunning(false)
    }
  }

  const handleValidate = async () => {
    type ValidateItem = {
      sheet: string
      rule: string
      message: string
      row?: number
    }
    const toValidateItem = (v: unknown): ValidateItem => {
      if (typeof v === 'string') return { sheet: '-', rule: '검증', message: v }
      if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>
        return {
          sheet: String(o.sheet ?? '-'),
          rule: String(o.rule ?? '검증'),
          message: String(o.message ?? ''),
          row: typeof o.row === 'number' ? o.row : undefined,
        }
      }
      return { sheet: '-', rule: '검증', message: String(v ?? '') }
    }
    try {
      setIsValidating(true)
      setErrorMessage('')
      setInfoMessage('')
      setValidationResult(null)
      const raw = (await requestOpsApi(
        '/api/ops/validate',
        'POST',
        { season: season.trim() || DEFAULT_SEASON, region: 'all' },
        operatorKey
      )) as Record<string, unknown>
      const data = {
        valid: !!raw.valid,
        errors: Array.isArray(raw.errors) ? raw.errors.map(toValidateItem) : [],
        warnings: Array.isArray(raw.warnings)
          ? raw.warnings.map(toValidateItem)
          : [],
        summary: Array.isArray(raw.summary)
          ? (raw.summary as { sheet: string; target: string; rows: number }[])
          : [],
      }
      setValidationResult(data)
      setInfoMessage(data.valid ? '검증 통과' : '검증 실패 — 오류를 확인하세요')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '검증 실패')
    } finally {
      setIsValidating(false)
    }
  }

  const handlePublish = async () => {
    const modeLabel = exportReplaceMode
      ? 'replace (초기화 후 재송출)'
      : 'upsert'
    if (
      !confirm(
        `시즌 ${season || DEFAULT_SEASON} 전체를 ${modeLabel} 모드로 송출합니다.\n\n자동으로 검증 → 백업 → 송출이 실행됩니다. 계속하시겠습니까?`
      )
    )
      return
    try {
      setIsPublishing(true)
      setErrorMessage('')
      setInfoMessage('')
      setValidationResult(null)
      const payload: Record<string, unknown> = {
        season: season.trim() || DEFAULT_SEASON,
        region: 'all',
      }
      if (exportReplaceMode) payload.mode = 'replace'
      const data = (await requestOpsApi(
        '/api/ops/publish',
        'POST',
        payload,
        operatorKey
      )) as { publishId?: string; snapshotId?: string; totalRows?: number }
      setInfoMessage(
        `송출 완료 — publishId: ${data.publishId ?? '?'}, 백업: ${data.snapshotId ?? '?'}, 총 ${data.totalRows ?? 0}행`
      )
      await fetchFeed({ force: true })
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '송출 실패')
    } finally {
      setIsPublishing(false)
    }
  }

  const loadSnapshots = async () => {
    try {
      setIsLoadingSnapshots(true)
      setErrorMessage('')
      const data = (await requestOpsApi(
        '/api/ops/snapshots',
        'POST',
        {},
        operatorKey
      )) as {
        snapshotId: string
        createdAt: string
        publishId: string
        totalRows: number
        sheets: { sheet: string; rows: number }[]
      }[]
      setSnapshots(Array.isArray(data) ? data : [])
      if (Array.isArray(data) && data.length > 0 && !selectedSnapshotId) {
        setSelectedSnapshotId(data[0].snapshotId)
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : '스냅샷 목록 조회 실패'
      )
    } finally {
      setIsLoadingSnapshots(false)
    }
  }

  const handleRollback = async () => {
    if (!selectedSnapshotId) {
      setErrorMessage('롤백할 스냅샷을 선택하세요')
      return
    }
    const snap = snapshots.find((s) => s.snapshotId === selectedSnapshotId)
    if (
      !confirm(
        `스냅샷 "${selectedSnapshotId}"(으)로 롤백합니다.\n\n생성: ${snap?.createdAt ?? '?'}\npublishId: ${snap?.publishId ?? '?'}\n\n현재 pub_* 데이터가 모두 교체됩니다. 계속하시겠습니까?`
      )
    )
      return
    try {
      setIsRollingBack(true)
      setErrorMessage('')
      setInfoMessage('')
      const data = (await requestOpsApi(
        '/api/ops/rollback',
        'POST',
        { snapshotId: selectedSnapshotId },
        operatorKey
      )) as { rollbackId?: string; restoredRows?: number }
      setInfoMessage(
        `롤백 완료 — rollbackId: ${data.rollbackId ?? '?'}, 복원 행: ${data.restoredRows ?? 0}`
      )
      await fetchFeed({ force: true })
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '롤백 실패')
    } finally {
      setIsRollingBack(false)
    }
  }

  const handleWriteOpsGuide = async () => {
    try {
      setIsGuideRunning(true)
      setErrorMessage('')
      setInfoMessage('')
      await requestOpsApi(
        '/api/ops/guide',
        'POST',
        { overwrite: true, sheetName: 'ops_sheet_guide' },
        operatorKey
      )
      setInfoMessage('Ops guide sheet has been written. (ops_sheet_guide)')
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to write ops guide sheet'
      )
    } finally {
      setIsGuideRunning(false)
    }
  }

  const loadPublishLog = async () => {
    try {
      setIsLoadingLog(true)
      setErrorMessage('')
      const data = await requestOpsApi(
        '/api/ops/publish-log',
        'POST',
        {},
        operatorKey
      )
      setPublishLog(
        Array.isArray(data) ? (data as Record<string, unknown>[]) : []
      )
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : '발행 로그 조회 실패'
      )
    } finally {
      setIsLoadingLog(false)
    }
  }

  const toggleOpsPanel = (panel: OpsPanel) => {
    setOpsPanel((prev) => (prev === panel ? null : panel))
  }

  /* ── field rendering (generic stages) ── */
  const requiredFields = stageDef.fields.filter((f) => f.required)
  const optionalFields = stageDef.fields.filter((f) => !f.required)

  const renderFieldInput = (field: (typeof stageDef.fields)[number]) => {
    const value = draft[field.name] ?? field.defaultValue ?? ''
    const type = field.type ?? 'text'

    return (
      <div key={field.name} className='space-y-1'>
        <label className='text-xs font-medium text-white/40'>
          {field.label}
          {field.required ? (
            <span className='ml-0.5 text-[#ff2a00]'>*</span>
          ) : null}
        </label>

        {type === 'select' ? (
          <Select
            value={value}
            onValueChange={(next) => setDraftField(field.name, next)}
          >
            <SelectTrigger className='min-h-[48px] text-base'>
              <SelectValue placeholder={field.placeholder || '선택'} />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === 'boolean' ? (
          <Select
            value={value || 'false'}
            onValueChange={(next) => setDraftField(field.name, next)}
          >
            <SelectTrigger className='min-h-[48px] text-base'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={type === 'number' ? 'number' : 'text'}
            inputMode={type === 'number' ? 'numeric' : undefined}
            value={value}
            onChange={(event) => setDraftField(field.name, event.target.value)}
            placeholder={field.placeholder}
            className='min-h-[48px] text-base'
          />
        )}
      </div>
    )
  }

  /* Swiss 전용 추가 필드 (매치/점수 외) */
  const swissExtraFields = stageDef.fields.filter(
    (f) =>
      ![
        'round',
        'table',
        'p1EntryId',
        'p1Nickname',
        'p2EntryId',
        'p2Nickname',
        'song1',
        'level1',
        'p1Score1',
        'p2Score1',
        'song2',
        'level2',
        'p1Score2',
        'p2Score2',
        'song3',
        'level3',
        'p1Score3',
        'p2Score3',
        'winnerEntryId',
      ].includes(f.name)
  )

  const p1Label = `P1 ${draft.p1Nickname?.trim() || draft.p1EntryId?.trim() || ''}`
  const p2Label = `P2 ${draft.p2Nickname?.trim() || draft.p2EntryId?.trim() || ''}`

  /* ──────────────────────────────────────────────
     RENDER
     ────────────────────────────────────────────── */

  return (
    <div className='mx-auto max-w-lg px-4 pt-4 pb-28'>
      {/* ════ HEADER ════ */}
      <header className='mb-4 flex items-center justify-between'>
        <h1 className='text-lg font-extrabold tracking-tight'>
          운영 <span className='text-[#ff2a00]'>콘솔</span>
        </h1>
        <div className='flex items-center gap-2'>
          <a
            href={broadcastUrl}
            target='_blank'
            rel='noreferrer'
            className='flex h-9 w-9 items-center justify-center rounded-lg border border-[#ff2a00]/20 text-base text-[#ff8c66] transition-colors hover:bg-[#ff2a00]/10'
            title='실시간 송출 화면'
          >
            📡
          </a>
          <button
            type='button'
            onClick={() => setShowSettings((prev) => !prev)}
            className='flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-base text-white/40 transition-colors hover:bg-white/5'
            title='설정'
          >
            ⚙
          </button>
        </div>
      </header>

      {/* ════ SETTINGS DRAWER ════ */}
      {showSettings ? (
        <div className='mb-4 space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-4'>
          <div className='space-y-1'>
            <label className='text-xs font-semibold text-white/40'>
              운영자 키
            </label>
            <Input
              type='password'
              value={operatorKey}
              onChange={(event) => setOperatorKey(event.target.value)}
              placeholder='OPS_OPERATOR_KEY'
              autoComplete='off'
              className='min-h-[48px] text-base'
            />
          </div>
          <div className='space-y-1'>
            <label className='text-xs font-semibold text-white/40'>시즌</label>
            <Input
              value={season}
              onChange={(event) => setSeason(event.target.value)}
              placeholder='2026'
              className='min-h-[48px] w-24 text-base'
            />
          </div>
          <Button
            variant='outline'
            className='min-h-[48px] w-full'
            onClick={() => {
              void fetchFeed({ force: true })
            }}
            disabled={feedLoading}
          >
            {feedLoading ? '새로고침 중..' : 'DB 새로고침'}
          </Button>
        </div>
      ) : null}

      {/* ════ MESSAGES ════ */}
      {infoMessage ? (
        <p className='mb-3 rounded-lg border border-emerald-300/25 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-200'>
          {infoMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className='mb-3 rounded-lg border border-red-300/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-100'>
          {errorMessage}
        </p>
      ) : null}
      {feedError ? (
        <p className='mb-3 rounded-lg border border-red-300/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-100'>
          {feedError}
        </p>
      ) : null}

      {/* ════ PUB BAR ════ */}
      <div className='mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs'>
        <div>
          <span className='text-white/25'>송출</span>
          <span className='ml-2 font-mono text-[#ff8c66]'>
            {publishMeta?.lastPublishId || '—'}
          </span>
        </div>
        <div className='text-white/25'>
          {publishMeta?.lastPublishedAt
            ? new Date(publishMeta.lastPublishedAt).toLocaleString('ko-KR')
            : ''}
          {lastFeedAt ? ` · DB ${lastFeedAt}` : ''}
        </div>
      </div>

      {/* ════ REGION PILLS ════ */}
      <div className='-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        {weekStatuses.map((week) => (
          <button
            key={week.key}
            type='button'
            onClick={() => setRegion(week.key)}
            className={`flex min-h-[48px] flex-shrink-0 items-center gap-1.5 rounded-full px-5 text-sm font-semibold transition ${
              region === week.key
                ? 'bg-[#ff2a00] text-white'
                : 'border border-white/[0.08] bg-white/[0.04] text-white/45'
            }`}
          >
            {week.label}
            <span className='text-xs opacity-50'>W{week.weekNo}</span>
            <span
              className={`ml-0.5 inline-block h-1.5 w-1.5 rounded-full ${
                week.status === 'done'
                  ? 'bg-emerald-400'
                  : week.status === 'live'
                    ? region === week.key
                      ? 'bg-white/80'
                      : 'bg-[#ff2a00]'
                    : 'bg-white/25'
              }`}
            />
          </button>
        ))}
      </div>

      {/* ════ STATUS CARDS ════ */}
      <div className='mb-6 space-y-3'>
        {/* Current match */}
        <div className='rounded-xl border border-[#ff2a00]/20 bg-[#ff2a00]/[0.08] p-4'>
          <div className='text-[10px] font-bold tracking-widest text-[#ff2a00] uppercase'>
            현재 경기 ·{' '}
            {stage === 'finalMatch'
              ? 'Top8'
              : `Swiss${currentSwissRound ? ` R${currentSwissRound}` : ''}`}
          </div>
          <div className='mt-1.5 text-xl leading-tight font-extrabold text-white'>
            {stageCurrent
              ? `${stageCurrent.leftName} vs ${stageCurrent.rightName}`
              : '대기중'}
          </div>
          {stageCurrent ? (
            <div className='mt-1 text-sm text-white/40'>
              {stageCurrent.label}
            </div>
          ) : null}
        </div>

        {/* Progress */}
        <div className='rounded-xl border border-white/[0.08] bg-white/[0.04] p-4'>
          <div className='mb-3'>
            <div className='mb-1.5 flex items-baseline justify-between'>
              <span className='text-sm font-semibold text-white/60'>Swiss</span>
              <span className='font-mono text-xl font-semibold text-white'>
                {swissProgress.completed}/{swissProgress.total}
              </span>
            </div>
            <div className='h-1.5 overflow-hidden rounded-full bg-white/[0.06]'>
              <div
                className='h-full rounded-full bg-[#ff2a00] transition-all duration-500'
                style={{
                  width:
                    swissProgress.total > 0
                      ? `${(swissProgress.completed / swissProgress.total) * 100}%`
                      : '0%',
                }}
              />
            </div>
          </div>
          <div>
            <div className='mb-1.5 flex items-baseline justify-between'>
              <span className='text-sm font-semibold text-white/60'>Top 8</span>
              <span className='font-mono text-xl font-semibold text-white'>
                {finalsProgress.completed}/{finalsProgress.total}
              </span>
            </div>
            <div className='h-1.5 overflow-hidden rounded-full bg-white/[0.06]'>
              <div
                className='h-full rounded-full bg-[#ff8c66] transition-all duration-500'
                style={{
                  width:
                    finalsProgress.total > 0
                      ? `${(finalsProgress.completed / finalsProgress.total) * 100}%`
                      : '0%',
                }}
              />
            </div>
          </div>
          <div className='mt-3 flex gap-4 border-t border-white/[0.08] pt-3'>
            <span className='text-sm text-white/40'>
              <strong className='mr-1 font-bold text-[#ff2a00]'>A</strong>
              {regionArchive?.qualifiers.groupA
                ? regionArchive.qualifiers.groupA.nickname
                : '미확정'}
            </span>
            <span className='text-sm text-white/40'>
              <strong className='mr-1 font-bold text-[#ff2a00]'>B</strong>
              {regionArchive?.qualifiers.groupB
                ? regionArchive.qualifiers.groupB.nickname
                : '미확정'}
            </span>
          </div>
        </div>

        {/* Ranking preview */}
        {finalRanking.length > 0 ? (
          <details>
            <summary className='flex min-h-[44px] cursor-pointer items-center text-sm font-medium text-white/40'>
              ▸ 지역 순위 (Top 8)
            </summary>
            <div className='mt-1 overflow-x-auto rounded-xl border border-white/[0.08]'>
              <table className='min-w-full text-left text-xs'>
                <thead className='bg-white/[0.05] text-white/50'>
                  <tr>
                    <th className='px-3 py-2'>#</th>
                    <th className='px-3 py-2'>닉네임</th>
                    <th className='px-3 py-2'>북번호</th>
                    <th className='px-3 py-2'>전적</th>
                    <th className='px-3 py-2'>상태</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-white/[0.06]'>
                  {finalRanking.slice(0, 8).map((row) => (
                    <tr key={`${row.entryId}-${row.rank}`}>
                      <td className='px-3 py-2 font-bold text-[#ff2a00]'>
                        {row.rank}
                      </td>
                      <td className='px-3 py-2 text-white/80'>
                        {row.nickname}
                      </td>
                      <td className='px-3 py-2 font-mono text-white/40'>
                        {row.cardNo || '-'}
                      </td>
                      <td className='px-3 py-2 font-mono text-white/60'>
                        {typeof row.wins === 'number' &&
                        typeof row.losses === 'number'
                          ? `${row.wins}-${row.losses}`
                          : '-'}
                      </td>
                      <td className='px-3 py-2 text-white/50'>
                        {row.statusLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ) : null}
      </div>

      {/* ════ DIVIDER ════ */}
      <div className='mb-6 h-px bg-white/[0.08]' />

      {/* ════ INPUT SECTION ════ */}
      <div className='mb-3 text-[11px] font-bold tracking-widest text-white/30 uppercase'>
        경기 입력
      </div>

      {/* Stage selector */}
      <div className='mb-1.5'>
        <Select
          value={stage}
          onValueChange={(value) => setStage(value as OpsStageKey)}
        >
          <SelectTrigger className='min-h-[48px] w-full text-base'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPS_STAGE_ORDER.map((key) => (
              <SelectItem key={key} value={key}>
                {OPS_STAGE_DEFINITIONS[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className='mb-5 text-xs leading-relaxed text-white/25'>
        {stageDef.description}
      </p>

      {/* Sequential guide */}
      {isSequentialStage ? (
        <>
          <div className='-mx-4 mb-2.5 flex gap-2 overflow-x-auto px-4 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            {[
              { label: '현재 경기', value: matchShort(stageCurrent) },
              { label: '다음 경기', value: matchShort(stageNext) },
              { label: '직전 결과', value: matchShort(stagePrevious) },
            ].map((cell) => (
              <div
                key={cell.label}
                className='min-w-[130px] flex-shrink-0 rounded-lg border border-white/[0.08] bg-black/30 px-3.5 py-3'
              >
                <div className='text-[10px] text-white/25'>{cell.label}</div>
                <div className='mt-1 text-sm font-semibold text-white'>
                  {cell.value}
                </div>
              </div>
            ))}
          </div>
          <div className='mb-5 flex gap-2'>
            <Button
              variant='outline'
              className='min-h-[48px] flex-1'
              onClick={handleLoadCurrentMatch}
            >
              현재 경기 불러오기
            </Button>
            <Button
              variant='outline'
              className='min-h-[48px] flex-1'
              onClick={handleLoadNextMatch}
            >
              다음 경기 슬롯
            </Button>
          </div>
        </>
      ) : null}

      {/* ════ SWISS-SPECIFIC FORM ════ */}
      {stage === 'swissMatch' ? (
        <>
          {/* 매치 정보 */}
          <div className='mb-3 space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4'>
            <div className='flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-white/30 uppercase'>
              <span className='inline-block h-2 w-2 rounded-sm bg-[#ff2a00]' />
              매치 정보
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <label className='text-xs font-medium text-white/40'>
                  라운드<span className='ml-0.5 text-[#ff2a00]'>*</span>
                </label>
                <Input
                  type='number'
                  inputMode='numeric'
                  value={draft.round ?? ''}
                  onChange={(e) => setDraftField('round', e.target.value)}
                  placeholder='1'
                  className='min-h-[48px] text-base'
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs font-medium text-white/40'>
                  테이블<span className='ml-0.5 text-[#ff2a00]'>*</span>
                </label>
                <Input
                  type='number'
                  inputMode='numeric'
                  value={draft.table ?? ''}
                  onChange={(e) => setDraftField('table', e.target.value)}
                  placeholder='1'
                  className='min-h-[48px] text-base'
                />
              </div>
            </div>
            <div className='space-y-3'>
              <div className='space-y-1'>
                <label className='text-xs font-medium text-white/40'>
                  P1 선수<span className='ml-0.5 text-[#ff2a00]'>*</span>
                </label>
                {playerOptions.length > 0 ? (
                  <OpsCombobox
                    displayValue={
                      draft.p1EntryId
                        ? `${draft.p1Nickname || draft.p1EntryId} (${draft.p1EntryId})`
                        : ''
                    }
                    options={playerOptions}
                    onSelect={(entryId) => handlePlayerSelect('p1', entryId)}
                    placeholder='선수 검색...'
                    searchPlaceholder='닉네임 또는 엔트리ID'
                  />
                ) : (
                  <Input
                    value={draft.p1EntryId ?? ''}
                    onChange={(e) => setDraftField('p1EntryId', e.target.value)}
                    placeholder='SEO-01'
                    className='min-h-[48px] text-base'
                  />
                )}
              </div>
              <div className='space-y-1'>
                <label className='text-xs font-medium text-white/40'>
                  P1 닉네임<span className='ml-0.5 text-[#ff2a00]'>*</span>
                </label>
                <Input
                  value={draft.p1Nickname ?? ''}
                  onChange={(e) => setDraftField('p1Nickname', e.target.value)}
                  placeholder='서울선수01'
                  className='min-h-[48px] text-base'
                />
                {draft.p1EntryId && participantByEntryId.get(draft.p1EntryId) ? (() => {
                  const p = participantByEntryId.get(draft.p1EntryId)!
                  return (
                    <div className='flex flex-wrap gap-1.5 pt-1'>
                      {p.cardNo ? (
                        <span className='rounded-md bg-white/[0.06] px-2 py-1 text-[11px] text-white/50'>
                          북 {p.cardNo}
                        </span>
                      ) : null}
                      {p.qualifierRegion ? (
                        <span className='rounded-md bg-white/[0.06] px-2 py-1 text-[11px] text-white/50'>
                          온라인 {p.qualifierRegion}
                        </span>
                      ) : null}
                      {p.offlineSongs && p.offlineSongs.length > 0 ? (
                        <span className='rounded-md bg-[#ff2a00]/10 px-2 py-1 text-[11px] text-[#ff8c66]'>
                          선곡 {p.offlineSongs.length}곡
                        </span>
                      ) : null}
                    </div>
                  )
                })() : null}
              </div>
              <div className='space-y-1'>
                <label className='text-xs font-medium text-white/40'>
                  P2 선수
                </label>
                {playerOptions.length > 0 ? (
                  <OpsCombobox
                    displayValue={
                      draft.p2EntryId
                        ? `${draft.p2Nickname || draft.p2EntryId} (${draft.p2EntryId})`
                        : ''
                    }
                    options={playerOptions}
                    onSelect={(entryId) => handlePlayerSelect('p2', entryId)}
                    placeholder='선수 검색...'
                    searchPlaceholder='닉네임 또는 엔트리ID'
                  />
                ) : (
                  <Input
                    value={draft.p2EntryId ?? ''}
                    onChange={(e) => setDraftField('p2EntryId', e.target.value)}
                    placeholder='SEO-16'
                    className='min-h-[48px] text-base'
                  />
                )}
              </div>
              <div className='space-y-1'>
                <label className='text-xs font-medium text-white/40'>
                  P2 닉네임
                </label>
                <Input
                  value={draft.p2Nickname ?? ''}
                  onChange={(e) => setDraftField('p2Nickname', e.target.value)}
                  placeholder='서울선수16'
                  className='min-h-[48px] text-base'
                />
                {draft.p2EntryId && participantByEntryId.get(draft.p2EntryId) ? (() => {
                  const p = participantByEntryId.get(draft.p2EntryId)!
                  return (
                    <div className='flex flex-wrap gap-1.5 pt-1'>
                      {p.cardNo ? (
                        <span className='rounded-md bg-white/[0.06] px-2 py-1 text-[11px] text-white/50'>
                          북 {p.cardNo}
                        </span>
                      ) : null}
                      {p.qualifierRegion ? (
                        <span className='rounded-md bg-white/[0.06] px-2 py-1 text-[11px] text-white/50'>
                          온라인 {p.qualifierRegion}
                        </span>
                      ) : null}
                      {p.offlineSongs && p.offlineSongs.length > 0 ? (
                        <span className='rounded-md bg-[#ff2a00]/10 px-2 py-1 text-[11px] text-[#ff8c66]'>
                          선곡 {p.offlineSongs.length}곡
                        </span>
                      ) : null}
                    </div>
                  )
                })() : null}
              </div>
            </div>
          </div>

          {/* 곡별 점수 */}
          <div className='mb-3 space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4'>
            <div className='flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-white/30 uppercase'>
              <span className='inline-block h-2 w-2 rounded-sm bg-[#ff2a00]' />
              곡별 점수
            </div>
            <SwissSongCard
              badge='곡 1'
              songField='song1'
              levelField='level1'
              p1ScoreField='p1Score1'
              p2ScoreField='p2Score1'
              p1Label={p1Label}
              p2Label={p2Label}
              draft={draft}
              setDraftField={setDraftField}
              songOptions={songOptions}
              prioritySongs={p1SongPriority}
              priorityLabel={`${draft.p1Nickname?.trim() || 'P1'} 선곡`}
            />
            <SwissSongCard
              badge='곡 2'
              songField='song2'
              levelField='level2'
              p1ScoreField='p1Score2'
              p2ScoreField='p2Score2'
              p1Label={p1Label}
              p2Label={p2Label}
              draft={draft}
              setDraftField={setDraftField}
              songOptions={songOptions}
              prioritySongs={p2SongPriority}
              priorityLabel={`${draft.p2Nickname?.trim() || 'P2'} 선곡`}
            />
            <SwissSongCard
              badge='타이브레이커'
              songField='song3'
              levelField='level3'
              p1ScoreField='p1Score3'
              p2ScoreField='p2Score3'
              p1Label={p1Label}
              p2Label={p2Label}
              draft={draft}
              setDraftField={setDraftField}
              dim
              songOptions={songOptions}
              prioritySongs={[...p1SongPriority, ...p2SongPriority]}
              priorityLabel='P1 + P2 선곡'
            />
          </div>

          {/* 승자 선택 */}
          {winnerOptions.length > 0 ? (
            <div className='mb-3 rounded-xl border border-[#ff2a00]/20 bg-[#ff2a00]/[0.08] p-4'>
              <div className='mb-3 text-[10px] font-bold tracking-widest text-[#ff2a00] uppercase'>
                승자 선택
              </div>
              <div className='grid grid-cols-2 gap-2.5'>
                {winnerOptions.map((option) => (
                  <button
                    key={option.entryId}
                    type='button'
                    onClick={() =>
                      setDraftField('winnerEntryId', option.entryId)
                    }
                    className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-lg border-2 p-3 text-center transition ${
                      draft.winnerEntryId === option.entryId
                        ? 'border-[#ff2a00] bg-[#ff2a00] font-semibold text-white'
                        : 'border-white/[0.08] bg-black/30 text-white/40'
                    }`}
                  >
                    <span className='text-[15px] font-semibold'>
                      {option.nickname || option.entryId}
                    </span>
                    <span className='text-[11px] opacity-50'>
                      {option.entryId}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* 추가 필드 */}
          {swissExtraFields.length > 0 ? (
            <details className='mb-3'>
              <summary className='flex min-h-[44px] cursor-pointer items-center text-sm font-medium text-white/40'>
                ▸ 추가 필드 ({swissExtraFields.length}개)
              </summary>
              <div className='mt-2 space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4'>
                {swissExtraFields.map(renderFieldInput)}
              </div>
            </details>
          ) : null}
        </>
      ) : (
        /* ════ GENERIC FORM (non-Swiss stages) ════ */
        <>
          <div className='mb-3 space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4'>
            <div className='flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-white/30 uppercase'>
              <span className='inline-block h-2 w-2 rounded-sm bg-[#ff2a00]' />
              필수 입력
            </div>
            <div className='space-y-3'>
              {requiredFields.map(renderFieldInput)}
            </div>
          </div>

          {winnerOptions.length > 0 ? (
            <div className='mb-3 rounded-xl border border-[#ff2a00]/20 bg-[#ff2a00]/[0.08] p-4'>
              <div className='mb-3 text-[10px] font-bold tracking-widest text-[#ff2a00] uppercase'>
                승자 선택
              </div>
              <div className='grid grid-cols-2 gap-2.5'>
                {winnerOptions.map((option) => (
                  <button
                    key={option.entryId}
                    type='button'
                    onClick={() =>
                      setDraftField('winnerEntryId', option.entryId)
                    }
                    className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-lg border-2 p-3 text-center transition ${
                      draft.winnerEntryId === option.entryId
                        ? 'border-[#ff2a00] bg-[#ff2a00] font-semibold text-white'
                        : 'border-white/[0.08] bg-black/30 text-white/40'
                    }`}
                  >
                    <span className='text-[15px] font-semibold'>
                      {option.nickname || option.entryId}
                    </span>
                    <span className='text-[11px] opacity-50'>
                      {option.entryId}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {optionalFields.length > 0 ? (
            <details className='mb-3'>
              <summary className='flex min-h-[44px] cursor-pointer items-center text-sm font-medium text-white/40'>
                ▸ 추가 필드 ({optionalFields.length}개)
              </summary>
              <div className='mt-2 space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4'>
                {optionalFields.map(renderFieldInput)}
              </div>
            </details>
          ) : null}
        </>
      )}

      {/* Swiss bulk seeding */}
      {stage === 'swissMatch' ? (
        <details className='mb-3'>
          <summary className='flex min-h-[44px] cursor-pointer items-center text-sm font-medium text-white/40'>
            ▸ Round pre-draw (bulk schedule)
          </summary>
          <div className='mt-2 space-y-3 rounded-xl border border-white/[0.08] bg-black/20 p-4'>
            <p className='text-xs text-white/40'>
              players loaded: {regionParticipants.length} ·
              table,p1EntryId,p2EntryId[,note]
            </p>
            <div className='space-y-2'>
              <div className='space-y-1'>
                <label className='text-xs text-white/40'>round</label>
                <Input
                  type='number'
                  inputMode='numeric'
                  value={bulkRound}
                  onChange={(event) => setBulkRound(event.target.value)}
                  placeholder={
                    currentSwissRound ? String(currentSwissRound) : '1'
                  }
                  className='min-h-[48px] text-base'
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs text-white/40'>
                  Song 1{bulkLevel1 ? ` · ★${bulkLevel1}` : ''}
                </label>
                <OpsCombobox
                  displayValue={bulkSong1}
                  options={songOptions}
                  onSelect={(val) => {
                    const opt = parseSongOption(val)
                    if (opt) {
                      setBulkSong1(opt.title)
                      setBulkLevel1(String(opt.level))
                    }
                  }}
                  placeholder='곡 1 검색...'
                  searchPlaceholder='곡명으로 검색'
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs text-white/40'>
                  Song 2{bulkLevel2 ? ` · ★${bulkLevel2}` : ''}
                </label>
                <OpsCombobox
                  displayValue={bulkSong2}
                  options={songOptions}
                  onSelect={(val) => {
                    const opt = parseSongOption(val)
                    if (opt) {
                      setBulkSong2(opt.title)
                      setBulkLevel2(String(opt.level))
                    }
                  }}
                  placeholder='곡 2 검색...'
                  searchPlaceholder='곡명으로 검색'
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs text-white/40'>
                  Song 3 (opt){bulkLevel3 ? ` · ★${bulkLevel3}` : ''}
                </label>
                <OpsCombobox
                  displayValue={bulkSong3}
                  options={songOptions}
                  onSelect={(val) => {
                    const opt = parseSongOption(val)
                    if (opt) {
                      setBulkSong3(opt.title)
                      setBulkLevel3(String(opt.level))
                    }
                  }}
                  placeholder='곡 3 검색...'
                  searchPlaceholder='곡명으로 검색'
                />
              </div>
              <Textarea
                value={bulkLines}
                onChange={(event) => setBulkLines(event.target.value)}
                placeholder={'1,SEO-01,SEO-16\n2,SEO-02,SEO-15\n3,SEO-03,BYE'}
                className='min-h-32 font-mono text-sm'
              />
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button
                variant='outline'
                size='sm'
                className='min-h-[44px]'
                onClick={handlePrefillRoundLines}
                disabled={isBulkSeeding}
              >
                Load round lines
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='min-h-[44px]'
                onClick={handleGenerateSeedOrderLines}
                disabled={isBulkSeeding}
              >
                Auto by seed
              </Button>
              <Button
                size='sm'
                className='min-h-[44px]'
                onClick={handleBulkSeedRound}
                disabled={isBulkSeeding}
              >
                {isBulkSeeding ? 'Saving..' : 'Save pre-draw'}
              </Button>
            </div>
          </div>
        </details>
      ) : null}

      {/* ════ OPS SECTION ════ */}
      <div className='mt-6 mb-5 h-px bg-white/[0.08]' />
      <div className='mb-3 text-[11px] font-bold tracking-widest text-white/30 uppercase'>
        운영 도구
      </div>

      <div className='mb-3 grid grid-cols-2 gap-2.5'>
        <button
          type='button'
          onClick={() => toggleOpsPanel('validate')}
          className={`flex min-h-[64px] flex-col justify-center rounded-xl border p-3.5 text-left transition ${
            opsPanel === 'validate'
              ? 'border-[#ff2a00]/30 bg-[#ff2a00]/15 text-[#ffd6cf]'
              : 'border-[#ff2a00]/15 bg-[#ff2a00]/[0.08] text-[#ffd6cf]'
          }`}
        >
          <span className='text-sm font-semibold'>검증 + 발행</span>
          <span className='text-[10px] text-white/25'>검증 → 백업 → 송출</span>
        </button>
        <button
          type='button'
          onClick={() => toggleOpsPanel('rollback')}
          className={`flex min-h-[64px] flex-col justify-center rounded-xl border p-3.5 text-left transition ${
            opsPanel === 'rollback'
              ? 'border-white/20 bg-white/10 text-white/80'
              : 'border-white/[0.08] bg-white/[0.04] text-white/45'
          }`}
        >
          <span className='text-sm font-semibold'>롤백</span>
          <span className='text-[10px] text-white/25'>스냅샷 복원</span>
        </button>
        <button
          type='button'
          onClick={() => toggleOpsPanel('log')}
          className={`flex min-h-[64px] flex-col justify-center rounded-xl border p-3.5 text-left transition ${
            opsPanel === 'log'
              ? 'border-white/20 bg-white/10 text-white/80'
              : 'border-white/[0.08] bg-white/[0.04] text-white/45'
          }`}
        >
          <span className='text-sm font-semibold'>발행 로그</span>
          <span className='text-[10px] text-white/25'>최근 50건</span>
        </button>
        <button
          type='button'
          onClick={() => toggleOpsPanel('utility')}
          className={`flex min-h-[64px] flex-col justify-center rounded-xl border p-3.5 text-left transition ${
            opsPanel === 'utility'
              ? 'border-white/20 bg-white/10 text-white/80'
              : 'border-white/[0.08] bg-white/[0.04] text-white/45'
          }`}
        >
          <span className='text-sm font-semibold'>유틸리티</span>
          <span className='text-[10px] text-white/25'>DB 초기화</span>
        </button>
      </div>

      {/* ── Validate + Publish panel ── */}
      {opsPanel === 'validate' ? (
        <div className='mb-3 space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4'>
          <h3 className='text-base font-bold'>검증 + 발행</h3>
          <p className='text-sm text-white/40'>
            검증 → 백업(스냅샷) → 송출 → 캐시 초기화 순차 실행
          </p>

          <Button
            variant='outline'
            className='min-h-[48px] w-full'
            onClick={handleValidate}
            disabled={isValidating}
          >
            {isValidating ? '검증 중..' : '데이터 검증 실행'}
          </Button>

          {validationResult ? (
            <div className='space-y-2'>
              <p
                className={`text-sm font-semibold ${validationResult.valid ? 'text-emerald-300' : 'text-red-300'}`}
              >
                {validationResult.valid
                  ? '✓ 검증 통과 — 송출 가능'
                  : `✗ 검증 실패 — 오류 ${validationResult.errors.length}건`}
              </p>

              {validationResult.errors.length > 0 ? (
                <div className='max-h-40 overflow-y-auto rounded-lg border border-red-300/25 bg-red-500/10 p-3 text-xs text-red-100'>
                  {validationResult.errors.map((e, i) => (
                    <div key={i} className='py-0.5'>
                      <span className='font-mono text-red-300'>
                        [{e.sheet}]
                      </span>{' '}
                      {e.rule}: {e.message}
                      {e.row != null ? ` (행 ${e.row})` : ''}
                    </div>
                  ))}
                </div>
              ) : null}

              {validationResult.warnings.length > 0 ? (
                <div className='max-h-32 overflow-y-auto rounded-lg border border-yellow-300/25 bg-yellow-500/10 p-3 text-xs text-yellow-100'>
                  {validationResult.warnings.map((w, i) => (
                    <div key={i} className='py-0.5'>
                      <span className='font-mono text-yellow-300'>
                        [{w.sheet}]
                      </span>{' '}
                      {w.rule}: {w.message}
                    </div>
                  ))}
                </div>
              ) : null}

              {validationResult.valid ? (
                <div className='space-y-3 border-t border-white/[0.08] pt-3'>
                  <label className='flex items-center gap-2 text-sm text-white/60'>
                    <input
                      type='checkbox'
                      checked={exportReplaceMode}
                      onChange={(e) => setExportReplaceMode(e.target.checked)}
                      className='accent-[#ff2a00]'
                    />
                    replace 모드 (초기화 후 재송출)
                  </label>
                  <Button
                    className='min-h-[48px] w-full'
                    onClick={handlePublish}
                    disabled={isPublishing}
                  >
                    {isPublishing ? '송출 중..' : '검증 + 백업 + 송출'}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── Rollback panel ── */}
      {opsPanel === 'rollback' ? (
        <div className='mb-3 space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4'>
          <h3 className='text-base font-bold'>롤백</h3>
          <p className='text-sm text-white/40'>
            이전 스냅샷으로 pub_* 전체 복원. 현재 공개 데이터가 모두 교체됩니다.
          </p>

          <Button
            variant='outline'
            className='min-h-[48px] w-full'
            onClick={loadSnapshots}
            disabled={isLoadingSnapshots}
          >
            {isLoadingSnapshots ? '조회 중..' : '스냅샷 조회'}
          </Button>

          {snapshots.length > 0 ? (
            <>
              <Select
                value={selectedSnapshotId}
                onValueChange={setSelectedSnapshotId}
              >
                <SelectTrigger className='min-h-[48px] text-base'>
                  <SelectValue placeholder='스냅샷 선택' />
                </SelectTrigger>
                <SelectContent>
                  {snapshots.map((snap) => (
                    <SelectItem key={snap.snapshotId} value={snap.snapshotId}>
                      {snap.snapshotId} ({snap.createdAt})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedSnapshotId ? (
                <Button
                  variant='destructive'
                  className='min-h-[48px] w-full'
                  onClick={handleRollback}
                  disabled={isRollingBack}
                >
                  {isRollingBack ? '롤백 중..' : '롤백 실행'}
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {/* ── Log panel ── */}
      {opsPanel === 'log' ? (
        <div className='mb-3 space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4'>
          <h3 className='text-base font-bold'>발행 로그</h3>

          <Button
            variant='outline'
            className='min-h-[48px] w-full'
            onClick={loadPublishLog}
            disabled={isLoadingLog}
          >
            {isLoadingLog ? '조회 중..' : '로그 조회'}
          </Button>

          {publishLog.length > 0 ? (
            <div className='overflow-x-auto rounded-lg border border-white/[0.08]'>
              <table className='min-w-full text-left text-xs'>
                <thead className='bg-white/[0.05] text-white/50'>
                  <tr>
                    <th className='px-3 py-2'>ID</th>
                    <th className='px-3 py-2'>모드</th>
                    <th className='px-3 py-2'>시각</th>
                    <th className='px-3 py-2'>행</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-white/[0.06]'>
                  {publishLog.map((entry, i) => {
                    const mode = String(entry.mode ?? '')
                    const modeColor =
                      mode === 'rollback'
                        ? 'text-red-300 bg-red-500/10'
                        : mode === 'replace'
                          ? 'text-orange-300 bg-orange-500/10'
                          : mode === 'commit'
                            ? 'text-white/60 bg-white/[0.06]'
                            : 'text-blue-300 bg-blue-500/10'
                    return (
                      <tr key={i}>
                        <td className='px-3 py-2 font-mono text-white/70'>
                          {String(entry.publishId ?? '')}
                        </td>
                        <td className='px-3 py-2'>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${modeColor}`}
                          >
                            {mode || '?'}
                          </span>
                        </td>
                        <td className='px-3 py-2 text-white/50'>
                          {entry.publishedAt
                            ? new Date(
                                String(entry.publishedAt)
                              ).toLocaleString('ko-KR')
                            : ''}
                        </td>
                        <td className='px-3 py-2 font-mono text-white/50'>
                          {String(entry.totalRows ?? '')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── Utility panel ── */}
      {opsPanel === 'utility' ? (
        <div className='mb-3 space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4'>
          <h3 className='text-base font-bold'>유틸리티</h3>
          <div className='space-y-2'>
            <Button
              variant='outline'
              className='min-h-[48px] w-full'
              onClick={handleInitOpsTabs}
              disabled={isInitRunning}
            >
              {isInitRunning ? '초기화 중..' : '운영 DB 탭 초기화'}
            </Button>
            <Button
              variant='outline'
              className='min-h-[48px] w-full'
              onClick={handleWriteOpsGuide}
              disabled={isGuideRunning}
            >
              {isGuideRunning ? 'Writing..' : 'Write ops guide sheet'}
            </Button>
          </div>
        </div>
      ) : null}

      {/* spacer for sticky save bar */}
      <div className='h-20' />

      {/* ════ STICKY SAVE BAR ════ */}
      <div className='fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-lg gap-2.5 border-t border-white/[0.08] bg-[#0b0b10]/95 px-4 py-3 backdrop-blur-sm'>
        <Button
          onClick={handleSaveRow}
          disabled={isSaving}
          className='min-h-[52px] flex-1 bg-[#ff2a00] text-base font-bold hover:bg-[#ff2a00]/90'
        >
          {isSaving ? '저장 중..' : 'DB 저장'}
        </Button>
        <Button
          variant='outline'
          onClick={resetDraft}
          disabled={isSaving}
          className='min-h-[52px] min-w-[80px]'
        >
          초기화
        </Button>
      </div>
    </div>
  )
}
