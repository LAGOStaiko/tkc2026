import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useResults } from '@/lib/api'
import { resolveArcadeSeasonArchive } from '@/lib/arcade-results-archive'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/arcade-results/2026/')({
  component: ArcadeResults2026Page,
})

function StageRuleCard({
  title,
  description,
  detail,
}: {
  title: string
  description: string
  detail: string
}) {
  return (
    <div className='rounded-xl border border-white/10 bg-white/[0.03] p-5'>
      <div className='text-sm font-bold text-[#ff2a00]'>{title}</div>
      <p className='mt-1.5 text-sm leading-relaxed text-white/75'>
        {description}
      </p>
      <p className='mt-2 text-xs text-white/50'>{detail}</p>
    </div>
  )
}

function ArcadeResults2026Page() {
  const { data, isLoading, isError } = useResults<unknown>()
  const archive = useMemo(() => resolveArcadeSeasonArchive(data), [data])

  const finalizedRegionCount = archive.regions.filter((region) => {
    return (
      Boolean(region.qualifiers.groupA) && Boolean(region.qualifiers.groupB)
    )
  }).length

  useEffect(() => {
    document.title = `${t('meta.siteName')} | 아케이드 ${archive.season} 아카이브`
  }, [archive.season])

  return (
    <TkcSection className='space-y-8 md:space-y-10'>
      <div className='space-y-3'>
        <a
          href='/results'
          className='text-sm text-white/60 transition-colors hover:text-[#ff2a00]'
        >
          ← 결과 아카이브로 돌아가기
        </a>
        <TkcPageHeader
          title={`아케이드 ${archive.season} 시즌 아카이브`}
          subtitle='지역 예선부터 Top 8 결선까지 전체 기록을 관리합니다.'
        />
      </div>

      {isError ? (
        <div className='rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100'>
          API 연동 데이터가 없어 기본 아카이브 뼈대로 표시 중입니다.
        </div>
      ) : null}

      <section className='rounded-2xl border border-white/10 bg-white/[0.03] p-6'>
        <div className='flex flex-wrap items-center gap-2.5 text-xs text-white/70'>
          <span className='rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 font-medium'>
            지역 확정 {finalizedRegionCount}/4
          </span>
          <span className='rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 font-medium'>
            결선 매치 {archive.finals.crossMatches.length}경기
          </span>
          <span className='rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 font-medium'>
            {isLoading ? '데이터 동기화 중' : '아카이브 상태 확인됨'}
          </span>
        </div>

        <div className='mt-5 grid gap-3 md:grid-cols-2'>
          <StageRuleCard
            title='온라인 예선'
            description='과제곡 2곡 합산 스코어 어택으로 순위를 결정합니다.'
            detail={`${archive.songs.online1} + ${archive.songs.online2}`}
          />
          <StageRuleCard
            title='스위스 스테이지'
            description='16명 스위스 시스템, 2패 누적 시 탈락 (최대 4R).'
            detail='상위 시드 진영 선택 · 동점 시 랜덤 타이브레이커 반복'
          />
          <StageRuleCard
            title='결선 진출자 선발전 / 시드 배정전'
            description='3승 1패 참가자 추가 선발 후, 결선 시드 배정전 진행.'
            detail={`${archive.songs.decider31} / ${archive.songs.seeding}`}
          />
          <StageRuleCard
            title='Top 8 결선'
            description='A그룹(지역 1위) vs B그룹(지역 2위) 크로스 토너먼트.'
            detail='A1-B4, A2-B3, A3-B2, A4-B1'
          />
        </div>
      </section>

      <section className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-bold text-white'>지역 상세</h2>
          <a
            href='/arcade-results/2026/finals'
            className='text-sm font-semibold text-[#ff2a00] hover:underline'
          >
            Top 8 결선 상세 →
          </a>
        </div>

        <div className='grid gap-3 md:grid-cols-2'>
          {archive.regions.map((region) => {
            const hasAny =
              region.onlineRows.length > 0 ||
              region.swissMatches.length > 0 ||
              region.deciderRows.length > 0 ||
              region.seedingRows.length > 0

            return (
              <a
                key={region.key}
                href={`/arcade-results/2026/${region.key}`}
                className='rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#ff2a00]/30 hover:bg-white/[0.06]'
              >
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-2.5'>
                    <img
                      src={region.image}
                      alt={region.arcade}
                      className='size-8 shrink-0 rounded-lg object-cover'
                      loading='lazy'
                    />
                    <div>
                      <h3 className='text-base font-bold text-white'>
                        {region.label}
                      </h3>
                      <div className='text-xs text-white/50'>{region.arcade}</div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      hasAny
                        ? 'border border-emerald-300/30 bg-emerald-500/10 text-emerald-100'
                        : 'border border-white/15 bg-white/5 text-white/55'
                    }`}
                  >
                    {hasAny ? '기록 있음' : '입력 대기'}
                  </span>
                </div>
                <div className='mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-white/70'>
                  <div>
                    온라인:{' '}
                    <span className='font-medium text-white/90'>
                      {region.onlineRows.length}
                    </span>
                    명
                  </div>
                  <div>
                    Swiss:{' '}
                    <span className='font-medium text-white/90'>
                      {region.swissMatches.length}
                    </span>
                    매치
                  </div>
                  <div>
                    3-1:{' '}
                    <span className='font-medium text-white/90'>
                      {region.deciderRows.length}
                    </span>
                    명
                  </div>
                  <div>
                    시드전:{' '}
                    <span className='font-medium text-white/90'>
                      {region.seedingRows.length}
                    </span>
                    명
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </section>
    </TkcSection>
  )
}
