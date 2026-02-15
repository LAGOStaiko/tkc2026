import { useEffect, useMemo, type CSSProperties } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useResults } from '@/lib/api'
import { resolveArcadeSeasonArchive } from '@/lib/arcade-results-archive'
import { cn } from '@/lib/utils'
import { PageHero, TkcSection } from '@/components/tkc/layout'
import { FadeIn } from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/results')({
  component: ResultsHubPage,
})

/* ════════════════════════════════════════════════════════════════════ */
/*  Shared Components                                                  */
/* ════════════════════════════════════════════════════════════════════ */

function MetaChip({
  label,
  value,
  variant = 'default',
}: {
  label: string
  value: string
  variant?: 'default' | 'status' | 'ready'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-3 py-1.5 font-mono text-[12px] font-semibold tracking-wide',
        variant === 'ready'
          ? 'border-emerald-400/15 bg-emerald-500/8 text-emerald-400'
          : variant === 'status'
            ? 'border-[#e74c3c]/20 text-[#e74c3c]'
            : 'border-[#1e1e1e] bg-white/[0.03] text-white/50'
      )}
    >
      {label} <strong className='font-bold text-white/90'>{value}</strong>
    </span>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Page                                                               */
/* ════════════════════════════════════════════════════════════════════ */

const ROUND_LABELS = ['1차', '2차', '3차', '4차']

