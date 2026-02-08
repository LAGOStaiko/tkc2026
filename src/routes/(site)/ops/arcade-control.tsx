import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
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
  OPS_REGION_OPTIONS,
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/ops/arcade-control')({
  component: ArcadeOpsControlPage,
})

const OPERATOR_KEY_STORAGE = 'tkc2026:ops:operator-key'
const DEFAULT_SEASON = '2026'
const DEFAULT_REGION: OpsRegionKey = 'seoul'
const REFRESH_MS = 5000

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

async function requestOpsApi(
  path: string,
  method: 'GET' | 'POST',
  body: unknown,
  operatorKey: string
) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (method !== 'GET') headers['Content-Type'] = 'application/json'
  if (operatorKey.trim()) headers['X-OPS-Key'] = operatorKey.trim()

  const response = await fetch(path, {
    method,
    headers,
    body: method === 'GET' ? undefined : JSON.stringify(body),
  })
  const payload = (await response
    .json()
    .catch(() => null)) as ApiEnvelope | null

  if (!response.ok || !payload?.ok) {
    throw new Error(
      payload?.error || `${response.status} ${response.statusText}`.trim()
    )
  }

  return payload.data
}

function statusBadgeClass(status: 'pending' | 'live' | 'done') {
  if (status === 'done')
    return 'border-emerald-300/25 bg-emerald-500/10 text-emerald-200'
  if (status === 'live')
    return 'border-[#ff2a00]/35 bg-[#ff2a00]/10 text-[#ffd6cf]'
  return 'border-white/20 bg-white/[0.06] text-white/70'
}

function statusLabel(status: 'pending' | 'live' | 'done') {
  if (status === 'done') return '완료'
  if (status === 'live') return '진행중'
  return '대기'
}

