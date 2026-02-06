import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  buildRegionFinalRanking,
  OPS_REGION_OPTIONS,
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

function formatScore(value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  return value.toLocaleString('en-US')
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
  const finalRanking = useMemo(
    () => (regionArchive ? buildRegionFinalRanking(regionArchive) : []),
    [regionArchive]
  )

  const latestSwissRound = useMemo(() => {
    if (!regionArchive || regionArchive.swissMatches.length === 0) return null
    const maxRound = Math.max(...regionArchive.swissMatches.map((row) => row.round))
    const rows = regionArchive.swissMatches
      .filter((row) => row.round === maxRound)
      .slice()
      .sort((a, b) => (a.table ?? 0) - (b.table ?? 0))
    return { round: maxRound, rows }
  }, [regionArchive])

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
    fetchFeed()
    const timer = window.setInterval(fetchFeed, REFRESH_MS)
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
        <p className='mt-2 text-xs text-white/60 md:text-sm'>
          운영 DB 기준 자동 갱신 화면 (약 3초 간격)
        </p>
        {error ? (
          <p className='mt-3 rounded-md border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs text-red-100'>
            {error}
          </p>
        ) : null}
      </header>

      <div className='grid gap-4 xl:grid-cols-3'>
        <section className='rounded-2xl border border-white/15 bg-white/[0.04] p-4 xl:col-span-2'>
          <h2 className='text-lg font-bold text-[#ff2a00] md:text-2xl'>최종 순위</h2>
          {finalRanking.length === 0 ? (
            <p className='mt-4 text-sm text-white/60'>순위 데이터 입력 대기</p>
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
                  {finalRanking.map((row) => (
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

        <section className='space-y-4'>
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
            <h3 className='text-sm font-bold text-[#ff2a00] md:text-base'>
              {latestSwissRound ? `Swiss Round ${latestSwissRound.round}` : 'Swiss 진행 상황'}
            </h3>
            {latestSwissRound ? (
              <div className='mt-3 space-y-2 text-xs md:text-sm'>
                {latestSwissRound.rows.map((row, index) => (
                  <div
                    key={`${row.round}-${row.table ?? index}`}
                    className='rounded-lg border border-white/10 bg-black/25 px-3 py-2'
                  >
                    <div className='font-semibold text-white/90'>
                      T{row.table ?? index + 1} · {row.player1.nickname} vs{' '}
                      {row.player2?.nickname ?? 'BYE'}
                    </div>
                    <div className='mt-1 text-white/55'>
                      승자:{' '}
                      <span className='font-semibold text-white/85'>
                        {row.winnerEntryId || '기록 대기'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='mt-3 text-xs text-white/60'>매치 기록 대기</p>
            )}
          </div>
        </section>
      </div>

      <section className='grid gap-4 md:grid-cols-3'>
        <div className='rounded-2xl border border-white/15 bg-white/[0.04] p-4'>
          <div className='text-xs text-white/50'>온라인 예선</div>
          <div className='mt-2 text-2xl font-black text-white'>
            {regionArchive?.onlineRows.length ?? 0}
            <span className='ml-1 text-sm font-medium text-white/60'>명</span>
          </div>
        </div>
        <div className='rounded-2xl border border-white/15 bg-white/[0.04] p-4'>
          <div className='text-xs text-white/50'>Swiss 매치</div>
          <div className='mt-2 text-2xl font-black text-white'>
            {regionArchive?.swissMatches.length ?? 0}
            <span className='ml-1 text-sm font-medium text-white/60'>경기</span>
          </div>
        </div>
        <div className='rounded-2xl border border-white/15 bg-white/[0.04] p-4'>
          <div className='text-xs text-white/50'>결선 Top 8 기록</div>
          <div className='mt-2 text-2xl font-black text-white'>
            {archive.finals.crossMatches.filter((row) => row.winnerEntryId).length}
            <span className='ml-1 text-sm font-medium text-white/60'>경기 완료</span>
          </div>
        </div>
      </section>

      {regionArchive?.deciderRows && regionArchive.deciderRows.length > 0 ? (
        <section className='rounded-2xl border border-white/15 bg-white/[0.04] p-4'>
          <h2 className='text-lg font-bold text-[#ff2a00]'>3-1 선발전</h2>
          <div className='mt-3 grid gap-2 md:grid-cols-2'>
            {regionArchive.deciderRows
              .slice()
              .sort((a, b) => a.rank - b.rank)
              .map((row) => (
                <div
                  key={`${row.entryId}-${row.rank}`}
                  className='rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm'
                >
                  <div className='font-semibold text-white/90'>
                    {row.rank}위 {row.nickname}
                  </div>
                  <div className='mt-1 font-mono text-xs text-white/50'>
                    {row.entryId}
                  </div>
                  <div className='mt-1 text-white/70'>점수 {formatScore(row.score)}</div>
                </div>
              ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}
