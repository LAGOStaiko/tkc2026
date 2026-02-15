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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/ops/arcade-control')({
  component: ArcadeOpsControlPage,
})

const DEFAULT_SEASON = '2026'
const DEFAULT_REGION: OpsRegionKey = 'seoul'
const REFRESH_MS = 5000
const OPS_KEY_SESSION_KEY = 'tkc2026:ops-operator-key'

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

function matchLine(match?: OpsProgressMatch) {
  if (!match) return '留ㅼ튂 ?놁쓬'
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
  const [isOperatorVerified, setIsOperatorVerified] = useState(false)
  const [isOperatorVerifying, setIsOperatorVerifying] = useState(false)
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

  const [activeTab, setActiveTab] = useState('input')
  const [publishMeta, setPublishMeta] = useState<{
    lastPublishId: string
    lastPublishedAt: string
    lastCommitId: string
    lastCommittedAt: string
  } | null>(null)
  const [publishLog, setPublishLog] = useState<Record<string, unknown>[]>([])
  const [isLoadingLog, setIsLoadingLog] = useState(false)

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

  const applyFeedData = useCallback((data: unknown) => {
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
  }, [])

  const fetchFeedWithKey = useCallback(
    async (rawOperatorKey: string) => {
      const key = rawOperatorKey.trim()
      if (!key) {
        throw new Error('Operator key is required')
      }

      const params = new URLSearchParams({
        season: season.trim() || DEFAULT_SEASON,
        region,
      })

      const data = await requestOpsApi(
        `/api/ops/feed?${params.toString()}`,
        'GET',
        null,
        key
      )
      applyFeedData(data)
      return data
    },
    [applyFeedData, region, season]
  )

  const fetchFeed = useCallback(async () => {
    try {
      setFeedLoading(true)
      setFeedError('')
      return await fetchFeedWithKey(operatorKey)
    } catch (err) {
      setFeedError(err instanceof Error ? err.message : 'Failed to load feed')
      return null
    } finally {
      setFeedLoading(false)
    }
  }, [fetchFeedWithKey, operatorKey])

  const verifyOperatorKey = useCallback(
    async (rawOperatorKey: string) => {
      try {
        setIsOperatorVerifying(true)
        setFeedError('')
        await fetchFeedWithKey(rawOperatorKey)
        setIsOperatorVerified(true)
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(
            OPS_KEY_SESSION_KEY,
            rawOperatorKey.trim()
          )
        }
      } catch (err) {
        setIsOperatorVerified(false)
        setFeedError(
          err instanceof Error ? err.message : 'Authentication failed'
        )
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(OPS_KEY_SESSION_KEY)
        }
      } finally {
        setIsOperatorVerifying(false)
      }
    },
    [fetchFeedWithKey]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const restored = window.sessionStorage.getItem(OPS_KEY_SESSION_KEY)?.trim()
    if (!restored) return
    setOperatorKey(restored)
    void verifyOperatorKey(restored)
  }, [verifyOperatorKey])

  useEffect(() => {
    if (!isOperatorVerified) return
    void fetchFeed()
    const timer = window.setInterval(() => {
      void fetchFeed()
    }, REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [fetchFeed, isOperatorVerified])

  const validateRequiredFields = () => {
    for (const field of stageDef.fields) {
      if (!field.required) continue
      const value = draft[field.name]
      if (!value || value.trim().length === 0) {
        throw new Error(`?꾩닔 ??ぉ ?꾨씫: ${field.label}`)
      }
    }
  }

  const handleLoadCurrentMatch = () => {
    if (stage === 'swissMatch') {
      const template = buildCurrentSwissMatchDraft(regionArchive)
      if (!template) {
        setErrorMessage('?꾩옱 吏꾪뻾以묒씤 Swiss 寃쎄린媛 ?놁뒿?덈떎.')
        return
      }
      applyTemplate(template)
      setInfoMessage('?꾩옱 Swiss 寃쎄린 ?뺣낫瑜??낅젰?쇱뿉 遺덈윭?붿뒿?덈떎.')
      setErrorMessage('')
      return
    }

    if (stage === 'finalMatch') {
      const template = buildCurrentFinalMatchDraft(archive)
      if (!template) {
        setErrorMessage('?꾩옱 吏꾪뻾以묒씤 Top8 寃쎄린媛 ?놁뒿?덈떎.')
        return
      }
      applyTemplate(template)
      setInfoMessage('?꾩옱 Top8 寃쎄린 ?뺣낫瑜??낅젰?쇱뿉 遺덈윭?붿뒿?덈떎.')
      setErrorMessage('')
    }
  }

  const handleLoadNextMatch = () => {
    if (stage === 'swissMatch') {
      applyTemplate(buildNextSwissMatchDraft(regionArchive))
      setInfoMessage('?ㅼ쓬 Swiss 寃쎄린 ?낅젰 ?щ’??遺덈윭?붿뒿?덈떎.')
      setErrorMessage('')
      return
    }

    if (stage === 'finalMatch') {
      applyTemplate(buildNextFinalMatchDraft(archive))
      setInfoMessage('?ㅼ쓬 Top8 寃쎄린 ?낅젰 ?щ’??遺덈윭?붿뒿?덈떎.')
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
      setValidationResult(null)
      const fresh = await fetchFeed()

      if (stage === 'swissMatch') {
        const nextArchive = resolveArcadeSeasonArchive(fresh)
        const nextRegion = getRegionByKey(nextArchive, region)
        applyTemplate(buildNextSwissMatchDraft(nextRegion))
      } else if (stage === 'finalMatch') {
        const nextArchive = resolveArcadeSeasonArchive(fresh)
        applyTemplate(buildNextFinalMatchDraft(nextArchive))
      }

      setInfoMessage(`${stageDef.label} ?낅젰 ?꾨즺`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '?낅젰 ????ㅽ뙣')
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
      setInfoMessage('?댁쁺 DB ??珥덇린???꾨즺')
      await fetchFeed()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'DB ??珥덇린???ㅽ뙣')
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
      if (typeof v === 'string')
        return { sheet: '-', rule: 'Validation', message: v }
      if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>
        return {
          sheet: String(o.sheet ?? '-'),
          rule: String(o.rule ?? 'Validation'),
          message: String(o.message ?? ''),
          row: typeof o.row === 'number' ? o.row : undefined,
        }
      }
      return { sheet: '-', rule: 'Validation', message: String(v ?? '') }
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
      setInfoMessage(
        data.valid ? 'Validation passed' : 'Validation failed. Check errors.'
      )
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '寃利??ㅽ뙣')
    } finally {
      setIsValidating(false)
    }
  }

  const handlePublish = async () => {
    const modeLabel = exportReplaceMode
      ? 'replace (珥덇린?????ъ넚異?'
      : 'upsert'
    if (
      !confirm(
        `?쒖쫵 ${season || DEFAULT_SEASON} ?꾩껜瑜?${modeLabel} 紐⑤뱶濡??≪텧?⑸땲??\n\n?먮룞?쇰줈 寃利???諛깆뾽 ???≪텧???ㅽ뻾?⑸땲?? 怨꾩냽?섏떆寃좎뒿?덇퉴?`
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
        `Publish completed. publishId: ${data.publishId ?? '-'}, backup: ${data.snapshotId ?? '-'}, total rows: ${data.totalRows ?? 0}`
      )
      await fetchFeed()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '?≪텧 ?ㅽ뙣')
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
        err instanceof Error ? err.message : '?ㅻ깄??紐⑸줉 議고쉶 ?ㅽ뙣'
      )
    } finally {
      setIsLoadingSnapshots(false)
    }
  }

  const handleRollback = async () => {
    if (!selectedSnapshotId) {
      setErrorMessage('Select a snapshot before rollback')
      return
    }
    const snap = snapshots.find((s) => s.snapshotId === selectedSnapshotId)
    const confirmMessage = `Rollback snapshot "${selectedSnapshotId}"?\n\nCreated: ${snap?.createdAt ?? '-'}\nPublishId: ${snap?.publishId ?? '-'}\n\nCurrent pub_* data will be replaced. Continue?`
    if (!confirm(confirmMessage)) return
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
        `濡ㅻ갚 ?꾨즺 ??rollbackId: ${data.rollbackId ?? '?'}, 蹂듭썝 ?? ${data.restoredRows ?? 0}`
      )
      await fetchFeed()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '濡ㅻ갚 ?ㅽ뙣')
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
        err instanceof Error ? err.message : '諛쒗뻾 濡쒓렇 議고쉶 ?ㅽ뙣'
      )
    } finally {
      setIsLoadingLog(false)
    }
  }

  const requiredFields = stageDef.fields.filter((f) => f.required)
  const optionalFields = stageDef.fields.filter((f) => !f.required)

  const renderFieldInput = (field: (typeof stageDef.fields)[number]) => {
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
              <SelectValue placeholder={field.placeholder || '?좏깮'} />
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
            onChange={(event) => setDraftField(field.name, event.target.value)}
            placeholder={field.placeholder}
          />
        )}
      </div>
    )
  }

  if (!isOperatorVerified) {
    return (
      <TkcSection className='space-y-4 md:space-y-6'>
        <TkcPageHeader
          title='Arcade Ops Access'
          subtitle='Enter the operator key to unlock this page.'
        />
        <section className='rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
          <div className='grid gap-3 md:grid-cols-4'>
            <div className='space-y-1.5 md:col-span-2'>
              <label className='text-xs font-semibold text-white/70'>
                Operator key
              </label>
              <Input
                type='password'
                value={operatorKey}
                onChange={(event) => {
                  setOperatorKey(event.target.value)
                  setFeedError('')
                }}
                placeholder='Cloudflare OPS_OPERATOR_KEY'
                autoComplete='off'
              />
            </div>
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-white/70'>
                Season
              </label>
              <Input
                value={season}
                onChange={(event) => setSeason(event.target.value)}
                placeholder='2026'
              />
            </div>
            <div className='flex items-end'>
              <Button
                variant='outline'
                size='sm'
                className='w-full'
                onClick={() => void verifyOperatorKey(operatorKey)}
                disabled={isOperatorVerifying || !operatorKey.trim()}
              >
                {isOperatorVerifying ? 'Verifying...' : 'Unlock'}
              </Button>
            </div>
          </div>
          {feedError ? (
            <p className='mt-3 rounded-md border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs text-red-100'>
              {feedError}
            </p>
          ) : null}
        </section>
      </TkcSection>
    )
  }

  return (
    <TkcSection className='space-y-4 md:space-y-6'>
      <TkcPageHeader
        title='?꾩??대뱶 ?댁쁺 肄섏넄'
        subtitle='吏??? 二쇨컙 ?⑥쐞濡??꾪솚?섍퀬, 寃쎄린????留ㅼ튂???쒖감 ?낅젰/?≪텧?⑸땲??'
      />

      {/* ?? ?몄쬆 + ?ㅼ젙 ?? */}
      <section className='rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
        <div className='grid gap-3 md:grid-cols-4'>
          <div className='space-y-1.5 md:col-span-2'>
            <label className='text-xs font-semibold text-white/70'>
              ?댁쁺????{' '}
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
            <label className='text-xs font-semibold text-white/70'>?쒖쫵</label>
            <Input
              value={season}
              onChange={(event) => setSeason(event.target.value)}
              placeholder='2026'
            />
          </div>
          <div className='flex items-end'>
            <Button
              variant='outline'
              size='sm'
              className='w-full'
              onClick={fetchFeed}
              disabled={feedLoading}
            >
              {feedLoading ? '?덈줈怨좎묠 以?.' : 'DB ?덈줈怨좎묠'}
            </Button>
          </div>
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

      {/* ?? ?꾩옱 ?≪텧 踰꾩쟾 ?? */}
      <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm'>
        <div className='flex items-center gap-3'>
          <span className='text-white/40'>?꾩옱 ?≪텧</span>
          <span className='font-mono text-[#ff8c66]'>
            {publishMeta?.lastPublishId || '-'}
          </span>
        </div>
        <div className='flex items-center gap-4 text-xs text-white/50'>
          <span>
            {publishMeta?.lastPublishedAt
              ? new Date(publishMeta.lastPublishedAt).toLocaleString('ko-KR')
              : ''}
          </span>
          <span>{lastFeedAt ? `DB ${lastFeedAt}` : ''}</span>
        </div>
      </div>

      {/* ?? 吏????됲꽣 (異뺤냼) ?? */}
      <div className='flex flex-wrap gap-2'>
        {weekStatuses.map((week) => (
          <button
            key={week.key}
            type='button'
            onClick={() => setRegion(week.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              region === week.key
                ? 'bg-[#ff2a00] text-white'
                : 'bg-white/[0.06] text-white/60 hover:bg-white/10'
            }`}
          >
            {week.label}
            <span className='ml-1.5 text-xs opacity-60'>W{week.weekNo}</span>
            <span
              className={`ml-1 inline-block h-1.5 w-1.5 rounded-full ${
                week.status === 'done'
                  ? 'bg-emerald-400'
                  : week.status === 'live'
                    ? 'bg-[#ff2a00]'
                    : 'bg-white/30'
              }`}
            />
          </button>
        ))}
      </div>

      {/* ?? 硫붿씤 ???? */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='w-full'>
          <TabsTrigger value='input'>?낅젰</TabsTrigger>
          <TabsTrigger value='validate'>Validate</TabsTrigger>
          <TabsTrigger value='publish'>諛쒗뻾</TabsTrigger>
          <TabsTrigger value='rollback'>濡ㅻ갚</TabsTrigger>
          <TabsTrigger value='broadcast'>?≪텧?뺤씤</TabsTrigger>
          <TabsTrigger value='log'>濡쒓렇</TabsTrigger>
        </TabsList>

        {/* ?먥븧?먥븧 ?낅젰 ???먥븧?먥븧 */}
        <TabsContent value='input'>
          <div className='space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-white/70'>
                ?낅젰 ?ㅽ뀒?댁?
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
              <div className='rounded-xl border border-[#ff2a00]/20 bg-[#ff2a00]/5 p-3'>
                <p className='text-xs font-semibold text-[#ffd6cf]'>
                  ?쒖감 吏꾪뻾 媛?대뱶 (
                  {stage === 'swissMatch' ? 'Swiss' : 'Top8'})
                </p>
                <div className='mt-2 grid gap-2 text-xs md:grid-cols-3'>
                  <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
                    <div className='text-white/50'>?꾩옱 寃쎄린</div>
                    <div className='mt-1 font-medium text-white/85'>
                      {matchLine(stageCurrent)}
                    </div>
                  </div>
                  <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
                    <div className='text-white/50'>?ㅼ쓬 寃쎄린</div>
                    <div className='mt-1 font-medium text-white/85'>
                      {matchLine(stageNext)}
                    </div>
                  </div>
                  <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
                    <div className='text-white/50'>吏곸쟾 寃곌낵</div>
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
                    ?꾩옱 寃쎄린 遺덈윭?ㅺ린
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleLoadNextMatch}
                  >
                    ?ㅼ쓬 寃쎄린 ?щ’
                  </Button>
                </div>
              </div>
            ) : null}

            {/* ?꾩닔 ?꾨뱶 */}
            <div className='grid gap-3 md:grid-cols-2'>
              {requiredFields.map(renderFieldInput)}
            </div>

            {winnerOptions.length > 0 ? (
              <div className='rounded-lg border border-white/10 bg-black/25 p-3'>
                <p className='text-xs text-white/60'>?뱀옄 鍮좊Ⅸ ?좏깮</p>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {winnerOptions.map((option) => (
                    <Button
                      key={option.entryId}
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        setDraftField('winnerEntryId', option.entryId)
                      }
                    >
                      {option.nickname || option.entryId}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ?좏깮 ?꾨뱶 */}
            {optionalFields.length > 0 ? (
              <details className='group'>
                <summary className='cursor-pointer text-sm text-white/40 hover:text-white/60'>
                  異붽? ?꾨뱶 ({optionalFields.length}媛?
                </summary>
                <div className='mt-3 grid gap-3 md:grid-cols-2'>
                  {optionalFields.map(renderFieldInput)}
                </div>
              </details>
            ) : null}

            <div className='flex flex-wrap gap-2'>
              <Button onClick={handleSaveRow} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save to DB'}
              </Button>
              <Button
                variant='outline'
                onClick={resetDraft}
                disabled={isSaving}
              >
                ?낅젰 珥덇린??{' '}
              </Button>
            </div>

            {/* Swiss bulk seeding */}
            {stage === 'swissMatch' ? (
              <details className='group'>
                <summary className='cursor-pointer text-sm text-white/40 hover:text-white/60'>
                  Round pre-draw (bulk schedule)
                </summary>
                <div className='mt-3 rounded-xl border border-white/10 bg-black/20 p-3'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <span className='text-xs text-white/55'>
                      players loaded: {regionParticipants.length}
                    </span>
                  </div>
                  <p className='mt-1 text-xs text-white/55'>
                    Format: table,p1EntryId,p2EntryId[,note] ??Use BYE or - for
                    no opponent.
                  </p>
                  <div className='mt-3 grid gap-2 md:grid-cols-3'>
                    <div className='space-y-1'>
                      <label className='text-xs text-white/60'>round</label>
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
                      <label className='text-xs text-white/60'>
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
                          onChange={(event) =>
                            setBulkLevel1(event.target.value)
                          }
                          placeholder='Lv'
                        />
                      </div>
                    </div>
                    <div className='space-y-1'>
                      <label className='text-xs text-white/60'>
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
                          onChange={(event) =>
                            setBulkLevel2(event.target.value)
                          }
                          placeholder='Lv'
                        />
                      </div>
                    </div>
                  </div>
                  <div className='mt-2 grid gap-2 md:grid-cols-3'>
                    <div className='space-y-1 md:col-span-1'>
                      <label className='text-xs text-white/60'>
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
                          onChange={(event) =>
                            setBulkLevel3(event.target.value)
                          }
                          placeholder='Lv'
                        />
                      </div>
                    </div>
                  </div>
                  <div className='mt-2'>
                    <Textarea
                      value={bulkLines}
                      onChange={(event) => setBulkLines(event.target.value)}
                      placeholder={
                        '1,SEO-01,SEO-16\n2,SEO-02,SEO-15\n3,SEO-03,BYE'
                      }
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
                      {isBulkSeeding
                        ? 'Saving pre-draw...'
                        : 'Save round pre-draw'}
                    </Button>
                  </div>
                </div>
              </details>
            ) : null}

            {/* ?좏떥由ы떚 */}
            <div className='flex flex-wrap gap-2 border-t border-white/10 pt-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleInitOpsTabs}
                disabled={isInitRunning}
              >
                {isInitRunning ? 'Initializing...' : 'Initialize ops DB'}
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
          </div>
        </TabsContent>

        {/* ?먥븧?먥븧 寃利????먥븧?먥븧 */}
        <TabsContent value='validate'>
          <div className='space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
            <div className='space-y-1.5'>
              <h2 className='text-base font-bold text-white'>
                Data validation
              </h2>
              <p className='text-xs text-white/60'>
                Validate operator DB rows before publish (required fields,
                duplicates, and references).
              </p>
            </div>

            <Button
              variant='outline'
              onClick={handleValidate}
              disabled={isValidating}
            >
              {isValidating ? 'Validating...' : 'Run validation'}
            </Button>

            {validationResult ? (
              <div className='space-y-2'>
                <p
                  className={`text-xs font-semibold ${validationResult.valid ? 'text-emerald-300' : 'text-red-300'}`}
                >
                  {validationResult.valid
                    ? 'Validation passed. Ready to publish.'
                    : `Validation failed. ${validationResult.errors.length} errors found.`}
                </p>

                {validationResult.errors.length > 0 ? (
                  <div className='max-h-40 overflow-y-auto rounded-lg border border-red-300/25 bg-red-500/10 p-2 text-xs text-red-100'>
                    {validationResult.errors.map((e, i) => (
                      <div key={i} className='py-0.5'>
                        <span className='font-mono text-red-300'>
                          [{e.sheet}]
                        </span>{' '}
                        {e.rule}: {e.message}
                        {e.row != null ? ` (??${e.row})` : ''}
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
                      ??퀎 ?????붿빟 ({validationResult.summary.length}媛???
                    </summary>
                    <div className='mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono md:grid-cols-3'>
                      {validationResult.summary.map((s, i) => (
                        <span key={i}>
                          {s.target}: {s.rows}??{' '}
                        </span>
                      ))}
                    </div>
                  </details>
                ) : null}

                {validationResult.valid ? (
                  <p className='mt-2 text-sm text-emerald-400'>
                    寃利??듦낵 ??&quot;諛쒗뻾&quot; ??뿉???≪텧?????덉뒿?덈떎.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </TabsContent>

        {/* ?먥븧?먥븧 諛쒗뻾 ???먥븧?먥븧 */}
        <TabsContent value='publish'>
          <div className='space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
            <div className='space-y-1.5'>
              <h2 className='text-base font-bold text-white'>?덉쟾 ?≪텧</h2>
              <p className='text-xs text-white/60'>
                ?먮룞?쇰줈 寃利???諛깆뾽(?ㅻ깄?? ???≪텧 ??罹먯떆 珥덇린?붽?
                ?ㅽ뻾?⑸땲??
              </p>
            </div>

            {!validationResult ? (
              <div className='rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-300'>
                寃利앹쓣 癒쇱? ?ㅽ뻾??二쇱꽭?? &quot;寃利?quot;
                ??뿉???곗씠??寃利앹쓣 ?ㅽ뻾?????덉뒿?덈떎.
              </div>
            ) : !validationResult.valid ? (
              <div className='rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300'>
                寃利??ㅽ뙣 ???ㅻ쪟 {validationResult.errors.length}嫄댁쓣 ?섏젙
                ?? ?ㅼ떆 寃利앺빐 二쇱꽭??
              </div>
            ) : (
              <div className='space-y-3'>
                <div className='rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300'>
                  寃利??듦낵 ???≪텧?????덉뒿?덈떎.
                </div>
                <label className='flex items-center gap-2 text-xs text-white/70'>
                  <input
                    type='checkbox'
                    checked={exportReplaceMode}
                    onChange={(e) => setExportReplaceMode(e.target.checked)}
                    className='accent-[#ff2a00]'
                  />
                  replace 紐⑤뱶 (湲곗〈 ?꾩뭅?대툕 珥덇린?????ъ넚異?
                </label>
                <Button onClick={handlePublish} disabled={isPublishing}>
                  {isPublishing ? '?≪텧 以?.' : '寃利?+ 諛깆뾽 + ?≪텧'}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ?먥븧?먥븧 濡ㅻ갚 ???먥븧?먥븧 */}
        <TabsContent value='rollback'>
          <div className='space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
            <div className='space-y-1.5'>
              <h2 className='text-base font-bold text-white'>濡ㅻ갚</h2>
              <p className='text-xs text-white/60'>
                ?댁쟾 ?ㅻ깄?룹쑝濡?pub_* ?꾩껜瑜?蹂듭썝?⑸땲?? ?꾩옱 怨듦컻
                ?곗씠?곌? 紐⑤몢 援먯껜?⑸땲??
              </p>
            </div>

            <div className='flex flex-wrap items-end gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={loadSnapshots}
                disabled={isLoadingSnapshots}
              >
                {isLoadingSnapshots ? '議고쉶 以?.' : '?ㅻ깄??議고쉶'}
              </Button>
              {snapshots.length > 0 ? (
                <Select
                  value={selectedSnapshotId}
                  onValueChange={setSelectedSnapshotId}
                >
                  <SelectTrigger className='w-64'>
                    <SelectValue placeholder='?ㅻ깄???좏깮' />
                  </SelectTrigger>
                  <SelectContent>
                    {snapshots.map((snap) => (
                      <SelectItem key={snap.snapshotId} value={snap.snapshotId}>
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
                  ? '濡ㅻ갚 以?.'
                  : `"${selectedSnapshotId}" 濡ㅻ갚 ?ㅽ뻾`}
              </Button>
            ) : null}
          </div>
        </TabsContent>

        {/* ?먥븧?먥븧 ?≪텧?뺤씤 ???먥븧?먥븧 */}
        <TabsContent value='broadcast'>
          <div className='space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
            <div className='space-y-1.5'>
              <h2 className='text-base font-bold text-white'>?≪텧 ?뺤씤</h2>
              <p className='text-xs text-white/60'>
                ?꾩옱 怨듦컻 以묒씤 ?곗씠?곗쓽 ?붿빟怨??ㅼ떆媛??≪텧
                ?붾㈃???뺤씤?⑸땲??
              </p>
            </div>

            <a
              href={broadcastUrl}
              target='_blank'
              rel='noreferrer'
              className='inline-flex h-9 items-center gap-2 rounded-md border border-[#ff2a00]/30 bg-[#ff2a00]/10 px-4 text-sm font-semibold text-[#ffd6cf] transition-colors hover:bg-[#ff2a00]/20'
            >
              ?ㅼ떆媛??≪텧 ?붾㈃ ?닿린 &rarr;
            </a>

            {/* ?쒖쐞 誘몃━蹂닿린 */}
            <div className='rounded-xl border border-white/10 bg-white/[0.02] p-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-bold text-white'>
                  {
                    OPS_REGION_OPTIONS.find((option) => option.value === region)
                      ?.label
                  }{' '}
                  吏???쒖쐞
                </h3>
                <span className='text-xs text-white/45'>
                  {lastFeedAt
                    ? `DB ${lastFeedAt} updated`
                    : 'Waiting for update'}
                </span>
              </div>

              {feedError ? (
                <p className='mt-3 rounded-md border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs text-red-100'>
                  {feedError}
                </p>
              ) : null}

              {finalRanking.length === 0 ? (
                <p className='mt-3 text-xs text-white/60'>
                  ?댁쁺 DB???쒖쐞 ?곗씠?곌? ?놁뒿?덈떎.
                </p>
              ) : (
                <div className='mt-3 overflow-x-auto rounded-lg border border-white/10'>
                  <table className='min-w-full text-left text-xs'>
                    <thead className='bg-white/[0.07] text-white/70'>
                      <tr>
                        <th className='px-3 py-2'>?쒖쐞</th>
                        <th className='px-3 py-2'>?숇뜑 ?ㅼ엫</th>
                        <th className='px-3 py-2'>?꾩쟻</th>
                        <th className='px-3 py-2'>?곹깭</th>
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
                            <span className='ml-1 font-mono text-xs text-white/45'>
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

            {/* 寃쎄린 吏꾪뻾 ?붿빟 */}
            <div className='rounded-xl border border-white/10 bg-white/[0.02] p-4'>
              <h3 className='text-sm font-bold text-white'>
                寃쎄린 吏꾪뻾 ?붿빟
              </h3>
              <div className='mt-3 grid gap-2 text-xs md:grid-cols-2'>
                <div className='rounded-lg border border-[#ff2a00]/20 bg-[#ff2a00]/5 px-3 py-2'>
                  <span className='text-white/55'>Swiss 吏꾪뻾:</span>{' '}
                  <span className='font-semibold text-white/80'>
                    {swissProgress.completed}/{swissProgress.total}
                  </span>
                </div>
                <div className='rounded-lg border border-[#ff2a00]/20 bg-[#ff2a00]/5 px-3 py-2'>
                  <span className='text-white/55'>Top8 吏꾪뻾:</span>{' '}
                  <span className='font-semibold text-white/80'>
                    {finalsProgress.completed}/{finalsProgress.total}
                  </span>
                </div>
                <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
                  <span className='text-white/55'>?꾩옱 Swiss:</span>{' '}
                  <span className='font-semibold text-white/80'>
                    {matchLine(swissProgress.current)}
                  </span>
                </div>
                <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
                  <span className='text-white/55'>?꾩옱 Top8:</span>{' '}
                  <span className='font-semibold text-white/80'>
                    {matchLine(finalsProgress.current)}
                  </span>
                </div>
                <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
                  <span className='text-white/55'>A洹몃９:</span>{' '}
                  <span className='font-semibold text-white/80'>
                    {regionArchive?.qualifiers.groupA
                      ? `${regionArchive.qualifiers.groupA.nickname} (${regionArchive.qualifiers.groupA.entryId})`
                      : 'TBD'}
                  </span>
                </div>
                <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
                  <span className='text-white/55'>B洹몃９:</span>{' '}
                  <span className='font-semibold text-white/80'>
                    {regionArchive?.qualifiers.groupB
                      ? `${regionArchive.qualifiers.groupB.nickname} (${regionArchive.qualifiers.groupB.entryId})`
                      : 'TBD'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ?먥븧?먥븧 濡쒓렇 ???먥븧?먥븧 */}
        <TabsContent value='log'>
          <div className='space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
            <div className='space-y-1.5'>
              <h2 className='text-base font-bold text-white'>諛쒗뻾 濡쒓렇</h2>
              <p className='text-xs text-white/60'>
                ?≪텧/濡ㅻ갚/而ㅻ컠 ?대젰???뺤씤?⑸땲??(理쒓렐 50嫄?.
              </p>
            </div>

            <Button
              variant='outline'
              onClick={loadPublishLog}
              disabled={isLoadingLog}
            >
              {isLoadingLog ? '議고쉶 以?.' : '諛쒗뻾 濡쒓렇 議고쉶'}
            </Button>

            {publishLog.length > 0 ? (
              <div className='overflow-x-auto rounded-lg border border-white/10'>
                <table className='min-w-full text-left text-xs'>
                  <thead className='bg-white/[0.07] text-white/70'>
                    <tr>
                      <th className='px-3 py-2'>ID</th>
                      <th className='px-3 py-2'>紐⑤뱶</th>
                      <th className='px-3 py-2'>?쒓컖</th>
                      <th className='px-3 py-2'>?쒖쫵</th>
                      <th className='px-3 py-2'>吏??</th>
                      <th className='px-3 py-2'>??</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-white/[0.07]'>
                    {publishLog.map((entry, i) => {
                      const mode = String(entry.mode ?? '')
                      const modeColor =
                        mode === 'rollback'
                          ? 'text-red-300 bg-red-500/10 border-red-300/25'
                          : mode === 'replace'
                            ? 'text-orange-300 bg-orange-500/10 border-orange-300/25'
                            : mode === 'commit'
                              ? 'text-white/60 bg-white/[0.06] border-white/15'
                              : 'text-blue-300 bg-blue-500/10 border-blue-300/25'
                      return (
                        <tr key={i}>
                          <td className='px-3 py-2 font-mono text-xs text-white/80'>
                            {String(entry.publishId ?? '')}
                          </td>
                          <td className='px-3 py-2'>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${modeColor}`}
                            >
                              {mode || '?'}
                            </span>
                          </td>
                          <td className='px-3 py-2 text-white/60'>
                            {entry.publishedAt
                              ? new Date(
                                  String(entry.publishedAt)
                                ).toLocaleString('ko-KR')
                              : ''}
                          </td>
                          <td className='px-3 py-2 text-white/60'>
                            {String(entry.season ?? '')}
                          </td>
                          <td className='px-3 py-2 text-white/60'>
                            {String(entry.region ?? '')}
                          </td>
                          <td className='px-3 py-2 text-white/60 tabular-nums'>
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
        </TabsContent>
      </Tabs>
    </TkcSection>
  )
}
