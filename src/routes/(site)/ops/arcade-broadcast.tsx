import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  buildFinalsProgress,
  buildRegionFinalRanking,
  buildRegionWeekStatuses,
  buildSwissProgress,
  OPS_REGION_OPTIONS,
  type OpsProgressMatch,
  type OpsRegionKey,
} from '@/lib/arcade-ops'
import {
  getRegionByKey,
  resolveArcadeSeasonArchive,
} from '@/lib/arcade-results-archive'

export const Route = createFileRoute('/(site)/ops/arcade-broadcast')({
  component: ArcadeOpsBroadcastPage,
})

const DEFAULT_SEASON = '2026'
const DEFAULT_REGION: OpsRegionKey = 'seoul'
const REFRESH_MS = 3000

type ApiEnvelope = {
  ok?: boolean
  data?: unknown
  error?: string
}

function normalizeRegionKey(value: string | null): OpsRegionKey {
  const text = (value ?? '').trim().toLowerCase()
  if (text === 'seoul') return 'seoul'
  if (text === 'daejeon') return 'daejeon'
  if (text === 'gwangju') return 'gwangju'
  if (text === 'busan') return 'busan'
  return DEFAULT_REGION
}

function readSearchDefaults() {
  if (typeof window === 'undefined') {
    return { season: DEFAULT_SEASON, region: DEFAULT_REGION }
  }
  const params = new URLSearchParams(window.location.search)
  return {
    season: params.get('season')?.trim() || DEFAULT_SEASON,
    region: normalizeRegionKey(params.get('region')),
  }
}

function statusLabel(status: 'pending' | 'live' | 'done') {
  if (status === 'done') return '완료'
  if (status === 'live') return '진행중'
  return '대기'
}

function statusBadgeClass(status: 'pending' | 'live' | 'done') {
  if (status === 'done') return 'border-emerald-300/25 bg-emerald-500/10 text-emerald-200'
  if (status === 'live') return 'border-[#ff2a00]/35 bg-[#ff2a00]/10 text-[#ffd6cf]'
  return 'border-white/20 bg-white/[0.06] text-white/70'
}

function matchName(match?: OpsProgressMatch) {
  if (!match) return '대기 중'
  return `${match.leftName} vs ${match.rightName}`
}

function matchWinnerLabel(match?: OpsProgressMatch) {
  if (!match?.winnerEntryId) return '미정'
  if (match.winnerEntryId === match.leftEntryId) return `${match.leftName} 승`
  if (match.winnerEntryId === match.rightEntryId) return `${match.rightName} 승`
  return match.winnerEntryId
}

function MatchCard({
  title,
  match,
}: {
  title: string
  match?: OpsProgressMatch
}) {
  return (
    <div className='rounded-2xl border border-white/15 bg-white/[0.04] p-4'>
      <div className='text-xs text-white/55'>{title}</div>
      {match ? (
        <>
          <div className='mt-2 text-sm font-black text-[#ff2a00] md:text-base'>
            {match.label}
          </div>
          <div className='mt-2 text-lg font-bold text-white md:text-xl'>
            {match.leftName}
            <span className='mx-2 text-white/45'>vs</span>
            {match.rightName}
          </div>
          <div className='mt-1 text-xs text-white/60'>
            {match.leftEntryId || '-'} / {match.rightEntryId || '-'}
          </div>
          <div className='mt-3 text-xs text-white/55'>
            승자: <span className='font-semibold text-white/85'>{matchWinnerLabel(match)}</span>
          </div>
          {match.note ? (
            <div className='mt-1 text-xs text-white/50'>{match.note}</div>
          ) : null}
        </>
      ) : (
        <div className='mt-3 text-sm text-white/60'>진행중인 경기가 없습니다.</div>
      )}
    </div>
  )
}

