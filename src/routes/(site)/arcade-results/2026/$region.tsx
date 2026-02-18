import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ARCADE_SONGS } from '@/content/arcade-songs'
import { t } from '@/text'
import { useResults } from '@/lib/api'
import {
  getRegionByKey,
  getRegionDefinitions,
  isArcadeRegionKey,
  resolveArcadeSeasonArchive,
  type ArcadeRegionArchive,
  type ArcadeSwissMatch,
} from '@/lib/arcade-results-archive'
import { buildRegionFinalRanking } from '@/lib/arcade-results-ranking'
import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/tkc/guide-shared'
import { TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/arcade-results/2026/$region')({
  component: ArcadeRegionDetailPage,
})

/* ════════════════════════════════════════════════════════════════════ */
/*  Constants                                                          */
/* ════════════════════════════════════════════════════════════════════ */

const formatScore = (value: number) => value.toLocaleString('en-US')

const REGION_ROUND_LABELS: Record<string, string> = {
  seoul: '1차',
  daejeon: '2차',
  gwangju: '3차',
  busan: '4차',
}

const REGION_HERO_LABELS: Record<string, string> = {
  seoul: 'ARCADE · SEOUL',
  daejeon: 'ARCADE · DAEJEON',
  gwangju: 'ARCADE · GWANGJU',
  busan: 'ARCADE · BUSAN',
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Breadcrumb                                                         */
/* ════════════════════════════════════════════════════════════════════ */

function Breadcrumb({ regionLabel }: { regionLabel: string }) {
  return (
    <nav className='mb-5 flex items-center gap-1.5 text-[12px] text-white/30'>
      <Link to='/results' className='transition-colors hover:text-[#f5a623]'>
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
      <span className='font-semibold text-white/60'>{regionLabel}</span>
    </nav>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Region Stepper                                                     */
/* ════════════════════════════════════════════════════════════════════ */

function RegionStepper({ activeKey }: { activeKey: string }) {
  const regions = getRegionDefinitions()

  return (
    <div className='mb-7 flex gap-1 sm:gap-1.5'>
      {regions.map((r) => {
        const isActive = r.key === activeKey
        const roundLabel = REGION_ROUND_LABELS[r.key] ?? ''
        return (
          <Link
            key={r.key}
            to='/arcade-results/2026/$region'
            params={{ region: r.key }}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-[12px] font-semibold no-underline transition-all sm:gap-2 sm:px-3 sm:text-[13px]',
              isActive
                ? 'border-[#e74c3c]/25 bg-[#e74c3c]/[0.04] text-white/90'
                : 'border-[#1e1e1e] bg-[#111] text-white/35 hover:border-[#2a2a2a] hover:text-white/55'
            )}
          >
            <span className='font-mono text-[8px] font-extrabold tracking-[0.5px] text-[#f5a623] sm:text-[9px]'>
              {roundLabel}
            </span>
            {r.shortLabel}
          </Link>
        )
      })}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Sticky Section Nav                                                 */
/* ════════════════════════════════════════════════════════════════════ */

type NavItem = { id: string; label: string; mobileLabel: string; hasData: boolean }

function SectionNav({
  activeId,
  items,
}: {
  activeId: string
  items: NavItem[]
}) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav
      className='sticky top-0 z-50 -mx-4 mb-7 overflow-x-auto border-b border-[#1e1e1e] bg-[#0a0a0a]/85 px-4 backdrop-blur-2xl md:-mx-6 md:px-6'
      style={{ scrollbarWidth: 'none' }}
    >
      <div className='flex gap-0.5'>
        {items.map((item) => (
          <button
            key={item.id}
            type='button'
            onClick={() => scrollTo(item.id)}
            className={cn(
              '-mb-px border-b-2 px-3.5 py-2 text-[11px] font-semibold whitespace-nowrap transition-all sm:px-3.5 sm:text-[12px]',
              activeId === item.id
                ? 'border-[#e74c3c] text-white/90'
                : 'border-transparent text-white/30 hover:text-white/50'
            )}
          >
            <span className='hidden sm:inline'>{item.label}</span>
            <span className='sm:hidden'>{item.mobileLabel}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Section Head                                                       */
/* ════════════════════════════════════════════════════════════════════ */

function SectionHead({ badge, title }: { badge: string; title: string }) {
  return (
    <div className='mb-4 flex items-center gap-2.5'>
      <span className='rounded-[5px] border border-[#e74c3c]/15 bg-[#e74c3c]/[0.08] px-2 py-[3px] font-mono text-[10px] font-extrabold tracking-[1px] text-[#e74c3c]'>
        {badge}
      </span>
      <h2 className='text-[16px] font-extrabold text-white/[0.88] sm:text-[18px]'>
        {title}
      </h2>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Podium (Top 2 Qualified)                                           */
/* ════════════════════════════════════════════════════════════════════ */

function QualifiedPodium({
  rankingRows,
}: {
  rankingRows: ReturnType<typeof buildRegionFinalRanking>
}) {
  const top2 = rankingRows.filter((r) => r.rank <= 2)
  const rest = rankingRows.filter((r) => r.rank > 2)

  return (
    <section id='standings' data-section='standings' className='mb-10 scroll-mt-18'>
      <FadeIn>
        <SectionHead badge='STANDINGS' title='최종 순위' />

        {/* Top 2 podium cards */}
        {top2.length > 0 && (
          <div className='mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2'>
            {top2.map((row) => {
              const isFirst = row.rank === 1
              const groupSeed = isFirst ? 'A' : 'B'
              const record =
                typeof row.wins === 'number' && typeof row.losses === 'number'
                  ? `${row.wins}-${row.losses}`
                  : undefined
              const seedLabel = isFirst
                ? `${record ? record + ' 자동 진출' : '자동 진출'}`
                : `${record ? record + ' 선발 진출' : '선발 진출'}`

              return (
                <div
                  key={row.entryId}
                  className={cn(
                    'relative flex items-center gap-3 overflow-hidden rounded-xl border p-4 sm:gap-3.5 sm:p-5',
                    isFirst
                      ? 'border-[#ffd700]/15 bg-[linear-gradient(135deg,#111,#141210,#111)] [animation:tkc-glow-pulse_4s_ease-in-out_infinite]'
                      : 'border-[#1e1e1e] bg-[#111]'
                  )}
                >
                  {isFirst && (
                    <div className='tkc-champion-shimmer absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,transparent,#ffd700,#f5a623,#ffd700,transparent)] bg-[length:200%_100%] [animation:tkc-shimmer_4s_linear_infinite]' />
                  )}
                  {!isFirst && (
                    <div className='absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#c0c0c0] to-[#c0c0c0]/20 opacity-30' />
                  )}

                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-[10px] font-mono text-[18px] font-black',
                      isFirst
                        ? 'border border-[#ffd700]/[0.12] bg-[#ffd700]/[0.06] text-[#ffd700] [text-shadow:0_0_10px_rgba(255,215,0,0.3)]'
                        : 'border border-[#c0c0c0]/[0.1] bg-[#c0c0c0]/[0.06] text-[#c0c0c0]'
                    )}
                  >
                    {row.rank}
                  </div>

                  <div className='min-w-0 flex-1'>
                    <div className='font-mono text-[9px] font-extrabold tracking-[1px] text-[#e74c3c]'>
                      QUALIFIED
                    </div>
                    <div
                      className={cn(
                        'text-[15px] font-extrabold sm:text-[18px]',
                        isFirst
                          ? 'text-white [text-shadow:0_0_20px_rgba(255,215,0,0.1)]'
                          : 'text-white/90'
                      )}
                    >
                      {row.nickname}
                    </div>
                    <div className='mt-0.5 flex items-center gap-1.5 text-[11px] text-white/30'>
                      <span
                        className={cn(
                          'rounded-[4px] px-1.5 py-px font-mono text-[9px] font-extrabold',
                          groupSeed === 'A'
                            ? 'bg-[#e74c3c]/[0.08] text-[#e74c3c]'
                            : 'bg-[#f5a623]/[0.08] text-[#f5a623]'
                        )}
                      >
                        {groupSeed} 진출
                      </span>
                      <span>· {seedLabel}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Rest table */}
        {rest.length > 0 && (
          <div className='overflow-hidden rounded-[10px] border border-[#1e1e1e] bg-[#111]'>
            <table className='w-full border-collapse'>
              <thead>
                <tr>
                  <th className='w-11 border-b border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2 text-center font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/25'>
                    #
                  </th>
                  <th className='border-b border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2 text-left font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/25'>
                    닉네임
                  </th>
                  <th className='border-b border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2 text-left font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/25'>
                    전적
                  </th>
                  <th className='hidden border-b border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2 text-left font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/25 sm:table-cell'>
                    비고
                  </th>
                </tr>
              </thead>
              <tbody>
                {rest.map((row, i) => {
                  const record =
                    typeof row.wins === 'number' && typeof row.losses === 'number'
                      ? `${row.wins}-${row.losses}`
                      : '—'
                  return (
                    <tr key={row.entryId}>
                      <td
                        className={cn(
                          'px-3.5 py-2 text-center font-mono text-[12px] font-extrabold text-white/25',
                          i < rest.length - 1 && 'border-b border-white/[0.03]'
                        )}
                      >
                        {row.rank}
                      </td>
                      <td
                        className={cn(
                          'px-3.5 py-2 text-[13px] font-bold text-white/65',
                          i < rest.length - 1 && 'border-b border-white/[0.03]'
                        )}
                      >
                        {row.nickname}
                      </td>
                      <td
                        className={cn(
                          'px-3.5 py-2 text-[13px] text-white/50',
                          i < rest.length - 1 && 'border-b border-white/[0.03]'
                        )}
                      >
                        {record}
                      </td>
                      <td
                        className={cn(
                          'hidden px-3.5 py-2 text-[11px] text-white/25 sm:table-cell',
                          i < rest.length - 1 && 'border-b border-white/[0.03]'
                        )}
                      >
                        {row.statusLabel !== '탈락' && row.statusLabel !== '진행중'
                          ? row.statusLabel
                          : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {rankingRows.length === 0 && (
          <div className='rounded-[10px] border border-[#1e1e1e] bg-[#111] px-4 py-3.5 text-[13px] text-white/40'>
            최종 순위 데이터가 아직 입력되지 않았습니다.
          </div>
        )}
      </FadeIn>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Swiss Round Accordion                                              */
/* ════════════════════════════════════════════════════════════════════ */

function SwissRoundBlock({
  round,
  matches,
  isOpen,
  onToggle,
}: {
  round: number
  matches: ArcadeSwissMatch[]
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <button
        type='button'
        onClick={onToggle}
        className='flex w-full items-center justify-between rounded-lg border border-[#1e1e1e] bg-[#111] px-3.5 py-2.5 transition-colors hover:border-[#2a2a2a]'
      >
        <div className='flex items-center gap-2'>
          <span className='rounded bg-[#f5a623]/[0.06] px-1.5 py-0.5 font-mono text-[10px] font-extrabold tracking-[0.5px] text-[#f5a623]'>
            R{round}
          </span>
          <span className='text-[13px] font-bold text-white/70 sm:text-[14px]'>
            라운드 {round}
          </span>
        </div>
        <span className='text-[12px] text-white/20'>{isOpen ? '▾' : '▸'}</span>
      </button>

      {isOpen && (
        <div className='mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2'>
          {matches.map((match, index) => {
            const p1 = match.player1
            const p2 = match.player2
            const isP1Win = match.winnerEntryId === p1.entryId
            const isP2Win = p2 ? match.winnerEntryId === p2.entryId : false

            return (
              <div
                key={`${match.round}-${match.table ?? index}`}
                className='overflow-hidden rounded-lg border border-[#1e1e1e] bg-white/[0.015]'
              >
                <div className='flex items-center justify-between border-b border-[#1e1e1e] bg-white/[0.015] px-2.5 py-1'>
                  <span className='font-mono text-[9px] font-extrabold tracking-[0.5px] text-white/20'>
                    <span className='hidden sm:inline'>MATCH {match.table ?? index + 1}</span>
                    <span className='sm:hidden'>M{match.table ?? index + 1}</span>
                  </span>
                  {match.bye && (
                    <span className='font-mono text-[8px] font-extrabold text-white/15'>
                      BYE
                    </span>
                  )}
                </div>

                {/* Player 1 */}
                <div
                  className={cn(
                    'flex items-center gap-2 border-b border-white/[0.02] px-2.5 py-[5px] text-[12px]',
                    isP1Win && 'bg-[#e74c3c]/[0.03]'
                  )}
                >
                  <span
                    className={cn(
                      'min-w-6 font-mono text-[10px] font-extrabold',
                      isP1Win ? 'text-emerald-400' : 'text-white/20'
                    )}
                  >
                    {isP1Win ? 'W' : match.winnerEntryId ? 'L' : '—'}
                  </span>
                  <span
                    className={cn(
                      'flex-1 truncate font-semibold',
                      isP1Win ? 'text-white/90' : 'text-white/55'
                    )}
                  >
                    {p1.nickname}
                  </span>
                  {match.games.length > 0 && (
                    <span
                      className={cn(
                        'font-mono text-[11px] font-bold',
                        isP1Win ? 'text-[#f5a623]' : 'text-white/25'
                      )}
                    >
                      {formatScore(
                        match.games.reduce((sum, g) => sum + g.p1Score, 0)
                      )}
                    </span>
                  )}
                </div>

                {/* Player 2 */}
                {p2 ? (
                  <div
                    className={cn(
                      'flex items-center gap-2 px-2.5 py-[5px] text-[12px]',
                      isP2Win && 'bg-[#e74c3c]/[0.03]'
                    )}
                  >
                    <span
                      className={cn(
                        'min-w-6 font-mono text-[10px] font-extrabold',
                        isP2Win ? 'text-emerald-400' : 'text-white/20'
                      )}
                    >
                      {isP2Win ? 'W' : match.winnerEntryId ? 'L' : '—'}
                    </span>
                    <span
                      className={cn(
                        'flex-1 truncate font-semibold',
                        isP2Win ? 'text-white/90' : 'text-white/55'
                      )}
                    >
                      {p2.nickname}
                    </span>
                    {match.games.length > 0 && (
                      <span
                        className={cn(
                          'font-mono text-[11px] font-bold',
                          isP2Win ? 'text-[#f5a623]' : 'text-white/25'
                        )}
                      >
                        {formatScore(
                          match.games.reduce((sum, g) => sum + g.p2Score, 0)
                        )}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className='px-2.5 py-2 text-[11px] italic text-white/20'>
                    부전승
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Stage Card (선발전 / 시드전)                                       */
/* ════════════════════════════════════════════════════════════════════ */

function StageCard({
  badgeLabel,
  badgeVariant,
  songTitle,
  difficulty,
  rows,
  cutlineAfter,
  callout,
}: {
  badgeLabel: string
  badgeVariant: 'selection' | 'seed'
  songTitle: string
  difficulty?: string
  rows: { rank: number; nickname: string; score: number; badge?: string }[]
  cutlineAfter?: number
  callout?: React.ReactNode
}) {
  const accentColor = badgeVariant === 'selection' ? '#f5a623' : '#e74c3c'

  return (
    <div className='overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111]'>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-[#1e1e1e] bg-white/[0.015] px-4 py-3.5 sm:px-[18px]'>
        <div className='flex items-center gap-2.5'>
          <span
            className='rounded-[5px] border px-[7px] py-[3px] font-mono text-[10px] font-extrabold tracking-[0.5px]'
            style={{
              color: accentColor,
              background: `${accentColor}14`,
              borderColor: `${accentColor}1f`,
            }}
          >
            {badgeLabel}
          </span>
          <span className='text-[13px] font-bold text-white/80 sm:text-[14px]'>
            {songTitle}
          </span>
        </div>
        {difficulty && (
          <span className='font-mono text-[11px] text-white/30'>
            {difficulty}
          </span>
        )}
      </div>

      {/* Table */}
      <table className='w-full border-collapse'>
        <thead>
          <tr>
            <th className='w-11 px-3.5 py-2 text-center font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/20 sm:border-b sm:border-[#1e1e1e]'>
              #
            </th>
            <th className='px-3.5 py-2 text-left font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/20 sm:border-b sm:border-[#1e1e1e]'>
              닉네임
            </th>
            <th className='px-3.5 py-2 text-left font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/20 sm:border-b sm:border-[#1e1e1e]'>
              점수
            </th>
            <th className='hidden px-3.5 py-2 text-left font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/20 sm:table-cell sm:border-b sm:border-[#1e1e1e]'>
              {badgeVariant === 'seed' ? '시드' : '판정'}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isPass = cutlineAfter != null ? row.rank <= cutlineAfter : true
            const showCutBefore =
              cutlineAfter != null && i > 0 && rows[i - 1].rank <= cutlineAfter && row.rank > cutlineAfter

            return (
              <tr key={row.rank}>
                {showCutBefore ? null : null}
                <td
                  className={cn(
                    'px-3.5 py-2 text-center font-mono text-[12px] font-extrabold',
                    isPass ? 'text-emerald-400' : 'text-white/15',
                    i < rows.length - 1 && 'border-b border-white/[0.03]',
                    showCutBefore &&
                      `border-t-2`
                  )}
                  style={
                    showCutBefore
                      ? {
                          borderTopColor: accentColor,
                          borderTopWidth: '2px',
                          borderTopStyle: 'solid',
                        }
                      : undefined
                  }
                >
                  {row.rank}
                </td>
                <td
                  className={cn(
                    'px-3.5 py-2 text-[13px] font-bold',
                    isPass ? 'text-white/80' : 'text-white/35',
                    i < rows.length - 1 && 'border-b border-white/[0.03]'
                  )}
                  style={
                    showCutBefore
                      ? {
                          borderTopColor: accentColor,
                          borderTopWidth: '2px',
                          borderTopStyle: 'solid',
                        }
                      : undefined
                  }
                >
                  {row.nickname}
                </td>
                <td
                  className={cn(
                    'px-3.5 py-2 font-mono text-[12px] font-bold',
                    isPass ? 'text-white/60' : 'text-white/20',
                    i < rows.length - 1 && 'border-b border-white/[0.03]'
                  )}
                  style={
                    showCutBefore
                      ? {
                          borderTopColor: accentColor,
                          borderTopWidth: '2px',
                          borderTopStyle: 'solid',
                        }
                      : undefined
                  }
                >
                  {formatScore(row.score)}
                </td>
                <td
                  className={cn(
                    'hidden px-3.5 py-2 sm:table-cell',
                    i < rows.length - 1 && 'border-b border-white/[0.03]'
                  )}
                  style={
                    showCutBefore
                      ? {
                          borderTopColor: accentColor,
                          borderTopWidth: '2px',
                          borderTopStyle: 'solid',
                        }
                      : undefined
                  }
                >
                  {row.badge && (
                    <span className='rounded-[4px] bg-emerald-400/[0.06] px-1.5 py-[2px] font-mono text-[9px] font-extrabold tracking-[0.5px] text-emerald-400'>
                      {row.badge}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Callout */}
      {callout && (
        <div
          className='mx-4 mb-4 mt-3 flex flex-wrap items-center gap-2 rounded-lg border px-3.5 py-3 text-[13px] font-semibold text-white/70 sm:mx-4'
          style={{
            background: `${accentColor}0a`,
            borderColor: `${accentColor}1a`,
          }}
        >
          {callout}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Online Qualifier Table                                             */
/* ════════════════════════════════════════════════════════════════════ */

function OnlineQualifierSection({
  region,
}: {
  region: ArcadeRegionArchive
}) {
  const sorted = useMemo(
    () => [...region.onlineRows].sort((a, b) => a.rank - b.rank),
    [region.onlineRows]
  )
  const advanced = sorted.filter((r) => r.advanced)
  const remaining = sorted.filter((r) => !r.advanced)
  const showCutline = advanced.length > 0 && remaining.length > 0

  if (sorted.length === 0) {
    return (
      <div className='rounded-[10px] border border-[#1e1e1e] bg-[#111] px-4 py-3.5 text-[13px] text-white/40'>
        온라인 예선 결과가 아직 입력되지 않았습니다.
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111]'>
      <div className='overflow-x-auto'>
        <table className='w-full border-collapse'>
          <thead>
            <tr>
              <th className='w-11 border-b border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2.5 text-center font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/25'>
                #
              </th>
              <th className='border-b border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2.5 text-left font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/25'>
                닉네임
              </th>
              <th className='hidden border-b border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2.5 text-left font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/25 sm:table-cell'>
                곡 1
              </th>
              <th className='hidden border-b border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2.5 text-left font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/25 sm:table-cell'>
                곡 2
              </th>
              <th className='border-b border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2.5 text-left font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/25'>
                합계
              </th>
            </tr>
          </thead>
          <tbody>
            {advanced.map((row, i) => (
              <tr key={row.entryId} className='bg-emerald-500/[0.02]'>
                <td
                  className={cn(
                    'px-3.5 py-[9px] text-center font-mono text-[12px] font-extrabold text-[#e74c3c]',
                    i < advanced.length - 1 && 'border-b border-white/[0.03]'
                  )}
                >
                  {row.rank}
                </td>
                <td
                  className={cn(
                    'px-3.5 py-[9px] text-[13px] font-bold text-white/80',
                    i < advanced.length - 1 && 'border-b border-white/[0.03]'
                  )}
                >
                  {row.nickname}
                </td>
                <td
                  className={cn(
                    'hidden px-3.5 py-[9px] font-mono text-[12px] font-bold text-white/50 sm:table-cell',
                    i < advanced.length - 1 && 'border-b border-white/[0.03]'
                  )}
                >
                  {formatScore(row.score1)}
                </td>
                <td
                  className={cn(
                    'hidden px-3.5 py-[9px] font-mono text-[12px] font-bold text-white/50 sm:table-cell',
                    i < advanced.length - 1 && 'border-b border-white/[0.03]'
                  )}
                >
                  {formatScore(row.score2)}
                </td>
                <td
                  className={cn(
                    'px-3.5 py-[9px] font-mono text-[12px] font-bold text-white/70',
                    i < advanced.length - 1 && 'border-b border-white/[0.03]'
                  )}
                >
                  <strong>{formatScore(row.total)}</strong>
                </td>
              </tr>
            ))}

            {showCutline && (
              <tr>
                <td colSpan={5} className='h-0.5 p-0'>
                  <div className='h-full bg-gradient-to-r from-transparent via-[#e74c3c] to-transparent' />
                </td>
              </tr>
            )}

            {remaining.map((row, i) => (
              <tr key={row.entryId}>
                <td
                  className={cn(
                    'px-3.5 py-[9px] text-center font-mono text-[12px] font-extrabold text-white/15',
                    i < remaining.length - 1 && 'border-b border-white/[0.03]'
                  )}
                >
                  {row.rank}
                </td>
                <td
                  className={cn(
                    'px-3.5 py-[9px] text-[13px] font-bold text-white/25',
                    i < remaining.length - 1 && 'border-b border-white/[0.03]'
                  )}
                >
                  {row.nickname}
                </td>
                <td
                  className={cn(
                    'hidden px-3.5 py-[9px] font-mono text-[12px] font-bold text-white/20 sm:table-cell',
                    i < remaining.length - 1 && 'border-b border-white/[0.03]'
                  )}
                >
                  {formatScore(row.score1)}
                </td>
                <td
                  className={cn(
                    'hidden px-3.5 py-[9px] font-mono text-[12px] font-bold text-white/20 sm:table-cell',
                    i < remaining.length - 1 && 'border-b border-white/[0.03]'
                  )}
                >
                  {formatScore(row.score2)}
                </td>
                <td
                  className={cn(
                    'px-3.5 py-[9px] font-mono text-[12px] font-bold text-white/20',
                    i < remaining.length - 1 && 'border-b border-white/[0.03]'
                  )}
                >
                  {formatScore(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  const [activeSection, setActiveSection] = useState('standings')
  const [openRounds, setOpenRounds] = useState<Set<number>>(new Set())

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

  const participantCount = useMemo(() => {
    if (!regionData) return 0
    const seen = new Set<string>()
    for (const row of regionData.swissStandings) seen.add(row.entryId)
    for (const row of regionData.onlineRows) seen.add(row.entryId)
    return seen.size
  }, [regionData])

  const navItems: NavItem[] = useMemo(
    () => [
      { id: 'standings', label: '최종 순위', mobileLabel: '순위', hasData: finalRankingRows.length > 0 },
      { id: 'swiss', label: '스위스', mobileLabel: '스위스', hasData: swissByRound.length > 0 },
      { id: 'selection', label: '선발전', mobileLabel: '선발전', hasData: sortedDeciderRows.length > 0 },
      { id: 'seed', label: '시드전', mobileLabel: '시드전', hasData: sortedSeedingRows.length > 0 },
      { id: 'online', label: '온라인 예선', mobileLabel: '온라인', hasData: regionData ? regionData.onlineRows.length > 0 : false },
    ],
    [finalRankingRows, swissByRound, sortedDeciderRows, sortedSeedingRows, regionData]
  )

  // IntersectionObserver for sticky nav
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
      ? `${regionData.label} 아카이브`
      : '지역 아카이브'
    document.title = `${t('meta.siteName')} | ${title}`
  }, [regionData])

  const toggleRound = (round: number) => {
    setOpenRounds((prev) => {
      const next = new Set(prev)
      if (next.has(round)) next.delete(round)
      else next.add(round)
      return next
    })
  }

  // Not found
  if (!regionData) {
    return (
      <TkcSection className='space-y-6'>
        <Breadcrumb regionLabel='—' />
        <div>
          <div className='mb-3 font-mono text-[12px] font-bold tracking-[1.5px] text-[#e74c3c]'>
            NOT FOUND
          </div>
          <h1 className='text-[28px] font-black tracking-[-0.5px] text-white/[0.92]'>
            지역을 찾을 수 없습니다
          </h1>
          <p className='mt-2 text-[13px] break-keep text-white/50'>
            유효한 지역: seoul, daejeon, gwangju, busan
          </p>
        </div>
      </TkcSection>
    )
  }

  const roundLabel = REGION_ROUND_LABELS[regionData.key] ?? ''

  return (
    <TkcSection className='space-y-0'>
      {/* ── Breadcrumb ── */}
      <Breadcrumb regionLabel={regionData.shortLabel} />

      {/* ── Hero ── */}
      <FadeIn>
        <div className='mb-1'>
          <div className='mb-3 inline-flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-[1.5px] text-[#e74c3c]'>
            <span className='tkc-motion-dot size-1.5 rounded-full bg-[#e74c3c] shadow-[0_0_8px_#e74c3c]' />
            {REGION_HERO_LABELS[regionData.key] ?? 'ARCADE'}
          </div>
          <h1 className='bg-gradient-to-r from-[#e74c3c] to-[#f5a623] bg-clip-text text-[26px] leading-[1.2] font-black tracking-[-0.5px] text-transparent sm:text-[32px]'>
            {regionData.shortLabel} 아카이브
          </h1>
          <p className='mt-2.5 text-[13px] leading-[1.7] break-keep text-white/50 sm:text-[14px]'>
            <span className='hidden sm:inline'>
              {regionData.arcade}에서 진행된 아케이드 {roundLabel} 지역 예선 전체
              기록
            </span>
            <span className='sm:hidden'>
              {roundLabel} 지역 예선 · {regionData.arcade}
            </span>
          </p>

          {/* Meta chips */}
          <div className='mt-2 flex flex-wrap gap-1.5'>
            <span className='hidden rounded-md border border-[#1e1e1e] bg-white/[0.025] px-2.5 py-1 text-[11px] text-white/40 sm:inline-flex'>
              📍 <strong className='ml-1 font-bold text-white/70'>{regionData.arcade}</strong>
            </span>
            {regionData.updatedAt && (
              <span className='inline-flex rounded-md border border-[#1e1e1e] bg-white/[0.025] px-2.5 py-1 text-[11px] text-white/40'>
                📅 <strong className='ml-1 font-bold text-white/70'>{regionData.updatedAt}</strong>
              </span>
            )}
            {participantCount > 0 && (
              <span className='inline-flex rounded-md border border-[#1e1e1e] bg-white/[0.025] px-2.5 py-1 text-[11px] text-white/40'>
                👤 <span className='hidden sm:inline'>참가자</span> <strong className='ml-1 font-bold text-white/70'>{participantCount}명</strong>
              </span>
            )}
          </div>
        </div>
      </FadeIn>

      {/* ── Region Stepper ── */}
      <RegionStepper activeKey={regionData.key} />

      {/* ── Sticky Nav ── */}
      <SectionNav activeId={activeSection} items={navItems} />

      {/* ═══ 1. 최종 순위 ═══ */}
      <QualifiedPodium rankingRows={finalRankingRows} />

      {/* ═══ 2. 스위스 ═══ */}
      <section id='swiss' data-section='swiss' className='mb-10 scroll-mt-18'>
        <FadeIn>
          <SectionHead badge='SWISS' title='스위스 라운드' />
          {swissByRound.length === 0 ? (
            <div className='rounded-[10px] border border-[#1e1e1e] bg-[#111] px-4 py-3.5 text-[13px] text-white/40'>
              스위스 매치 데이터가 아직 입력되지 않았습니다.
            </div>
          ) : (
            <div className='space-y-3'>
              {swissByRound.map((block) => (
                <SwissRoundBlock
                  key={block.round}
                  round={block.round}
                  matches={block.matches}
                  isOpen={openRounds.has(block.round)}
                  onToggle={() => toggleRound(block.round)}
                />
              ))}
            </div>
          )}
        </FadeIn>
      </section>

      {/* ═══ 3. 선발전 ═══ */}
      <section id='selection' data-section='selection' className='mb-10 scroll-mt-18'>
        <FadeIn>
          <SectionHead badge='SELECTION' title='선발전' />
          {sortedDeciderRows.length === 0 ? (
            <div className='rounded-[10px] border border-[#1e1e1e] bg-[#111] px-4 py-3.5 text-[13px] text-white/40'>
              선발전 결과가 아직 입력되지 않았습니다.
            </div>
          ) : (
            <StageCard
              badgeLabel='과제곡'
              badgeVariant='selection'
              songTitle={ARCADE_SONGS.decider31.title}
              difficulty={`おに ★${ARCADE_SONGS.decider31.level}`}
              rows={sortedDeciderRows.map((row) => ({
                rank: row.rank,
                nickname: row.nickname,
                score: row.score,
                badge:
                  regionData.deciderWinnerEntryId === row.entryId ||
                  row.rank <= (sortedDeciderRows.length > 3 ? 3 : 1)
                    ? '통과'
                    : undefined,
              }))}
              cutlineAfter={
                sortedDeciderRows.length > 3
                  ? 3
                  : sortedDeciderRows.length > 1
                    ? 1
                    : undefined
              }
              callout={
                <span className='break-keep'>
                  3-1 중 상위 {sortedDeciderRows.length > 3 ? 3 : 1}명이 선발전
                  통과 → 시드전 진출
                </span>
              }
            />
          )}
        </FadeIn>
      </section>

      {/* ═══ 4. 시드전 ═══ */}
      <section id='seed' data-section='seed' className='mb-10 scroll-mt-18'>
        <FadeIn>
          <SectionHead badge='SEED' title='시드전' />
          {sortedSeedingRows.length === 0 ? (
            <div className='rounded-[10px] border border-[#1e1e1e] bg-[#111] px-4 py-3.5 text-[13px] text-white/40'>
              시드전 결과가 아직 입력되지 않았습니다.
            </div>
          ) : (
            <StageCard
              badgeLabel='시드 과제곡'
              badgeVariant='seed'
              songTitle={ARCADE_SONGS.seeding.title}
              difficulty={`おに ★${ARCADE_SONGS.seeding.level}`}
              rows={sortedSeedingRows.map((row) => ({
                rank: row.rank,
                nickname: row.nickname,
                score: row.score,
                badge:
                  regionData.qualifiers.groupB?.entryId === row.entryId
                    ? 'B 진출'
                    : undefined,
              }))}
              callout={
                <>
                  <span className='rounded-[4px] bg-[#e74c3c]/[0.1] px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-[#e74c3c]'>
                    A
                  </span>
                  <span>
                    {regionData.qualifiers.groupA?.nickname ?? '—'}
                    {regionData.qualifiers.groupA ? ' (4-0 자동)' : ''}
                  </span>
                  <span className='text-white/20'>·</span>
                  <span className='rounded-[4px] bg-[#f5a623]/[0.1] px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-[#f5a623]'>
                    B
                  </span>
                  <span>
                    {regionData.qualifiers.groupB?.nickname ?? '—'}
                    {regionData.qualifiers.groupB ? ' (시드전 1위)' : ''}
                  </span>
                  <span className='text-white/20'>→ 결선 진출 확정</span>
                </>
              }
            />
          )}
        </FadeIn>
      </section>

      {/* ═══ 5. 온라인 예선 ═══ */}
      <section id='online' data-section='online' className='mb-10 scroll-mt-18'>
        <FadeIn>
          <SectionHead badge='ONLINE' title='온라인 예선' />
          <OnlineQualifierSection region={regionData} />
        </FadeIn>
      </section>
    </TkcSection>
  )
}
