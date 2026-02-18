import { useEffect, useMemo, useState } from 'react'
import { t } from '@/text'
import { useResults } from '@/lib/api'
import {
  resolveArcadeSeasonArchive,
  type ArcadeFinalCrossMatch,
  type ArcadeFinalSeedRow,
  type ArcadeRegionArchive,
} from '@/lib/arcade-results-archive'
import {
  resolveConsoleSeasonArchive,
  buildStandings as buildConsoleStandings,
  buildQualifierRows as buildConsoleQualifierRows,
  getSF1 as getConsoleSF1,
  getSF2 as getConsoleSF2,
  getFinal as getConsoleFinal,
  type ConsoleQualifierRow,
  type ConsoleStage,
} from '@/lib/console-results-archive'
import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/tkc/guide-shared'
import { TkcSection } from '@/components/tkc/layout'

type Division = 'arcade' | 'console'

const ROUND_LABELS: Record<string, string> = {
  seoul: '1차',
  daejeon: '2차',
  gwangju: '3차',
  busan: '4차',
}

const PODIUM_CONFIG = [
  {
    rank: 1,
    label: 'CHAMPION',
    rankCn:
      'text-[14px] size-[34px] text-[#ffd700] bg-[#ffd700]/[0.06] border border-[#ffd700]/[0.12] [text-shadow:0_0_10px_rgba(255,215,0,0.3)]',
    labelCn:
      'bg-gradient-to-r from-[#ffd700] to-[#f5a623] bg-clip-text text-transparent',
    cardCn:
      'border-[#ffd700]/15 bg-[linear-gradient(135deg,#111,#141210,#111)] tkc-champion-card',
    nameCn: 'text-[17px] text-white [text-shadow:0_0_20px_rgba(255,215,0,0.1)]',
    mobileNameCn:
      'text-[16px] text-white [text-shadow:0_0_20px_rgba(255,215,0,0.1)]',
    showCrown: true,
    showShimmer: true,
  },
  {
    rank: 2,
    label: 'RUNNER-UP',
    rankCn:
      'text-[#c0c0c0] bg-[#c0c0c0]/[0.06] border border-[#c0c0c0]/[0.1]',
    labelCn: 'text-[#c0c0c0]',
    cardCn: 'border-[#1e1e1e] bg-[#111]',
    nameCn: 'text-[15px] text-white/85',
    mobileNameCn: 'text-[15px] text-white/85',
    showCrown: false,
    showShimmer: false,
  },
  {
    rank: 3,
    label: '3RD',
    rankCn:
      'text-[#cd7f32] bg-[#cd7f32]/[0.06] border border-[#cd7f32]/[0.1]',
    labelCn: 'text-[#cd7f32]',
    cardCn: 'border-[#1e1e1e] bg-[#111]',
    nameCn: 'text-[15px] text-white/85',
    mobileNameCn: 'text-[15px] text-white/85',
    showCrown: false,
    showShimmer: false,
  },
  {
    rank: 4,
    label: '4TH',
    rankCn: 'text-white/25 bg-white/[0.02] border border-[#1e1e1e]',
    labelCn: 'text-white/20',
    cardCn: 'border-[#1e1e1e] bg-[#111]',
    nameCn: 'text-[15px] text-white/85',
    mobileNameCn: 'text-[15px] text-white/85',
    showCrown: false,
    showShimmer: false,
  },
] as const

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

function regionHasData(region: ArcadeRegionArchive) {
  return (
    region.onlineRows.length > 0 ||
    region.swissMatches.length > 0 ||
    region.deciderRows.length > 0 ||
    region.seedingRows.length > 0
  )
}

function SectionHead({
  badge,
  badgeVariant,
  title,
  linkLabel,
  linkHref,
}: {
  badge: string
  badgeVariant: 'arcade' | 'console'
  title: string
  linkLabel?: string
  linkHref?: string
}) {
  return (
    <div className='mb-3.5 flex items-center justify-between'>
      <h3 className='flex items-center gap-2 text-[15px] font-extrabold text-white/85 sm:text-[17px]'>
        <span
          className={cn(
            'rounded-[5px] border px-[7px] py-[3px] font-mono text-[10px] font-extrabold tracking-[1px]',
            badgeVariant === 'arcade' &&
              'border-[#e74c3c]/[0.12] bg-[#e74c3c]/[0.08] text-[#e74c3c]',
            badgeVariant === 'console' &&
              'border-[#4a9eff]/[0.12] bg-[#4a9eff]/[0.08] text-[#4a9eff]'
          )}
        >
          {badge}
        </span>
        {title}
      </h3>
      {linkLabel && linkHref && (
        <a
          href={linkHref}
          className='text-[12px] text-white/30 transition-colors hover:text-[#f5a623]'
        >
          {linkLabel}
        </a>
      )}
    </div>
  )
}

