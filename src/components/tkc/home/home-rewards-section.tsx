import { Link } from '@tanstack/react-router'
import { FadeIn } from '@/components/tkc/guide-shared'
import { HomeSectionHead } from './home-section-head'

export function HomeRewardsSection() {
  return (
    <section className='mt-8 sm:mt-8 md:mt-10'>
      <FadeIn>
        <HomeSectionHead label='Rewards' title='보상'>
          <Link
            to='/rewards'
            className='text-sm text-white/55 transition-colors hover:text-[#f5a623]'
          >
            자세히 보기 →
          </Link>
        </HomeSectionHead>
      </FadeIn>

      <div className='grid gap-3 md:grid-cols-2'>
        <FadeIn delay={100}>
          <div className='group relative overflow-hidden rounded-xl border border-[#f5a623]/15 bg-[#111] transition-all hover:border-[#f5a623]/30'>
            <div className='absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-[#f5a623] via-[#f5a623]/40 to-transparent' />
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-[#f5a623]/[0.03] to-transparent' />

            <div className='relative p-6'>
              <div className='mb-4 flex items-start gap-3.5'>
                <div className='flex size-12 shrink-0 items-center justify-center rounded-[12px] border border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/15 to-[#f5a623]/[0.05] text-xl shadow-[0_0_16px_rgba(245,166,35,0.08)]'>
                  🏷️
                </div>
                <div>
                  <div className='mb-1 flex flex-wrap items-center gap-1.5'>
                    <span className='font-mono text-[12px] font-bold tracking-[1.5px] text-[#f5a623]'>
                      LIMITED NAMEPLATE
                    </span>
                    <span className='rounded bg-[#f5a623] px-1.5 py-0.5 text-[12px] leading-none font-bold text-[#0a0a0a]'>
                      한정
                    </span>
                  </div>
                  <h3 className='text-[17px] font-extrabold tracking-tight'>
                    TKC 2026 한정 명찰
                  </h3>
                </div>
              </div>

              <p className='mb-4 text-[13px] leading-relaxed break-keep text-white/50'>
                대회 참가와 결승 직관을 모두 완료한 참가자에게만 지급되는 한정
                명찰입니다.
              </p>

              <div className='mb-5 overflow-hidden rounded-lg border border-dashed border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/[0.02] to-transparent'>
                <div className='flex flex-col items-center justify-center gap-2 py-8 text-center'>
                  <span className='text-2xl opacity-40'>🏷️</span>
                  <span className='text-[12px] font-semibold text-white/30'>
                    명찰 디자인 미리보기
                  </span>
                  <span className='rounded-md bg-[#f5a623]/[0.06] px-2.5 py-1 font-mono text-[12px] font-bold tracking-[1.5px] text-[#f5a623]/40'>
                    COMING SOON
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-3'>
                {[
                  { num: '1', label: '엔트리 등록' },
                  { num: '2', label: '참가 확인' },
                  { num: '3', label: '현장 수령' },
                ].map((step) => (
                  <div
                    key={step.num}
                    className='flex items-center gap-1.5 rounded-md border border-[#f5a623]/15 bg-[#f5a623]/[0.05] px-2.5 py-1.5'
                  >
                    <span className='flex size-5 shrink-0 items-center justify-center rounded-[5px] bg-[#f5a623]/10 text-[12px] font-extrabold text-[#f5a623]'>
                      {step.num}
                    </span>
                    <span className='text-[12px] font-medium break-keep text-white/55 sm:text-[13px]'>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className='group relative overflow-hidden rounded-xl border border-[#e74c3c]/15 bg-[#111] transition-all hover:border-[#e74c3c]/30'>
            <div className='absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-[#e74c3c] via-[#e74c3c]/40 to-transparent' />
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-[#e74c3c]/[0.03] to-transparent' />

            <div className='relative p-6'>
              <div className='mb-4 flex items-start gap-3.5'>
                <div className='flex size-12 shrink-0 items-center justify-center rounded-[12px] border border-[#e74c3c]/20 bg-gradient-to-br from-[#e74c3c]/15 to-[#e74c3c]/[0.05] text-xl shadow-[0_0_16px_rgba(231,76,60,0.08)]'>
                  🎖️
                </div>
                <div>
                  <div className='mb-1 flex flex-wrap items-center gap-1.5'>
                    <span className='font-mono text-[11px] font-bold tracking-[1.5px] text-[#e74c3c] sm:text-[12px]'>
                      IN-GAME TITLE
                    </span>
                    <span className='rounded bg-[#e74c3c] px-1.5 py-0.5 text-[11px] leading-none font-bold text-white sm:text-[12px]'>
                      한정
                    </span>
                    <span className='rounded border border-[#e74c3c]/20 bg-[#e74c3c]/10 px-1.5 py-0.5 text-[11px] leading-none font-bold text-[#e74c3c] sm:text-[12px]'>
                      🇰🇷 KR ONLY
                    </span>
                  </div>
                  <h3 className='text-[17px] font-extrabold tracking-tight break-keep'>
                    아케이드 인게임 칭호
                  </h3>
                </div>
              </div>

              <p className='mb-4 text-[13px] leading-relaxed break-keep text-white/50'>
                대한민국 TKC 2026에서만 획득할 수 있는 한정 칭호입니다. 다른
                어떤 대회나 이벤트에서도 얻을 수 없으며, 결선 진출자 TOP 8
                전원에게 지급됩니다.
              </p>

              <div className='mb-5 overflow-hidden rounded-lg border border-dashed border-[#e74c3c]/20 bg-gradient-to-br from-[#e74c3c]/[0.02] to-transparent'>
                <div className='flex flex-col items-center justify-center gap-2 py-8 text-center'>
                  <span className='text-2xl opacity-40'>🎖️</span>
                  <span className='text-[12px] font-semibold text-white/30'>
                    칭호 디자인 미리보기
                  </span>
                  <span className='rounded-md bg-[#e74c3c]/[0.06] px-2.5 py-1 font-mono text-[12px] font-bold tracking-[1.5px] text-[#e74c3c]/40'>
                    COMING SOON
                  </span>
                </div>
              </div>

              <div className='flex flex-wrap gap-1.5'>
                <span className='inline-flex items-center gap-1 rounded-md border border-[#f5a623]/15 bg-[#f5a623]/10 px-2 py-1 text-[12px] font-semibold text-[#f5a623]'>
                  👑 우승
                </span>
                <span className='inline-flex rounded-md border border-[#a8b4c0]/12 bg-[#a8b4c0]/10 px-2 py-1 text-[12px] font-semibold text-[#a8b4c0]'>
                  준우승
                </span>
                <span className='inline-flex rounded-md border border-[#cd7f32]/12 bg-[#cd7f32]/10 px-2 py-1 text-[12px] font-semibold text-[#cd7f32]'>
                  3위
                </span>
                <span className='inline-flex rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[12px] font-semibold text-white/50'>
                  4위
                </span>
                <span className='inline-flex rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[12px] font-semibold text-white/50'>
                  5~8위
                </span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      <FadeIn delay={300}>
        <div className='relative mt-3 overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] px-5 py-4 sm:px-6'>
          <div className='absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-[#e74c3c] to-[#f5a623]' />
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <p className='text-[13px] break-keep text-white/50'>
              <span className='font-semibold text-white/70'>
                결선 입상자 보상
              </span>
              과 직관 보상, 그리고 콘솔 부문 개발진 사인 공식 상패가 제공됩니다.
            </p>
            <Link
              to='/rewards'
              className='shrink-0 rounded-lg border border-[#1e1e1e] px-4 py-2 text-[12px] font-semibold text-white/50 transition-all hover:border-white/20 hover:text-white'
            >
              전체 보상 보기 →
            </Link>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
