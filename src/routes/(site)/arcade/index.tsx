import { createFileRoute, Link } from '@tanstack/react-router'
import { Callout, Card, FadeIn, TkcIcon } from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/arcade/')({
  component: ArcadeOnlinePage,
})

type OverviewItem = { label: string; value: string; color?: string }

const OVERVIEW: OverviewItem[] = [
  { label: '진행 방식', value: '2곡 합산 점수' },
  { label: '스위스 진출', value: '회차별 상위권', color: '#f7d154' },
  { label: '접수 기간', value: '2026.03.02 ~ 2026.04.30' },
  {
    label: '오프라인 예선',
    value: '서울 · 대전 · 광주 · 부산',
    color: '#f5a623',
  },
]

const REGIONS = [
  { round: '1차', date: '03.21', city: '서울', venue: 'TAIKO LABS' },
  { round: '2차', date: '03.28', city: '대전', venue: '싸이뮤직 게임월드' },
  { round: '3차', date: '04.04', city: '광주', venue: '게임플라자' },
  { round: '4차', date: '04.11', city: '부산', venue: '게임D' },
] as const

const FLOW = [
  '온라인 신청서 작성',
  '아케이드 예선 회차 참가',
  '회차별 결과 집계',
  '오프라인 스위스 진출자 확정',
] as const

function ArcadeOnlinePage() {
  return (
    <div className='space-y-6'>
      <FadeIn>
        <Card>
          <h2 className='mb-4 text-[17px] font-bold text-white/90 sm:text-[18px]'>
            예선 한눈에 보기
          </h2>
          <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-4'>
            {OVERVIEW.map((item) => (
              <div
                key={item.label}
                className='rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] px-3 py-3'
              >
                <div className='text-[11px] text-white/35'>{item.label}</div>
                <div
                  className='mt-1 text-[14px] font-extrabold tracking-tight'
                  style={{ color: item.color ?? 'rgba(255,255,255,0.9)' }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={80}>
        <Card>
          <h2 className='mb-4 text-[17px] font-bold text-white/90 sm:text-[18px]'>
            오프라인 예선 일정
          </h2>
          <div className='space-y-2.5'>
            {REGIONS.map((item) => (
              <div
                key={item.round}
                className='flex items-center justify-between rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] px-3.5 py-3'
              >
                <div>
                  <div className='text-[11px] text-white/35'>
                    {item.round} · {item.date}
                  </div>
                  <div className='text-[14px] font-bold text-white/85'>
                    {item.city}
                  </div>
                </div>
                <div className='text-right text-[12px] text-white/45'>
                  {item.venue}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={140}>
        <Card>
          <h2 className='mb-3 text-[17px] font-bold text-white/90 sm:text-[18px]'>
            진행 플로우
          </h2>
          <ol className='space-y-2 text-[13px] leading-relaxed text-white/60 sm:text-[14px]'>
            {FLOW.map((item, i) => (
              <li key={item} className='flex items-start gap-2 break-keep'>
                <span className='mt-[2px] inline-flex w-5 shrink-0 items-center justify-center rounded-full bg-[#f5a623]/20 text-[11px] font-bold text-[#f5a623]'>
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>

          <Callout type='info' icon={<TkcIcon name='info' />}>
            상세 매칭 규정과 점수 집계 기준은 다음 단계인 “오프라인 스위스” 안내
            페이지에서 확인할 수 있습니다.
          </Callout>
        </Card>
      </FadeIn>

      <FadeIn delay={200}>
        <Card>
          <div className='flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center'>
            <div>
              <h2 className='text-[17px] font-bold text-white/90 sm:text-[18px]'>
                스위스 규정 확인
              </h2>
              <p className='mt-1 text-[13px] text-white/45'>
                매치 규칙, 진출 기준, 시드 결정 방식을 확인하세요.
              </p>
            </div>
            <Link
              to='/arcade/swiss'
              className='inline-flex items-center justify-center rounded-lg bg-[#f5a623] px-4 py-2.5 text-[13px] font-semibold text-black hover:bg-[#ffc04d] sm:text-sm'
            >
              스위스 안내 보기
            </Link>
          </div>
        </Card>
      </FadeIn>
    </div>
  )
}
