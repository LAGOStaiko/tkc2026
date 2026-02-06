import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useResults } from '@/lib/api'
import { resolveArcadeSeasonArchive } from '@/lib/arcade-results-archive'
import { cn } from '@/lib/utils'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/results')({
  component: ResultsHubPage,
})

function StatChip({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70',
        className
      )}
    >
      <span className='text-white/50'>{label}</span> <span>{value}</span>
    </div>
  )
}

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

      const qualifierCount = [region.qualifiers.groupA, region.qualifiers.groupB].filter(
        Boolean
      ).length

      return {
        ...region,
        hasData,
        qualifierCount,
      }
    })
  }, [archive.regions])

  const finalizedRegionCount = regionCards.filter(
    (region) => region.qualifierCount >= 2
  ).length

  const finalsMatchCount = archive.finals.crossMatches.length

  useEffect(() => {
    document.title = `${t('meta.siteName')} | 순위 및 결과 아카이브`
  }, [])

  return (
    <TkcSection className='space-y-8 md:space-y-10'>
      <TkcPageHeader
        title='순위 및 결과 아카이브'
        subtitle='아케이드 예선/결선 기록을 시즌 단위로 보관합니다.'
      />

      {isError ? (
        <div className='rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100'>
          결과 데이터를 불러오지 못했습니다. 기본 아카이브 구조만 표시합니다.
        </div>
      ) : null}

      <section className='grid gap-4 md:grid-cols-2'>
        <a
          href='/arcade-results/2026'
          className='rounded-2xl border border-white/15 bg-white/[0.03] p-5 transition hover:border-[#ff2a00]/40 hover:bg-white/[0.06]'
        >
          <div className='text-xs font-semibold tracking-wide text-[#ff2a00]'>
            ARCADE ARCHIVE
          </div>
          <h2 className='mt-1 text-xl font-bold text-white'>
            {archive.season} 시즌 아카이브
          </h2>
          <p className='mt-2 text-sm text-white/65'>
            온라인 예선, Swiss Stage, 3-1 선발전, 시드전, Top 8 결선을
            단계별로 조회할 수 있습니다.
          </p>
          <div className='mt-4 flex flex-wrap gap-2'>
            <StatChip label='지역 확정' value={`${finalizedRegionCount}/4`} />
            <StatChip
              label='결선 매치'
              value={finalsMatchCount > 0 ? `${finalsMatchCount}경기` : '대기'}
            />
            <StatChip
              label='상태'
              value={isLoading ? '동기화 중' : '아카이브 준비'}
            />
          </div>
        </a>

        <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-5'>
          <div className='text-xs font-semibold tracking-wide text-white/50'>
            CONSOLE ARCHIVE
          </div>
          <h2 className='mt-1 text-xl font-bold text-white/90'>콘솔 아카이브</h2>
          <p className='mt-2 text-sm text-white/60'>
            콘솔 결과 아카이브는 별도 구조로 확장 예정입니다.
          </p>
          <div className='mt-4 text-xs text-white/45'>
            현재는 기존 콘솔 결과 페이지 운영 데이터를 유지합니다.
          </div>
        </div>
      </section>

      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-white'>아케이드 지역별 바로가기</h3>
          <a
            href='/arcade-results/2026/finals'
            className='text-sm font-semibold text-[#ff2a00] hover:underline'
          >
            Top 8 결선 보기
          </a>
        </div>

        <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-4'>
          {regionCards.map((region) => (
            <a
              key={region.key}
              href={`/arcade-results/2026/${region.key}`}
              className='rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/25 hover:bg-white/[0.06]'
            >
              <div className='text-sm font-semibold text-white'>{region.label}</div>
              <div className='mt-2 text-xs text-white/60'>
                온라인 {region.onlineRows.length}명 · Swiss {region.swissMatches.length}매치
              </div>
              <div className='mt-3 flex flex-wrap gap-2'>
                <StatChip
                  label='진행'
                  value={region.hasData ? '기록 있음' : '대기'}
                  className={
                    region.hasData
                      ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100'
                      : undefined
                  }
                />
                <StatChip
                  label='진출'
                  value={region.qualifierCount > 0 ? `${region.qualifierCount}명` : '미확정'}
                />
              </div>
            </a>
          ))}
        </div>
      </section>
    </TkcSection>
  )
}
