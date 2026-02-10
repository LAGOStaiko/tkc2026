import { createFileRoute, Link } from '@tanstack/react-router'
import { Callout, Card, FadeIn, TkcIcon } from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/arcade/finals')({
  component: ArcadeFinalsPage,
})

/* ════════════════════════════════════════════════════════════════════ */
/*  Constants                                                          */
/* ════════════════════════════════════════════════════════════════════ */

const REGIONS = [
  { name: '서울', color: '#e84545' },
  { name: '대전', color: '#f5a623' },
  { name: '광주', color: '#f7d154' },
  { name: '부산', color: '#4ecb71' },
] as const

/* ════════════════════════════════════════════════════════════════════ */
/*  Page                                                               */
/* ════════════════════════════════════════════════════════════════════ */

function ArcadeFinalsPage() {
  return (
    <>
      {/* ── Overview ── */}
      <FadeIn>
        <div className='mb-2 font-mono text-xs font-semibold tracking-[2px] text-[#4ecb71] uppercase'>
          Final Stage
        </div>
        <h2 className='mb-2 text-[clamp(22px,4vw,30px)] font-extrabold tracking-tight text-white/90'>
          PlayX4 결선 토너먼트
        </h2>
        <p className='mb-8 text-sm font-light break-keep text-white/55'>
          전국 4개 지역에서 각 2명, 총 8명이 최종 결선에서 경쟁합니다.
        </p>
      </FadeIn>

      {/* ── Top 8 Structure ── */}
      <FadeIn delay={150}>
        <Card className='mb-6 overflow-hidden p-0'>
          <div className='flex items-center gap-2.5 border-b border-[#1e1e1e] bg-[#111] px-6 py-4'>
            <span className='size-2 rounded-full bg-[#4ecb71]' />
            <span className='text-[15px] font-bold text-white/90'>
              결선 진출 구성
            </span>
          </div>
          <div className='grid grid-cols-2 gap-0 bg-[#111] sm:grid-cols-4'>
            {REGIONS.map((region, i) => (
              <div
                key={region.name}
                className={`relative border-[#1e1e1e] px-5 py-6 text-center ${
                  i < 2 ? 'border-b sm:border-b-0' : ''
                } ${i % 2 === 0 || i === 0 ? 'border-r' : ''} ${i === 2 ? 'sm:border-r' : ''}`}
              >
                <div
                  className='absolute top-0 right-0 left-0 h-0.5'
                  style={{ background: region.color }}
                />
                <div
                  className='text-2xl font-extrabold'
                  style={{ color: region.color }}
                >
                  2명
                </div>
                <div className='mt-1 text-[13px] font-bold text-white/90'>
                  {region.name}
                </div>
                <div className='mt-0.5 text-[11px] text-white/35'>
                  오프라인 예선 통과
                </div>
              </div>
            ))}
          </div>
          <div className='border-t border-[#1e1e1e] bg-[#111] px-6 py-4 text-center'>
            <span className='font-mono text-xl font-extrabold text-[#4ecb71]'>
              Top 8
            </span>
            <span className='ml-2 text-sm text-white/55'>
              — 4지역 × 2명 = 최종 결선 진출
            </span>
          </div>
        </Card>
      </FadeIn>

      {/* ── Tournament Format ── */}
      <FadeIn delay={200}>
        <Card className='mb-6'>
          <div className='mb-4 text-sm font-bold text-white/90'>
            토너먼트 형식
          </div>
          <div className='space-y-3'>
            <div className='flex items-center gap-3.5 rounded-xl border border-[#1e1e1e] bg-white/[0.015] px-4 py-3.5'>
              <div className='flex size-9 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-[#f5a623] font-mono text-sm font-extrabold text-[#f5a623]'>
                1
              </div>
              <div>
                <div className='text-[13px] font-bold text-white/90'>
                  시드 산정
                </div>
                <div className='text-xs break-keep text-white/35'>
                  진출자 8명이 시드 과제곡을 플레이하여 시드 배정
                </div>
              </div>
            </div>
            <div className='flex items-center gap-3.5 rounded-xl border border-[#1e1e1e] bg-white/[0.015] px-4 py-3.5'>
              <div className='flex size-9 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-[#f5a623] font-mono text-sm font-extrabold text-[#f5a623]'>
                2
              </div>
              <div>
                <div className='text-[13px] font-bold text-white/90'>
                  토너먼트 대진
                </div>
                <div className='text-xs break-keep text-white/35'>
                  시드 기반 싱글 엘리미네이션 토너먼트 진행
                </div>
              </div>
            </div>
            <div className='flex items-center gap-3.5 rounded-xl border border-[#1e1e1e] bg-white/[0.015] px-4 py-3.5'>
              <div className='flex size-9 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-[#4ecb71] font-mono text-sm font-extrabold text-[#4ecb71]'>
                3
              </div>
              <div>
                <div className='text-[13px] font-bold text-white/90'>
                  최종 우승자 결정
                </div>
                <div className='text-xs break-keep text-white/35'>
                  PlayX4 현장에서 최종 우승자가 결정됩니다
                </div>
              </div>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* ── Venue Info ── */}
      <FadeIn delay={250}>
        <Card className='mb-6'>
          <div className='mb-4 text-sm font-bold text-white/90'>현장 안내</div>
          <div className='flex items-center justify-between border-b border-[#1e1e1e] py-2.5 text-[13px] last:border-b-0'>
            <span className='text-white/55'>행사</span>
            <span className='font-semibold text-white/90'>PlayX4</span>
          </div>
          <div className='flex items-center justify-between border-b border-[#1e1e1e] py-2.5 text-[13px] last:border-b-0'>
            <span className='text-white/55'>현장 참여 시</span>
            <span className='font-semibold text-white/90'>
              확정 명찰 현장 수령
            </span>
          </div>
          <div className='flex items-center justify-between border-b border-[#1e1e1e] py-2.5 text-[13px] last:border-b-0'>
            <span className='text-white/55'>불참 시</span>
            <span className='font-semibold text-white/90'>
              명찰 미지급 (별도 발송 불가)
            </span>
          </div>
        </Card>
      </FadeIn>

      {/* ── TBD Notice ── */}
      <FadeIn delay={300}>
        <Callout type='warning' icon={<TkcIcon name='warning' />}>
          결선 세부 규정(대진표, 곡 선택 규칙, 라운드별 경기 방식 등)은{' '}
          <strong className='text-white/80'>추후 공지</strong>될 예정입니다.
          공식 채널을 통해 안내됩니다.
        </Callout>
        <div className='mt-4 text-center'>
          <Link
            to='/arcade'
            className='inline-flex items-center gap-1.5 text-[13px] font-medium text-[#f5a623] transition-colors hover:text-[#f7d154]'
          >
            ← 온라인 예선 안내로 돌아가기
          </Link>
        </div>
      </FadeIn>
    </>
  )
}
