import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useResults } from '@/lib/api'
import {
  getRegionDefinitions,
  resolveArcadeSeasonArchive,
  type ArcadeFinalCrossMatch,
  type ArcadeFinalSeedRow,
} from '@/lib/arcade-results-archive'
import { cn } from '@/lib/utils'
import { PageHero, TkcSection } from '@/components/tkc/layout'
import { FadeIn } from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/arcade-results/2026/finals')({
  component: ArcadeFinals2026Page,
})

const formatScore = (value?: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  return value.toLocaleString('en-US')
}

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

/* ════════════════════════════════════════════════════════════════════ */
/*  Components                                                         */
/* ════════════════════════════════════════════════════════════════════ */

function GroupSeedTable({
  title,
  rows,
}: {
  title: string
  rows: ArcadeFinalSeedRow[]
}) {
  return (
    <div className='rounded-2xl border border-[#1e1e1e] bg-[#111] p-5'>
      <div className='mb-4 text-sm font-bold text-[#f5a623]'>{title}</div>

      {rows.length === 0 ? (
        <div className='text-sm text-white/45'>시드 데이터 입력 대기</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className='hidden overflow-x-auto rounded-xl border border-[#1e1e1e] md:block'>
            <table className='w-full text-left text-sm'>
              <thead className='bg-[#1a1a1a] text-xs font-semibold text-white/50'>
                <tr>
                  <th className='px-4 py-2.5 whitespace-nowrap'>시드</th>
                  <th className='px-4 py-2.5 whitespace-nowrap'>지역</th>
                  <th className='px-4 py-2.5 whitespace-nowrap'>엔트리</th>
                  <th className='px-4 py-2.5 whitespace-nowrap'>동더 네임</th>
                  <th className='px-4 py-2.5 text-right whitespace-nowrap'>
                    배정전 점수
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-[#1e1e1e]'>
                {[...rows]
                  .sort((a, b) => a.seed - b.seed)
                  .map((row) => (
                    <tr
                      key={`${row.regionKey}-${row.entryId}-${row.seed}`}
                      className='transition-colors hover:bg-white/[0.03]'
                    >
                      <td className='px-4 py-3 font-bold whitespace-nowrap text-[#f5a623]'>
                        {row.seed}
                      </td>
                      <td className='px-4 py-3 whitespace-nowrap text-white/65'>
                        {row.regionLabel}
                        {(() => {
                          const def = getRegionDefinitions().find(
                            (d) => d.key === row.regionKey
                          )
                          return def ? (
                            <span className='ml-1.5 text-xs text-white/35'>
                              {def.arcade}
                            </span>
                          ) : null
                        })()}
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

          {/* Mobile cards */}
          <div className='space-y-2 md:hidden'>
            {[...rows]
              .sort((a, b) => a.seed - b.seed)
              .map((row) => (
                <div
                  key={`m-${row.regionKey}-${row.entryId}`}
                  className='rounded-xl border border-[#1e1e1e] bg-white/[0.02] px-4 py-3'
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0'>
                      <div className='font-semibold text-white'>
                        {row.nickname}
                      </div>
                      <div className='mt-0.5 font-mono text-xs text-white/40'>
                        {row.entryId}
                      </div>
                    </div>
                    <span className='shrink-0 rounded-full bg-[#f5a623]/15 px-2 py-0.5 text-xs font-bold text-[#f5a623]'>
                      시드 {row.seed}
                    </span>
                  </div>
                  <div className='mt-2 flex items-center gap-3 text-xs text-white/50'>
                    <span>{row.regionLabel}</span>
                    <span className='tabular-nums'>
                      {formatScore(row.score)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  )
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

  useEffect(() => {
    document.title = `${t('meta.siteName')} | 아케이드 ${archive.season} Top 8 결선`
  }, [archive.season])

  return (
    <TkcSection className='space-y-8 md:space-y-10'>
      <div className='space-y-3'>
        <a
          href='/arcade-results/2026'
          className='text-sm text-white/50 transition-colors hover:text-[#f5a623]'
        >
          ← 아케이드 시즌 페이지로 돌아가기
        </a>
        <PageHero
          badge='TOP 8 FINALS'
          title={`Top 8 결선`}
          subtitle='A그룹(지역 1위)과 B그룹(지역 2위) 크로스 매칭 기록'
          accentColor='#e86e3a'
          gradientTo='#f5a623'
        />
      </div>

      {isError && (
        <div className='flex gap-3 rounded-xl border border-[#f5a623]/[0.12] bg-[#f5a623]/[0.04] p-3.5 text-[12px] leading-relaxed text-white/55 sm:p-4 sm:text-[13px]'>
          <span className='mt-0.5 shrink-0'>⚠</span>
          <span className='break-keep'>
            결선 아카이브 API가 비어 있어 현재 입력된 데이터만 표시합니다.
          </span>
        </div>
      )}

      {/* Seed groups */}
      <FadeIn>
        <section className='grid gap-4 md:grid-cols-2'>
          <GroupSeedTable
            title='A그룹 시드 (지역 1위)'
            rows={archive.finals.groupASeeds}
          />
          <GroupSeedTable
            title='B그룹 시드 (지역 2위)'
            rows={archive.finals.groupBSeeds}
          />
        </section>
      </FadeIn>

      {/* Cross matches */}
      <FadeIn>
        <section className='space-y-4'>
          <div className='flex items-center gap-2.5'>
            <span className='size-2 shrink-0 rounded-full bg-[#e86e3a]' />
            <h2 className='text-lg font-bold text-white'>Top 8 크로스 대진</h2>
          </div>

          {crossMatches.length === 0 ? (
            <div className='rounded-2xl border border-[#1e1e1e] bg-[#111] px-5 py-4 text-sm text-white/50'>
              결선 대진 데이터 입력 대기
            </div>
          ) : (
            <div className='grid gap-3 md:grid-cols-2'>
              {crossMatches
                .slice()
                .sort((a, b) => a.matchNo - b.matchNo)
                .map((match) => {
                  const leftName = `${match.left.regionLabel} ${match.left.nickname}`
                  const leftId = match.left.entryId
                  const rightName = `${match.right.regionLabel} ${match.right.nickname}`
                  const rightId = match.right.entryId
                  const isLeftWinner =
                    match.winnerEntryId === match.left.entryId
                  const isRightWinner =
                    match.winnerEntryId === match.right.entryId
                  const winnerLabel = isLeftWinner
                    ? `${leftName} (${leftId})`
                    : isRightWinner
                      ? `${rightName} (${rightId})`
                      : match.winnerEntryId || null

                  return (
                    <div
                      key={`final-${match.matchNo}`}
                      className='tkc-motion-surface rounded-2xl border border-[#1e1e1e] bg-[#111] p-5 hover:border-[#2a2a2a]'
                    >
                      <div className='font-mono text-xs font-bold tracking-[1.5px] text-[#f5a623]'>
                        MATCH {match.matchNo}
                      </div>

                      <div className='mt-3 space-y-2'>
                        <div
                          className={cn(
                            'flex items-baseline gap-2 text-sm',
                            isLeftWinner
                              ? 'font-bold text-[#f5a623]'
                              : 'text-white'
                          )}
                        >
                          <span>{leftName}</span>
                          <span className='font-mono text-xs text-white/35'>
                            {leftId}
                          </span>
                          {isLeftWinner && (
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
                            isRightWinner
                              ? 'font-bold text-[#f5a623]'
                              : 'text-white'
                          )}
                        >
                          <span>{rightName}</span>
                          <span className='font-mono text-xs text-white/35'>
                            {rightId}
                          </span>
                          {isRightWinner && (
                            <span className='text-xs font-medium text-emerald-400'>
                              WIN
                            </span>
                          )}
                        </div>
                      </div>

                      <div className='mt-4 rounded-xl border border-[#1e1e1e] bg-[#0a0a0a] px-3.5 py-2.5 text-xs'>
                        <span className='text-white/40'>승자:</span>{' '}
                        <span className='font-semibold text-white/80'>
                          {winnerLabel ?? '기록 대기'}
                        </span>
                      </div>

                      {match.note && (
                        <div className='mt-2.5 text-xs text-white/45'>
                          {match.note}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </section>
      </FadeIn>
    </TkcSection>
  )
}