function ArchiveDescriptionCard({
  division,
  season,
  isLoading,
  finalizedRegionCount,
  finalsMatchCount,
}: {
  division: Division
  season: string
  isLoading: boolean
  finalizedRegionCount: number
  finalsMatchCount: number
}) {
  if (division === 'arcade') {
    return (
      <div className='relative overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] p-5 sm:p-6'>
        <div className='pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-[#f5a623]/[0.04]' />
        <div className='pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#e74c3c] via-[#f5a623] to-transparent opacity-60' />
        <div className='relative'>
          <div className='font-mono text-[11px] font-extrabold tracking-[1.2px] text-[#f5a623] sm:text-[12px]'>
            ARCADE ARCHIVE
          </div>
          <h2 className='mt-2 text-[20px] font-extrabold tracking-tight text-white sm:text-[24px]'>
            {season} 시즌 아케이드 결과
          </h2>
          <p className='mt-2.5 max-w-[760px] text-[13px] leading-relaxed break-keep text-white/55 sm:text-[14px]'>
            온라인 예선, 스위스 스테이지, 결선 진출자 선발전, 시드전, Top 8
            결선을 단계별로 조회할 수 있습니다.
          </p>
          <div className='mt-5 flex flex-wrap gap-1.5'>
            <span className='rounded-md border border-[#1e1e1e] bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] font-bold text-white/55 sm:text-[12px]'>
              지역 확정{' '}
              <strong className='text-white/85'>{finalizedRegionCount}/4</strong>
            </span>
            <span className='rounded-md border border-[#1e1e1e] bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] font-bold text-white/55 sm:text-[12px]'>
              결선 매치{' '}
              <strong className='text-white/85'>
                {finalsMatchCount > 0 ? `${finalsMatchCount}경기` : '대기'}
              </strong>
            </span>
            <span className='rounded-md border border-emerald-400/15 bg-emerald-500/[0.08] px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-400 sm:text-[12px]'>
              {isLoading ? '동기화 중' : '아카이브 진행 중'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='relative overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] p-5 sm:p-6'>
      <div className='pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-[#4a9eff]/[0.05]' />
      <div className='pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#4a9eff] via-[#22d3ee] to-transparent opacity-55' />
      <div className='relative'>
        <div className='font-mono text-[11px] font-extrabold tracking-[1.2px] text-[#4a9eff] sm:text-[12px]'>
          CONSOLE ARCHIVE
        </div>
        <h2 className='mt-2 text-[20px] font-extrabold tracking-tight text-white sm:text-[24px]'>
          {season} 시즌 콘솔 결과
        </h2>
        <p className='mt-2.5 max-w-[760px] text-[13px] leading-relaxed break-keep text-white/55 sm:text-[14px]'>
          온라인 예선을 거쳐 선발된 Top 4의 결선 토너먼트 결과를 조회할 수
          있습니다.
        </p>
        <div className='mt-5 flex flex-wrap gap-1.5'>
          <span className='rounded-md border border-[#1e1e1e] bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] font-bold text-white/55 sm:text-[12px]'>
            온라인 예선 <strong className='text-white/85'>Top 4</strong>
          </span>
          <span className='rounded-md border border-[#1e1e1e] bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] font-bold text-white/55 sm:text-[12px]'>
            결선 스테이지{' '}
            <strong className='text-white/85'>
              {finalsMatchCount > 0 ? `${finalsMatchCount}개` : 'SF / 3RD / FINAL'}
            </strong>
          </span>
          <span className={cn(
            'rounded-md px-2.5 py-1 font-mono text-[11px] font-bold sm:text-[12px]',
            finalsMatchCount > 0
              ? 'border border-emerald-400/15 bg-emerald-500/[0.08] text-emerald-400'
              : 'border border-[#4a9eff]/15 bg-[#4a9eff]/[0.08] text-[#4a9eff]'
          )}>
            {isLoading ? '동기화 중' : finalsMatchCount > 0 ? '데이터 연동 완료' : '데이터 대기'}
          </span>
        </div>
      </div>
    </div>
  )
}

function PodiumPreview({
  badgeVariant,
  linkHref,
  subLabel,
  names,
}: {
  badgeVariant: 'arcade' | 'console'
  linkHref?: string
  subLabel: string
  names?: Record<number, string>
}) {
  return (
    <div>
      <SectionHead
        badge='FINALS'
        badgeVariant={badgeVariant}
        title='최종 순위'
        linkLabel={linkHref ? '결선 상세 →' : undefined}
        linkHref={linkHref}
      />

      <div className='hidden grid-cols-4 gap-2 sm:grid'>
        {PODIUM_CONFIG.map((pod) => (
          <div
            key={pod.rank}
            className={cn(
              'relative flex flex-col items-center gap-1.5 overflow-hidden rounded-[10px] border p-4 text-center',
              pod.cardCn,
              pod.rank === 1 &&
                'p-5 [animation:tkc-glow-pulse_4s_ease-in-out_infinite]'
            )}
          >
            {pod.showShimmer && (
              <div className='tkc-champion-shimmer absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,transparent,#ffd700,#f5a623,#ffd700,transparent)] bg-[length:200%_100%] [animation:tkc-shimmer_4s_linear_infinite]' />
            )}
            {pod.showCrown && <span className='text-[20px]'>👑</span>}
            <span
              className={cn(
                'flex size-7 items-center justify-center rounded-[7px] font-mono text-[11px] font-black',
                pod.rankCn
              )}
            >
              {pod.rank}
            </span>
            <span className={cn('font-mono text-[9px] font-extrabold tracking-[1px]', pod.labelCn)}>
              {pod.label}
            </span>
            <span className={cn('font-extrabold', pod.nameCn)}>
              {names?.[pod.rank] ?? '—'}
            </span>
            <span className='text-[11px] text-white/30'>{subLabel}</span>
          </div>
        ))}
      </div>

      <div className='flex flex-col gap-1.5 sm:hidden'>
        {PODIUM_CONFIG.map((pod) => (
          <div
            key={pod.rank}
            className={cn(
              'relative flex items-center gap-3 overflow-hidden rounded-[10px] border px-3.5 py-3',
              pod.cardCn,
              pod.rank === 1 &&
                'px-4 py-3.5 [animation:tkc-glow-pulse_4s_ease-in-out_infinite]'
            )}
          >
            {pod.showShimmer && (
              <div className='tkc-champion-shimmer absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,transparent,#ffd700,#f5a623,#ffd700,transparent)] bg-[length:200%_100%] [animation:tkc-shimmer_4s_linear_infinite]' />
            )}
            {pod.showCrown && <span className='text-[16px]'>👑</span>}
            <div className='flex-1'>
              <div className={cn('font-mono text-[9px] font-extrabold tracking-[1px]', pod.labelCn)}>
                {pod.label}
              </div>
              <div className={cn('font-extrabold', pod.mobileNameCn)}>
                {names?.[pod.rank] ?? '—'}
              </div>
            </div>
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-[7px] font-mono text-[11px] font-black',
                pod.rankCn
              )}
            >
              {pod.rank}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RegionCards({ regions }: { regions: ArcadeRegionArchive[] }) {
  return (
    <div>
      <SectionHead badge='ARCADE' badgeVariant='arcade' title='지역 예선' />

      <div className='grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2'>
        {regions.map((region) => {
          const isDone = regionHasData(region)
          const qualA = region.qualifiers.groupA
          const qualB = region.qualifiers.groupB

          return (
            <a
              key={region.key}
              href={`/arcade-results/2026/${region.key}`}
              className='group relative flex flex-col items-center gap-2 overflow-hidden rounded-[10px] border border-[#1e1e1e] bg-[#111] p-4 text-inherit no-underline transition-all hover:border-[#2a2a2a] hover:-translate-y-0.5'
            >
              <span className='rounded bg-[#f5a623]/[0.06] px-1.5 py-0.5 font-mono text-[10px] font-extrabold tracking-[0.5px] text-[#f5a623]'>
                {ROUND_LABELS[region.key] ?? ''}
              </span>
              <span className='text-[14px] font-extrabold text-white/85 sm:text-[16px]'>
                {region.shortLabel}
              </span>
              <span className={cn('text-[11px] font-semibold', isDone ? 'text-emerald-400' : 'text-white/20')}>
                {isDone ? '완료' : '예정'}
              </span>
              <div className={cn('mt-1 flex w-full flex-col gap-1 border-t border-white/[0.04] pt-2', !isDone && 'opacity-25')}>
                {isDone ? (
                  <>
                    {qualA && (
                      <div className='flex items-center justify-center gap-[5px] text-[11px] sm:text-[12px]'>
                        <span className='rounded-[3px] bg-[#e74c3c]/[0.08] px-1 py-px font-mono text-[9px] font-extrabold text-[#e74c3c]'>
                          A
                        </span>
                        <span className='truncate font-bold text-white/70'>{qualA.nickname}</span>
                      </div>
                    )}
                    {qualB && (
                      <div className='flex items-center justify-center gap-[5px] text-[11px] sm:text-[12px]'>
                        <span className='rounded-[3px] bg-[#f5a623]/[0.08] px-1 py-px font-mono text-[9px] font-extrabold text-[#f5a623]'>
                          B
                        </span>
                        <span className='truncate font-bold text-white/70'>{qualB.nickname}</span>
                      </div>
                    )}
                    {!qualA && !qualB && <div className='text-center text-[11px] text-white/15'>—</div>}
                  </>
                ) : (
                  <div className='text-center text-[11px] text-white/70'>—</div>
                )}
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

function ArcadeFinalsPreview({ matches }: { matches: ArcadeFinalCrossMatch[] }) {
  const displayMatches =
    matches.length >= 4
      ? matches.slice(0, 4)
      : [
          { matchNo: 1, seedL: 'A1', seedR: 'B4', nameL: 'TBD', nameR: 'TBD' },
          { matchNo: 2, seedL: 'A2', seedR: 'B3', nameL: 'TBD', nameR: 'TBD' },
          { matchNo: 3, seedL: 'A3', seedR: 'B2', nameL: 'TBD', nameR: 'TBD' },
          { matchNo: 4, seedL: 'A4', seedR: 'B1', nameL: 'TBD', nameR: 'TBD' },
        ]

  return (
    <a
      href='/arcade-results/2026/finals'
      className='group relative block overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] p-5 no-underline transition-colors hover:border-[#2a2a2a]'
    >
      <div className='mb-3.5 flex items-center justify-between'>
        <span className='text-[14px] font-extrabold text-white/[0.88] sm:text-[16px]'>
          <span className='hidden sm:inline'>🏆 Top 8 결선 · 크로스 대진</span>
          <span className='sm:hidden'>🏆 Top 8 결선</span>
        </span>
        <span className='text-[12px] text-white/30 transition-colors group-hover:text-[#f5a623]'>
          <span className='hidden sm:inline'>결선 상세 →</span>
          <span className='sm:hidden'>상세 →</span>
        </span>
      </div>

      <div className='grid grid-cols-2 gap-1 sm:grid-cols-4 sm:gap-1.5'>
        {displayMatches.map((m) => {
          const hasData = 'left' in m
          const seedL = hasData ? `A${(m as ArcadeFinalCrossMatch).left.seed}` : (m as { seedL: string }).seedL
          const seedR = hasData ? `B${(m as ArcadeFinalCrossMatch).right.seed}` : (m as { seedR: string }).seedR
          const nameL = hasData ? (m as ArcadeFinalCrossMatch).left.nickname : (m as { nameL: string }).nameL
          const nameR = hasData ? (m as ArcadeFinalCrossMatch).right.nickname : (m as { nameR: string }).nameR

          return (
            <div key={m.matchNo} className='overflow-hidden rounded-lg border border-[#1e1e1e] bg-white/[0.015]'>
              <div className='border-b border-[#1e1e1e] bg-white/[0.015] px-2 py-1 font-mono text-[9px] font-extrabold tracking-[0.5px] text-white/20'>
                QF-{m.matchNo}
              </div>
              <div className='flex items-center gap-1.5 border-b border-white/[0.02] px-2 py-[5px] text-[11px]'>
                <span className='min-w-4 font-mono text-[9px] font-extrabold text-white/20'>{seedL}</span>
                <span className={cn('truncate font-semibold', nameL === 'TBD' ? 'text-white/15 italic' : 'text-white/50')}>
                  {nameL}
                </span>
              </div>
              <div className='flex items-center gap-1.5 px-2 py-[5px] text-[11px]'>
                <span className='min-w-4 font-mono text-[9px] font-extrabold text-white/20'>{seedR}</span>
                <span className={cn('truncate font-semibold', nameR === 'TBD' ? 'text-white/15 italic' : 'text-white/50')}>
                  {nameR}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </a>
  )
}

function ConsoleQualifierTable({
  qualifierRows,
}: {
  qualifierRows: ConsoleQualifierRow[]
}) {
  const rows =
    qualifierRows.length > 0
      ? qualifierRows.filter((r) => r.passed).slice(0, 4)
      : [1, 2, 3, 4].map((rank) => ({
          rank,
          nickname: '—',
          score: null as number | null,
          detail: '',
          passed: true,
          seed: `#${rank}`,
        }))

  return (
    <div>
      <SectionHead badge='QUALIFIER' badgeVariant='console' title='온라인 예선' />
      <div className='overflow-hidden rounded-[10px] border border-[#1e1e1e] bg-[#111]'>
        <table className='w-full border-collapse'>
          <thead>
            <tr>
              <th className='w-[44px] border-b border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2 text-center font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/25 sm:w-11'>
                #
              </th>
              <th className='border-b border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2 text-left font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/25'>
                닉네임
              </th>
              <th className='border-b border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2 text-left font-mono text-[10px] font-extrabold tracking-[0.5px] text-white/25'>
                시드
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.rank}>
                <td className={cn('px-3.5 py-[7px] text-center font-mono text-[11px] font-extrabold text-[#4a9eff] sm:text-[12px]', i < rows.length - 1 && 'border-b border-white/[0.03]')}>
                  {row.rank}
                </td>
                <td className={cn('px-3.5 py-[7px] text-[12px] font-bold text-white/75 sm:text-[13px]', i < rows.length - 1 && 'border-b border-white/[0.03]')}>
                  {row.nickname}
                </td>
                <td className={cn('px-3.5 py-[7px]', i < rows.length - 1 && 'border-b border-white/[0.03]')}>
                  {row.seed && (
                    <span className='rounded-[3px] bg-[#4a9eff]/[0.08] px-[5px] py-[2px] font-mono text-[8px] font-extrabold text-[#4a9eff] sm:text-[9px]'>
                      {row.seed}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function consoleStagePreviewRows(
  stage: ConsoleStage | undefined,
  seed1: string,
  seed2: string,
  tbd1: string,
  tbd2: string
): { seed?: string; name: string; hasData: boolean }[] {
  if (stage && stage.rows.length >= 2) {
    const sorted = [...stage.rows].sort((a, b) => a.rank - b.rank)
    return [
      { seed: seed1, name: sorted[0].nickname, hasData: true },
      { seed: seed2, name: sorted[1].nickname, hasData: true },
    ]
  }
  return [
    { seed: seed1, name: tbd1, hasData: false },
    { seed: seed2, name: tbd2, hasData: false },
  ]
}

function ConsoleFinalsPreview({
  sf1,
  sf2,
  final,
}: {
  sf1?: ConsoleStage
  sf2?: ConsoleStage
  final?: ConsoleStage
}) {
  const matches = [
    { label: 'SF-1', rows: consoleStagePreviewRows(sf1, '#1', '#4', 'TBD', 'TBD') },
    { label: 'SF-2', rows: consoleStagePreviewRows(sf2, '#2', '#3', 'TBD', 'TBD') },
    { label: 'FINAL', rows: consoleStagePreviewRows(final, undefined as unknown as string, undefined as unknown as string, 'SF-1 승자', 'SF-2 승자') },
  ]

  return (
    <a
      href='/console-results/2026'
      className='group relative block overflow-hidden rounded-xl border border-[#4a9eff]/[0.08] bg-[#111] p-5 no-underline transition-colors hover:border-[#2a2a2a]'
    >
      <div className='mb-3.5 flex items-center justify-between'>
        <span className='text-[14px] font-extrabold text-white/[0.88] sm:text-[16px]'>
          <span className='hidden sm:inline'>🏆 Top 4 결선 · 4강 토너먼트</span>
          <span className='sm:hidden'>🏆 Top 4 결선</span>
        </span>
        <span className='text-[12px] text-white/30 transition-colors group-hover:text-[#f5a623]'>
          <span className='hidden sm:inline'>결선 상세 →</span>
          <span className='sm:hidden'>상세 →</span>
        </span>
      </div>

      <div className='grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-1.5'>
        {matches.map((m) => (
          <div key={m.label} className='overflow-hidden rounded-lg border border-[#1e1e1e] bg-white/[0.015]'>
            <div className='border-b border-[#1e1e1e] bg-white/[0.015] px-2 py-1 font-mono text-[9px] font-extrabold tracking-[0.5px] text-white/20'>
              {m.label}
            </div>
            {m.rows.map((row, i) => (
              <div key={i} className='flex items-center gap-1.5 border-b border-white/[0.02] px-2 py-[5px] text-[11px] last:border-b-0'>
                {row.seed && <span className='min-w-4 font-mono text-[9px] font-extrabold text-white/20'>{row.seed}</span>}
                <span className={cn('truncate font-semibold', row.hasData ? 'text-white/50' : 'text-white/15 italic')}>
                  {row.name}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </a>
  )
}

export function ResultsHubPage() {
  const [division, setDivision] = useState<Division>('arcade')
  const { data, isLoading, isError } = useResults<unknown>()
  const archive = useMemo(() => resolveArcadeSeasonArchive(data), [data])
  const consoleArchive = useMemo(
    () => resolveConsoleSeasonArchive(data),
    [data]
  )

  const crossMatches = useMemo(() => {
    if (archive.finals.crossMatches.length > 0) {
      return archive.finals.crossMatches
    }
    return deriveCrossMatches(
      archive.finals.groupASeeds,
      archive.finals.groupBSeeds
    )
  }, [archive.finals])

  const finalizedRegionCount = useMemo(() => {
    return archive.regions.filter((region) => {
      const qualifierCount = [
        region.qualifiers.groupA,
        region.qualifiers.groupB,
      ].filter(Boolean).length
      return qualifierCount >= 2
    }).length
  }, [archive.regions])

  const consoleStandings = useMemo(
    () => buildConsoleStandings(consoleArchive),
    [consoleArchive]
  )
  const consoleQualifierRows = useMemo(
    () => buildConsoleQualifierRows(consoleArchive),
    [consoleArchive]
  )
  const consoleSF1 = useMemo(
    () => getConsoleSF1(consoleArchive),
    [consoleArchive]
  )
  const consoleSF2 = useMemo(
    () => getConsoleSF2(consoleArchive),
    [consoleArchive]
  )
  const consoleFinal = useMemo(
    () => getConsoleFinal(consoleArchive),
    [consoleArchive]
  )

  const consoleStandingNames = useMemo(() => {
    const map: Record<number, string> = {}
    for (const s of consoleStandings) {
      map[s.rank] = s.nickname
    }
    return map
  }, [consoleStandings])

  const consoleStageCount = consoleArchive.stages.length

  useEffect(() => {
    document.title = `${t('meta.siteName')} | 아카이브`
  }, [])

  return (
    <TkcSection className='space-y-8 md:space-y-10'>
      <FadeIn>
        <div>
          <div className='mb-3 inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-[1.5px] text-[#e74c3c]'>
            <span className='tkc-motion-dot size-1.5 rounded-full bg-[#e74c3c] shadow-[0_0_8px_#e74c3c]' />
            TKC 2026
          </div>
          <h1 className='bg-gradient-to-r from-[#e74c3c] to-[#f5a623] bg-clip-text text-[26px] leading-[1.2] font-black tracking-[-0.5px] text-transparent sm:text-[32px]'>
            대회 아카이브
          </h1>
          <p className='mt-2.5 max-w-[600px] text-[13px] leading-[1.7] break-keep text-white/50 sm:text-sm'>
            <span className='hidden sm:inline'>
              태고의 달인 한국 챔피언십 2026의 전체 기록입니다. 시즌별 결과와 상세
              기록을 확인하세요.
            </span>
            <span className='sm:hidden'>태고의 달인 한국 챔피언십 2026 전체 기록</span>
          </p>
        </div>
      </FadeIn>

      <div className='border-b border-[#1e1e1e]'>
        <div className='flex gap-1.5'>
          <button
            type='button'
            className='-mb-px flex items-center gap-2 border-b-2 border-[#e74c3c] px-4 py-2.5 text-[13px] font-semibold text-white/[0.92] sm:px-5 sm:text-sm'
          >
            <span className='rounded border border-[#e74c3c]/15 bg-[#e74c3c]/[0.08] px-1.5 py-0.5 font-mono text-[10px] font-extrabold tracking-[0.5px] text-[#e74c3c] sm:text-[11px]'>
              2026
            </span>
            <span className='hidden sm:inline'>TKC 2026</span>
            <span className='sm:hidden'>TKC</span>
          </button>
        </div>
      </div>

      <div className='flex gap-1'>
        <button
          type='button'
          onClick={() => setDivision('arcade')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-3.5 py-[9px] text-[12px] font-semibold transition-all sm:px-[18px] sm:text-[13px]',
            division === 'arcade'
              ? 'border-[#e74c3c]/25 bg-[#e74c3c]/[0.04] text-white/90'
              : 'border-[#1e1e1e] bg-[#111] text-white/35 hover:border-[#2a2a2a] hover:text-white/50'
          )}
        >
          <span className={cn('size-1.5 rounded-full bg-[#e74c3c] transition-opacity', division === 'arcade' ? 'opacity-100' : 'opacity-40')} />
          <span className='hidden sm:inline'>아케이드 시즌</span>
          <span className='sm:hidden'>아케이드</span>
          <span className='rounded-[3px] bg-emerald-400/[0.08] px-[5px] py-[2px] font-mono text-[9px] font-extrabold tracking-[0.5px] text-emerald-400'>
            {isLoading ? '동기화 중' : '진행 중'}
          </span>
        </button>

        <button
          type='button'
          onClick={() => setDivision('console')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-3.5 py-[9px] text-[12px] font-semibold transition-all sm:px-[18px] sm:text-[13px]',
            division === 'console'
              ? 'border-[#4a9eff]/25 bg-[#4a9eff]/[0.04] text-white/90'
              : 'border-[#1e1e1e] bg-[#111] text-white/35 hover:border-[#2a2a2a] hover:text-white/50'
          )}
        >
          <span className={cn('size-1.5 rounded-full bg-[#4a9eff] transition-opacity', division === 'console' ? 'opacity-100' : 'opacity-40')} />
          <span className='hidden sm:inline'>콘솔 시즌</span>
          <span className='sm:hidden'>콘솔</span>
          <span className='rounded-[3px] bg-white/[0.03] px-[5px] py-[2px] font-mono text-[9px] font-extrabold tracking-[0.5px] text-white/25'>
            예정
          </span>
        </button>
      </div>

      {isError && (
        <div className='flex items-center gap-3 rounded-xl border border-[#f5a623]/[0.12] bg-[#f5a623]/[0.04] p-3.5 text-[12px] leading-relaxed text-white/55 sm:p-4 sm:text-[13px]'>
          <span className='shrink-0'>⚠</span>
          <span className='break-keep'>
            결과 데이터를 불러오지 못했습니다. 기본 아카이브 구조만 표시합니다.
          </span>
        </div>
      )}

      {division === 'arcade' && (
        <div className='space-y-8'>
          <FadeIn>
            <ArchiveDescriptionCard
              division='arcade'
              season={archive.season}
              isLoading={isLoading}
              finalizedRegionCount={finalizedRegionCount}
              finalsMatchCount={crossMatches.length}
            />
          </FadeIn>

          <FadeIn>
            <PodiumPreview
              badgeVariant='arcade'
              linkHref='/arcade-results/2026/finals'
              subLabel='— 예선'
            />
          </FadeIn>

          <FadeIn delay={80}>
            <RegionCards regions={archive.regions} />
          </FadeIn>

          <FadeIn delay={140}>
            <ArcadeFinalsPreview matches={crossMatches} />
          </FadeIn>
        </div>
      )}

      {division === 'console' && (
        <div className='space-y-8'>
          <FadeIn>
            <ArchiveDescriptionCard
              division='console'
              season={archive.season}
              isLoading={isLoading}
              finalizedRegionCount={finalizedRegionCount}
              finalsMatchCount={consoleStageCount}
            />
          </FadeIn>

          <FadeIn>
            <PodiumPreview
              badgeVariant='console'
              linkHref='/console-results/2026'
              subLabel='온라인 예선'
              names={consoleStandingNames}
            />
          </FadeIn>

          <FadeIn delay={80}>
            <ConsoleQualifierTable qualifierRows={consoleQualifierRows} />
          </FadeIn>

          <FadeIn delay={140}>
            <ConsoleFinalsPreview
              sf1={consoleSF1}
              sf2={consoleSF2}
              final={consoleFinal}
            />
          </FadeIn>
        </div>
      )}
    </TkcSection>
  )
}
