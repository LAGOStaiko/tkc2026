import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ARCADE_SONGS } from '@/content/arcade-songs'
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
import { FadeIn } from '@/components/tkc/guide-shared'
import { PageHero, TkcSection } from '@/components/tkc/layout'
import { LevelBadge } from '@/components/tkc/level-badge'
import { parseLevelNumber } from '@/components/tkc/parse-level-number'

export const Route = createFileRoute('/(site)/arcade-results/2026/$region')({
  component: ArcadeRegionDetailPage,
})

const formatScore = (value: number) => value.toLocaleString('en-US')

const REGION_ROUND_LABELS: Record<string, string> = {
  seoul: '1차',
  daejeon: '2차',
  gwangju: '3차',
  busan: '4차',
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Navigation                                                        */
/* ════════════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { id: 'finals', label: '최종 순위' },
  { id: 'selection', label: '추가 진출자 선발전' },
  { id: 'seed', label: '시드 배정전' },
]

function SectionNav({ activeId }: { activeId: string }) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className='sticky top-0 z-50 -mx-4 mb-10 border-b border-[#1e1e1e] bg-[#0a0a0a]/85 px-4 py-3 backdrop-blur-2xl md:-mx-6 md:px-6'>
      <div
        className='flex gap-1.5 overflow-x-auto'
        style={{ scrollbarWidth: 'none' }}
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type='button'
            onClick={() => scrollTo(item.id)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-medium whitespace-nowrap transition-all ${
              activeId === item.id
                ? 'border-[#2a2a2a] bg-[#111] text-white/90'
                : 'border-transparent text-white/35 hover:bg-[#111] hover:text-white/55'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Section Layout                                                     */
/* ════════════════════════════════════════════════════════════════════ */

function SectionBlock({
  id,
  stageLabel,
  title,
  desc,
  children,
}: {
  id: string
  stageLabel: string
  title: string
  desc: string
  children: ReactNode
}) {
  return (
    <section id={id} data-section={id} className='mb-20 scroll-mt-18'>
      <FadeIn>
        <div className='mb-2 font-mono text-sm font-semibold tracking-[2px] text-[#e74c3c] uppercase'>
          {stageLabel}
        </div>
        <h2 className='mb-3 text-2xl font-bold tracking-tight text-white/90 md:text-[32px]'>
          {title}
        </h2>
        <p className='mb-8 max-w-[640px] text-[15px] leading-relaxed font-light break-keep text-white/55'>
          {desc}
        </p>
      </FadeIn>
      <div className='space-y-5'>{children}</div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Record / Status Badges                                             */
/* ════════════════════════════════════════════════════════════════════ */

function RecordBadge({ wins, losses }: { wins: number; losses: number }) {
  const text = `${wins}-${losses}`
  const color =
    wins >= 3
      ? 'text-emerald-400'
      : wins >= 2
        ? 'text-[#f5a623]'
        : 'text-[#e74c3c]'
  return (
    <span className={cn('font-mono text-sm font-semibold', color)}>{text}</span>
  )
}

function StatusTag({ label }: { label: string }) {
  const isQualify = label !== '탈락'
  return (
    <span
      className={cn(
        'inline-block rounded-md border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide',
        isQualify
          ? 'border-[#e74c3c]/15 bg-[#e74c3c]/8 text-[#e74c3c]'
          : 'border-[#1e1e1e] bg-white/[0.03] text-white/50'
      )}
    >
      {label}
    </span>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Result Callout                                                     */
/* ════════════════════════════════════════════════════════════════════ */

function ResultCallout({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center gap-3 rounded-xl border border-[#e74c3c]/12 bg-[#e74c3c]/4 px-5 py-3.5 text-[15px] text-white/65'>
      <span className='size-1.5 shrink-0 rounded-full bg-[#e74c3c]' />
      <span className='break-keep'>
        {label} <strong className='font-semibold text-white/90'>{value}</strong>
      </span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Difficulty Badge                                                   */
/* ════════════════════════════════════════════════════════════════════ */

function DiffBadge({ level }: { level: number }) {
  return <LevelBadge level={level} />
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Match Block (Song header)                                          */
/* ════════════════════════════════════════════════════════════════════ */

function MatchBlockHead({
  label,
  songTitle,
  level,
}: {
  label: string
  songTitle: string
  level: number
}) {
  return (
    <div className='mb-4 flex flex-wrap items-baseline gap-3'>
      <span className='text-base font-bold text-white'>{label}</span>
      <span className='text-sm text-white/50'>{songTitle}</span>
      <DiffBadge level={level} />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Podium Card                                                        */
/* ════════════════════════════════════════════════════════════════════ */

function PodiumCard({
  rank,
  groupLabel,
  nickname,
  entryId,
  seed,
  record,
}: {
  rank: number
  groupLabel: string
  nickname: string
  entryId: string
  seed?: number
  record?: string
}) {
  const isFirst = rank === 1
  return (
    <div className='tkc-arc-glow rounded-2xl'>
      <div className='relative overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] p-7 md:p-8'>
        <div className='pointer-events-none absolute -top-8 -right-8 size-36 rounded-full bg-[#e74c3c]/4' />

        <div
          className={cn(
            'absolute top-5 right-6 flex size-14 items-center justify-center rounded-full text-3xl font-black',
            isFirst
              ? 'bg-[#e74c3c]/12 text-[#e74c3c] shadow-[0_0_24px_rgba(231,76,60,0.15)]'
              : 'bg-[#f5a623]/10 text-[#f5a623] shadow-[0_0_24px_rgba(245,166,35,0.1)]'
          )}
        >
          {rank}
        </div>

        <div className='relative'>
          <div className='mb-2 font-mono text-[11px] font-semibold tracking-[1px] text-[#e74c3c]'>
            {groupLabel}
          </div>
          <div className='text-2xl font-extrabold text-white md:text-[28px]'>
            {nickname}
          </div>
          <div className='mt-1 font-mono text-[13px] text-white/50'>
            {entryId}
          </div>
          <div className='mt-4 flex gap-5 text-sm text-white/50'>
            {typeof seed === 'number' && (
              <span>
                시드{' '}
                <strong className='font-semibold text-white/90'>{seed}</strong>
              </span>
            )}
            {record && (
              <span>
                전적{' '}
                <strong className='font-semibold text-white/90'>
                  {record}
                </strong>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Swiss Round Detail Card                                            */
/* ════════════════════════════════════════════════════════════════════ */

function SwissRoundCard({
  matches,
  round,
}: {
  matches: ArcadeSwissMatch[]
  round: number
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
/*  Helpers                                                            */
/* ════════════════════════════════════════════════════════════════════ */

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

/* ════════════════════════════════════════════════════════════════════ */
/*  Page                                                               */
/* ════════════════════════════════════════════════════════════════════ */

function ArcadeRegionDetailPage() {
  const { region } = Route.useParams()
  const { data } = useResults<unknown>()
  const archive = useMemo(() => resolveArcadeSeasonArchive(data), [data])
  const [activeSection, setActiveSection] = useState('finals')

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

  const sortedDeciderRows = useMemo(() => {
    if (!regionData) return []
    return [...regionData.deciderRows].sort((a, b) => a.rank - b.rank)
  }, [regionData])

  const sortedSeedingRows = useMemo(() => {
    if (!regionData) return []
    return [...regionData.seedingRows].sort((a, b) => a.rank - b.rank)
  }, [regionData])

  const sortedOnlineRows = useMemo(() => {
    if (!regionData) return []
    return [...regionData.onlineRows].sort((a, b) => a.rank - b.rank)
  }, [regionData])

  // IntersectionObserver for active nav
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('[data-section]')
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.section
            if (id) setActiveSection(id)
          }
        }
      },
      { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' }
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
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

  const roundLabel = REGION_ROUND_LABELS[regionData.key] ?? ''

  return (
    <TkcSection className='space-y-0'>
      {/* ── Hero ── */}
      <div className='mb-6 space-y-3'>
        <a
          href='/arcade-results/2026'
          className='text-sm text-white/50 transition-colors hover:text-[#f5a623]'
        >
          ← 아케이드 시즌 페이지로 돌아가기
        </a>
        <PageHero
          badge={`${roundLabel} · ${regionData.shortLabel}`}
          title={`${regionData.shortLabel} 아카이브`}
          subtitle={`${roundLabel} ${regionData.shortLabel} 지역 예선 결과입니다.`}
          accentColor='#e74c3c'
          gradientTo='#f5a623'
        />
      </div>

      {/* ── Nav ── */}
      <SectionNav activeId={activeSection} />

      {/* ═══════════ 01. Final Rankings ═══════════ */}
      <SectionBlock
        id='finals'
        stageLabel='Final'
        title='최종 순위'
        desc='선발전 · 시드전 성적을 포함한 종합 순위입니다.'
      >
        {/* Podium top 2 */}
        {finalRankingRows.filter((r) => r.rank <= 2).length > 0 && (
          <div className='grid gap-4 sm:grid-cols-2'>
            {finalRankingRows
              .filter((r) => r.rank <= 2)
              .map((row) => (
                <PodiumCard
                  key={`podium-${row.entryId}`}
                  rank={row.rank}
                  groupLabel={row.statusLabel}
                  nickname={row.nickname}
                  entryId={row.entryId}
                  seed={row.seed}
                  record={
                    typeof row.wins === 'number' &&
                    typeof row.losses === 'number'
                      ? `${row.wins}-${row.losses}`
                      : undefined
                  }
                />
              ))}
          </div>
        )}

        {/* Remaining ranking table */}
        {finalRankingRows.filter((r) => r.rank > 2).length > 0 && (
          <>
            {/* Desktop table */}
            <div className='hidden overflow-x-auto rounded-2xl border border-[#1e1e1e] bg-[#111] md:block'>
              <table className='w-full text-left text-[15px]'>
                <thead>
                  <tr className='border-b border-[#1e1e1e] bg-white/[0.015]'>
                    <th className='px-4 py-3.5 text-center font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                      순위
                    </th>
                    <th className='px-4 py-3.5 font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                      동더 네임
                    </th>
                    <th className='px-4 py-3.5 text-center font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                      시드
                    </th>
                    <th className='px-4 py-3.5 text-center font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                      전적
                    </th>
                    <th className='px-4 py-3.5 text-center font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {finalRankingRows
                    .filter((r) => r.rank > 2)
                    .map((row) => {
                      const record =
                        typeof row.wins === 'number' &&
                        typeof row.losses === 'number'
                          ? { wins: row.wins, losses: row.losses }
                          : null
                      return (
                        <tr
                          key={`fr-${row.entryId}-${row.rank}`}
                          className='border-b border-white/[0.03] transition-colors last:border-b-0 hover:bg-white/[0.02]'
                        >
                          <td className='w-14 px-4 py-3.5 text-center font-mono text-sm font-bold text-white/50'>
                            {row.rank}
                          </td>
                          <td className='px-4 py-3.5'>
                            <span className='font-semibold text-white'>
                              {row.nickname}
                            </span>
                            <span className='ml-2 font-mono text-xs text-white/50'>
                              {row.entryId}
                            </span>
                          </td>
                          <td className='px-4 py-3.5 text-center text-white/65 tabular-nums'>
                            {typeof row.seed === 'number' ? row.seed : '-'}
                          </td>
                          <td className='px-4 py-3.5 text-center'>
                            {record ? (
                              <RecordBadge
                                wins={record.wins}
                                losses={record.losses}
                              />
                            ) : (
                              <span className='text-white/35'>-</span>
                            )}
                          </td>
                          <td className='px-4 py-3.5 text-center'>
                            <StatusTag label={row.statusLabel} />
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
                .map((row) => (
                  <div
                    key={`m-fr-${row.entryId}-${row.rank}`}
                    className='flex items-center gap-3 rounded-2xl border border-[#1e1e1e] bg-[#111] px-4 py-3'
                  >
                    <span className='w-7 text-center text-sm font-bold text-white/40'>
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
                          시드 {typeof row.seed === 'number' ? row.seed : '-'}
                        </span>
                        {typeof row.wins === 'number' &&
                          typeof row.losses === 'number' && (
                            <RecordBadge wins={row.wins} losses={row.losses} />
                          )}
                      </div>
                    </div>
                    <StatusTag label={row.statusLabel} />
                  </div>
                ))}
            </div>
          </>
        )}

        {finalRankingRows.length === 0 && (
          <div className='rounded-2xl border border-[#1e1e1e] bg-[#111] px-5 py-4 text-sm text-white/50'>
            최종 순위 데이터가 아직 입력되지 않았습니다.
          </div>
        )}

        {/* Swiss round detail */}
        {swissByRound.length > 0 && (
          <details className='group mt-6'>
            <summary className='cursor-pointer text-sm font-medium text-white/40 transition-colors hover:text-white/60'>
              <span className='group-open:hidden'>
                ▸ 스위스 라운드별 상세 매치 기록 보기
              </span>
              <span className='hidden group-open:inline'>
                ▾ 스위스 라운드별 상세 매치 기록 접기
              </span>
            </summary>
            <div className='mt-5 space-y-6'>
              {swissByRound.map((block) => (
                <SwissRoundCard
                  key={block.round}
                  round={block.round}
                  matches={block.matches}
                />
              ))}
            </div>
          </details>
        )}
      </SectionBlock>

      {/* ═══════════ 02. Selection Match ═══════════ */}
      <SectionBlock
        id='selection'
        stageLabel='Stage 01'
        title='추가 진출자 선발전'
        desc='3-1 추가 진출자 선발전'
      >
        <MatchBlockHead
          label='선발전 곡'
          songTitle={ARCADE_SONGS.decider31.title}
          level={ARCADE_SONGS.decider31.level}
        />

        {sortedDeciderRows.length === 0 ? (
          <div className='rounded-2xl border border-[#1e1e1e] bg-[#111] px-5 py-4 text-sm text-white/50'>
            선발전 결과가 아직 입력되지 않았습니다.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className='hidden overflow-x-auto rounded-2xl border border-[#1e1e1e] bg-[#111] md:block'>
              <table className='w-full text-left text-[15px]'>
                <thead>
                  <tr className='border-b border-[#1e1e1e] bg-white/[0.015]'>
                    <th className='px-4 py-3.5 text-center font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                      순위
                    </th>
                    <th className='px-4 py-3.5 font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                      엔트리
                    </th>
                    <th className='px-4 py-3.5 font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                      동더 네임
                    </th>
                    <th className='px-4 py-3.5 text-right font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                      점수
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDeciderRows.map((row, idx) => (
                    <tr
                      key={`dec-${row.entryId}`}
                      className='border-b border-white/[0.03] transition-colors last:border-b-0 hover:bg-white/[0.02]'
                    >
                      <td
                        className={cn(
                          'w-14 px-4 py-3.5 text-center font-mono text-sm font-bold',
                          idx === 0 ? 'text-[#e74c3c]' : 'text-white/50'
                        )}
                      >
                        {row.rank}
                      </td>
                      <td className='px-4 py-3.5 font-mono text-[13px] text-white/50'>
                        {row.entryId}
                      </td>
                      <td className='px-4 py-3.5 font-semibold text-white'>
                        {row.nickname}
                      </td>
                      <td className='px-4 py-3.5 text-right font-mono text-[15px] font-semibold tracking-wide text-white tabular-nums'>
                        {formatScore(row.score)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className='space-y-2 md:hidden'>
              {sortedDeciderRows.map((row, idx) => (
                <div
                  key={`dec-m-${row.entryId}`}
                  className='flex items-center gap-3 rounded-2xl border border-[#1e1e1e] bg-[#111] px-4 py-3'
                >
                  <span
                    className={cn(
                      'w-7 text-center font-mono text-sm font-bold',
                      idx === 0 ? 'text-[#e74c3c]' : 'text-white/40'
                    )}
                  >
                    {row.rank}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='font-semibold text-white'>
                      {row.nickname}
                    </div>
                    <div className='mt-0.5 font-mono text-xs text-white/40'>
                      {row.entryId}
                    </div>
                  </div>
                  <span className='font-mono text-sm font-semibold text-white tabular-nums'>
                    {formatScore(row.score)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {regionData.deciderWinnerEntryId && (
          <ResultCallout
            label='선발전 통과:'
            value={renderParticipant(
              regionData,
              regionData.deciderWinnerEntryId
            )}
          />
        )}
      </SectionBlock>

      {/* ═══════════ 03. Seed Match ═══════════ */}
      <SectionBlock
        id='seed'
        stageLabel='Stage 02'
        title='결선 시드 배정전'
        desc='A/B 그룹 시드를 결정합니다.'
      >
        <MatchBlockHead
          label='시드 배정 곡'
          songTitle={ARCADE_SONGS.seeding.title}
          level={ARCADE_SONGS.seeding.level}
        />

        {sortedSeedingRows.length === 0 ? (
          <div className='rounded-2xl border border-[#1e1e1e] bg-[#111] px-5 py-4 text-sm text-white/50'>
            시드 배정전 결과가 아직 입력되지 않았습니다.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className='hidden overflow-x-auto rounded-2xl border border-[#1e1e1e] bg-[#111] md:block'>
              <table className='w-full text-left text-[15px]'>
                <thead>
                  <tr className='border-b border-[#1e1e1e] bg-white/[0.015]'>
                    <th className='px-4 py-3.5 text-center font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                      순위
                    </th>
                    <th className='px-4 py-3.5 font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                      엔트리
                    </th>
                    <th className='px-4 py-3.5 font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                      동더 네임
                    </th>
                    <th className='px-4 py-3.5 text-right font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                      점수
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSeedingRows.map((row, idx) => (
                    <tr
                      key={`seed-${row.entryId}`}
                      className='border-b border-white/[0.03] transition-colors last:border-b-0 hover:bg-white/[0.02]'
                    >
                      <td
                        className={cn(
                          'w-14 px-4 py-3.5 text-center font-mono text-sm font-bold',
                          idx === 0 ? 'text-[#e74c3c]' : 'text-white/50'
                        )}
                      >
                        {row.rank}
                      </td>
                      <td className='px-4 py-3.5 font-mono text-[13px] text-white/50'>
                        {row.entryId}
                      </td>
                      <td className='px-4 py-3.5 font-semibold text-white'>
                        {row.nickname}
                      </td>
                      <td className='px-4 py-3.5 text-right font-mono text-[15px] font-semibold tracking-wide text-white tabular-nums'>
                        {formatScore(row.score)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className='space-y-2 md:hidden'>
              {sortedSeedingRows.map((row, idx) => (
                <div
                  key={`seed-m-${row.entryId}`}
                  className='flex items-center gap-3 rounded-2xl border border-[#1e1e1e] bg-[#111] px-4 py-3'
                >
                  <span
                    className={cn(
                      'w-7 text-center font-mono text-sm font-bold',
                      idx === 0 ? 'text-[#e74c3c]' : 'text-white/40'
                    )}
                  >
                    {row.rank}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='font-semibold text-white'>
                      {row.nickname}
                    </div>
                    <div className='mt-0.5 font-mono text-xs text-white/40'>
                      {row.entryId}
                    </div>
                  </div>
                  <span className='font-mono text-sm font-semibold text-white tabular-nums'>
                    {formatScore(row.score)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Qualifier callouts */}
        <div className='space-y-2'>
          {regionData.qualifiers.groupA && (
            <ResultCallout
              label='지역 1위(A):'
              value={`${regionData.qualifiers.groupA.nickname} (${regionData.qualifiers.groupA.entryId})`}
            />
          )}
          {regionData.qualifiers.groupB && (
            <ResultCallout
              label='지역 2위(B):'
              value={`${regionData.qualifiers.groupB.nickname} (${regionData.qualifiers.groupB.entryId})`}
            />
          )}
          {!regionData.qualifiers.groupA && !regionData.qualifiers.groupB && (
            <div className='rounded-xl border border-[#1e1e1e] bg-[#111] px-5 py-3.5 text-sm text-white/50'>
              진출자 미확정
            </div>
          )}
        </div>
      </SectionBlock>

      {/* ═══════════ Online Qualifiers ═══════════ */}
      <FadeIn>
        <section className='mb-20'>
          <div className='mb-2 font-mono text-sm font-semibold tracking-[2px] text-[#e74c3c] uppercase'>
            Qualifier
          </div>
          <h2 className='mb-3 text-2xl font-bold tracking-tight text-white/90 md:text-[32px]'>
            온라인 예선
          </h2>
          <p className='mb-8 max-w-[640px] text-[15px] leading-relaxed font-light break-keep text-white/55'>
            과제곡 2곡 합산 스코어 기준. 동점은 접수 순서 우선.
          </p>

          {sortedOnlineRows.length === 0 ? (
            <div className='rounded-2xl border border-[#1e1e1e] bg-[#111] px-5 py-4 text-sm text-white/50'>
              온라인 예선 결과가 아직 입력되지 않았습니다.
            </div>
          ) : (
            <div className='space-y-5'>
              {/* Desktop table */}
              <div className='hidden overflow-x-auto rounded-2xl border border-[#1e1e1e] bg-[#111] md:block'>
                <table className='w-full text-left text-[15px]'>
                  <thead>
                    <tr className='border-b border-[#1e1e1e] bg-white/[0.015]'>
                      <th className='px-4 py-3.5 text-center font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                        순위
                      </th>
                      <th className='px-4 py-3.5 font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                        엔트리
                      </th>
                      <th className='px-4 py-3.5 font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                        동더 네임
                      </th>
                      <th className='px-4 py-3.5 text-right font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                        과제곡 1
                      </th>
                      <th className='px-4 py-3.5 text-right font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                        과제곡 2
                      </th>
                      <th className='px-4 py-3.5 text-right font-mono text-xs font-semibold tracking-wider text-white/50 uppercase'>
                        합산
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOnlineRows.map((row, idx) => (
                      <tr
                        key={`ol-${row.entryId}`}
                        className={cn(
                          'border-b border-white/[0.03] transition-colors last:border-b-0 hover:bg-white/[0.02]',
                          row.advanced && 'bg-emerald-500/5'
                        )}
                      >
                        <td
                          className={cn(
                            'w-14 px-4 py-3.5 text-center font-mono text-sm font-bold',
                            idx < 16 ? 'text-[#e74c3c]' : 'text-white/50'
                          )}
                        >
                          {row.rank}
                        </td>
                        <td className='px-4 py-3.5 font-mono text-[13px] text-white/50'>
                          {row.entryId}
                        </td>
                        <td className='px-4 py-3.5 font-semibold text-white'>
                          {row.nickname}
                        </td>
                        <td className='px-4 py-3.5 text-right text-white/65 tabular-nums'>
                          {formatScore(row.score1)}
                        </td>
                        <td className='px-4 py-3.5 text-right text-white/65 tabular-nums'>
                          {formatScore(row.score2)}
                        </td>
                        <td className='px-4 py-3.5 text-right font-mono font-semibold text-white tabular-nums'>
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
                    key={`ol-m-${row.entryId}`}
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
            </div>
          )}
        </section>
      </FadeIn>
    </TkcSection>
  )
}
