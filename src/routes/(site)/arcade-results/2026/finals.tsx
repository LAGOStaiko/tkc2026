import { useEffect, useMemo } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useResults } from '@/lib/api'
import {
  getRegionDefinitions,
  resolveArcadeSeasonArchive,
  type ArcadeFinalCrossMatch,
  type ArcadeFinalSeedRow,
} from '@/lib/arcade-results-archive'
import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/tkc/guide-shared'
import { TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/arcade-results/2026/finals')({
  component: ArcadeFinals2026Page,
})

/* ════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                            */
/* ════════════════════════════════════════════════════════════════════ */

function deriveCrossMatches(
  groupA: ArcadeFinalSeedRow[],
  groupB: ArcadeFinalSeedRow[]
): ArcadeFinalCrossMatch[] {
  const aSorted = [...groupA].sort((a, b) => a.seed - b.seed)
  const bSorted = [...groupB].sort((a, b) => a.seed - b.seed)
  if (aSorted.length < 4 || bSorted.length < 4) return []
  return [
    { matchNo: 1, left: aSorted[0], right: bSorted[3] },
    { matchNo: 2, left: aSorted[1], right: bSorted[2] },
    { matchNo: 3, left: aSorted[2], right: bSorted[1] },
    { matchNo: 4, left: aSorted[3], right: bSorted[0] },
  ]
}

