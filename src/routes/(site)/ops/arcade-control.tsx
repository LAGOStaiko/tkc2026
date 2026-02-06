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
  buildInitialDraft,
  buildOpsUpsertPayload,
  buildRegionFinalRanking,
  OPS_REGION_OPTIONS,
  OPS_STAGE_DEFINITIONS,
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
  const regionArchive = useMemo(() => getRegionByKey(archive, region), [archive, region])
  const finalRanking = useMemo(() => {
    if (!regionArchive) return []
    return buildRegionFinalRanking(regionArchive)
  }, [regionArchive])

  const latestSwissRound = useMemo(() => {
    if (!regionArchive || regionArchive.swissMatches.length === 0) return null
    const maxRound = Math.max(...regionArchive.swissMatches.map((match) => match.round))
    const rows = regionArchive.swissMatches
      .filter((match) => match.round === maxRound)
      .slice()
      .sort((a, b) => (a.table ?? 0) - (b.table ?? 0))
    return { round: maxRound, rows }
  }, [regionArchive])

  const broadcastUrl = useMemo(
    () => `/ops/arcade-broadcast?season=${encodeURIComponent(season)}&region=${region}`,
    [season, region]
  )

  const setDraftField = (name: string, value: string) => {
    setDraft((prev) => ({ ...prev, [name]: value }))
  }

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

      setFeedRaw(payload.data ?? null)
      setLastFeedAt(new Date().toLocaleTimeString('ko-KR', { hour12: false }))
    } catch (err) {
      setFeedError(err instanceof Error ? err.message : '송출 데이터 조회 실패')
    } finally {
      setFeedLoading(false)
    }
  }, [region, season])

  useEffect(() => {
    fetchFeed()
    const timer = window.setInterval(fetchFeed, REFRESH_MS)
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
      setInfoMessage(`${stageDef.label} 입력 완료`)
      await fetchFeed()
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
      setInfoMessage(`${OPS_REGION_OPTIONS.find((r) => r.value === region)?.label ?? region} 데이터 내보내기 완료`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '지역 내보내기 실패')
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
      setInfoMessage(`시즌 ${season || DEFAULT_SEASON} 전체 내보내기 완료`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '전체 내보내기 실패')
    } finally {
      setIsExportAllRunning(false)
    }
  }

  return (
    <TkcSection className='space-y-6 md:space-y-8'>
      <TkcPageHeader
        title='아케이드 운영 콘솔'
        subtitle='스마트폰 입력 → 운영 DB 저장 → 검수 후 홈페이지 아카이브 내보내기'
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
            <label className='text-xs font-semibold text-white/70'>지역</label>
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
            송출 창 열기
          </a>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchFeed}
            disabled={feedLoading}
          >
            {feedLoading ? '새로고침 중...' : 'DB 새로고침'}
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
          <h2 className='text-base font-bold text-white'>현장 입력</h2>
          <p className='text-xs text-white/60'>
            룰북 기준 스테이지별로 필요한 항목만 입력합니다. 동일 키 재입력 시 기존 값을 업데이트합니다.
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

        <div className='mt-4 flex flex-wrap gap-2'>
          <Button onClick={handleSaveRow} disabled={isSaving}>
            {isSaving ? '저장 중...' : 'DB 저장'}
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
          <h2 className='text-base font-bold text-white'>내보내기</h2>
          <p className='text-xs text-white/60'>
            운영 DB 데이터를 검수한 뒤 홈페이지용 아카이브 시트로 반영합니다.
          </p>
        </div>

        <div className='mt-4 flex flex-wrap gap-2'>
          <Button
            variant='outline'
            onClick={handleInitOpsTabs}
            disabled={isInitRunning}
          >
            {isInitRunning ? '초기화 중...' : '운영 DB 탭 초기화'}
          </Button>
          <Button
            onClick={handleExportRegion}
            disabled={isExportRegionRunning}
          >
            {isExportRegionRunning ? '내보내는 중...' : '선택 지역 내보내기'}
          </Button>
          <Button
            variant='secondary'
            onClick={handleExportAll}
            disabled={isExportAllRunning}
          >
            {isExportAllRunning ? '내보내는 중...' : '시즌 전체 내보내기'}
          </Button>
        </div>
      </section>

      <section className='grid gap-4 lg:grid-cols-2'>
        <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-bold text-white'>
              {OPS_REGION_OPTIONS.find((option) => option.value === region)?.label} 최종 순위 미리보기
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
          <h3 className='text-sm font-bold text-white'>현재 라운드 Swiss 매치</h3>
          {latestSwissRound ? (
            <>
              <p className='mt-2 text-xs text-white/55'>
                Round {latestSwissRound.round}
              </p>
              <div className='mt-3 space-y-2'>
                {latestSwissRound.rows.map((match, index) => (
                  <div
                    key={`${match.round}-${match.table ?? index}`}
                    className='rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs'
                  >
                    <div className='font-semibold text-white/80'>
                      T{match.table ?? index + 1} · {match.player1.nickname} vs{' '}
                      {match.player2?.nickname ?? 'BYE'}
                    </div>
                    <div className='mt-1 text-white/55'>
                      승자:{' '}
                      <span className='font-medium text-white/80'>
                        {match.winnerEntryId || '기록 대기'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className='mt-3 text-xs text-white/60'>
              Swiss 매치 기록이 없습니다.
            </p>
          )}

          <div className='mt-4 grid gap-2 text-xs'>
            <div className='rounded-lg border border-[#ff2a00]/20 bg-[#ff2a00]/5 px-3 py-2'>
              <span className='text-white/55'>A그룹:</span>{' '}
              <span className='font-semibold text-white/80'>
                {regionArchive?.qualifiers.groupA
                  ? `${regionArchive.qualifiers.groupA.nickname} (${regionArchive.qualifiers.groupA.entryId})`
                  : '미확정'}
              </span>
            </div>
            <div className='rounded-lg border border-[#ff2a00]/20 bg-[#ff2a00]/5 px-3 py-2'>
              <span className='text-white/55'>B그룹:</span>{' '}
              <span className='font-semibold text-white/80'>
                {regionArchive?.qualifiers.groupB
                  ? `${regionArchive.qualifiers.groupB.nickname} (${regionArchive.qualifiers.groupB.entryId})`
                  : '미확정'}
              </span>
            </div>
            <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
              <span className='text-white/55'>결선 매치 데이터:</span>{' '}
              <span className='font-semibold text-white/80'>
                {archive.finals.crossMatches.length}경기
              </span>
            </div>
            <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
              <span className='text-white/55'>결선 승자 입력:</span>{' '}
              <span className='font-semibold text-white/80'>
                {
                  archive.finals.crossMatches.filter(
                    (row) => Boolean(row.winnerEntryId)
                  ).length
                }
                경기
              </span>
            </div>
          </div>
        </div>
      </section>
    </TkcSection>
  )
}
