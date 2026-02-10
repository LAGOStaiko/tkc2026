import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { formatSongLabel } from '@/content/arcade-songs'
import { t } from '@/text'
import { useResults } from '@/lib/api'
import {
  getRegionByKey,
  isArcadeRegionKey,
  resolveArcadeSeasonArchive,
  type ArcadeRegionArchive,
  type ArcadeSwissMatch,
} from '@/lib/arcade-results-archive'
import { buildRegionFinalRanking } from '@/lib/arcade-results-ranking'
import { cn } from '@/lib/utils'
import { PageHero, TkcSection } from '@/components/tkc/layout'
import { FadeIn } from '@/components/tkc/guide-shared'
import { LevelBadge, parseLevelNumber } from '@/components/tkc/level-badge'

export const Route = createFileRoute('/(site)/arcade-results/2026/$region')({
  component: ArcadeRegionDetailPage,
})

const formatScore = (value: number) => value.toLocaleString('en-US')

/* ════════════════════════════════════════════════════════════════════ */
/*  Shared Components                                                  */
/* ════════════════════════════════════════════════════════════════════ */

function EmptyMessage({ children }: { children: string }) {
  return (
    <div className='rounded-2xl border border-[#1e1e1e] bg-[#111] px-5 py-4 text-sm text-white/50'>
      {children}
    </div>
  )
}

function StageTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className='space-y-1.5'>
      <h2 className='flex items-center gap-2.5 text-lg font-bold text-white'>
        <span className='inline-block h-4 w-1 rounded-full bg-[#f5a623]' />
        {title}
      </h2>
      {subtitle && (
        <p className='pl-3.5 text-sm text-white/50'>{subtitle}</p>
      )}
    </div>
  )
}

