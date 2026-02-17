import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useResults } from '@/lib/api'
import {
  resolveArcadeSeasonArchive,
  type ArcadeRegionArchive,
  type ArcadeSeasonArchive,
} from '@/lib/arcade-results-archive'
import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/tkc/guide-shared'
import { TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/arcade-results/2026/')({
  component: ArcadeResults2026Page,
})

/* ════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                            */
/* ════════════════════════════════════════════════════════════════════ */

function getRoundLabel(key: string) {
  const map: Record<string, string> = {
    seoul: '1차',
    daejeon: '2차',
    gwangju: '3차',
    busan: '4차',
  }
  return map[key] ?? ''
}

function getRegionParticipants(region: ArcadeRegionArchive) {
  const seen = new Set<string>()
  const list: { entryId: string; nickname: string }[] = []

  const sources = [
    ...region.swissStandings.map((s) => ({
      entryId: s.entryId,
      nickname: s.nickname,
    })),
    ...region.onlineRows.map((s) => ({
      entryId: s.entryId,
      nickname: s.nickname,
    })),
  ]

  for (const p of sources) {
    if (!seen.has(p.entryId)) {
      seen.add(p.entryId)
      list.push(p)
    }
  }
  return list
}

const STAGES = [
  {
    num: '01',
    name: '온라인 예선',
    desc: '과제곡 2곡 합산 스코어 어택',
    hasSong: true,
  },
  {
    num: '02',
    name: '스위스 스테이지',
    desc: '16명 스위스, 2패 탈락 (최대 4R)',
  },
  {
    num: '03',
    name: '선발전 · 시드전',
    desc: '3-1 추가 선발 + 결선 시드 배정',
  },
  { num: '04', name: 'Top 8 결선', desc: 'A vs B 크로스 토너먼트' },
]

/* ════════════════════════════════════════════════════════════════════ */
/*  Pipeline Card                                                      */
/* ════════════════════════════════════════════════════════════════════ */

