import { Fragment, useEffect, useMemo } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useResults } from '@/lib/api'
import {
  resolveConsoleSeasonArchive,
  buildStandings,
  buildQualifierRows,
  getSF1,
  getSF2,
  getThirdPlace,
  getFinal,
  type ConsoleStage,
  type ConsoleQualifierRow,
} from '@/lib/console-results-archive'
import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/tkc/guide-shared'
import { TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/console-results/2026/')({
  component: ConsoleResults2026Page,
})

/* ════════════════════════════════════════════════════════════════════ */
/*  Breadcrumb                                                         */
/* ════════════════════════════════════════════════════════════════════ */

function Breadcrumb() {
  return (
    <nav className='mb-5 flex items-center gap-1.5 text-[12px] text-white/30'>
      <Link
        to='/results'
        className='transition-colors hover:text-[#4a9eff]'
      >
        아카이브
      </Link>
      <span className='text-white/15'>›</span>
      <Link
        to='/results'
        className='hidden transition-colors hover:text-[#4a9eff] sm:inline'
      >
        콘솔 시즌
      </Link>
      <span className='hidden text-white/15 sm:inline'>›</span>
      <span className='font-semibold text-white/60'>
        <span className='hidden sm:inline'>2026</span>
        <span className='sm:hidden'>콘솔 2026</span>
      </span>
    </nav>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Section Head                                                       */
/* ════════════════════════════════════════════════════════════════════ */

function SectionHead({ badge, title }: { badge: string; title: string }) {
  return (
    <div className='mb-4 flex items-center gap-2.5'>
      <span className='rounded-[5px] border border-[#4a9eff]/15 bg-[#4a9eff]/[0.08] px-2 py-[3px] font-mono text-[10px] font-extrabold tracking-[1px] text-[#4a9eff]'>
        {badge}
      </span>
      <span className='text-[15px] font-extrabold text-white/[0.88] sm:text-lg'>
        {title}
      </span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Champion Card                                                      */
/* ════════════════════════════════════════════════════════════════════ */

function ChampionCard({ name }: { name: string }) {
  return (
    <div
      className='tkc-champion-card relative mb-2.5 overflow-hidden rounded-[16px] border border-[#ffd700]/15 p-6 sm:p-8'
      style={{
        background:
          'linear-gradient(135deg, #111 0%, #10111a 50%, #111 100%)',
        animation: 'tkc-glow-pulse-console 4s ease-in-out infinite',
      }}
    >
      {/* Shimmer top bar */}
      <div
        className='tkc-champion-shimmer absolute inset-x-0 top-0 h-[3px]'
        style={{
          background:
            'linear-gradient(90deg, transparent, #ffd700, #4a9eff, #22d3ee, #4a9eff, #ffd700, transparent)',
          backgroundSize: '200% 100%',
          animation: 'tkc-shimmer 4s linear infinite',
        }}
      />
      {/* Glow blob */}
      <div className='pointer-events-none absolute -top-[80px] -right-[40px] size-[240px] rounded-full bg-[radial-gradient(circle,_rgba(74,158,255,0.04),_transparent_70%)]' />

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
              background: 'linear-gradient(90deg, #ffd700, #22d3ee)',
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
          <div className='mt-1.5 text-[13px] text-white/40'>
            콘솔 시즌 우승
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
    mobileLabel: 'RUNNER-UP',
    color: '#c0c0c0',
    barGradient: 'linear-gradient(90deg, #c0c0c0, rgba(192,192,192,0.2))',
  },
  3: {
    label: '3RD PLACE',
    mobileLabel: '3RD',
    color: '#cd7f32',
    barGradient: 'linear-gradient(90deg, #cd7f32, rgba(205,127,50,0.2))',
  },
  4: {
    label: '4TH PLACE',
    mobileLabel: '4TH',
    color: 'rgba(255,255,255,0.3)',
    barGradient:
      'linear-gradient(90deg, rgba(255,255,255,0.15), transparent)',
  },
} as const

function RunnerUpCard({
  rank,
  name,
}: {
  rank: 2 | 3 | 4
  name: string
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
            <span className='hidden sm:inline'>{cfg.label}</span>
            <span className='sm:hidden'>{cfg.mobileLabel}</span>
          </div>
          <div className='mt-0.5 text-sm font-extrabold text-white/85 sm:text-base'>
            {name}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Match Box                                                          */
/* ════════════════════════════════════════════════════════════════════ */

type MatchPlayer = {
  seed?: string
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
  hideLabelMobile,
  hideBanPickMobile,
  hideSeedsMobile,
}: {
  label: string
  players: MatchPlayer[]
  banPicks?: BanPickRow[]
  isFinal?: boolean
  hideLabelMobile?: boolean
  hideBanPickMobile?: boolean
  hideSeedsMobile?: boolean
}) {
  return (
    <div
      className='overflow-hidden rounded-lg border bg-white/[0.015]'
      style={{
        borderColor: isFinal
          ? 'rgba(74,158,255,0.15)'
          : 'rgba(255,255,255,0.04)',
      }}
    >
      {/* Header */}
      <div
        className={cn(
          'items-center justify-between border-b px-2.5 py-1.5',
          hideLabelMobile ? 'hidden sm:flex' : 'flex'
        )}
        style={{
          borderColor: isFinal
            ? 'rgba(74,158,255,0.15)'
            : 'rgba(255,255,255,0.04)',
          background: isFinal
            ? 'rgba(74,158,255,0.02)'
            : 'rgba(255,255,255,0.015)',
        }}
      >
        <span
          className='font-mono text-[9px] font-extrabold tracking-[0.5px]'
          style={{
            color: isFinal ? '#22d3ee' : 'rgba(255,255,255,0.25)',
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
            p.isWinner && 'bg-[#4a9eff]/[0.04]',
            p.isTbd && 'opacity-60'
          )}
        >
          {p.seed && (
            <span
              className={cn(
                'min-w-[16px] font-mono text-[10px] font-extrabold text-white/25',
                hideSeedsMobile && 'hidden sm:inline'
              )}
            >
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
                'hidden font-mono text-[11px] font-bold sm:inline',
                p.isWinner ? 'text-[#22d3ee]' : 'text-white/25'
              )}
            >
              {p.score}
            </span>
          )}
        </div>
      ))}

      {/* Ban/Pick area */}
      {banPicks && banPicks.length > 0 && (
        <div
          className={cn(
            'flex-col gap-[3px] border-t border-[#1e1e1e] bg-white/[0.01] px-2.5 py-2',
            hideBanPickMobile ? 'hidden sm:flex' : 'flex'
          )}
        >
          {banPicks.map((bp, i) => (
            <div key={i} className='flex items-center gap-1.5 text-[11px]'>
              <span className='min-w-[14px] font-mono text-[9px] font-extrabold text-white/30'>
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
/*  Qualifier Table                                                    */
/* ════════════════════════════════════════════════════════════════════ */

const DEFAULT_QUALIFIER_ROWS: ConsoleQualifierRow[] = Array.from(
  { length: 8 },
  (_, i) => ({
    rank: i + 1,
    nickname: '—',
    score: null,
    detail: '',
    passed: i < 4,
    seed: i < 4 ? `#${i + 1}` : undefined,
  })
)

function QualifierTable({ rows }: { rows: ConsoleQualifierRow[] }) {
  const displayRows = rows.length > 0 ? rows : DEFAULT_QUALIFIER_ROWS
  const cutoffIndex = displayRows.findIndex((r) => !r.passed)

  return (
    <div className='overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111]'>
      <table className='w-full border-collapse'>
        <thead>
          <tr className='border-b border-[#1e1e1e] bg-white/[0.015]'>
            <th className='w-[50px] px-2.5 py-2.5 text-center font-mono text-[9px] font-extrabold tracking-[0.5px] text-white/30 sm:px-3.5 sm:text-[10px]'>
              #
            </th>
            <th className='px-2.5 py-2.5 text-left font-mono text-[9px] font-extrabold tracking-[0.5px] text-white/30 sm:px-3.5 sm:text-[10px]'>
              닉네임
            </th>
            <th className='px-2.5 py-2.5 text-left font-mono text-[9px] font-extrabold tracking-[0.5px] text-white/30 sm:px-3.5 sm:text-[10px]'>
              점수
            </th>
            <th className='px-2.5 py-2.5 text-left font-mono text-[9px] font-extrabold tracking-[0.5px] text-white/30 sm:px-3.5 sm:text-[10px]'>
              <span className='hidden sm:inline'>시드</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <Fragment key={row.rank}>
              {cutoffIndex > 0 && i === cutoffIndex && (
                <tr aria-hidden>
                  <td
                    colSpan={4}
                    className='h-0.5 !border-b-0 !p-0'
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, #4a9eff, transparent)',
                    }}
                  />
                </tr>
              )}
              <tr>
                <td
                  className={cn(
                    'px-2.5 py-2 text-center font-mono text-[12px] font-extrabold sm:px-3.5 sm:py-2.5',
                    row.passed ? 'text-[#4a9eff]' : 'text-white/20',
                    i < displayRows.length - 1 &&
                      'border-b border-white/[0.03]'
                  )}
                >
                  {row.rank}
                </td>
                <td
                  className={cn(
                    'px-2.5 py-2 text-[12px] sm:px-3.5 sm:py-2.5 sm:text-[13px]',
                    row.passed
                      ? 'font-bold text-white/60'
                      : 'font-medium text-white/25',
                    i < displayRows.length - 1 &&
                      'border-b border-white/[0.03]'
                  )}
                >
                  {row.nickname}
                </td>
                <td
                  className={cn(
                    'px-2.5 py-2 font-mono text-[11px] font-bold sm:px-3.5 sm:py-2.5 sm:text-[12px]',
                    row.passed ? 'text-white/40' : 'text-white/25',
                    i < displayRows.length - 1 &&
                      'border-b border-white/[0.03]'
                  )}
                >
                  {row.score !== null ? row.score.toLocaleString() : '—'}
                </td>
                <td
                  className={cn(
                    'px-2.5 py-2 sm:px-3.5 sm:py-2.5',
                    i < displayRows.length - 1 &&
                      'border-b border-white/[0.03]'
                  )}
                >
                  {row.seed && (
                    <span className='inline-flex rounded bg-[#4a9eff]/[0.08] px-[5px] py-0.5 font-mono text-[9px] font-extrabold tracking-[0.5px] text-[#4a9eff]'>
                      {row.seed}
                    </span>
                  )}
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Stage → MatchPlayer helpers                                       */
/* ════════════════════════════════════════════════════════════════════ */

function stageToPlayers(
  stage: ConsoleStage | undefined,
  seed1?: string,
  seed2?: string,
  tbd1 = 'TBD',
  tbd2 = 'TBD'
): MatchPlayer[] {
  if (!stage || stage.rows.length < 2) {
    return [
      { seed: seed1, name: tbd1, score: '—', isTbd: true },
      { seed: seed2, name: tbd2, score: '—', isTbd: true },
    ]
  }

  const sorted = [...stage.rows].sort((a, b) => a.rank - b.rank)
  const winner = sorted[0]
  const loser = sorted[1]

  return [
    {
      seed: seed1,
      name: winner.nickname,
      score: winner.score !== null ? winner.score.toLocaleString() : '—',
      isWinner: true,
    },
    {
      seed: seed2,
      name: loser.nickname,
      score: loser.score !== null ? loser.score.toLocaleString() : '—',
      isWinner: false,
    },
  ]
}

function buildBanPicks(who1: string, who2: string): BanPickRow[] {
  return [
    { who: who1, type: 'ban', song: '—' },
    { who: who2, type: 'ban', song: '—' },
    { who: who1, type: 'pick', song: '—' },
    { who: who2, type: 'pick', song: '—' },
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

function ConsoleResults2026Page() {
  const { data, isLoading, isError } = useResults<unknown>()
  const archive = useMemo(() => resolveConsoleSeasonArchive(data), [data])
  const standings = useMemo(() => buildStandings(archive), [archive])
  const qualifierRows = useMemo(() => buildQualifierRows(archive), [archive])

  const sf1 = useMemo(() => getSF1(archive), [archive])
  const sf2 = useMemo(() => getSF2(archive), [archive])
  const thirdPlace = useMemo(() => getThirdPlace(archive), [archive])
  const final = useMemo(() => getFinal(archive), [archive])

  const champion = standings.find((s) => s.rank === 1)?.nickname ?? '—'
  const runner2 = standings.find((s) => s.rank === 2)?.nickname ?? '—'
  const runner3 = standings.find((s) => s.rank === 3)?.nickname ?? '—'
  const runner4 = standings.find((s) => s.rank === 4)?.nickname ?? '—'

  useEffect(() => {
    document.title = `${t('meta.siteName')} | 콘솔 시즌 2026`
  }, [])

  return (
    <TkcSection className='space-y-8 md:space-y-10'>
      {/* ── Breadcrumb + Hero ── */}
      <div>
        <Breadcrumb />
        <div className='mb-3 inline-flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-[1.5px] text-[#4a9eff]'>
          <span className='tkc-motion-dot size-1.5 rounded-full bg-[#4a9eff] shadow-[0_0_8px_#4a9eff]' />
          <span className='hidden sm:inline'>CONSOLE SEASON</span>
          <span className='sm:hidden'>CONSOLE</span>
        </div>
        <h1 className='bg-gradient-to-r from-[#4a9eff] to-[#22d3ee] bg-clip-text text-[26px] leading-[1.2] font-black tracking-[-0.5px] text-transparent sm:text-[32px]'>
          콘솔 시즌 2026
        </h1>
        <p className='mt-2.5 max-w-[600px] text-[13px] leading-[1.7] break-keep text-white/50 sm:text-sm'>
          <span className='hidden sm:inline'>
            Nintendo Switch 온라인 예선을 거쳐 선발된 Top 4의 결선 토너먼트.
            밴픽과 과제곡으로 승부합니다.
          </span>
          <span className='sm:hidden'>
            온라인 예선 Top 4 결선 토너먼트
          </span>
        </p>
      </div>

      {/* ── Overview Bar ── */}
      <div className='flex flex-wrap gap-1.5'>
        <div className='inline-flex items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-[#111] px-2.5 py-2 text-[11px] text-white/50 sm:px-3.5 sm:text-[12px]'>
          <span className='hidden sm:inline'>🎮 플랫폼</span>
          <span className='sm:hidden'>🎮</span>
          <strong className='font-bold text-white/85'>
            <span className='hidden sm:inline'>Nintendo Switch</span>
            <span className='sm:hidden'>Switch</span>
          </strong>
        </div>
        <div className='inline-flex items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-[#111] px-2.5 py-2 text-[11px] text-white/50 sm:px-3.5 sm:text-[12px]'>
          <span className='hidden sm:inline'>👤 결선</span>
          <span className='sm:hidden'>👤</span>
          <strong className='font-bold text-white/85'>4명</strong>
        </div>
        <div className='hidden items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-[#111] px-3.5 py-2 text-[12px] text-white/50 sm:inline-flex'>
          ⚔ 방식 <strong className='font-bold text-white/85'>단판 토너먼트</strong>
        </div>
        <div className='inline-flex items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-[#111] px-2.5 py-2 text-[11px] text-white/50 sm:px-3.5 sm:text-[12px]'>
          <span className='hidden sm:inline'>🏆 라운드</span>
          <span className='sm:hidden'>🏆</span>
          <strong className='font-bold text-white/85'>
            <span className='hidden sm:inline'>3</span>
            <span className='sm:hidden'>3라운드</span>
          </strong>
        </div>
        {isLoading && (
          <div className='inline-flex items-center gap-1.5 rounded-lg border border-[#4a9eff]/15 bg-[#4a9eff]/[0.04] px-2.5 py-2 text-[11px] font-semibold text-[#4a9eff] sm:px-3.5 sm:text-[12px]'>
            동기화 중
          </div>
        )}
      </div>

      {isError && (
        <div className='flex items-center gap-3 rounded-xl border border-[#4a9eff]/[0.12] bg-[#4a9eff]/[0.04] p-3.5 text-[12px] leading-relaxed text-white/55 sm:p-4 sm:text-[13px]'>
          <span className='shrink-0'>⚠</span>
          <span className='break-keep'>
            결과 데이터를 불러오지 못했습니다. 기본 구조만 표시합니다.
          </span>
        </div>
      )}

      {/* ── Podium (STANDINGS) ── */}
      <FadeIn>
        <section>
          <SectionHead badge='STANDINGS' title='최종 순위' />
          <ChampionCard name={champion} />
          <div className='grid gap-1.5 sm:grid-cols-3 sm:gap-2'>
            <RunnerUpCard rank={2} name={runner2} />
            <RunnerUpCard rank={3} name={runner3} />
            <RunnerUpCard rank={4} name={runner4} />
          </div>
        </section>
      </FadeIn>

      {/* ── Bracket ── */}
      <FadeIn>
        <section>
          <SectionHead badge='BRACKET' title='결선 대진표' />
          <div className='grid gap-2.5 sm:grid-cols-2'>
            {/* 4강 (SF) – full width */}
            <div className='relative col-span-full overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] p-5'>
              <div className='absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#4a9eff] via-[#22d3ee] to-transparent opacity-40' />
              <div className='mb-3.5 flex items-center justify-between'>
                <div>
                  <div className='font-mono text-[10px] font-extrabold tracking-[1px] text-[#4a9eff]'>
                    SEMIFINALS
                  </div>
                  <div className='text-lg font-extrabold text-white/90 sm:text-xl'>
                    4강
                  </div>
                </div>
                <div className='text-[11px] text-white/30'>
                  <span className='hidden sm:inline'>
                    각자 1곡 + 과제곡 · 3곡 합산 · 2경기
                  </span>
                  <span className='sm:hidden'>3곡</span>
                </div>
              </div>
              <div className='grid gap-2 sm:grid-cols-2'>
                <MatchBox
                  label='SF-1'
                  players={stageToPlayers(sf1, '#1', '#4')}
                  banPicks={buildBanPicks('#1', '#4')}
                  hideBanPickMobile
                />
                <MatchBox
                  label='SF-2'
                  players={stageToPlayers(sf2, '#2', '#3')}
                  banPicks={buildBanPicks('#2', '#3')}
                  hideBanPickMobile
                />
              </div>
            </div>

            {/* 3·4위전 */}
            <div className='relative overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] p-5'>
              <div className='absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#4a9eff] via-[#22d3ee] to-transparent opacity-40' />
              <div className='mb-3.5 flex items-center justify-between'>
                <div>
                  <div className='font-mono text-[10px] font-extrabold tracking-[1px] text-[#4a9eff]'>
                    3RD PLACE
                  </div>
                  <div className='text-lg font-extrabold text-white/90 sm:text-xl'>
                    3·4위전
                  </div>
                </div>
                <div className='hidden text-[11px] text-white/30 sm:block'>
                  3곡 합산
                </div>
              </div>
              <MatchBox
                label='3RD'
                players={stageToPlayers(
                  thirdPlace,
                  '—',
                  '—',
                  'SF-1 패자',
                  'SF-2 패자'
                )}
                banPicks={buildBanPicks('A', 'B')}
                hideLabelMobile
                hideBanPickMobile
                hideSeedsMobile
              />
            </div>

            {/* 결승 (Final) – full width */}
            <div className='relative col-span-full overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] p-5'>
              <div
                className='absolute inset-x-0 top-0 h-[3px] opacity-70'
                style={{
                  background:
                    'linear-gradient(90deg, #4a9eff, #22d3ee, #ffd700, transparent 90%)',
                }}
              />
              <div className='mb-3.5 flex items-center justify-between'>
                <div>
                  <div className='font-mono text-[10px] font-extrabold tracking-[1px] text-[#22d3ee]'>
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
                  <span className='sm:hidden'>5곡</span>
                </div>
              </div>
              <MatchBox
                label='FINAL'
                isFinal
                players={stageToPlayers(
                  final,
                  '—',
                  '—',
                  'SF-1 승자',
                  'SF-2 승자'
                )}
                banPicks={buildFinalBanPicks()}
                hideSeedsMobile
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
              <span className='font-mono text-[10px] font-extrabold text-[#4a9eff]'>
                1
              </span>
              <span className='hidden sm:inline'>합산 점수 동점 발생</span>
              <span className='sm:hidden'>동점</span>
            </div>
            <span className='text-[11px] text-white/12'>→</span>
            <div className='inline-flex items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-white/[0.015] px-2.5 py-2 text-[11px] text-white/50 sm:px-3.5 sm:text-[12px]'>
              <span className='font-mono text-[10px] font-extrabold text-[#4a9eff]'>
                2
              </span>
              <span className='hidden sm:inline'>
                마지막 곡 동일 조건 재대결
              </span>
              <span className='sm:hidden'>재대결</span>
            </div>
            <span className='text-[11px] text-white/12'>→</span>
            <div className='inline-flex items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-white/[0.015] px-2.5 py-2 text-[11px] text-white/50 sm:px-3.5 sm:text-[12px]'>
              <span className='font-mono text-[10px] font-extrabold text-[#4a9eff]'>
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

      {/* ── Qualifier Table ── */}
      <FadeIn>
        <section>
          <SectionHead badge='QUALIFIER' title='온라인 예선 순위' />
          <QualifierTable rows={qualifierRows} />
        </section>
      </FadeIn>
    </TkcSection>
  )
}