function ResultsHubPage() {
  const { data, isLoading, isError } = useResults<unknown>()
  const archive = useMemo(() => resolveArcadeSeasonArchive(data), [data])

  const regionCards = useMemo(() => {
    return archive.regions.map((region) => {
      const hasData =
        region.onlineRows.length > 0 ||
        region.swissMatches.length > 0 ||
        region.deciderRows.length > 0 ||
        region.seedingRows.length > 0

      const qualifierCount = [
        region.qualifiers.groupA,
        region.qualifiers.groupB,
      ].filter(Boolean).length

      return { ...region, hasData, qualifierCount }
    })
  }, [archive.regions])

  const finalizedRegionCount = regionCards.filter(
    (r) => r.qualifierCount >= 2
  ).length

  const finalsMatchCount = archive.finals.crossMatches.length

  useEffect(() => {
    document.title = `${t('meta.siteName')} | 아카이브`
  }, [])

  return (
    <TkcSection className='space-y-8 md:space-y-10'>
      <PageHero
        badge='ARCHIVE'
        title='아카이브'
        subtitle='대회 결과와 기록을 확인하세요.'
      />

      {isError && (
        <div className='flex items-center gap-3 rounded-xl border border-[#f5a623]/[0.12] bg-[#f5a623]/[0.04] p-3.5 text-[12px] leading-relaxed text-white/55 sm:p-4 sm:text-[13px]'>
          <span className='shrink-0'>⚠</span>
          <span className='break-keep'>
            결과 데이터를 불러오지 못했습니다. 기본 아카이브 구조만 표시합니다.
          </span>
        </div>
      )}

      {/* ── Archive Cards ── */}
      <div className='grid gap-4 md:grid-cols-2'>
        {/* Arcade */}
        <FadeIn>
          <a
            href='/arcade-results/2026'
            className='tkc-arc-glow group block rounded-2xl'
            style={
              {
                '--tkc-arc-glow-color': 'rgba(245,166,35,0.35)',
              } as CSSProperties
            }
          >
            <div className='relative overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] p-6 transition-all group-hover:border-[#2a2a2a] sm:p-8'>
              <div className='pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-[#f5a623]/[0.04]' />
              <div className='relative'>
                <div className='font-mono text-[11px] font-semibold tracking-[1.5px] text-[#f5a623] uppercase'>
                  Arcade Archive
                </div>
                <h2 className='mt-2.5 text-2xl font-extrabold tracking-tight text-white sm:text-[26px]'>
                  {archive.season} 시즌 아카이브
                </h2>
                <p className='mt-3 text-[14px] leading-relaxed break-keep text-white/55'>
                  온라인 예선, 스위스 스테이지, 결선 진출자 선발전, 시드전, Top 8
                  결선을 단계별로 조회할 수 있습니다.
                </p>
                <div className='mt-5 flex flex-wrap gap-2'>
                  <MetaChip
                    label='지역 확정'
                    value={`${finalizedRegionCount}/4`}
                  />
                  <MetaChip
                    label='결선 매치'
                    value={
                      finalsMatchCount > 0
                        ? `${finalsMatchCount}경기`
                        : '대기'
                    }
                  />
                  <MetaChip
                    label='상태'
                    value={isLoading ? '동기화 중' : '아카이브 준비'}
                    variant='status'
                  />
                </div>
              </div>
            </div>
          </a>
        </FadeIn>

        {/* Console */}
        <FadeIn delay={100}>
          <div
            className='tkc-arc-glow rounded-2xl'
            style={
              {
                '--tkc-arc-glow-color': 'rgba(231,76,60,0.35)',
              } as CSSProperties
            }
          >
            <div className='relative overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] p-6 sm:p-8'>
              <div className='pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-[#e74c3c]/[0.04]' />
              <div className='relative'>
                <div className='font-mono text-[11px] font-semibold tracking-[1.5px] text-[#e74c3c] uppercase'>
                  Console Archive
                </div>
                <h2 className='mt-2.5 text-2xl font-extrabold tracking-tight text-white/90 sm:text-[26px]'>
                  콘솔 아카이브
                </h2>
                <p className='mt-3 text-[14px] leading-relaxed break-keep text-white/55'>
                  콘솔 결과 아카이브는 별도 구조로 확장 예정입니다.
                </p>
                <div className='mt-4 border-t border-[#1e1e1e] pt-4 text-[13px] italic text-white/40'>
                  현재는 기존 콘솔 결과 페이지 운영 데이터를 유지합니다.
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ── Arcade Region Section ── */}
      <FadeIn>
        <section className='space-y-5'>
          <div className='flex items-end justify-between gap-4'>
            <h3 className='text-[22px] font-bold tracking-tight text-white'>
              아케이드 지역별 바로가기
            </h3>
            <a
              href='/arcade-results/2026/finals'
              className='shrink-0 font-mono text-[13px] font-semibold text-[#e74c3c] transition-opacity hover:opacity-70'
            >
              Top 8 결선 보기 →
            </a>
          </div>

          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {regionCards.map((region, i) => (
              <a
                key={region.key}
                href={`/arcade-results/2026/${region.key}`}
                className='tkc-motion-lift relative overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] p-5 sm:p-6'
              >
                <div className='absolute inset-x-0 top-0 h-0.5 bg-[#f5a623] opacity-50' />

                <div className='font-mono text-[11px] font-semibold tracking-[1px] text-[#f5a623]'>
                  {ROUND_LABELS[i]}
                </div>
                <div className='mt-1.5 text-xl font-extrabold tracking-tight text-white'>
                  {region.shortLabel}
                </div>
                <div className='mt-2 text-[14px] text-white/50'>
                  온라인 {region.onlineRows.length}명 · 스위스{' '}
                  {region.swissMatches.length}매치
                </div>

                <div className='mt-4 flex flex-wrap gap-1.5'>
                  <span
                    className={cn(
                      'rounded-md border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide',
                      region.hasData
                        ? 'border-emerald-400/15 bg-emerald-500/8 text-emerald-400'
                        : 'border-[#1e1e1e] bg-white/[0.03] text-white/50'
                    )}
                  >
                    {region.hasData ? '진행 기록 있음' : '입력 대기'}
                  </span>
                  <span className='rounded-md border border-[#1e1e1e] bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-white/50'>
                    진출{' '}
                    {region.qualifierCount > 0
                      ? `${region.qualifierCount}명`
                      : '미확정'}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ── Console Placeholder ── */}
      <FadeIn>
        <section className='space-y-5'>
          <h3 className='text-[22px] font-bold tracking-tight text-white'>
            콘솔 결과
          </h3>
          <div className='rounded-2xl border border-dashed border-[#e74c3c]/15 bg-[#111] px-8 py-10 text-center'>
            <h4 className='text-lg font-bold text-white'>
              콘솔 아카이브 준비 중
            </h4>
            <p className='mt-2 text-[15px] leading-relaxed text-white/50'>
              콘솔 결과 아카이브는 별도 구조로 확장 예정입니다.
              <br />
              현재는 기존 콘솔 결과 페이지를 참고해 주세요.
            </p>
            <a
              href='/console/results'
              className='mt-5 inline-flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-white/55 transition-all hover:border-white/30 hover:bg-white/[0.03] hover:text-white/80'
            >
              기존 결과 페이지 →
            </a>
          </div>
        </section>
      </FadeIn>
    </TkcSection>
  )
}