function PipelineCard({ archive }: { archive: ArcadeSeasonArchive }) {
  return (
    <div className='group relative overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] transition-colors hover:border-[#2a2a2a]'>
      <div className='absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#f5a623] via-[#f5a623]/40 to-transparent opacity-50' />
      <div className='pointer-events-none absolute -top-[60px] -right-[60px] size-[200px] rounded-full bg-[radial-gradient(circle,_rgba(245,166,35,0.04),_transparent_70%)] opacity-0 transition-opacity group-hover:opacity-100' />

      <div className='relative p-5 sm:p-6'>
        <div className='mb-1 font-mono text-xs font-bold tracking-[1.5px] text-white/25'>
          STAGE STRUCTURE
        </div>
        <h3 className='mb-4 text-lg font-extrabold tracking-[-0.3px] text-white/[0.92]'>
          스테이지 구조
        </h3>

        {/* Desktop: 4-col grid */}
        <div className='hidden gap-2 md:grid md:grid-cols-4'>
          {STAGES.map((stage) => (
            <div
              key={stage.num}
              className='rounded-xl border border-white/[0.04] bg-white/[0.015] p-3.5 transition-colors hover:border-white/[0.08]'
            >
              <div className='font-mono text-[10px] font-bold tracking-[1px] text-[#f5a623]/60'>
                {stage.num}
              </div>
              <div className='mt-1 text-[13px] font-bold text-white/[0.88]'>
                {stage.name}
              </div>
              <div className='mt-0.5 text-[11px] leading-[1.5] break-keep text-white/35'>
                {stage.desc}
              </div>
              {stage.hasSong && (
                <div className='mt-1.5 font-mono text-[10px] text-white/20'>
                  ♪ {archive.songs.online1} + {archive.songs.online2}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: compact rows */}
        <div className='flex flex-col md:hidden'>
          {STAGES.map((stage, i) => (
            <div
              key={stage.num}
              className={cn(
                'flex items-center gap-2.5 py-2.5',
                i < STAGES.length - 1 && 'border-b border-white/[0.04]'
              )}
            >
              <span className='min-w-[22px] font-mono text-[10px] font-bold tracking-[1px] text-[#f5a623]/60'>
                {stage.num}
              </span>
              <span className='text-[13px] font-bold text-white/[0.88]'>
                {stage.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Participant Chips                                                  */
/* ════════════════════════════════════════════════════════════════════ */

const MOBILE_CHIP_LIMIT = 5

function ParticipantChips({
  participants,
}: {
  participants: { entryId: string; nickname: string }[]
}) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = participants.length > MOBILE_CHIP_LIMIT

  return (
    <div>
      <div className='mb-2 flex items-center gap-1.5 text-xs font-semibold text-white/40'>
        참가자{' '}
        <span className='rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-[11px] font-bold text-white/35'>
          {participants.length}
        </span>
      </div>

      {/* Desktop: show all */}
      <div className='hidden flex-wrap gap-1 md:flex'>
        {participants.map((p) => (
          <span
            key={p.entryId}
            className='inline-flex rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-white/60 transition-colors hover:border-white/10 hover:bg-white/[0.06]'
          >
            {p.nickname}
          </span>
        ))}
      </div>

      {/* Mobile: limited with expand */}
      <div className='md:hidden'>
        <div className='flex flex-wrap gap-1'>
          {(expanded
            ? participants
            : participants.slice(0, MOBILE_CHIP_LIMIT)
          ).map((p) => (
            <span
              key={p.entryId}
              className='inline-flex rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-white/60'
            >
              {p.nickname}
            </span>
          ))}
        </div>
        {hasMore && !expanded && (
          <button
            type='button'
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setExpanded(true)
            }}
            className='mt-1.5 inline-flex items-center rounded-lg border border-[#f5a623]/15 bg-[#f5a623]/[0.08] px-2.5 py-1 text-xs font-bold text-[#f5a623] transition-colors hover:bg-[#f5a623]/[0.14]'
          >
            +{participants.length - MOBILE_CHIP_LIMIT}명 더보기
          </button>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Region Card                                                        */
/* ════════════════════════════════════════════════════════════════════ */

function RegionCard({ region }: { region: ArcadeRegionArchive }) {
  const participants = getRegionParticipants(region)
  const roundLabel = getRoundLabel(region.key)
  const hasQualA = Boolean(region.qualifiers.groupA)
  const hasQualB = Boolean(region.qualifiers.groupB)

  const stats = [
    { label: '온라인', value: region.onlineRows.length },
    { label: '스위스', value: region.swissMatches.length },
    { label: '3-1', value: region.deciderRows.length },
    { label: '시드전', value: region.seedingRows.length },
  ]

  return (
    <a
      href={`/arcade-results/2026/${region.key}`}
      className='group relative block overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] text-inherit no-underline transition-colors hover:border-[#2a2a2a]'
    >
      <div className='absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#f5a623] via-[#f5a623]/40 to-transparent opacity-40 transition-opacity group-hover:opacity-100' />
      <div className='pointer-events-none absolute -top-[60px] -right-[60px] size-[200px] rounded-full bg-[radial-gradient(circle,_rgba(245,166,35,0.04),_transparent_70%)] opacity-0 transition-opacity group-hover:opacity-100' />

      <div className='relative flex flex-col gap-0 p-5 sm:p-6 md:grid md:grid-cols-[240px_1fr] md:gap-5'>
        {/* Left: region info + stats */}
        <div>
          <div className='flex items-center gap-2.5'>
            <img
              src={region.image}
              alt={region.arcade}
              className='size-9 shrink-0 rounded-[10px] border border-white/[0.06] object-cover'
              loading='lazy'
            />
            <div className='min-w-0'>
              <div className='text-[17px] font-extrabold tracking-[-0.3px] text-white/[0.92]'>
                {region.shortLabel}
              </div>
              <div className='text-[11px] text-white/35'>{region.arcade}</div>
            </div>
            <span className='ml-auto shrink-0 rounded-full border border-[#f5a623]/20 bg-[#f5a623]/[0.08] px-2.5 py-1 font-mono text-[11px] font-bold tracking-[0.5px] text-[#f5a623]'>
              {roundLabel}
            </span>
          </div>

          <div className='mt-3 grid grid-cols-4 gap-1.5'>
            {stats.map((s) => (
              <div
                key={s.label}
                className='rounded-[10px] border border-white/[0.04] bg-white/[0.015] py-2 text-center'
              >
                <div
                  className={cn(
                    'font-mono text-base font-extrabold',
                    s.value > 0 ? 'text-white/[0.88]' : 'text-white/15'
                  )}
                >
                  {s.value}
                </div>
                <div className='text-[10px] font-semibold text-white/30'>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: participants + qualifiers */}
        <div className='mt-3.5 md:mt-0 md:border-l md:border-white/[0.04] md:pl-5'>
          {participants.length > 0 ? (
            <ParticipantChips participants={participants} />
          ) : (
            <div className='text-[13px] text-white/25'>
              참가자 데이터 입력 대기
            </div>
          )}

          {(hasQualA || hasQualB) && (
            <div className='mt-3 border-t border-white/[0.04] pt-2.5'>
              <div className='mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-[1px] text-[#e74c3c]'>
                <span className='tkc-motion-dot size-[5px] rounded-full bg-[#e74c3c] shadow-[0_0_8px_#e74c3c]' />
                QUALIFIED
              </div>
              <div className='flex gap-1.5'>
                <span
                  className={cn(
                    'flex-1 overflow-hidden rounded-[10px] px-2.5 py-[7px] text-center text-[13px] font-bold text-ellipsis whitespace-nowrap',
                    hasQualA
                      ? 'border border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-400'
                      : 'border border-[#1e1e1e] bg-white/[0.02] text-white/25'
                  )}
                >
                  {hasQualA
                    ? `A · ${region.qualifiers.groupA!.nickname}`
                    : 'A · 대기'}
                </span>
                <span
                  className={cn(
                    'flex-1 overflow-hidden rounded-[10px] px-2.5 py-[7px] text-center text-[13px] font-bold text-ellipsis whitespace-nowrap',
                    hasQualB
                      ? 'border border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-400'
                      : 'border border-[#1e1e1e] bg-white/[0.02] text-white/25'
                  )}
                >
                  {hasQualB
                    ? `B · ${region.qualifiers.groupB!.nickname}`
                    : 'B · 대기'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </a>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Finals Card                                                        */
/* ════════════════════════════════════════════════════════════════════ */

function FinalsCard({ archive }: { archive: ArcadeSeasonArchive }) {
  const matches = archive.finals.crossMatches
  const allFinished =
    matches.length > 0 && matches.every((m) => m.winnerEntryId)

  if (matches.length === 0 && archive.finals.groupASeeds.length === 0)
    return null

  return (
    <a
      href='/arcade-results/2026/finals'
      className='group relative block overflow-hidden rounded-xl border border-[#e74c3c]/15 bg-[#111] text-inherit no-underline transition-colors hover:border-[#e74c3c]/30'
    >
      <div className='absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#e74c3c] to-[#f5a623] opacity-50' />
      <div className='absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-[#e74c3c] to-[#f5a623]' />
      <div className='pointer-events-none absolute -top-[60px] -right-[60px] size-[200px] rounded-full bg-[radial-gradient(circle,_rgba(231,76,60,0.04),_transparent_70%)] opacity-0 transition-opacity group-hover:opacity-100' />

      <div className='relative p-5 sm:p-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <span className='flex items-center gap-1.5 font-mono text-xs font-bold tracking-[1.5px] text-[#e74c3c]'>
            <span className='tkc-motion-dot size-1.5 rounded-full bg-[#e74c3c] shadow-[0_0_8px_#e74c3c]' />
            TOP 8 FINALS
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold tracking-[0.5px]',
              allFinished
                ? 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-400'
                : 'border-white/[0.06] bg-white/[0.02] text-white/35'
            )}
          >
            {allFinished ? (
              <>
                <span className='hidden sm:inline'>결선 완료</span>
                <span className='sm:hidden'>완료</span>
              </>
            ) : (
              '진행 대기'
            )}
          </span>
        </div>

        <h3 className='mt-2 bg-gradient-to-r from-[#e74c3c] to-[#f5a623] bg-clip-text text-xl font-black tracking-[-0.5px] text-transparent'>
          Top 8 크로스 대진
        </h3>

        {/* Match bracket */}
        {matches.length > 0 && (
          <div className='mt-4 grid grid-cols-2 gap-1.5 md:grid-cols-4'>
            {matches
              .slice()
              .sort((a, b) => a.matchNo - b.matchNo)
              .map((match) => {
                const isLeftWin = match.winnerEntryId === match.left.entryId
                const isRightWin = match.winnerEntryId === match.right.entryId
                const hasResult = isLeftWin || isRightWin

                return (
                  <div
                    key={match.matchNo}
                    className='rounded-[10px] border border-white/[0.04] bg-white/[0.015] p-3 text-center transition-colors hover:border-white/[0.08]'
                  >
                    <div className='font-mono text-[11px] font-bold tracking-[0.5px] text-[#f5a623]'>
                      M{match.matchNo}
                    </div>
                    {hasResult ? (
                      <div className='mt-1.5 flex flex-col gap-[3px]'>
                        <div
                          className={cn(
                            'flex items-center justify-between rounded-md px-1.5 py-1 text-[11px] font-semibold sm:px-2 sm:text-xs',
                            isLeftWin
                              ? 'border border-emerald-400/12 bg-emerald-400/[0.06] text-emerald-400'
                              : 'border border-white/[0.04] bg-white/[0.015] text-white/30'
                          )}
                        >
                          <span className='truncate font-bold'>
                            {match.left.nickname}
                          </span>
                          <span className='ml-1 shrink-0 font-mono text-[11px] font-extrabold'>
                            {isLeftWin ? 'W' : 'L'}
                          </span>
                        </div>
                        <div
                          className={cn(
                            'flex items-center justify-between rounded-md px-1.5 py-1 text-[11px] font-semibold sm:px-2 sm:text-xs',
                            isRightWin
                              ? 'border border-emerald-400/12 bg-emerald-400/[0.06] text-emerald-400'
                              : 'border border-white/[0.04] bg-white/[0.015] text-white/30'
                          )}
                        >
                          <span className='truncate font-bold'>
                            {match.right.nickname}
                          </span>
                          <span className='ml-1 shrink-0 font-mono text-[11px] font-extrabold'>
                            {isRightWin ? 'W' : 'L'}
                          </span>
                        </div>
                        <div className='mt-0.5 font-mono text-[9px] font-bold tracking-[0.5px] text-emerald-400'>
                          FINISHED
                        </div>
                      </div>
                    ) : (
                      <div className='mt-1.5 space-y-1'>
                        <div className='text-[13px] text-white/50'>
                          <strong className='block truncate font-bold text-white/[0.88]'>
                            {match.left.nickname}
                          </strong>
                        </div>
                        <div className='font-mono text-[10px] font-bold tracking-widest text-white/25'>
                          VS
                        </div>
                        <div className='text-[13px] text-white/50'>
                          <strong className='block truncate font-bold text-white/[0.88]'>
                            {match.right.nickname}
                          </strong>
                        </div>
                        <div className='text-[10px] text-white/20'>대기</div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        )}

        {/* No match data fallback */}
        {matches.length === 0 && (
          <div className='mt-4 rounded-xl border border-[#1e1e1e] bg-white/[0.02] px-4 py-3 text-sm text-white/25'>
            결선 대진 데이터 입력 대기
          </div>
        )}
      </div>
    </a>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Page                                                               */
/* ════════════════════════════════════════════════════════════════════ */

function ArcadeResults2026Page() {
  const { data, isLoading, isError } = useResults<unknown>()
  const archive = useMemo(() => resolveArcadeSeasonArchive(data), [data])

  const finalizedRegionCount = archive.regions.filter(
    (region) =>
      Boolean(region.qualifiers.groupA) && Boolean(region.qualifiers.groupB)
  ).length

  useEffect(() => {
    document.title = `${t('meta.siteName')} | 아케이드 ${archive.season} 아카이브`
  }, [archive.season])

  return (
    <TkcSection className='space-y-8 md:space-y-10'>
      {/* Back nav + Hero */}
      <div className='space-y-4'>
        <a
          href='/results'
          className='inline-flex items-center gap-1 text-[13px] text-white/40 transition-colors hover:text-[#f5a623]'
        >
          ← <span className='hidden sm:inline'>결과 아카이브로 돌아가기</span>
          <span className='sm:hidden'>아카이브</span>
        </a>

        <div>
          <div className='mb-3 inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-[1.5px] text-[#f5a623]'>
            <span className='tkc-motion-dot size-1.5 rounded-full bg-[#f5a623] shadow-[0_0_8px_#f5a623]' />
            ARCADE ARCHIVE
          </div>
          <h1 className='text-[28px] leading-[1.2] font-black tracking-[-0.5px] text-white/[0.92] md:text-[32px]'>
            아케이드 {archive.season}
          </h1>
          <p className='mt-2 text-[13px] leading-[1.7] break-keep text-white/50 sm:text-sm'>
            지역 예선부터 Top 8 결선까지 전체 기록을 관리합니다.
          </p>

          {/* Status chips */}
          <div className='mt-4 flex flex-wrap gap-1.5'>
            <span className='inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 font-mono text-xs font-bold tracking-[0.5px] text-white/50'>
              <span className='hidden sm:inline'>지역 확정</span>
              <span className='sm:hidden'>지역</span>{' '}
              <strong className='text-white/[0.88]'>
                {finalizedRegionCount}/4
              </strong>
            </span>
            <span className='inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 font-mono text-xs font-bold tracking-[0.5px] text-white/50'>
              <span className='hidden sm:inline'>결선 매치</span>
              <span className='sm:hidden'>결선</span>{' '}
              <strong className='text-white/[0.88]'>
                {archive.finals.crossMatches.length}
                <span className='hidden sm:inline'>경기</span>
              </strong>
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs font-bold tracking-[0.5px]',
                isLoading
                  ? 'border-[#f5a623]/20 text-[#f5a623]'
                  : 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-400'
              )}
            >
              {!isLoading && (
                <span className='tkc-motion-dot size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]' />
              )}
              <span className='hidden sm:inline'>
                {isLoading ? '데이터 동기화 중' : '시즌 완료'}
              </span>
              <span className='sm:hidden'>
                {isLoading ? '동기화 중' : '완료'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {isError && (
        <div className='flex items-center gap-3 rounded-xl border border-[#f5a623]/[0.12] bg-[#f5a623]/[0.04] p-3.5 text-[12px] leading-relaxed text-white/55 sm:p-4 sm:text-[13px]'>
          <span className='shrink-0'>⚠</span>
          <span className='break-keep'>
            API 연동 데이터가 없어 기본 아카이브 뼈대로 표시 중입니다.
          </span>
        </div>
      )}

      {/* Pipeline */}
      <FadeIn>
        <PipelineCard archive={archive} />
      </FadeIn>

      {/* Regions */}
      <FadeIn>
        <section className='space-y-3'>
          <div className='flex flex-wrap items-end justify-between gap-3'>
            <div>
              <div className='mb-1.5 font-mono text-xs font-semibold tracking-[1.5px] text-white/25'>
                REGIONS
              </div>
              <h2 className='text-xl font-extrabold tracking-[-0.3px] text-white/[0.92] md:text-[clamp(20px,4vw,24px)]'>
                지역 상세
              </h2>
            </div>
            <a
              href='/arcade-results/2026/finals'
              className='text-[13px] text-white/55 transition-colors hover:text-[#f5a623] sm:text-sm'
            >
              Top 8 결선 상세 →
            </a>
          </div>

          <div className='flex flex-col gap-2'>
            {archive.regions.map((region) => (
              <RegionCard key={region.key} region={region} />
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Finals */}
      <FadeIn>
        <FinalsCard archive={archive} />
      </FadeIn>

      {/* Bottom action */}
      <FadeIn>
        <div className='relative overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] px-5 py-4 transition-colors hover:border-[#2a2a2a] sm:px-6'>
          <div className='absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-[#f5a623] to-[#e74c3c]' />
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <p className='text-[13px] break-keep text-white/50'>
              <strong className='font-semibold text-white/70'>
                아케이드 {archive.season} 시즌
              </strong>
              <span className='hidden sm:inline'>
                의 전체 매치 기록과 상세 데이터를 확인하세요.
              </span>
              <span className='sm:hidden'> · 전체 기록 확인</span>
            </p>
            <a
              href='/arcade-results/2026/finals'
              className='shrink-0 rounded-lg border border-[#1e1e1e] px-4 py-2 text-xs font-semibold text-white/50 transition-all hover:border-white/20 hover:text-white'
            >
              <span className='hidden sm:inline'>전체 기록 보기 →</span>
              <span className='sm:hidden'>기록 보기 →</span>
            </a>
          </div>
        </div>
      </FadeIn>
    </TkcSection>
  )
}
