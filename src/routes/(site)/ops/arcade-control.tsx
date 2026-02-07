import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  buildCurrentFinalMatchDraft,
  buildCurrentSwissMatchDraft,
  buildFinalsProgress,
  buildInitialDraft,
  buildNextFinalMatchDraft,
  buildNextSwissMatchDraft,
  buildOpsUpsertPayload,
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
  const payload = (await response.json().catch(() => null)) as ApiEnvelope | null

  if (!response.ok || !payload?.ok) {
    throw new Error(
      payload?.error || `${response.status} ${response.statusText}`.trim()
    )
  }

  return payload.data
}

function statusBadgeClass(status: 'pending' | 'live' | 'done') {
  if (status === 'done') return 'border-emerald-300/25 bg-emerald-500/10 text-emerald-200'
  if (status === 'live') return 'border-[#ff2a00]/35 bg-[#ff2a00]/10 text-[#ffd6cf]'
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
  const [isExportRegionRunning, setIsExportRegionRunning] = useState(false)
  const [isExportAllRunning, setIsExportAllRunning] = useState(false)

  const [infoMessage, setInfoMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [feedRaw, setFeedRaw] = useState<unknown>(null)
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedError, setFeedError] = useState('')
  const [lastFeedAt, setLastFeedAt] = useState('')

  const stageDef = OPS_STAGE_DEFINITIONS[stage]

  const archive = useMemo(() => resolveArcadeSeasonArchive(feedRaw), [feedRaw])
  const weekStatuses = useMemo(() => buildRegionWeekStatuses(archive), [archive])
  const regionArchive = useMemo(() => getRegionByKey(archive, region), [archive, region])
  const finalRanking = useMemo(() => {
    if (!regionArchive) return []
    return buildRegionFinalRanking(regionArchive)
  }, [regionArchive])
  const swissProgress = useMemo(() => buildSwissProgress(regionArchive), [regionArchive])
  const finalsProgress = useMemo(() => buildFinalsProgress(archive), [archive])

  const isSequentialStage = stage === 'swissMatch' || stage === 'finalMatch'
  const stageCurrent = stage === 'swissMatch'
    ? swissProgress.current
    : (stage === 'finalMatch' ? finalsProgress.current : undefined)
  const stageNext = stage === 'swissMatch'
    ? swissProgress.next
    : (stage === 'finalMatch' ? finalsProgress.next : undefined)
  const stagePrevious = stage === 'swissMatch'
    ? swissProgress.previous
    : (stage === 'finalMatch' ? finalsProgress.previous : undefined)

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
          nickname: draft.leftNickname?.trim() ?? draft.leftEntryId?.trim() ?? '',
        },
        {
          entryId: draft.rightEntryId?.trim() ?? '',
          nickname: draft.rightNickname?.trim() ?? draft.rightEntryId?.trim() ?? '',
        },
      ].filter((row) => row.entryId)
    }
    return []
  }, [draft, stage])

  const broadcastUrl = useMemo(
    () => `/ops/arcade-broadcast?season=${encodeURIComponent(season)}&region=${region}`,
    [season, region]
  )

  const setDraftField = (name: string, value: string) => {
    setDraft((prev) => ({ ...prev, [name]: value }))
  }

  const applyTemplate = useCallback((template: Record<string, string>) => {
    setDraft({
      ...buildInitialDraft(stage),
      ...template,
    })
  }, [stage])

  const resetDraft = useCallback(() => {
    setDraft(buildInitialDraft(stage))
  }, [stage])

  useEffect(() => {
    setDraft(buildInitialDraft(stage))
  }, [stage])

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
      const payload = (await response.json().catch(() => null)) as ApiEnvelope | null

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
      await requestOpsApi('/api/ops/init', 'POST', { scope: 'ops' }, operatorKey)
      setInfoMessage('운영 DB 탭 초기화 완료')
      await fetchFeed()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'DB 탭 초기화 실패')
    } finally {
      setIsInitRunning(false)
    }
  }

  const handleExportRegion = async () => {
    try {
      setIsExportRegionRunning(true)
      setErrorMessage('')
      setInfoMessage('')
      await requestOpsApi(
        '/api/ops/export',
        'POST',
        { season: season.trim() || DEFAULT_SEASON, region },
        operatorKey
      )
      setInfoMessage('이번 주 지역 결과를 송출용 아카이브로 반영했습니다.')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '지역 송출 실패')
    } finally {
      setIsExportRegionRunning(false)
    }
  }

  const handleExportAll = async () => {
    try {
      setIsExportAllRunning(true)
      setErrorMessage('')
      setInfoMessage('')
      await requestOpsApi(
        '/api/ops/export',
        'POST',
        { season: season.trim() || DEFAULT_SEASON, region: 'all' },
        operatorKey
      )
      setInfoMessage(`시즌 ${season || DEFAULT_SEASON} 전체 송출 완료`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '전체 송출 실패')
    } finally {
      setIsExportAllRunning(false)
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
            <label className='text-xs font-semibold text-white/70'>운영자 키</label>
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
            <label className='text-xs font-semibold text-white/70'>현재 지역</label>
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
          <h2 className='text-base font-bold text-white'>주간 지역 운영 보드</h2>
          <p className='text-xs text-white/60'>
            1주차부터 4주차까지 지역을 순서대로 운영합니다. 카드를 눌러 현재 주차 지역을 즉시 전환할 수 있습니다.
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
                온라인 {week.onlineEntries}명 / Swiss {week.swissCompleted}/{week.swissTotal} / 결선확정 {week.qualifierCount}/2
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
          <label className='text-xs font-semibold text-white/70'>입력 스테이지</label>
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
                <div className='mt-1 font-medium text-white/85'>{matchLine(stageCurrent)}</div>
              </div>
              <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
                <div className='text-white/50'>다음 경기</div>
                <div className='mt-1 font-medium text-white/85'>{matchLine(stageNext)}</div>
              </div>
              <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
                <div className='text-white/50'>직전 결과</div>
                <div className='mt-1 font-medium text-white/85'>{matchLine(stagePrevious)}</div>
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
              <Button
                variant='outline'
                size='sm'
                onClick={handleLoadNextMatch}
              >
                다음 경기 슬롯
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
                  {field.required ? <span className='ml-1 text-[#ff2a00]'>*</span> : null}
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
          <Button
            variant='outline'
            onClick={resetDraft}
            disabled={isSaving}
          >
            입력 초기화
          </Button>
        </div>
      </section>

      <section className='rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
        <div className='space-y-1.5'>
          <h2 className='text-base font-bold text-white'>송출 반영</h2>
          <p className='text-xs text-white/60'>
            경기 종료 직후 현재 지역만 송출하면, 방송/제어 페이지가 실시간으로 최신 결과를 반영합니다.
          </p>
        </div>

        <div className='mt-4 flex flex-wrap gap-2'>
          <Button
            variant='outline'
            onClick={handleInitOpsTabs}
            disabled={isInitRunning}
          >
            {isInitRunning ? '초기화 중..' : '운영 DB 탭 초기화'}
          </Button>
          <Button
            onClick={handleExportRegion}
            disabled={isExportRegionRunning}
          >
            {isExportRegionRunning ? '송출 중..' : '이번 주 지역 송출'}
          </Button>
          <Button
            variant='secondary'
            onClick={handleExportAll}
            disabled={isExportAllRunning}
          >
            {isExportAllRunning ? '송출 중..' : '시즌 전체 송출'}
          </Button>
        </div>
      </section>

      <section className='grid gap-4 lg:grid-cols-2'>
        <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-bold text-white'>
              {OPS_REGION_OPTIONS.find((option) => option.value === region)?.label} 지역 순위 미리보기
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
            <p className='mt-3 text-xs text-white/60'>운영 DB에 순위 데이터가 없습니다.</p>
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
                      <td className='px-3 py-2 font-bold text-[#ff2a00]'>{row.rank}</td>
                      <td className='px-3 py-2 text-white/85'>
                        {row.nickname}
                        <span className='ml-1 font-mono text-[10px] text-white/45'>
                          ({row.entryId})
                        </span>
                      </td>
                      <td className='px-3 py-2 tabular-nums text-white/70'>
                        {typeof row.wins === 'number' && typeof row.losses === 'number'
                          ? `${row.wins}-${row.losses}`
                          : '-'}
                      </td>
                      <td className='px-3 py-2 text-white/65'>{row.statusLabel}</td>
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
