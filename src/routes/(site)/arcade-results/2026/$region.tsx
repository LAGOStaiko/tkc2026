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
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'
import { LevelBadge, parseLevelNumber } from '@/components/tkc/level-badge'

export const Route = createFileRoute('/(site)/arcade-results/2026/$region')({
  component: ArcadeRegionDetailPage,
})

const formatScore = (value: number) => value.toLocaleString('en-US')

function EmptyMessage({ children }: { children: string }) {
  return (
    <div className='rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/60'>
      {children}
    </div>
  )
}

function StageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className='space-y-1.5'>
      <h2 className='flex items-center gap-2.5 text-lg font-bold text-white'>
        <span className='inline-block h-4 w-1 rounded-full bg-[#ff2a00]' />
        {title}
      </h2>
      {subtitle ? (
        <p className='pl-3.5 text-sm text-white/60'>{subtitle}</p>
      ) : null}
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

  const fromSwiss = region.swissStandings.find((row) => row.entryId === entryId)
  if (fromSwiss) return `${fromSwiss.nickname} (${entryId})`

  if (region.qualifiers.groupA?.entryId === entryId) {
    return `${region.qualifiers.groupA.nickname} (${entryId})`
  }
  if (region.qualifiers.groupB?.entryId === entryId) {
    return `${region.qualifiers.groupB.nickname} (${entryId})`
  }

  return entryId
}

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
      <div className='text-sm font-bold text-[#ff2a00]'>Round {round}</div>

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
              className='rounded-xl border border-white/10 bg-white/[0.03] p-4 md:p-5'
            >
              <div className='flex items-center justify-between text-xs text-white/50'>
                <span>Table {match.table ?? index + 1}</span>
                {match.highSeedEntryId ? (
                  <span>진영 선택 {match.highSeedEntryId}</span>
                ) : null}
              </div>

              <div className='mt-3 space-y-1.5'>
                <div
                  className={`flex items-baseline gap-2 text-sm ${isP1Winner ? 'text-[#ff2a00]' : 'text-white'}`}
                >
                  <span className='font-bold'>{p1Name}</span>
                  <span className='font-mono text-xs text-white/40'>
                    {p1Id}
                  </span>
                  {isP1Winner ? (
                    <span className='text-xs font-medium text-emerald-300'>
                      WIN
                    </span>
                  ) : null}
                </div>
                <div className='text-xs font-bold tracking-widest text-white/50'>
                  VS
                </div>
                <div
                  className={`flex items-baseline gap-2 text-sm ${isP2Winner ? 'text-[#ff2a00]' : 'text-white'}`}
                >
                  <span className='font-bold'>{p2Name}</span>
                  {p2Id ? (
                    <span className='font-mono text-xs text-white/40'>
                      {p2Id}
                    </span>
                  ) : null}
                  {isP2Winner ? (
                    <span className='text-xs font-medium text-emerald-300'>
                      WIN
                    </span>
                  ) : null}
                </div>
              </div>

              {match.bye ? (
                <div className='mt-3 rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200'>
                  부전승 (1승 처리)
                </div>
              ) : null}

              {match.games.length > 0 ? (
                <div className='mt-3 space-y-1.5 rounded-lg border border-white/[0.07] bg-black/20 p-3'>
                  {match.games.map((game, gi) => (
                    <div
                      key={gi}
                      className='flex flex-col gap-0.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3'
                    >
                      <span className='inline-flex items-center gap-1.5 text-white/55'>
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
                      <span className='font-medium text-white/80 tabular-nums'>
                        {formatScore(game.p1Score)} :{' '}
                        {formatScore(game.p2Score)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              {match.tieBreakerSong ? (
                <div className='mt-2.5 text-xs font-medium text-[#ffb36d]'>
                  타이브레이커: {match.tieBreakerSong}
                </div>
              ) : null}

              {match.note ? (
                <div className='mt-2 text-xs text-white/50'>{match.note}</div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
          className='text-sm text-white/60 transition-colors hover:text-[#ff2a00]'
        >
          ← 아케이드 시즌 페이지로 돌아가기
        </a>
        <TkcPageHeader
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

  return (
    <TkcSection className='space-y-8 md:space-y-10'>
      <div className='space-y-3'>
        <a
          href='/arcade-results/2026'
          className='text-sm text-white/60 transition-colors hover:text-[#ff2a00]'
        >
          ← 아케이드 시즌 페이지로 돌아가기
        </a>
        <TkcPageHeader
          title={`${regionData.label} 결과 아카이브`}
          subtitle='온라인 예선 → 스위스 스테이지 → 결선 진출자 선발전 → 시드전까지 전체 경기 로그'
        />
      </div>

      <section className='space-y-6'>
        <StageTitle
          title='최종 순위'
          subtitle='선발전 · 시드전 성적을 포함한 종합 순위입니다.'
        />

        {finalRankingRows.filter((r) => r.rank <= 2).length > 0 && (
          <div className='grid gap-3 sm:grid-cols-2'>
            {finalRankingRows
              .filter((r) => r.rank <= 2)
              .map((row) => (
                <div
                  key={`hero-${row.entryId}`}
                  className='relative overflow-hidden rounded-xl border border-[#ff2a00]/25 bg-gradient-to-br from-[#ff2a00]/10 to-transparent p-5 md:p-6'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='space-y-1.5'>
                      <div className='text-xs font-bold tracking-widest text-[#ff2a00] uppercase'>
                        {row.statusLabel}
                      </div>
                      <div className='text-xl font-bold text-white md:text-2xl'>
                        {row.nickname}
                      </div>
                      <div className='font-mono text-xs text-white/45'>
                        {row.entryId}
                      </div>
                    </div>
                    <div className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-[#ff2a00]/30 bg-[#ff2a00]/15 text-xl font-bold text-[#ff2a00]'>
                      {row.rank}
                    </div>
                  </div>
                  {typeof row.wins === 'number' &&
                    typeof row.losses === 'number' && (
                      <div className='mt-4 flex gap-5 text-xs text-white/60'>
                        <span>
                          시드{' '}
                          <span className='font-medium text-white/80'>
                            {row.seed ?? '-'}
                          </span>
                        </span>
                        <span>
                          전적{' '}
                          <span className='font-medium text-white/80'>
                            {row.wins}-{row.losses}
                          </span>
                        </span>
                      </div>
                    )}
                </div>
              ))}
          </div>
        )}

        <div className='grid gap-5 md:grid-cols-2'>
          <div className='space-y-3'>
            <div className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5'>
              <span className='text-sm font-bold text-white'>
                3-1 추가 진출자 선발전
              </span>
              <span className='text-xs text-white/45'>
                {formatSongLabel('decider31')}
              </span>
            </div>

            {sortedDeciderRows.length === 0 ? (
              <div className='rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/50'>
                결과 대기
              </div>
            ) : (
              <div className='overflow-x-auto rounded-lg border border-white/10'>
                <table className='w-full min-w-[320px] text-left text-sm'>
                  <thead className='bg-white/[0.07] text-xs font-semibold text-white/70'>
                    <tr>
                      <th className='px-4 py-2.5 whitespace-nowrap'>순위</th>
                      <th className='px-4 py-2.5 whitespace-nowrap'>엔트리</th>
                      <th className='px-4 py-2.5 whitespace-nowrap'>닉네임</th>
                      <th className='px-4 py-2.5 text-right whitespace-nowrap'>
                        점수
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-white/[0.07]'>
                    {sortedDeciderRows.map((row) => (
                      <tr
                        key={`dec-${row.entryId}-${row.rank}`}
                        className='transition-colors hover:bg-white/[0.03]'
                      >
                        <td className='px-4 py-3 font-bold whitespace-nowrap text-[#ff2a00]'>
                          {row.rank}
                        </td>
                        <td className='px-4 py-3 font-mono text-xs whitespace-nowrap text-white/60'>
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

            {regionData.deciderWinnerEntryId ? (
              <div className='rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-200'>
                선발전 통과:{' '}
                {renderParticipant(regionData, regionData.deciderWinnerEntryId)}
              </div>
            ) : null}
          </div>

          <div className='space-y-3'>
            <div className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5'>
              <span className='text-sm font-bold text-white'>
                결선 시드 배정전
              </span>
              <span className='text-xs text-white/45'>
                {formatSongLabel('seeding')}
              </span>
            </div>

            {sortedSeedingRows.length === 0 ? (
              <div className='rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/50'>
                결과 대기
              </div>
            ) : (
              <div className='overflow-x-auto rounded-lg border border-white/10'>
                <table className='w-full min-w-[320px] text-left text-sm'>
                  <thead className='bg-white/[0.07] text-xs font-semibold text-white/70'>
                    <tr>
                      <th className='px-4 py-2.5 whitespace-nowrap'>순위</th>
                      <th className='px-4 py-2.5 whitespace-nowrap'>엔트리</th>
                      <th className='px-4 py-2.5 whitespace-nowrap'>닉네임</th>
                      <th className='px-4 py-2.5 text-right whitespace-nowrap'>
                        점수
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-white/[0.07]'>
                    {sortedSeedingRows.map((row) => (
                      <tr
                        key={`seed-${row.entryId}-${row.rank}`}
                        className='transition-colors hover:bg-white/[0.03]'
                      >
                        <td className='px-4 py-3 font-bold whitespace-nowrap text-[#ff2a00]'>
                          {row.rank}
                        </td>
                        <td className='px-4 py-3 font-mono text-xs whitespace-nowrap text-white/60'>
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

            <div className='grid gap-2 text-sm'>
              <div className='rounded-lg border border-[#ff2a00]/20 bg-[#ff2a00]/5 px-4 py-2.5'>
                <span className='text-white/55'>지역 1위(A):</span>{' '}
                <span className='font-semibold text-white'>
                  {regionData.qualifiers.groupA
                    ? `${regionData.qualifiers.groupA.nickname} (${regionData.qualifiers.groupA.entryId})`
                    : '미확정'}
                </span>
              </div>
              <div className='rounded-lg border border-[#ff2a00]/20 bg-[#ff2a00]/5 px-4 py-2.5'>
                <span className='text-white/55'>지역 2위(B):</span>{' '}
                <span className='font-semibold text-white'>
                  {regionData.qualifiers.groupB
                    ? `${regionData.qualifiers.groupB.nickname} (${regionData.qualifiers.groupB.entryId})`
                    : '미확정'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {finalRankingRows.filter((r) => r.rank > 2).length > 0 && (
          <>
            {/* Desktop table */}
            <div className='hidden overflow-x-auto rounded-xl border border-white/10 md:block'>
              <table className='w-full min-w-[480px] text-left text-sm'>
                <thead className='bg-white/[0.07] text-xs font-semibold text-white/70'>
                  <tr>
                    <th className='px-4 py-2.5 whitespace-nowrap'>순위</th>
                    <th className='px-4 py-2.5 whitespace-nowrap'>닉네임</th>
                    <th className='px-4 py-2.5 text-right whitespace-nowrap'>
                      시드
                    </th>
                    <th className='px-4 py-2.5 text-right whitespace-nowrap'>
                      전적
                    </th>
                    <th className='px-4 py-2.5 whitespace-nowrap'>상태</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-white/[0.07]'>
                  {finalRankingRows
                    .filter((r) => r.rank > 2)
                    .map((row) => {
                      const statusStyle =
                        row.statusLabel === '결선 진출'
                          ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
                          : row.statusLabel === '결선 진출자 선발전'
                            ? 'border-[#ffb36d]/30 bg-[#ffb36d]/10 text-[#ffb36d]'
                            : row.statusLabel === '탈락'
                              ? 'border-red-300/20 bg-red-500/10 text-red-300/80'
                              : 'border-white/15 bg-white/5 text-white/60'
                      return (
                        <tr
                          key={`final-rank-${row.entryId}-${row.rank}`}
                          className='transition-colors hover:bg-white/[0.03]'
                        >
                          <td className='px-4 py-3 font-bold whitespace-nowrap text-white/60'>
                            {row.rank}
                          </td>
                          <td className='px-4 py-3 whitespace-nowrap'>
                            <span className='font-semibold text-white'>
                              {row.nickname}
                            </span>
                            <span className='ml-2 font-mono text-xs text-white/40'>
                              {row.entryId}
                            </span>
                          </td>
                          <td className='px-4 py-3 text-right whitespace-nowrap text-white/75 tabular-nums'>
                            {typeof row.seed === 'number' ? row.seed : '-'}
                          </td>
                          <td className='px-4 py-3 text-right whitespace-nowrap text-white/75 tabular-nums'>
                            {typeof row.wins === 'number' &&
                            typeof row.losses === 'number'
                              ? `${row.wins}-${row.losses}`
                              : '-'}
                          </td>
                          <td className='px-4 py-3 whitespace-nowrap'>
                            <span
                              className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
                            >
                              {row.statusLabel}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className='space-y-2 md:hidden'>
              {finalRankingRows
                .filter((r) => r.rank > 2)
                .map((row) => {
                  const statusStyle =
                    row.statusLabel === '결선 진출'
                      ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
                      : row.statusLabel === '결선 진출자 선발전'
                        ? 'border-[#ffb36d]/30 bg-[#ffb36d]/10 text-[#ffb36d]'
                        : row.statusLabel === '탈락'
                          ? 'border-red-300/20 bg-red-500/10 text-red-300/80'
                          : 'border-white/15 bg-white/5 text-white/60'
                  return (
                    <div
                      key={`m-final-${row.entryId}-${row.rank}`}
                      className='flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3'
                    >
                      <span className='w-6 text-center text-sm font-bold text-white/50'>
                        {row.rank}
                      </span>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-baseline gap-1.5'>
                          <span className='font-semibold text-white'>
                            {row.nickname}
                          </span>
                          <span className='font-mono text-xs text-white/50'>
                            {row.entryId}
                          </span>
                        </div>
                        <div className='mt-1 flex items-center gap-3 text-xs text-white/55'>
                          <span>
                            시드 {typeof row.seed === 'number' ? row.seed : '-'}
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
                        className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
                      >
                        {row.statusLabel}
                      </span>
                    </div>
                  )
                })}
            </div>
          </>
        )}
      </section>

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
            <div className='hidden overflow-x-auto rounded-xl border border-white/10 md:block'>
              <table className='w-full min-w-[560px] text-left text-sm'>
                <thead className='bg-white/[0.07] text-xs font-semibold text-white/70'>
                  <tr>
                    <th className='px-4 py-2.5 whitespace-nowrap'>순위</th>
                    <th className='px-4 py-2.5 whitespace-nowrap'>엔트리</th>
                    <th className='px-4 py-2.5 whitespace-nowrap'>닉네임</th>
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
                <tbody className='divide-y divide-white/[0.07]'>
                  {sortedOnlineRows.map((row) => (
                    <tr
                      key={`${row.entryId}-${row.rank}`}
                      className={`transition-colors hover:bg-white/[0.03] ${row.advanced ? 'bg-emerald-500/5' : ''}`}
                    >
                      <td className='px-4 py-3 font-bold whitespace-nowrap text-[#ff2a00]'>
                        {row.rank}
                      </td>
                      <td className='px-4 py-3 font-mono text-xs whitespace-nowrap text-white/60'>
                        {row.entryId}
                      </td>
                      <td className='px-4 py-3 font-semibold whitespace-nowrap text-white'>
                        {row.nickname}
                      </td>
                      <td className='px-4 py-3 text-right whitespace-nowrap text-white/75 tabular-nums'>
                        {formatScore(row.score1)}
                      </td>
                      <td className='px-4 py-3 text-right whitespace-nowrap text-white/75 tabular-nums'>
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
                  className={`rounded-xl border border-white/10 p-4 ${row.advanced ? 'border-emerald-300/20 bg-emerald-500/5' : 'bg-white/[0.03]'}`}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='text-base font-bold text-white'>
                        {row.nickname}
                      </div>
                      <div className='mt-0.5 font-mono text-xs text-white/45'>
                        {row.entryId}
                      </div>
                    </div>
                    <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#ff2a00]/15 text-sm font-bold text-[#ff2a00]'>
                      {row.rank}
                    </div>
                  </div>
                  <div className='mt-3 grid grid-cols-3 gap-2 text-xs'>
                    <div className='rounded-lg bg-white/[0.05] px-2.5 py-2 text-center'>
                      <div className='text-white/45'>과제곡 1</div>
                      <div className='mt-0.5 font-bold text-white/80 tabular-nums'>
                        {formatScore(row.score1)}
                      </div>
                    </div>
                    <div className='rounded-lg bg-white/[0.05] px-2.5 py-2 text-center'>
                      <div className='text-white/45'>과제곡 2</div>
                      <div className='mt-0.5 font-bold text-white/80 tabular-nums'>
                        {formatScore(row.score2)}
                      </div>
                    </div>
                    <div className='rounded-lg bg-[#ff2a00]/10 px-2.5 py-2 text-center'>
                      <div className='text-[#ff2a00]/60'>합산</div>
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
    </TkcSection>
  )
}