function getRegionLabel(key: string): string {
  const def = getRegionDefinitions().find((d) => d.key === key)
  return def?.shortLabel ?? key
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Breadcrumb                                                         */
/* ════════════════════════════════════════════════════════════════════ */

function Breadcrumb() {
  return (
    <nav className='mb-5 flex items-center gap-1.5 text-[12px] text-white/30'>
      <Link
        to='/results'
        className='transition-colors hover:text-[#f5a623]'
      >
        아카이브
      </Link>
      <span className='text-white/15'>›</span>
      <Link
        to='/arcade-results/2026'
        className='hidden transition-colors hover:text-[#f5a623] sm:inline'
      >
        아케이드 시즌
      </Link>
      <span className='hidden text-white/15 sm:inline'>›</span>
      <span className='font-semibold text-white/60'>결선</span>
    </nav>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Champion Card                                                      */
/* ════════════════════════════════════════════════════════════════════ */

function ChampionCard({
  name,
  region,
}: {
  name: string
  region: string
}) {
  return (
    <div
      className='tkc-champion-card relative mb-2.5 overflow-hidden rounded-[16px] border border-[#ffd700]/15 p-6 sm:p-8'
      style={{
        background:
          'linear-gradient(135deg, #111 0%, #141210 50%, #111 100%)',
        animation: 'tkc-glow-pulse 4s ease-in-out infinite',
      }}
    >
      {/* Shimmer top bar */}
      <div
        className='tkc-champion-shimmer absolute inset-x-0 top-0 h-[3px]'
        style={{
          background:
            'linear-gradient(90deg, transparent, #ffd700, #f5a623, #e74c3c, #f5a623, #ffd700, transparent)',
          backgroundSize: '200% 100%',
          animation: 'tkc-shimmer 4s linear infinite',
        }}
      />
      {/* Glow blob */}
      <div className='pointer-events-none absolute -top-[80px] -right-[40px] size-[240px] rounded-full bg-[radial-gradient(circle,_rgba(255,215,0,0.04),_transparent_70%)]' />

      <div className='relative z-[1] flex items-center gap-5 sm:gap-6'>
        <div
          className='tkc-crown-float text-[32px] leading-none drop-shadow-[0_0_12px_rgba(255,215,0,0.3)] sm:text-[42px]'
          style={{ animation: 'tkc-crown-float 3s ease-in-out infinite' }}
        >
          👑
        </div>
        <div className='min-w-0 flex-1'>
          <div
            className='mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] font-extrabold tracking-[2px] sm:text-[11px]'
            style={{
              background: 'linear-gradient(90deg, #ffd700, #f5a623)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🏆 CHAMPION
          </div>
          <div className='text-[22px] font-black text-[#f0f0f0] [text-shadow:0_0_30px_rgba(255,215,0,0.15)] sm:text-[28px]'>
            {name}
          </div>
          <div className='mt-1.5 flex items-center gap-2.5 text-[13px] text-white/40'>
            <span className='rounded border border-[#ffd700]/10 bg-[#ffd700]/[0.04] px-2 py-0.5 text-[11px] text-[#ffd700]/50'>
              {region} 예선
            </span>
            <span className='hidden sm:inline'>아케이드 시즌 우승</span>
          </div>
        </div>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#ffd700]/12 bg-[#ffd700]/[0.06] font-mono text-base font-black text-[#ffd700] [text-shadow:0_0_12px_rgba(255,215,0,0.3)] sm:size-12 sm:text-xl'>
          1
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Runner-up Card                                                     */
/* ════════════════════════════════════════════════════════════════════ */

const RUNNERUP_CONFIG = {
  2: {
    label: 'RUNNER-UP',
    color: '#c0c0c0',
    barGradient: 'linear-gradient(90deg, #c0c0c0, rgba(192,192,192,0.2))',
  },
  3: {
    label: '3RD PLACE',
    color: '#cd7f32',
    barGradient: 'linear-gradient(90deg, #cd7f32, rgba(205,127,50,0.2))',
  },
  4: {
    label: '4TH PLACE',
    color: 'rgba(255,255,255,0.3)',
    barGradient:
      'linear-gradient(90deg, rgba(255,255,255,0.15), transparent)',
  },
} as const

function RunnerUpCard({
  rank,
  name,
  region,
}: {
  rank: 2 | 3 | 4
  name: string
  region: string
}) {
  const cfg = RUNNERUP_CONFIG[rank]
  return (
    <div className='relative overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] transition-colors hover:border-[#2a2a2a]'>
      {/* Top bar */}
      <div
        className='absolute inset-x-0 top-0 h-[2px] opacity-30'
        style={{ background: cfg.barGradient }}
      />
      <div className='flex items-center gap-2.5 px-3 py-3.5 sm:gap-3.5 sm:px-4 sm:py-[18px]'>
        <div
          className='flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-black sm:size-9 sm:text-base'
          style={{
            color: cfg.color,
            background: `${cfg.color}0F`,
            border: `1px solid ${cfg.color}1F`,
          }}
        >
          {rank}
        </div>
        <div className='min-w-0 flex-1'>
          <div
            className='font-mono text-[9px] font-extrabold tracking-[1px]'
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </div>
          <div className='mt-0.5 text-sm font-extrabold text-white/85 sm:text-base'>
            {name}
          </div>
          <div className='mt-0.5 text-[11px] text-white/30'>
            {region} 예선
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Seed Group                                                         */
/* ════════════════════════════════════════════════════════════════════ */

function SeedGroup({
  groupLabel,
  description,
  seeds,
  accentColor,
}: {
  groupLabel: string
  description: string
  seeds: ArcadeFinalSeedRow[]
  accentColor: string
}) {
  const sortedSeeds = useMemo(
    () => [...seeds].sort((a, b) => a.seed - b.seed),
    [seeds]
  )
  const groupPrefix = groupLabel.charAt(0)

  return (
    <div className='overflow-hidden rounded-[10px] border border-[#1e1e1e] bg-[#111]'>
      <div className='flex items-center gap-2 border-b border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2.5'>
        <span
          className='font-mono text-[11px] font-extrabold tracking-[0.5px]'
          style={{ color: accentColor }}
        >
          {groupLabel}
        </span>
        <span className='text-[12px] text-white/40'>{description}</span>
      </div>

      {sortedSeeds.length === 0 ? (
        <div className='px-3.5 py-3 text-[13px] text-white/30'>
          시드 데이터 대기
        </div>
      ) : (
        sortedSeeds.map((row) => (
          <div
            key={`${row.regionKey}-${row.entryId}`}
            className='flex items-center gap-2.5 border-b border-white/[0.03] px-3.5 py-2 last:border-b-0'
          >
            <span
              className='min-w-[22px] font-mono text-[11px] font-extrabold'
              style={{ color: accentColor }}
            >
              {groupPrefix}
              {row.seed}
            </span>
            <span className='hidden rounded border border-[#1e1e1e] bg-white/[0.03] px-1.5 py-0.5 text-[11px] text-white/30 sm:inline'>
              {getRegionLabel(row.regionKey)}
            </span>
            <span className='flex-1 text-[13px] font-semibold text-white/75'>
              {row.nickname}
            </span>
            <span className='hidden font-mono text-[10px] font-bold tracking-[0.5px] text-white/20 sm:inline'>
              시드 과제곡 기준
            </span>
          </div>
        ))
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Match Box                                                          */
/* ════════════════════════════════════════════════════════════════════ */

type MatchPlayer = {
  seed: string
  name: string
  score?: string
  isWinner?: boolean
  isTbd?: boolean
}

type BanPickRow = {
  who: string
  type: 'ban' | 'pick'
  song: string
}

function MatchBox({
  label,
  players,
  banPicks,
  isFinal,
}: {
  label: string
  players: MatchPlayer[]
  banPicks?: BanPickRow[]
  isFinal?: boolean
}) {
  return (
    <div
      className='overflow-hidden rounded-lg border bg-white/[0.015]'
      style={{
        borderColor: isFinal
          ? 'rgba(231,76,60,0.15)'
          : 'rgba(255,255,255,0.04)',
      }}
    >
      {/* Header */}
      <div
        className='flex items-center justify-between border-b px-2.5 py-1.5'
        style={{
          borderColor: isFinal
            ? 'rgba(231,76,60,0.15)'
            : 'rgba(255,255,255,0.04)',
          background: isFinal
            ? 'rgba(231,76,60,0.02)'
            : 'rgba(255,255,255,0.015)',
        }}
      >
        <span
          className='font-mono text-[9px] font-extrabold tracking-[0.5px]'
          style={{
            color: isFinal ? '#f5a623' : 'rgba(255,255,255,0.25)',
          }}
        >
          {label}
        </span>
      </div>

      {/* Players */}
      {players.map((p, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-2 border-b border-white/[0.025] px-2.5 py-1.5 last:border-b-0',
            p.isWinner && 'bg-[#e74c3c]/[0.04]',
            p.isTbd && 'opacity-60'
          )}
        >
          {p.seed && (
            <span className='min-w-[20px] font-mono text-[10px] font-extrabold text-white/25'>
              {p.seed}
            </span>
          )}
          <span
            className={cn(
              'flex-1 font-semibold',
              p.isWinner
                ? 'text-[13px] text-white/95'
                : p.isTbd
                  ? 'text-[11px] text-white/18 italic'
                  : 'text-[13px] text-white/65'
            )}
          >
            {p.name}
          </span>
          {p.score !== undefined && (
            <span
              className={cn(
                'font-mono text-[11px] font-bold',
                p.isWinner ? 'text-[#f5a623]' : 'text-white/25'
              )}
            >
              {p.score}
            </span>
          )}
        </div>
      ))}

      {/* Ban/Pick area */}
      {banPicks && banPicks.length > 0 && (
        <div className='space-y-[3px] border-t border-[#1e1e1e] bg-white/[0.01] px-2.5 py-2'>
          {banPicks.map((bp, i) => (
            <div key={i} className='flex items-center gap-1.5 text-[11px]'>
              <span className='min-w-[18px] font-mono text-[9px] font-extrabold text-white/30'>
                {bp.who}
              </span>
              <span
                className={cn(
                  'min-w-[30px] rounded px-[5px] py-px text-center font-mono text-[8px] font-extrabold tracking-[0.5px]',
                  bp.type === 'ban'
                    ? 'border border-[#e74c3c]/12 bg-[#e74c3c]/[0.08] text-[#e74c3c]'
                    : 'border border-[#34d399]/12 bg-[#34d399]/[0.08] text-[#34d399]'
                )}
              >
                {bp.type === 'ban' ? 'BAN' : 'PICK'}
              </span>
              <span
                className={cn(
                  'text-[11px] font-medium',
                  bp.type === 'ban'
                    ? 'text-white/20 line-through'
                    : 'text-white/55'
                )}
              >
                {bp.song}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Section Header                                                     */
/* ════════════════════════════════════════════════════════════════════ */

function SectionHead({
  badge,
  title,
}: {
  badge: string
  title: string
}) {
  return (
    <div className='mb-4 flex items-center gap-2.5'>
      <span className='rounded-[5px] border border-[#e74c3c]/15 bg-[#e74c3c]/[0.08] px-2 py-[3px] font-mono text-[10px] font-extrabold tracking-[1px] text-[#e74c3c]'>
        {badge}
      </span>
      <span className='text-base font-extrabold text-white/[0.88] sm:text-lg'>
        {title}
      </span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Build match data from crossMatches                                 */
/* ════════════════════════════════════════════════════════════════════ */

function buildQFPlayers(match: ArcadeFinalCrossMatch): MatchPlayer[] {
  const isLeftWin = match.winnerEntryId === match.left.entryId
  const isRightWin = match.winnerEntryId === match.right.entryId
  return [
    {
      seed: `A${match.left.seed}`,
      name: match.left.nickname,
      score: '—',
      isWinner: isLeftWin,
    },
    {
      seed: `B${match.right.seed}`,
      name: match.right.nickname,
      score: '—',
      isWinner: isRightWin,
    },
  ]
}

function buildQFBanPicks(match: ArcadeFinalCrossMatch): BanPickRow[] {
  const leftSeed = `A${match.left.seed}`
  const rightSeed = `B${match.right.seed}`
  return [
    { who: leftSeed, type: 'ban', song: '—' },
    { who: rightSeed, type: 'ban', song: '—' },
    { who: leftSeed, type: 'pick', song: '—' },
    { who: rightSeed, type: 'pick', song: '—' },
  ]
}

function buildPlaceholderBanPicks(): BanPickRow[] {
  return [
    { who: 'A', type: 'ban', song: '—' },
    { who: 'B', type: 'ban', song: '—' },
    { who: 'A', type: 'pick', song: '—' },
    { who: 'B', type: 'pick', song: '—' },
  ]
}

function buildFinalBanPicks(): BanPickRow[] {
  return [
    { who: 'A', type: 'ban', song: '—' },
    { who: 'B', type: 'ban', song: '—' },
    { who: 'A', type: 'pick', song: '—' },
    { who: 'A', type: 'pick', song: '—' },
    { who: 'B', type: 'pick', song: '—' },
    { who: 'B', type: 'pick', song: '—' },
  ]
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Page                                                               */
/* ════════════════════════════════════════════════════════════════════ */

function ArcadeFinals2026Page() {
  const { data, isError } = useResults<unknown>()
  const archive = useMemo(() => resolveArcadeSeasonArchive(data), [data])

  const crossMatches = useMemo(() => {
    if (archive.finals.crossMatches.length > 0)
      return archive.finals.crossMatches
    return deriveCrossMatches(
      archive.finals.groupASeeds,
      archive.finals.groupBSeeds
    )
  }, [
    archive.finals.crossMatches,
    archive.finals.groupASeeds,
    archive.finals.groupBSeeds,
  ])

  const hasSeeds =
    archive.finals.groupASeeds.length > 0 ||
    archive.finals.groupBSeeds.length > 0

  useEffect(() => {
    document.title = `${t('meta.siteName')} | 아케이드 결선`
  }, [])

  return (
    <TkcSection className='space-y-8 md:space-y-10'>
      {/* ── Breadcrumb + Hero ── */}
      <div>
        <Breadcrumb />
        <div className='mb-3 inline-flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-[1.5px] text-[#e74c3c]'>
          <span className='tkc-motion-dot size-1.5 rounded-full bg-[#e74c3c] shadow-[0_0_8px_#e74c3c]' />
          ARCADE FINALS
        </div>
        <h1 className='bg-gradient-to-r from-[#e74c3c] to-[#f5a623] bg-clip-text text-[26px] leading-[1.2] font-black tracking-[-0.5px] text-transparent sm:text-[32px]'>
          아케이드 결선
        </h1>
        <p className='mt-2.5 max-w-[600px] text-[13px] leading-[1.7] break-keep text-white/50 sm:text-sm'>
          <span className='hidden sm:inline'>
            전국 4개 지역 예선을 통과한 Top 8 선수들의 단판 토너먼트. 밴픽
            전략과 과제곡이 승부를 가릅니다.
          </span>
          <span className='sm:hidden'>
            Top 8 단판 토너먼트. 밴픽 전략과 과제곡이 승부를 가릅니다.
          </span>
        </p>
      </div>

      {/* ── Overview Bar ── */}
      <div className='flex flex-wrap gap-1.5'>
        <div className='inline-flex items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-[#111] px-2.5 py-2 text-[12px] text-white/50 sm:px-3.5'>
          <span className='hidden sm:inline'>👤 참가자</span>
          <span className='sm:hidden'>👤</span>
          <strong className='font-bold text-white/85'>8명</strong>
        </div>
        <div className='inline-flex items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-[#111] px-2.5 py-2 text-[12px] text-white/50 sm:px-3.5'>
          <span className='hidden sm:inline'>⚔ 방식</span>
          <span className='sm:hidden'>⚔</span>
          <strong className='font-bold text-white/85'>
            <span className='hidden sm:inline'>단판 토너먼트</span>
            <span className='sm:hidden'>단판</span>
          </strong>
        </div>
        <div className='inline-flex items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-[#111] px-2.5 py-2 text-[12px] text-white/50 sm:px-3.5'>
          <span className='hidden sm:inline'>🎵 사전 준비</span>
          <span className='sm:hidden'>🎵</span>
          <strong className='font-bold text-white/85'>
            <span className='hidden sm:inline'>1인 5곡</span>
            <span className='sm:hidden'>5곡 준비</span>
          </strong>
        </div>
        <div className='hidden items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-[#111] px-3.5 py-2 text-[12px] text-white/50 sm:inline-flex'>
          🏆 총 라운드 <strong className='font-bold text-white/85'>4</strong>
        </div>
      </div>

      {isError && (
        <div className='flex items-center gap-3 rounded-xl border border-[#f5a623]/[0.12] bg-[#f5a623]/[0.04] p-3.5 text-[12px] leading-relaxed text-white/55 sm:p-4 sm:text-[13px]'>
          <span className='shrink-0'>⚠</span>
          <span className='break-keep'>
            결선 데이터를 불러오지 못했습니다. 기본 구조만 표시합니다.
          </span>
        </div>
      )}

      {/* ── Podium ── */}
      <FadeIn>
        <section>
          <ChampionCard name='—' region='—' />
          <div className='grid gap-1.5 sm:grid-cols-3 sm:gap-2'>
            <RunnerUpCard rank={2} name='—' region='—' />
            <RunnerUpCard rank={3} name='—' region='—' />
            <RunnerUpCard rank={4} name='—' region='—' />
          </div>
        </section>
      </FadeIn>

      {/* ── Seeding ── */}
      <FadeIn>
        <section>
          <SectionHead
            badge='SEEDING'
            title={hasSeeds ? 'Top 8 시드 편성' : 'Top 8'}
          />
          <div className='grid gap-2.5 sm:grid-cols-2'>
            <SeedGroup
              groupLabel='A그룹'
              description={hasSeeds ? '4-0 자동 진출자' : '4-0 진출'}
              seeds={archive.finals.groupASeeds}
              accentColor='#e74c3c'
            />
            <SeedGroup
              groupLabel='B그룹'
              description={hasSeeds ? '3-1 선발 진출자' : '3-1 진출'}
              seeds={archive.finals.groupBSeeds}
              accentColor='#f5a623'
            />
          </div>
        </section>
      </FadeIn>

      {/* ── Bracket ── */}
      <FadeIn>
        <section>
          <SectionHead badge='BRACKET' title='대진표' />
          <div className='grid gap-2.5 md:grid-cols-2'>
            {/* 8강 (QF) – full width */}
            <div className='relative col-span-full overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] p-5'>
              <div className='absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#e74c3c] via-[#f5a623] to-transparent opacity-40' />
              <div className='mb-3.5 flex items-center justify-between'>
                <div>
                  <div className='font-mono text-[10px] font-extrabold tracking-[1px] text-[#e74c3c]'>
                    QUARTERFINALS
                  </div>
                  <div className='text-lg font-extrabold text-white/90 sm:text-xl'>
                    8강
                  </div>
                </div>
                <div className='text-[11px] text-white/30'>
                  <span className='hidden sm:inline'>
                    각자 1곡 + 과제곡 · 3곡 합산 · 4경기
                  </span>
                  <span className='sm:hidden'>3곡 합산</span>
                </div>
              </div>

              {crossMatches.length > 0 ? (
                <div className='grid gap-2 sm:grid-cols-2'>
                  {crossMatches
                    .slice()
                    .sort((a, b) => a.matchNo - b.matchNo)
                    .map((match) => (
                      <MatchBox
                        key={match.matchNo}
                        label={`MATCH ${match.matchNo}`}
                        players={buildQFPlayers(match)}
                        banPicks={buildQFBanPicks(match)}
                      />
                    ))}
                </div>
              ) : (
                <div className='grid gap-2 sm:grid-cols-2'>
                  {([
                    ['A1', 'B4'],
                    ['A2', 'B3'],
                    ['A3', 'B2'],
                    ['A4', 'B1'],
                  ] as const).map(([left, right], i) => (
                    <MatchBox
                      key={i}
                      label={`MATCH ${i + 1}`}
                      players={[
                        { seed: left, name: 'TBD', score: '—' },
                        { seed: right, name: 'TBD', score: '—' },
                      ]}
                      banPicks={[
                        { who: left, type: 'ban', song: '—' },
                        { who: right, type: 'ban', song: '—' },
                        { who: left, type: 'pick', song: '—' },
                        { who: right, type: 'pick', song: '—' },
                      ]}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 4강 (SF) */}
            <div className='relative overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] p-5'>
              <div className='absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#e74c3c] via-[#f5a623] to-transparent opacity-40' />
              <div className='mb-3.5 flex items-center justify-between'>
                <div>
                  <div className='font-mono text-[10px] font-extrabold tracking-[1px] text-[#e74c3c]'>
                    SEMIFINALS
                  </div>
                  <div className='text-lg font-extrabold text-white/90 sm:text-xl'>
                    4강
                  </div>
                </div>
                <div className='text-[11px] text-white/30'>3곡 합산</div>
              </div>
              <div className='space-y-2'>
                <MatchBox
                  label='SF-1'
                  players={[
                    { seed: '—', name: 'M1 승자', score: '—', isTbd: true },
                    { seed: '—', name: 'M2 승자', score: '—', isTbd: true },
                  ]}
                  banPicks={buildPlaceholderBanPicks()}
                />
                <MatchBox
                  label='SF-2'
                  players={[
                    { seed: '—', name: 'M3 승자', score: '—', isTbd: true },
                    { seed: '—', name: 'M4 승자', score: '—', isTbd: true },
                  ]}
                  banPicks={buildPlaceholderBanPicks()}
                />
              </div>
            </div>

            {/* 3·4위전 */}
            <div className='relative overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] p-5'>
              <div className='absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#e74c3c] via-[#f5a623] to-transparent opacity-40' />
              <div className='mb-3.5 flex items-center justify-between'>
                <div>
                  <div className='font-mono text-[10px] font-extrabold tracking-[1px] text-[#e74c3c]'>
                    3RD PLACE
                  </div>
                  <div className='text-lg font-extrabold text-white/90 sm:text-xl'>
                    3·4위전
                  </div>
                </div>
                <div className='text-[11px] text-white/30'>3곡 합산</div>
              </div>
              <MatchBox
                label='3RD'
                players={[
                  {
                    seed: '—',
                    name: 'SF-1 패자',
                    score: '—',
                    isTbd: true,
                  },
                  {
                    seed: '—',
                    name: 'SF-2 패자',
                    score: '—',
                    isTbd: true,
                  },
                ]}
                banPicks={buildPlaceholderBanPicks()}
              />
            </div>

            {/* 결승 (Final) – full width */}
            <div className='relative col-span-full overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] p-5'>
              <div
                className='absolute inset-x-0 top-0 h-[3px] opacity-70'
                style={{
                  background:
                    'linear-gradient(90deg, #e74c3c, #f5a623, #f1c40f, transparent 90%)',
                }}
              />
              <div className='mb-3.5 flex items-center justify-between'>
                <div>
                  <div className='font-mono text-[10px] font-extrabold tracking-[1px] text-[#f5a623]'>
                    GRAND FINAL
                  </div>
                  <div className='text-lg font-extrabold text-white/90 sm:text-xl'>
                    결승
                  </div>
                </div>
                <div className='text-[11px] text-white/30'>
                  <span className='hidden sm:inline'>
                    각자 2곡 + 과제곡 · 5곡 합산
                  </span>
                  <span className='sm:hidden'>5곡 합산</span>
                </div>
              </div>
              <MatchBox
                label='FINAL'
                isFinal
                players={[
                  {
                    seed: '—',
                    name: 'SF-1 승자',
                    score: '—',
                    isTbd: true,
                  },
                  {
                    seed: '—',
                    name: 'SF-2 승자',
                    score: '—',
                    isTbd: true,
                  },
                ]}
                banPicks={buildFinalBanPicks()}
              />
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Tiebreak ── */}
      <FadeIn>
        <section>
          <SectionHead badge='TIEBREAK' title='동점 처리' />
          <div className='flex flex-wrap items-center gap-1.5'>
            <div className='inline-flex items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-white/[0.015] px-2.5 py-2 text-[11px] text-white/50 sm:px-3.5 sm:text-[12px]'>
              <span className='font-mono text-[10px] font-extrabold text-[#e74c3c]'>
                1
              </span>
              <span className='hidden sm:inline'>합산 점수 동점 발생</span>
              <span className='sm:hidden'>동점</span>
            </div>
            <span className='text-[11px] text-white/12'>→</span>
            <div className='inline-flex items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-white/[0.015] px-2.5 py-2 text-[11px] text-white/50 sm:px-3.5 sm:text-[12px]'>
              <span className='font-mono text-[10px] font-extrabold text-[#e74c3c]'>
                2
              </span>
              <span className='hidden sm:inline'>
                마지막 곡 동일 조건 재대결
              </span>
              <span className='sm:hidden'>재대결</span>
            </div>
            <span className='text-[11px] text-white/12'>→</span>
            <div className='inline-flex items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-white/[0.015] px-2.5 py-2 text-[11px] text-white/50 sm:px-3.5 sm:text-[12px]'>
              <span className='font-mono text-[10px] font-extrabold text-[#e74c3c]'>
                3
              </span>
              <span className='hidden sm:inline'>
                재대결도 동점 시 良 개수 비교
              </span>
              <span className='sm:hidden'>良 비교</span>
            </div>
          </div>
        </section>
      </FadeIn>
    </TkcSection>
  )
}