function renderParticipant(
  region: ArcadeRegionArchive,
  entryId?: string,
  fallback = '-'
) {
  if (!entryId) return fallback

  const fromOnline = region.onlineRows.find((row) => row.entryId === entryId)
  if (fromOnline) return `${fromOnline.nickname} (${entryId})`

  const fromSwiss = region.swissStandings.find(
    (row) => row.entryId === entryId
  )
  if (fromSwiss) return `${fromSwiss.nickname} (${entryId})`

  if (region.qualifiers.groupA?.entryId === entryId) {
    return `${region.qualifiers.groupA.nickname} (${entryId})`
  }
  if (region.qualifiers.groupB?.entryId === entryId) {
    return `${region.qualifiers.groupB.nickname} (${entryId})`
  }

  return entryId
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Swiss Round Card                                                   */
/* ════════════════════════════════════════════════════════════════════ */

function SwissRoundCard({
  matches,
  round,
}: {
  matches: ArcadeSwissMatch[]
  round: number
  region: ArcadeRegionArchive
}) {
  return (
    <div className='space-y-3'>
      <div className='font-mono text-sm font-bold text-[#f5a623]'>
        Round {round}
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        {matches.map((match, index) => {
          const p1Name = match.player1.nickname
          const p1Id = match.player1.entryId
          const p2Name = match.player2?.nickname ?? 'BYE'
          const p2Id = match.player2?.entryId
          const isP1Winner = match.winnerEntryId === p1Id
          const isP2Winner = Boolean(
            match.player2 && match.winnerEntryId === p2Id
          )

          return (
            <div
              key={`${match.round}-${match.table ?? index}`}
              className='tkc-motion-surface rounded-2xl border border-[#1e1e1e] bg-[#111] p-4 hover:border-[#2a2a2a] md:p-5'
            >
              <div className='flex items-center justify-between text-xs text-white/40'>
                <span className='font-mono'>
                  Table {match.table ?? index + 1}
                </span>
                {match.highSeedEntryId && (
                  <span>진영 선택 {match.highSeedEntryId}</span>
                )}
              </div>

              <div className='mt-3 space-y-1.5'>
                <div
                  className={cn(
                    'flex items-baseline gap-2 text-sm',
                    isP1Winner ? 'text-[#f5a623]' : 'text-white'
                  )}
                >
                  <span className='font-bold'>{p1Name}</span>
                  <span className='font-mono text-xs text-white/35'>
                    {p1Id}
                  </span>
                  {isP1Winner && (
                    <span className='text-xs font-medium text-emerald-400'>
                      WIN
                    </span>
                  )}
                </div>
                <div className='font-mono text-xs font-bold tracking-widest text-white/35'>
                  VS
                </div>
                <div
                  className={cn(
                    'flex items-baseline gap-2 text-sm',
                    isP2Winner ? 'text-[#f5a623]' : 'text-white'
                  )}
                >
                  <span className='font-bold'>{p2Name}</span>
                  {p2Id && (
                    <span className='font-mono text-xs text-white/35'>
                      {p2Id}
                    </span>
                  )}
                  {isP2Winner && (
                    <span className='text-xs font-medium text-emerald-400'>
                      WIN
                    </span>
                  )}
                </div>
              </div>

              {match.bye && (
                <div className='mt-3 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300'>
                  부전승 (1승 처리)
                </div>
              )}

              {match.games.length > 0 && (
                <div className='mt-3 space-y-1.5 rounded-xl border border-[#1e1e1e] bg-[#0a0a0a] p-3'>
                  {match.games.map((game, gi) => (
                    <div
                      key={gi}
                      className='flex flex-col gap-0.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3'
                    >
                      <span className='inline-flex items-center gap-1.5 text-white/45'>
                        {game.song}
                        {game.level
                          ? (() => {
                              const n = parseLevelNumber(game.level)
                              return n != null ? (
                                <LevelBadge level={n} />
                              ) : (
                                ` ${game.level}`
                              )
                            })()
                          : null}
                      </span>
                      <span className='font-medium text-white/70 tabular-nums'>
                        {formatScore(game.p1Score)} :{' '}
                        {formatScore(game.p2Score)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {match.tieBreakerSong && (
                <div className='mt-2.5 text-xs font-medium text-[#f5a623]/80'>
                  타이브레이커: {match.tieBreakerSong}
                </div>
              )}

              {match.note && (
                <div className='mt-2 text-xs text-white/40'>{match.note}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Page                                                               */
/* ════════════════════════════════════════════════════════════════════ */

function ArcadeRegionDetailPage() {
  const { region } = Route.useParams()
  const { data } = useResults<unknown>()
  const archive = useMemo(() => resolveArcadeSeasonArchive(data), [data])

  const regionData = useMemo(() => {
    if (!isArcadeRegionKey(region)) return undefined
    return getRegionByKey(archive, region)
  }, [archive, region])

  const finalRankingRows = useMemo(() => {
    if (!regionData) return []
    return buildRegionFinalRanking(regionData)
  }, [regionData])

  const swissByRound = useMemo(() => {
    if (!regionData) return []

    const map = new Map<number, ArcadeSwissMatch[]>()
    for (const match of regionData.swissMatches) {
      const rows = map.get(match.round) ?? []
      rows.push(match)
      map.set(match.round, rows)
    }

    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([round, matches]) => ({
        round,
        matches: [...matches].sort((a, b) => (a.table ?? 0) - (b.table ?? 0)),
      }))
  }, [regionData])

  useEffect(() => {
    const title = regionData
      ? `${regionData.label} 결과 아카이브`
      : '지역 결과 아카이브'
    document.title = `${t('meta.siteName')} | ${title}`
  }, [regionData])

  if (!regionData) {
    return (
      <TkcSection className='space-y-8'>
        <a
          href='/arcade-results/2026'
          className='text-sm text-white/50 transition-colors hover:text-[#f5a623]'
        >
          ← 아케이드 시즌 페이지로 돌아가기
        </a>
        <PageHero
          badge='NOT FOUND'
          title='지역을 찾을 수 없습니다'
          subtitle='유효한 지역 키: seoul, daejeon, gwangju, busan'
        />
      </TkcSection>
    )
  }

  const sortedOnlineRows = [...regionData.onlineRows].sort(
    (a, b) => a.rank - b.rank
  )
  const sortedDeciderRows = [...regionData.deciderRows].sort(
    (a, b) => a.rank - b.rank
  )
  const sortedSeedingRows = [...regionData.seedingRows].sort(
    (a, b) => a.rank - b.rank
  )

  const statusStyle = (label: string) =>
    label === '결선 진출'
      ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300'
      : label === '결선 진출자 선발전'
        ? 'border-[#f5a623]/25 bg-[#f5a623]/10 text-[#f5a623]'
        : label === '탈락'
          ? 'border-red-400/20 bg-red-500/10 text-red-300/80'
          : 'border-[#1e1e1e] bg-white/[0.03] text-white/50'

  return (
    <TkcSection className='space-y-8 md:space-y-10'>
      <div className='space-y-3'>
        <a
          href='/arcade-results/2026'
          className='text-sm text-white/50 transition-colors hover:text-[#f5a623]'
        >
          ← 아케이드 시즌 페이지로 돌아가기
        </a>
        <div className='flex items-center gap-3'>
          <img
            src={regionData.image}
            alt={regionData.arcade}
            className='size-10 shrink-0 rounded-lg object-cover'
            loading='lazy'
          />
          <PageHero
            badge={regionData.label.toUpperCase()}
            title={`${regionData.label}`}
            subtitle={`${regionData.arcade} · 온라인 예선 → 스위스 → 선발전 → 시드전`}
            accentColor='#f5a623'
            gradientTo='#f7d154'
          />
        </div>
      </div>

      {/* ── Final ranking ── */}
      <FadeIn>
        <section className='space-y-6'>
          <StageTitle
            title='최종 순위'
            subtitle='선발전 · 시드전 성적을 포함한 종합 순위입니다.'
          />

          {/* Top 2 hero cards */}
          {finalRankingRows.filter((r) => r.rank <= 2).length > 0 && (
            <div className='grid gap-3 sm:grid-cols-2'>
              {finalRankingRows
                .filter((r) => r.rank <= 2)
                .map((row) => (
                  <div
                    key={`hero-${row.entryId}`}
                    className='relative overflow-hidden rounded-2xl border border-[#f5a623]/25 bg-gradient-to-br from-[#f5a623]/10 to-transparent p-5 md:p-6'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='space-y-1.5'>
                        <div className='font-mono text-xs font-bold tracking-widest text-[#f5a623] uppercase'>
                          {row.statusLabel}
                        </div>
                        <div className='text-xl font-bold text-white md:text-2xl'>
                          {row.nickname}
                        </div>
                        <div className='font-mono text-xs text-white/40'>
                          {row.entryId}
                        </div>
                      </div>
                      <div className='flex size-11 flex-shrink-0 items-center justify-center rounded-full border border-[#f5a623]/30 bg-[#f5a623]/15 text-xl font-bold text-[#f5a623]'>
                        {row.rank}
                      </div>
                    </div>
                    {typeof row.wins === 'number' &&
                      typeof row.losses === 'number' && (
                        <div className='mt-4 flex gap-5 text-xs text-white/50'>
                          <span>
                            시드{' '}
                            <span className='font-medium text-white/70'>
                              {row.seed ?? '-'}
                            </span>
                          </span>
                          <span>
                            전적{' '}
                            <span className='font-medium text-white/70'>
                              {row.wins}-{row.losses}
                            </span>
                          </span>
                        </div>
                      )}
                  </div>
                ))}
            </div>
          )}

          {/* Decider & Seeding side-by-side */}
          <div className='grid gap-5 md:grid-cols-2'>
            {/* Decider */}
            <div className='space-y-3'>
              <div className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5'>
                <span className='text-sm font-bold text-white'>
                  3-1 추가 진출자 선발전
                </span>
                <span className='text-xs text-white/35'>
                  {formatSongLabel('decider31')}
                </span>
              </div>

              {sortedDeciderRows.length === 0 ? (
                <div className='rounded-xl border border-[#1e1e1e] bg-[#111] px-4 py-3 text-sm text-white/45'>
                  결과 대기
                </div>
              ) : (
                <div className='overflow-x-auto rounded-xl border border-[#1e1e1e]'>
                  <table className='w-full min-w-[320px] text-left text-sm'>
                    <thead className='bg-[#1a1a1a] text-xs font-semibold text-white/50'>
                      <tr>
                        <th className='px-4 py-2.5 whitespace-nowrap'>순위</th>
                        <th className='px-4 py-2.5 whitespace-nowrap'>
                          엔트리
                        </th>
                        <th className='px-4 py-2.5 whitespace-nowrap'>
                          동더 네임
                        </th>
                        <th className='px-4 py-2.5 text-right whitespace-nowrap'>
                          점수
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-[#1e1e1e]'>
                      {sortedDeciderRows.map((row) => (
                        <tr
                          key={`dec-${row.entryId}-${row.rank}`}
                          className='transition-colors hover:bg-white/[0.03]'
                        >
                          <td className='px-4 py-3 font-bold whitespace-nowrap text-[#f5a623]'>
                            {row.rank}
                          </td>
                          <td className='px-4 py-3 font-mono text-xs whitespace-nowrap text-white/50'>
                            {row.entryId}
                          </td>
                          <td className='px-4 py-3 font-semibold whitespace-nowrap text-white'>
                            {row.nickname}
                          </td>
                          <td className='px-4 py-3 text-right font-bold whitespace-nowrap text-white tabular-nums'>
                            {formatScore(row.score)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {regionData.deciderWinnerEntryId && (
                <div className='rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300'>
                  선발전 통과:{' '}
                  {renderParticipant(
                    regionData,
                    regionData.deciderWinnerEntryId
                  )}
                </div>
              )}
            </div>

            {/* Seeding */}
            <div className='space-y-3'>
              <div className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5'>
                <span className='text-sm font-bold text-white'>
                  결선 시드 배정전
                </span>
                <span className='text-xs text-white/35'>
                  {formatSongLabel('seeding')}
                </span>
              </div>

              {sortedSeedingRows.length === 0 ? (
                <div className='rounded-xl border border-[#1e1e1e] bg-[#111] px-4 py-3 text-sm text-white/45'>
                  결과 대기
                </div>
              ) : (
                <div className='overflow-x-auto rounded-xl border border-[#1e1e1e]'>
                  <table className='w-full min-w-[320px] text-left text-sm'>
                    <thead className='bg-[#1a1a1a] text-xs font-semibold text-white/50'>
                      <tr>
                        <th className='px-4 py-2.5 whitespace-nowrap'>순위</th>
                        <th className='px-4 py-2.5 whitespace-nowrap'>
                          엔트리
                        </th>
                        <th className='px-4 py-2.5 whitespace-nowrap'>
                          동더 네임
                        </th>
                        <th className='px-4 py-2.5 text-right whitespace-nowrap'>
                          점수
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-[#1e1e1e]'>
                      {sortedSeedingRows.map((row) => (
                        <tr
                          key={`seed-${row.entryId}-${row.rank}`}
                          className='transition-colors hover:bg-white/[0.03]'
                        >
                          <td className='px-4 py-3 font-bold whitespace-nowrap text-[#f5a623]'>
                            {row.rank}
                          </td>
                          <td className='px-4 py-3 font-mono text-xs whitespace-nowrap text-white/50'>
                            {row.entryId}
                          </td>
                          <td className='px-4 py-3 font-semibold whitespace-nowrap text-white'>
                            {row.nickname}
                          </td>
                          <td className='px-4 py-3 text-right font-bold whitespace-nowrap text-white tabular-nums'>
                            {formatScore(row.score)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Qualifier badges */}
              <div className='grid gap-2 text-sm'>
                <div className='rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/5 px-4 py-2.5'>
                  <span className='text-white/45'>지역 1위(A):</span>{' '}
                  <span className='font-semibold text-white'>
                    {regionData.qualifiers.groupA
                      ? `${regionData.qualifiers.groupA.nickname} (${regionData.qualifiers.groupA.entryId})`
                      : '미확정'}
                  </span>
                </div>
                <div className='rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/5 px-4 py-2.5'>
                  <span className='text-white/45'>지역 2위(B):</span>{' '}
                  <span className='font-semibold text-white'>
                    {regionData.qualifiers.groupB
                      ? `${regionData.qualifiers.groupB.nickname} (${regionData.qualifiers.groupB.entryId})`
                      : '미확정'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Remaining ranking table */}
          {finalRankingRows.filter((r) => r.rank > 2).length > 0 && (
            <>
              {/* Desktop table */}
              <div className='hidden overflow-x-auto rounded-2xl border border-[#1e1e1e] md:block'>
                <table className='w-full min-w-[480px] text-left text-sm'>
                  <thead className='bg-[#1a1a1a] text-xs font-semibold text-white/50'>
                    <tr>
                      <th className='px-4 py-2.5 whitespace-nowrap'>순위</th>
                      <th className='px-4 py-2.5 whitespace-nowrap'>
                        동더 네임
                      </th>
                      <th className='px-4 py-2.5 text-right whitespace-nowrap'>
                        시드
                      </th>
                      <th className='px-4 py-2.5 text-right whitespace-nowrap'>
                        전적
                      </th>
                      <th className='px-4 py-2.5 whitespace-nowrap'>상태</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-[#1e1e1e]'>
                    {finalRankingRows
                      .filter((r) => r.rank > 2)
                      .map((row) => (
                        <tr
                          key={`final-rank-${row.entryId}-${row.rank}`}
                          className='transition-colors hover:bg-white/[0.03]'
                        >
                          <td className='px-4 py-3 font-bold whitespace-nowrap text-white/50'>
                            {row.rank}
                          </td>
                          <td className='px-4 py-3 whitespace-nowrap'>
                            <span className='font-semibold text-white'>
                              {row.nickname}
                            </span>
                            <span className='ml-2 font-mono text-xs text-white/35'>
                              {row.entryId}
                            </span>
                          </td>
                          <td className='px-4 py-3 text-right whitespace-nowrap text-white/65 tabular-nums'>
                            {typeof row.seed === 'number' ? row.seed : '-'}
                          </td>
                          <td className='px-4 py-3 text-right whitespace-nowrap text-white/65 tabular-nums'>
                            {typeof row.wins === 'number' &&
                            typeof row.losses === 'number'
                              ? `${row.wins}-${row.losses}`
                              : '-'}
                          </td>
                          <td className='px-4 py-3 whitespace-nowrap'>
                            <span
                              className={cn(
                                'inline-block rounded-md border px-2.5 py-0.5 text-xs font-medium',
                                statusStyle(row.statusLabel)
                              )}
                            >
                              {row.statusLabel}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className='space-y-2 md:hidden'>
                {finalRankingRows
                  .filter((r) => r.rank > 2)
                  .map((row) => (
                    <div
                      key={`m-final-${row.entryId}-${row.rank}`}
                      className='flex items-center gap-3 rounded-2xl border border-[#1e1e1e] bg-[#111] px-4 py-3'
                    >
                      <span className='w-6 text-center text-sm font-bold text-white/40'>
                        {row.rank}
                      </span>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-baseline gap-1.5'>
                          <span className='font-semibold text-white'>
                            {row.nickname}
                          </span>
                          <span className='font-mono text-xs text-white/40'>
                            {row.entryId}
                          </span>
                        </div>
                        <div className='mt-1 flex items-center gap-3 text-xs text-white/45'>
                          <span>
                            시드{' '}
                            {typeof row.seed === 'number' ? row.seed : '-'}
                          </span>
                          <span>
                            전적{' '}
                            {typeof row.wins === 'number' &&
                            typeof row.losses === 'number'
                              ? `${row.wins}-${row.losses}`
                              : '-'}
                          </span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'flex-shrink-0 rounded-md border px-2.5 py-0.5 text-xs font-medium',
                          statusStyle(row.statusLabel)
                        )}
                      >
                        {row.statusLabel}
                      </span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </section>
      </FadeIn>

      {/* ── Online Qualifiers ── */}
      <FadeIn>
        <section className='space-y-3'>
          <StageTitle
            title='온라인 예선'
            subtitle='과제곡 2곡 합산 스코어 기준. 동점은 접수 순서 우선.'
          />

          {sortedOnlineRows.length === 0 ? (
            <EmptyMessage>
              온라인 예선 결과가 아직 입력되지 않았습니다.
            </EmptyMessage>
          ) : (
            <>
              {/* Desktop table */}
              <div className='hidden overflow-x-auto rounded-2xl border border-[#1e1e1e] md:block'>
                <table className='w-full min-w-[560px] text-left text-sm'>
                  <thead className='bg-[#1a1a1a] text-xs font-semibold text-white/50'>
                    <tr>
                      <th className='px-4 py-2.5 whitespace-nowrap'>순위</th>
                      <th className='px-4 py-2.5 whitespace-nowrap'>엔트리</th>
                      <th className='px-4 py-2.5 whitespace-nowrap'>
                        동더 네임
                      </th>
                      <th className='px-4 py-2.5 text-right whitespace-nowrap'>
                        과제곡 1
                      </th>
                      <th className='px-4 py-2.5 text-right whitespace-nowrap'>
                        과제곡 2
                      </th>
                      <th className='px-4 py-2.5 text-right whitespace-nowrap'>
                        합산
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-[#1e1e1e]'>
                    {sortedOnlineRows.map((row) => (
                      <tr
                        key={`${row.entryId}-${row.rank}`}
                        className={cn(
                          'transition-colors hover:bg-white/[0.03]',
                          row.advanced && 'bg-emerald-500/5'
                        )}
                      >
                        <td className='px-4 py-3 font-bold whitespace-nowrap text-[#f5a623]'>
                          {row.rank}
                        </td>
                        <td className='px-4 py-3 font-mono text-xs whitespace-nowrap text-white/50'>
                          {row.entryId}
                        </td>
                        <td className='px-4 py-3 font-semibold whitespace-nowrap text-white'>
                          {row.nickname}
                        </td>
                        <td className='px-4 py-3 text-right whitespace-nowrap text-white/65 tabular-nums'>
                          {formatScore(row.score1)}
                        </td>
                        <td className='px-4 py-3 text-right whitespace-nowrap text-white/65 tabular-nums'>
                          {formatScore(row.score2)}
                        </td>
                        <td className='px-4 py-3 text-right font-bold whitespace-nowrap text-white tabular-nums'>
                          {formatScore(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className='space-y-2 md:hidden'>
                {sortedOnlineRows.map((row) => (
                  <div
                    key={`m-${row.entryId}-${row.rank}`}
                    className={cn(
                      'rounded-2xl border border-[#1e1e1e] p-4',
                      row.advanced
                        ? 'border-emerald-400/20 bg-emerald-500/5'
                        : 'bg-[#111]'
                    )}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <div className='text-base font-bold text-white'>
                          {row.nickname}
                        </div>
                        <div className='mt-0.5 font-mono text-xs text-white/40'>
                          {row.entryId}
                        </div>
                      </div>
                      <div className='flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-[#f5a623]/15 text-sm font-bold text-[#f5a623]'>
                        {row.rank}
                      </div>
                    </div>
                    <div className='mt-3 grid grid-cols-3 gap-2 text-xs'>
                      <div className='rounded-lg bg-white/[0.04] px-2.5 py-2 text-center'>
                        <div className='text-white/35'>과제곡 1</div>
                        <div className='mt-0.5 font-bold text-white/75 tabular-nums'>
                          {formatScore(row.score1)}
                        </div>
                      </div>
                      <div className='rounded-lg bg-white/[0.04] px-2.5 py-2 text-center'>
                        <div className='text-white/35'>과제곡 2</div>
                        <div className='mt-0.5 font-bold text-white/75 tabular-nums'>
                          {formatScore(row.score2)}
                        </div>
                      </div>
                      <div className='rounded-lg bg-[#f5a623]/10 px-2.5 py-2 text-center'>
                        <div className='text-[#f5a623]/60'>합산</div>
                        <div className='mt-0.5 font-bold text-white tabular-nums'>
                          {formatScore(row.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </FadeIn>

      {/* ── Swiss Stage ── */}
      <FadeIn>
        <section className='space-y-3'>
          <StageTitle
            title='스위스 스테이지'
            subtitle='1:1 · 2곡 합산 · 2패 누적 탈락 · 동점 시 타이브레이커 반복'
          />

          {swissByRound.length === 0 ? (
            <EmptyMessage>
              스위스 스테이지 경기 로그가 아직 입력되지 않았습니다.
            </EmptyMessage>
          ) : (
            <div className='space-y-6'>
              {swissByRound.map((block) => (
                <SwissRoundCard
                  key={block.round}
                  round={block.round}
                  matches={block.matches}
                  region={regionData}
                />
              ))}
            </div>
          )}
        </section>
      </FadeIn>
    </TkcSection>
  )
}