function matchLine(match?: OpsProgressMatch) {
  if (!match) return '매치 없음'
  return `${match.label} - ${match.leftName} vs ${match.rightName}`
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

function ArcadeOpsControlPage() {
  const [operatorKey, setOperatorKey] = useState('')
  const [season, setSeason] = useState(DEFAULT_SEASON)
  const [region, setRegion] = useState<OpsRegionKey>(DEFAULT_REGION)
  const [stage, setStage] = useState<OpsStageKey>('swissMatch')
  const [draft, setDraft] = useState<Record<string, string>>(
    buildInitialDraft('swissMatch')
  )

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
  const finalRanking = useMemo(() => {
    if (!regionArchive) return []
    return buildRegionFinalRanking(regionArchive)
  }, [regionArchive])
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

  const setDraftField = (name: string, value: string) => {
    setDraft((prev) => ({ ...prev, [name]: value }))
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(OPERATOR_KEY_STORAGE)
    if (stored?.trim()) setOperatorKey(stored.trim())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!operatorKey.trim()) {
      window.localStorage.removeItem(OPERATOR_KEY_STORAGE)
      return
    }
    window.localStorage.setItem(OPERATOR_KEY_STORAGE, operatorKey.trim())
  }, [operatorKey])

  const fetchFeed = useCallback(async () => {
    try {
      setFeedLoading(true)
      setFeedError('')

      const params = new URLSearchParams({
        season: season.trim() || DEFAULT_SEASON,
        region,
      })

      const response = await fetch(`/api/ops/feed?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
      const payload = (await response
        .json()
        .catch(() => null)) as ApiEnvelope | null

      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload?.error || `${response.status} ${response.statusText}`.trim()
        )
      }

      const data = payload.data ?? null
      setFeedRaw(data)
      setLastFeedAt(new Date().toLocaleTimeString('ko-KR', { hour12: false }))
      return data
    } catch (err) {
      setFeedError(err instanceof Error ? err.message : '송출 데이터 조회 실패')
      return null
    } finally {
      setFeedLoading(false)
    }
  }, [region, season])

  useEffect(() => {
    void fetchFeed()
    const timer = window.setInterval(() => {
      void fetchFeed()
    }, REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [fetchFeed])

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

      const fresh = await fetchFeed()
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

      const payload = buildOpsUpsertPayload({
        stage,
        season,
        region,
        draft,
      })

      await requestOpsApi('/api/ops/upsert', 'POST', payload, operatorKey)
      const fresh = await fetchFeed()

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
      await fetchFeed()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'DB 탭 초기화 실패')
    } finally {
      setIsInitRunning(false)
    }
  }

  const handleValidate = async () => {
    try {
      setIsValidating(true)
      setErrorMessage('')
      setInfoMessage('')
      setValidationResult(null)
      const data = (await requestOpsApi(
        '/api/ops/validate',
        'POST',
        { season: season.trim() || DEFAULT_SEASON, region: 'all' },
        operatorKey
      )) as {
        valid: boolean
        errors: { sheet: string; rule: string; message: string; row?: number }[]
        warnings: {
          sheet: string
          rule: string
          message: string
          row?: number
        }[]
        summary: { sheet: string; target: string; rows: number }[]
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
    const modeLabel = exportReplaceMode ? 'replace (초기화 후 재송출)' : 'upsert'
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
      await fetchFeed()
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
      await fetchFeed()
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

  return (
    <TkcSection className='space-y-6 md:space-y-8'>
      <TkcPageHeader
        title='아케이드 운영 콘솔'
        subtitle='지역은 주간 단위로 전환하고, 경기는 한 매치씩 순차 입력/송출합니다.'
      />

      <section className='rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
        <div className='grid gap-3 md:grid-cols-4'>
          <div className='space-y-1.5 md:col-span-2'>
            <label className='text-xs font-semibold text-white/70'>
              운영자 키
            </label>
            <Input
              type='password'
              value={operatorKey}
              onChange={(event) => setOperatorKey(event.target.value)}
              placeholder='Cloudflare OPS_OPERATOR_KEY'
              autoComplete='off'
            />
          </div>

          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-white/70'>시즌</label>
            <Input
              value={season}
              onChange={(event) => setSeason(event.target.value)}
              placeholder='2026'
            />
          </div>

          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-white/70'>
              현재 지역
            </label>
            <Select
              value={region}
              onValueChange={(value) => setRegion(value as OpsRegionKey)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPS_REGION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='mt-3 flex flex-wrap gap-2'>
          <a
            href={broadcastUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex h-9 items-center rounded-md border border-white/15 bg-white/[0.04] px-3 text-xs font-semibold text-white/80 transition-colors hover:bg-white/[0.08]'
          >
            실시간 송출 화면 열기
          </a>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchFeed}
            disabled={feedLoading}
          >
            {feedLoading ? '새로고침 중..' : 'DB 새로고침'}
          </Button>
        </div>

        {infoMessage ? (
          <p className='mt-3 rounded-md border border-emerald-300/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200'>
            {infoMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className='mt-3 rounded-md border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs text-red-100'>
            {errorMessage}
          </p>
        ) : null}
      </section>

      <section className='rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
        <div className='space-y-1.5'>
          <h2 className='text-base font-bold text-white'>
            주간 지역 운영 보드
          </h2>
          <p className='text-xs text-white/60'>
            1주차부터 4주차까지 지역을 순서대로 운영합니다. 카드를 눌러 현재
            주차 지역을 즉시 전환할 수 있습니다.
          </p>
        </div>

        <div className='mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4'>
          {weekStatuses.map((week) => (
            <button
              key={week.key}
              type='button'
              onClick={() => setRegion(week.key)}
              className={`rounded-xl border p-3 text-left transition ${
                region === week.key
                  ? 'border-[#ff2a00]/70 bg-[#ff2a00]/10'
                  : 'border-white/10 bg-black/20 hover:border-white/25'
              }`}
            >
              <div className='flex items-center justify-between gap-2'>
                <span className='text-xs font-semibold text-white/70'>
                  {week.weekNo}주차
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(week.status)}`}
                >
                  {statusLabel(week.status)}
                </span>
              </div>

              <p className='mt-2 text-sm font-bold text-white'>{week.label}</p>
              <p className='mt-2 text-[11px] text-white/60'>
                온라인 {week.onlineEntries}명 / Swiss {week.swissCompleted}/
                {week.swissTotal} / 결선확정 {week.qualifierCount}/2
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className='rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
        <div className='space-y-1.5'>
          <h2 className='text-base font-bold text-white'>순차 입력</h2>
          <p className='text-xs text-white/60'>
            한 경기씩 끝날 때마다 저장하고 다음 경기 슬롯으로 이동합니다.
          </p>
        </div>

        <div className='mt-4 space-y-1.5'>
          <label className='text-xs font-semibold text-white/70'>
            입력 스테이지
          </label>
          <Select
            value={stage}
            onValueChange={(value) => setStage(value as OpsStageKey)}
          >
            <SelectTrigger className='w-full'>
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
          <p className='text-xs text-white/55'>{stageDef.description}</p>
        </div>

        {isSequentialStage ? (
          <div className='mt-4 rounded-xl border border-[#ff2a00]/20 bg-[#ff2a00]/5 p-3'>
            <p className='text-xs font-semibold text-[#ffd6cf]'>
              순차 진행 가이드 ({stage === 'swissMatch' ? 'Swiss' : 'Top8'})
            </p>
            <div className='mt-2 grid gap-2 text-xs md:grid-cols-3'>
              <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
                <div className='text-white/50'>현재 경기</div>
                <div className='mt-1 font-medium text-white/85'>
                  {matchLine(stageCurrent)}
                </div>
              </div>
              <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
                <div className='text-white/50'>다음 경기</div>
                <div className='mt-1 font-medium text-white/85'>
                  {matchLine(stageNext)}
                </div>
              </div>
              <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
                <div className='text-white/50'>직전 결과</div>
                <div className='mt-1 font-medium text-white/85'>
                  {matchLine(stagePrevious)}
                </div>
              </div>
            </div>

            <div className='mt-3 flex flex-wrap gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleLoadCurrentMatch}
              >
                현재 경기 불러오기
              </Button>
              <Button variant='outline' size='sm' onClick={handleLoadNextMatch}>
                다음 경기 슬롯
              </Button>
            </div>
          </div>
        ) : null}

        {stage === 'swissMatch' ? (
          <div className='mt-4 rounded-xl border border-white/10 bg-black/20 p-3'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <p className='text-xs font-semibold text-white/80'>
                Round pre-draw (bulk schedule before start)
              </p>
              <span className='text-[11px] text-white/55'>
                players loaded: {regionParticipants.length}
              </span>
            </div>

            <p className='mt-1 text-[11px] text-white/55'>
              Format: `table,p1EntryId,p2EntryId[,note]` one line each. Use
              `BYE` or `-` for no opponent.
            </p>

            <div className='mt-3 grid gap-2 md:grid-cols-3'>
              <div className='space-y-1'>
                <label className='text-[11px] text-white/60'>round</label>
                <Input
                  type='number'
                  inputMode='numeric'
                  value={bulkRound}
                  onChange={(event) => setBulkRound(event.target.value)}
                  placeholder={
                    currentSwissRound ? String(currentSwissRound) : '1'
                  }
                />
              </div>
              <div className='space-y-1'>
                <label className='text-[11px] text-white/60'>
                  song1 / level1
                </label>
                <div className='grid grid-cols-3 gap-2'>
                  <Input
                    className='col-span-2'
                    value={bulkSong1}
                    onChange={(event) => setBulkSong1(event.target.value)}
                    placeholder='Song 1'
                  />
                  <Input
                    value={bulkLevel1}
                    onChange={(event) => setBulkLevel1(event.target.value)}
                    placeholder='Lv'
                  />
                </div>
              </div>
              <div className='space-y-1'>
                <label className='text-[11px] text-white/60'>
                  song2 / level2
                </label>
                <div className='grid grid-cols-3 gap-2'>
                  <Input
                    className='col-span-2'
                    value={bulkSong2}
                    onChange={(event) => setBulkSong2(event.target.value)}
                    placeholder='Song 2'
                  />
                  <Input
                    value={bulkLevel2}
                    onChange={(event) => setBulkLevel2(event.target.value)}
                    placeholder='Lv'
                  />
                </div>
              </div>
            </div>

            <div className='mt-2 grid gap-2 md:grid-cols-3'>
              <div className='space-y-1 md:col-span-1'>
                <label className='text-[11px] text-white/60'>
                  song3 / level3 (optional)
                </label>
                <div className='grid grid-cols-3 gap-2'>
                  <Input
                    className='col-span-2'
                    value={bulkSong3}
                    onChange={(event) => setBulkSong3(event.target.value)}
                    placeholder='Song 3'
                  />
                  <Input
                    value={bulkLevel3}
                    onChange={(event) => setBulkLevel3(event.target.value)}
                    placeholder='Lv'
                  />
                </div>
              </div>
            </div>

            <div className='mt-2'>
              <Textarea
                value={bulkLines}
                onChange={(event) => setBulkLines(event.target.value)}
                placeholder={'1,SEO-01,SEO-16\n2,SEO-02,SEO-15\n3,SEO-03,BYE'}
                className='min-h-32 font-mono text-xs'
              />
            </div>

            <div className='mt-3 flex flex-wrap gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handlePrefillRoundLines}
                disabled={isBulkSeeding}
              >
                Load current round lines
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={handleGenerateSeedOrderLines}
                disabled={isBulkSeeding}
              >
                Auto-generate by seed order
              </Button>
              <Button
                size='sm'
                onClick={handleBulkSeedRound}
                disabled={isBulkSeeding}
              >
                {isBulkSeeding ? 'Saving pre-draw...' : 'Save round pre-draw'}
              </Button>
            </div>
          </div>
        ) : null}

        <div className='mt-4 grid gap-3 md:grid-cols-2'>
          {stageDef.fields.map((field) => {
            const value = draft[field.name] ?? field.defaultValue ?? ''
            const type = field.type ?? 'text'

            return (
              <div key={field.name} className='space-y-1'>
                <label className='text-xs text-white/70'>
                  {field.label}
                  {field.required ? (
                    <span className='ml-1 text-[#ff2a00]'>*</span>
                  ) : null}
                </label>

                {type === 'select' ? (
                  <Select
                    value={value}
                    onValueChange={(next) => setDraftField(field.name, next)}
                  >
                    <SelectTrigger className='w-full'>
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
                    <SelectTrigger className='w-full'>
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
                    onChange={(event) =>
                      setDraftField(field.name, event.target.value)
                    }
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            )
          })}
        </div>

        {winnerOptions.length > 0 ? (
          <div className='mt-3 rounded-lg border border-white/10 bg-black/25 p-3'>
            <p className='text-xs text-white/60'>승자 빠른 선택</p>
            <div className='mt-2 flex flex-wrap gap-2'>
              {winnerOptions.map((option) => (
                <Button
                  key={option.entryId}
                  size='sm'
                  variant='outline'
                  onClick={() => setDraftField('winnerEntryId', option.entryId)}
                >
                  {option.nickname || option.entryId}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <div className='mt-4 flex flex-wrap gap-2'>
          <Button onClick={handleSaveRow} disabled={isSaving}>
            {isSaving ? '저장 중..' : 'DB 저장'}
          </Button>
          <Button variant='outline' onClick={resetDraft} disabled={isSaving}>
            입력 초기화
          </Button>
        </div>
      </section>

      <section className='rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5 space-y-5'>
        <div className='space-y-1.5'>
          <h2 className='text-base font-bold text-white'>
            검증 → 송출 → 롤백
          </h2>
          <p className='text-xs text-white/60'>
            데이터 검증 후 안전하게 송출하고, 문제 발생 시 스냅샷으로 롤백할 수
            있습니다.
          </p>
        </div>

        {/* ── 1단계: 검증 ── */}
        <div className='space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3'>
          <h3 className='text-sm font-bold text-white'>1. 데이터 검증</h3>
          <Button
            variant='outline'
            onClick={handleValidate}
            disabled={isValidating}
          >
            {isValidating ? '검증 중..' : '데이터 검증 실행'}
          </Button>

          {validationResult ? (
            <div className='space-y-2'>
              <p
                className={`text-xs font-semibold ${validationResult.valid ? 'text-emerald-300' : 'text-red-300'}`}
              >
                {validationResult.valid
                  ? '검증 통과 — 송출 가능합니다.'
                  : `검증 실패 — 오류 ${validationResult.errors.length}건`}
              </p>

              {validationResult.errors.length > 0 ? (
                <div className='max-h-40 overflow-y-auto rounded-lg border border-red-300/25 bg-red-500/10 p-2 text-xs text-red-100'>
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
                <div className='max-h-32 overflow-y-auto rounded-lg border border-yellow-300/25 bg-yellow-500/10 p-2 text-xs text-yellow-100'>
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

              {validationResult.summary.length > 0 ? (
                <details className='text-xs text-white/60'>
                  <summary className='cursor-pointer hover:text-white/80'>
                    탭별 행 수 요약 ({validationResult.summary.length}개 탭)
                  </summary>
                  <div className='mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono md:grid-cols-3'>
                    {validationResult.summary.map((s, i) => (
                      <span key={i}>
                        {s.target}: {s.rows}행
                      </span>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* ── 2단계: 송출 ── */}
        <div className='space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3'>
          <h3 className='text-sm font-bold text-white'>2. 안전 송출</h3>
          <p className='text-[11px] text-white/50'>
            자동으로 검증 → 백업(스냅샷) → 송출 → 캐시 초기화가 실행됩니다.
          </p>
          <label className='flex items-center gap-2 text-xs text-white/70'>
            <input
              type='checkbox'
              checked={exportReplaceMode}
              onChange={(e) => setExportReplaceMode(e.target.checked)}
              className='accent-[#ff2a00]'
            />
            replace 모드 (기존 아카이브 초기화 후 재송출)
          </label>
          <Button onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? '송출 중..' : '검증 + 백업 + 송출'}
          </Button>
        </div>

        {/* ── 3단계: 롤백 ── */}
        <div className='space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3'>
          <h3 className='text-sm font-bold text-white'>3. 롤백</h3>
          <div className='flex flex-wrap items-end gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={loadSnapshots}
              disabled={isLoadingSnapshots}
            >
              {isLoadingSnapshots ? '조회 중..' : '스냅샷 조회'}
            </Button>
            {snapshots.length > 0 ? (
              <Select
                value={selectedSnapshotId}
                onValueChange={setSelectedSnapshotId}
              >
                <SelectTrigger className='w-64'>
                  <SelectValue placeholder='스냅샷 선택' />
                </SelectTrigger>
                <SelectContent>
                  {snapshots.map((snap) => (
                    <SelectItem
                      key={snap.snapshotId}
                      value={snap.snapshotId}
                    >
                      {snap.snapshotId} ({snap.createdAt})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
          {snapshots.length > 0 && selectedSnapshotId ? (
            <Button
              variant='destructive'
              onClick={handleRollback}
              disabled={isRollingBack}
            >
              {isRollingBack
                ? '롤백 중..'
                : `"${selectedSnapshotId}" 롤백 실행`}
            </Button>
          ) : null}
        </div>

        {/* ── 유틸리티 ── */}
        <div className='flex flex-wrap gap-2 border-t border-white/10 pt-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleInitOpsTabs}
            disabled={isInitRunning}
          >
            {isInitRunning ? '초기화 중..' : '운영 DB 탭 초기화'}
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={handleWriteOpsGuide}
            disabled={isGuideRunning}
          >
            {isGuideRunning ? 'Writing guide..' : 'Write ops guide sheet'}
          </Button>
        </div>
      </section>

      <section className='grid gap-4 lg:grid-cols-2'>
        <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-bold text-white'>
              {
                OPS_REGION_OPTIONS.find((option) => option.value === region)
                  ?.label
              }{' '}
              지역 순위 미리보기
            </h3>
            <span className='text-[11px] text-white/45'>
              {lastFeedAt ? `DB ${lastFeedAt} 갱신` : '갱신 대기'}
            </span>
          </div>

          {feedError ? (
            <p className='mt-3 rounded-md border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs text-red-100'>
              {feedError}
            </p>
          ) : null}

          {finalRanking.length === 0 ? (
            <p className='mt-3 text-xs text-white/60'>
              운영 DB에 순위 데이터가 없습니다.
            </p>
          ) : (
            <div className='mt-3 overflow-x-auto rounded-lg border border-white/10'>
              <table className='min-w-full text-left text-xs'>
                <thead className='bg-white/[0.07] text-white/70'>
                  <tr>
                    <th className='px-3 py-2'>순위</th>
                    <th className='px-3 py-2'>닉네임</th>
                    <th className='px-3 py-2'>전적</th>
                    <th className='px-3 py-2'>상태</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-white/[0.07]'>
                  {finalRanking.slice(0, 8).map((row) => (
                    <tr key={`${row.entryId}-${row.rank}`}>
                      <td className='px-3 py-2 font-bold text-[#ff2a00]'>
                        {row.rank}
                      </td>
                      <td className='px-3 py-2 text-white/85'>
                        {row.nickname}
                        <span className='ml-1 font-mono text-[10px] text-white/45'>
                          ({row.entryId})
                        </span>
                      </td>
                      <td className='px-3 py-2 text-white/70 tabular-nums'>
                        {typeof row.wins === 'number' &&
                        typeof row.losses === 'number'
                          ? `${row.wins}-${row.losses}`
                          : '-'}
                      </td>
                      <td className='px-3 py-2 text-white/65'>
                        {row.statusLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
          <h3 className='text-sm font-bold text-white'>경기 진행 요약</h3>

          <div className='mt-3 grid gap-2 text-xs'>
            <div className='rounded-lg border border-[#ff2a00]/20 bg-[#ff2a00]/5 px-3 py-2'>
              <span className='text-white/55'>Swiss 진행:</span>{' '}
              <span className='font-semibold text-white/80'>
                {swissProgress.completed}/{swissProgress.total}
              </span>
            </div>
            <div className='rounded-lg border border-[#ff2a00]/20 bg-[#ff2a00]/5 px-3 py-2'>
              <span className='text-white/55'>Top8 진행:</span>{' '}
              <span className='font-semibold text-white/80'>
                {finalsProgress.completed}/{finalsProgress.total}
              </span>
            </div>
            <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
              <span className='text-white/55'>현재 Swiss:</span>{' '}
              <span className='font-semibold text-white/80'>
                {matchLine(swissProgress.current)}
              </span>
            </div>
            <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
              <span className='text-white/55'>현재 Top8:</span>{' '}
              <span className='font-semibold text-white/80'>
                {matchLine(finalsProgress.current)}
              </span>
            </div>
            <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
              <span className='text-white/55'>A그룹:</span>{' '}
              <span className='font-semibold text-white/80'>
                {regionArchive?.qualifiers.groupA
                  ? `${regionArchive.qualifiers.groupA.nickname} (${regionArchive.qualifiers.groupA.entryId})`
                  : '미확정'}
              </span>
            </div>
            <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
              <span className='text-white/55'>B그룹:</span>{' '}
              <span className='font-semibold text-white/80'>
                {regionArchive?.qualifiers.groupB
                  ? `${regionArchive.qualifiers.groupB.nickname} (${regionArchive.qualifiers.groupB.entryId})`
                  : '미확정'}
              </span>
            </div>
          </div>
        </div>
      </section>
    </TkcSection>
  )
}