function ArcadeOpsBroadcastPage() {
  const defaults = readSearchDefaults()
  const [season] = useState(defaults.season)
  const [region] = useState<OpsRegionKey>(defaults.region)
  const [feedRaw, setFeedRaw] = useState<unknown>(null)
  const [error, setError] = useState('')
  const [lastUpdateAt, setLastUpdateAt] = useState('')

  const archive = useMemo(() => resolveArcadeSeasonArchive(feedRaw), [feedRaw])
  const regionArchive = useMemo(() => getRegionByKey(archive, region), [archive, region])
  const weekStatuses = useMemo(() => buildRegionWeekStatuses(archive), [archive])
  const weekStatus = useMemo(
    () => weekStatuses.find((week) => week.key === region),
    [region, weekStatuses]
  )
  const swissProgress = useMemo(() => buildSwissProgress(regionArchive), [regionArchive])
  const finalsProgress = useMemo(() => buildFinalsProgress(archive), [archive])
  const finalRanking = useMemo(
    () => (regionArchive ? buildRegionFinalRanking(regionArchive) : []),
    [regionArchive]
  )

  const primaryCurrent = swissProgress.current ?? finalsProgress.current
  const primaryNext = swissProgress.current
    ? swissProgress.next
    : (finalsProgress.current ? finalsProgress.next : undefined)
  const primaryPrevious = swissProgress.current
    ? swissProgress.previous
    : (finalsProgress.current ? finalsProgress.previous : (swissProgress.previous ?? finalsProgress.previous))
  const primaryStageLabel = swissProgress.current
    ? 'Swiss 진행중'
    : (finalsProgress.current ? 'Top8 진행중' : '진행 대기')

  const fetchFeed = useCallback(async () => {
    try {
      setError('')
      const params = new URLSearchParams({ season, region })
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
      setLastUpdateAt(
        new Date().toLocaleTimeString('ko-KR', {
          hour12: false,
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : '송출 데이터를 불러오지 못했습니다.')
    }
  }, [region, season])

  useEffect(() => {
    void fetchFeed()
    const timer = window.setInterval(() => {
      void fetchFeed()
    }, REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [fetchFeed])

  const regionLabel =
    OPS_REGION_OPTIONS.find((option) => option.value === region)?.label ?? region

  return (
    <section className='min-h-[calc(100svh-6rem)] space-y-5 bg-black px-4 py-5 text-white md:px-8 md:py-8'>
      <header className='rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h1 className='text-xl font-black tracking-tight md:text-3xl'>
            TKC {season} {regionLabel} 실시간 송출
          </h1>
          <div className='text-xs text-white/60 md:text-sm'>
            {lastUpdateAt ? `${lastUpdateAt} 갱신` : '초기 로딩 중'}
          </div>
        </div>

        <div className='mt-2 flex flex-wrap items-center gap-2 text-xs md:text-sm'>
          <span className='text-white/60'>현재 상태:</span>
          <span className='font-semibold text-[#ffb8a8]'>{primaryStageLabel}</span>
          {weekStatus ? (
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(weekStatus.status)}`}
            >
              {weekStatus.weekNo}주차 {statusLabel(weekStatus.status)}
            </span>
          ) : null}
        </div>

        {error ? (
          <p className='mt-3 rounded-md border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs text-red-100'>
            {error}
          </p>
        ) : null}
      </header>

      <div className='grid gap-4 xl:grid-cols-3'>
        <section className='space-y-4 xl:col-span-2'>
          <div className='rounded-2xl border border-[#ff2a00]/35 bg-[#ff2a00]/10 p-5'>
            <div className='text-xs font-semibold uppercase tracking-[0.18em] text-[#ffd6cf]'>
              Current Match
            </div>
            {primaryCurrent ? (
              <>
                <div className='mt-2 text-sm font-black text-white/90 md:text-base'>
                  {primaryCurrent.label}
                </div>
                <div className='mt-3 text-2xl font-black text-white md:text-4xl'>
                  {primaryCurrent.leftName}
                  <span className='mx-3 text-white/45'>VS</span>
                  {primaryCurrent.rightName}
                </div>
                <div className='mt-3 text-xs text-white/70 md:text-sm'>
                  Winner: <span className='font-bold text-white'>{matchWinnerLabel(primaryCurrent)}</span>
                </div>
                <div className='mt-1 text-[11px] text-white/55'>
                  {primaryCurrent.leftEntryId || '-'} / {primaryCurrent.rightEntryId || '-'}
                </div>
              </>
            ) : (
              <div className='mt-3 text-sm text-white/75'>진행중인 경기가 없습니다.</div>
            )}
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <MatchCard title='다음 경기' match={primaryNext} />
            <MatchCard title='직전 결과' match={primaryPrevious} />
          </div>
        </section>

        <section className='space-y-4'>
          <div className='rounded-2xl border border-white/15 bg-white/[0.04] p-4'>
            <h3 className='text-sm font-bold text-[#ff2a00] md:text-base'>진행률</h3>
            <div className='mt-3 space-y-2 text-xs md:text-sm'>
              <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
                <div className='text-white/55'>Swiss</div>
                <div className='mt-1 text-lg font-black text-white'>
                  {swissProgress.completed}
                  <span className='mx-1 text-white/50'>/</span>
                  {swissProgress.total}
                </div>
              </div>
              <div className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'>
                <div className='text-white/55'>Top8</div>
                <div className='mt-1 text-lg font-black text-white'>
                  {finalsProgress.completed}
                  <span className='mx-1 text-white/50'>/</span>
                  {finalsProgress.total}
                </div>
              </div>
            </div>
          </div>

          <div className='rounded-2xl border border-white/15 bg-white/[0.04] p-4'>
            <h3 className='text-sm font-bold text-[#ff2a00] md:text-base'>지역 결선 진출</h3>
            <div className='mt-3 space-y-2 text-xs md:text-sm'>
              <div className='rounded-lg border border-[#ff2a00]/20 bg-[#ff2a00]/8 px-3 py-2'>
                <span className='text-white/55'>A그룹</span>{' '}
                <span className='font-semibold text-white/90'>
                  {regionArchive?.qualifiers.groupA
                    ? `${regionArchive.qualifiers.groupA.nickname} (${regionArchive.qualifiers.groupA.entryId})`
                    : '미확정'}
                </span>
              </div>
              <div className='rounded-lg border border-[#ff2a00]/20 bg-[#ff2a00]/8 px-3 py-2'>
                <span className='text-white/55'>B그룹</span>{' '}
                <span className='font-semibold text-white/90'>
                  {regionArchive?.qualifiers.groupB
                    ? `${regionArchive.qualifiers.groupB.nickname} (${regionArchive.qualifiers.groupB.entryId})`
                    : '미확정'}
                </span>
              </div>
            </div>
          </div>

          <div className='rounded-2xl border border-white/15 bg-white/[0.04] p-4'>
            <h3 className='text-sm font-bold text-[#ff2a00] md:text-base'>현재 포커스</h3>
            <div className='mt-3 text-xs text-white/70'>
              {primaryCurrent ? (
                <div>
                  <div className='font-semibold text-white/90'>{primaryCurrent.label}</div>
                  <div className='mt-1'>{matchName(primaryCurrent)}</div>
                </div>
              ) : (
                '진행중인 경기 없음'
              )}
            </div>
          </div>
        </section>
      </div>

      <section className='rounded-2xl border border-white/15 bg-white/[0.04] p-4 md:p-5'>
        <h2 className='text-lg font-bold text-[#ff2a00] md:text-2xl'>지역 순위 (Top 8)</h2>
        {finalRanking.length === 0 ? (
          <p className='mt-3 text-sm text-white/60'>순위 데이터 입력 대기</p>
        ) : (
          <div className='mt-4 overflow-x-auto rounded-xl border border-white/10'>
            <table className='min-w-full text-left'>
              <thead className='bg-white/[0.08] text-xs text-white/75 md:text-sm'>
                <tr>
                  <th className='px-3 py-2'>순위</th>
                  <th className='px-3 py-2'>선수</th>
                  <th className='px-3 py-2 text-right'>전적</th>
                  <th className='px-3 py-2'>상태</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-white/[0.08] text-xs md:text-sm'>
                {finalRanking.slice(0, 8).map((row) => (
                  <tr key={`${row.entryId}-${row.rank}`}>
                    <td className='px-3 py-2 font-black text-[#ff2a00] md:text-base'>
                      {row.rank}
                    </td>
                    <td className='px-3 py-2'>
                      <div className='font-semibold text-white'>{row.nickname}</div>
                      <div className='font-mono text-[10px] text-white/45 md:text-xs'>
                        {row.entryId}
                      </div>
                    </td>
                    <td className='px-3 py-2 text-right font-semibold tabular-nums text-white/75'>
                      {typeof row.wins === 'number' && typeof row.losses === 'number'
                        ? `${row.wins}-${row.losses}`
                        : '-'}
                    </td>
                    <td className='px-3 py-2 text-white/70'>{row.statusLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}
