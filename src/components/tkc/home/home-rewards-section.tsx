import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/tkc/guide-shared'
import { HomeSectionHead } from './home-section-head'

const NAMEPLATE_SLIDES = [
  { src: '/branding/arcade-participant.jpg', label: 'ARCADE · Entrant' },
  { src: '/branding/arcade-swiss-stage.jpg', label: 'ARCADE · Swiss Stage' },
  { src: '/branding/arcade-finalist.jpg', label: 'ARCADE · Finalist' },
  { src: '/branding/console-participant.jpg', label: 'CONSOLE · Entrant' },
  { src: '/branding/console-finalist.jpg', label: 'CONSOLE · Finalist' },
] as const

function getCardPosition(slideIndex: number, activeIndex: number) {
  const count = NAMEPLATE_SLIDES.length
  let diff = slideIndex - activeIndex
  if (diff > Math.floor(count / 2)) diff -= count
  if (diff < -Math.floor(count / 2)) diff += count
  if (diff >= -2 && diff <= 2) return diff
  return null
}

const CARD_STYLES: Record<
  number,
  { transform: string; zIndex: number; opacity: number; filter: string }
> = {
  0: {
    transform: 'translateX(0) scale(1) rotateY(0deg)',
    zIndex: 5,
    opacity: 1,
    filter: 'brightness(1)',
  },
  1: {
    transform: 'translateX(110px) scale(0.78) rotateY(-8deg)',
    zIndex: 3,
    opacity: 0.55,
    filter: 'brightness(0.6)',
  },
  '-1': {
    transform: 'translateX(-110px) scale(0.78) rotateY(8deg)',
    zIndex: 3,
    opacity: 0.55,
    filter: 'brightness(0.6)',
  },
  2: {
    transform: 'translateX(170px) scale(0.6) rotateY(-12deg)',
    zIndex: 1,
    opacity: 0.2,
    filter: 'brightness(0.4)',
  },
  '-2': {
    transform: 'translateX(-170px) scale(0.6) rotateY(12deg)',
    zIndex: 1,
    opacity: 0.2,
    filter: 'brightness(0.4)',
  },
}

const HIDDEN_STYLE = {
  transform: 'translateX(0) scale(0.5)',
  zIndex: 0,
  opacity: 0,
  filter: 'brightness(0.4)',
}

function NameplateCarousel() {
  const [current, setCurrent] = useState(0)
  const [labelVisible, setLabelVisible] = useState(true)
  const timerRef = useRef<number | null>(null)
  const dragStartRef = useRef<number | null>(null)

  const count = NAMEPLATE_SLIDES.length

  const startAutoTimer = useCallback(() => {
    if (timerRef.current != null) clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % count
        setLabelVisible(false)
        setTimeout(() => setLabelVisible(true), 150)
        return next
      })
    }, 4000)
  }, [count])

  useEffect(() => {
    startAutoTimer()
    return () => {
      if (timerRef.current != null) clearInterval(timerRef.current)
    }
  }, [startAutoTimer])

  const goTo = useCallback(
    (index: number) => {
      const next = ((index % count) + count) % count
      setLabelVisible(false)
      setCurrent(next)
      setTimeout(() => setLabelVisible(true), 150)
      startAutoTimer()
    },
    [count, startAutoTimer]
  )

  const move = (dir: number) => {
    goTo(current + dir)
  }

  const handlePointerDown = (x: number) => {
    dragStartRef.current = x
  }

  const handlePointerUp = (x: number) => {
    if (dragStartRef.current == null) return
    const diff = x - dragStartRef.current
    dragStartRef.current = null
    if (Math.abs(diff) > 40) {
      move(diff > 0 ? -1 : 1)
    }
  }

  return (
    <div className='group/carousel nameplate-carousel relative mb-5 overflow-hidden rounded-lg border border-[#f5a623]/12'>
      <div
        className='nameplate-stage relative flex h-[280px] cursor-grab items-center justify-center overflow-hidden active:cursor-grabbing'
        style={{ perspective: '800px' }}
        onMouseDown={(e) => handlePointerDown(e.clientX)}
        onMouseUp={(e) => handlePointerUp(e.clientX)}
        onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
        onTouchEnd={(e) => handlePointerUp(e.changedTouches[0].clientX)}
      >
        {NAMEPLATE_SLIDES.map((slide, i) => {
          const pos = getCardPosition(i, current)
          const style = pos != null ? CARD_STYLES[pos] : HIDDEN_STYLE
          return (
            <div
              key={slide.label}
              className='absolute w-[160px] origin-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[transform,opacity]'
              style={{
                transform: style.transform,
                zIndex: style.zIndex,
                opacity: style.opacity,
                filter: style.filter,
                pointerEvents: pos != null ? 'auto' : 'none',
              }}
              onClick={() => {
                if (pos !== 0 && pos != null) move(pos)
              }}
            >
              <img
                src={slide.src}
                alt={slide.label}
                className={cn(
                  'w-full rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
                  pos === 0 &&
                    'shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_60px_rgba(220,50,30,0.15),0_0_20px_rgba(245,166,35,0.1)]'
                )}
                draggable={false}
              />
            </div>
          )
        })}
      </div>

      <button
        onClick={() => move(-1)}
        className='absolute top-1/2 left-2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#f5a623]/15 bg-black/50 text-[15px] text-[#f5a623]/70 opacity-0 backdrop-blur-md transition-all group-hover/carousel:opacity-100 hover:border-[#f5a623]/35 hover:bg-[#f5a623]/12 hover:text-[#f5a623]'
      >
        ‹
      </button>
      <button
        onClick={() => move(1)}
        className='absolute top-1/2 right-2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#f5a623]/15 bg-black/50 text-[15px] text-[#f5a623]/70 opacity-0 backdrop-blur-md transition-all group-hover/carousel:opacity-100 hover:border-[#f5a623]/35 hover:bg-[#f5a623]/12 hover:text-[#f5a623]'
      >
        ›
      </button>

      <div className='pb-0.5 text-center'>
        <span
          className={cn(
            'inline-block text-[12px] font-bold tracking-[1px] text-[#f5a623] transition-all duration-400',
            labelVisible
              ? 'translate-y-0 opacity-100'
              : 'translate-y-1 opacity-0'
          )}
        >
          {NAMEPLATE_SLIDES[current].label}
        </span>
      </div>

      <div className='flex items-center justify-center gap-[5px] pt-2 pb-3'>
        {NAMEPLATE_SLIDES.map((slide, i) => (
          <button
            key={slide.label}
            onClick={() => move(i - current)}
            className={cn(
              'h-[5px] rounded-full transition-all duration-350',
              i === current
                ? 'w-[18px] bg-[#f5a623] shadow-[0_0_8px_rgba(245,166,35,0.3)]'
                : 'w-[5px] bg-[#f5a623]/15 hover:bg-[#f5a623]/40'
            )}
          />
        ))}
      </div>
    </div>
  )
}

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

      <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
        {/* ── 한정 명찰 카드 ── */}
        <FadeIn delay={100} className='h-full'>
          <div className='group relative h-full overflow-hidden rounded-xl border border-[#f5a623]/15 bg-[#111] transition-all hover:border-[#f5a623]/30'>
            <div className='absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-[#f5a623] via-[#f5a623]/40 to-transparent' />
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-[#f5a623]/[0.03] to-transparent' />

            <div className='relative flex h-full flex-col p-6'>
              <div className='mb-4 flex items-start gap-3.5'>
                <div className='flex size-12 shrink-0 items-center justify-center rounded-[12px] border border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/15 to-[#f5a623]/[0.05] text-xl shadow-[0_0_16px_rgba(245,166,35,0.08)]'>
                  🏷️
                </div>
                <div>
                  <div className='mb-1 flex flex-wrap items-center gap-1.5 leading-none'>
                    <span className='inline-flex h-5 items-center font-mono text-[12px] leading-none font-bold tracking-[1.5px] whitespace-nowrap text-[#f5a623]'>
                      LIMITED NAMEPLATE
                    </span>
                    <span className='inline-flex h-5 items-center rounded bg-[#f5a623] px-1.5 text-[12px] leading-none font-bold whitespace-nowrap text-[#0a0a0a]'>
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

              <NameplateCarousel />

              <p className='mt-auto text-[12px] font-bold break-keep text-white/40'>
                온라인 예선 참가 후 결선 직관 시 지급
              </p>
            </div>
          </div>
        </FadeIn>

        {/* ── 인게임 칭호 카드 ── */}
        <FadeIn delay={200} className='h-full'>
          <div className='group relative h-full overflow-hidden rounded-xl border border-[#e74c3c]/15 bg-[#111] transition-all hover:border-[#e74c3c]/30'>
            <div className='absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-[#e74c3c] via-[#e74c3c]/40 to-transparent' />
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-[#e74c3c]/[0.03] to-transparent' />

            <div className='relative flex h-full flex-col p-6'>
              <div className='mb-4 flex items-start gap-3.5'>
                <div className='flex size-12 shrink-0 items-center justify-center rounded-[12px] border border-[#e74c3c]/20 bg-gradient-to-br from-[#e74c3c]/15 to-[#e74c3c]/[0.05] text-xl shadow-[0_0_16px_rgba(231,76,60,0.08)]'>
                  🎖️
                </div>
                <div>
                  <div className='mb-1 flex flex-wrap items-center gap-1.5 leading-none'>
                    <span className='inline-flex h-5 items-center font-mono text-[12px] leading-none font-bold tracking-[1.5px] whitespace-nowrap text-[#e74c3c]'>
                      IN-GAME TITLE
                    </span>
                    <span className='inline-flex h-5 items-center rounded bg-[#e74c3c] px-1.5 text-[12px] leading-none font-bold whitespace-nowrap text-white'>
                      한정
                    </span>
                    <span className='inline-flex h-5 items-center rounded border border-[#e74c3c]/20 bg-[#e74c3c]/10 px-1.5 text-[12px] leading-none font-bold whitespace-nowrap text-[#e74c3c]'>
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

              <div className='relative mb-5 flex min-h-[320px] flex-1 flex-col items-center justify-center gap-2.5 overflow-hidden rounded-lg border border-[#e74c3c]/12 bg-[radial-gradient(ellipse_at_50%_55%,_rgba(231,76,60,0.08)_0%,_rgba(231,76,60,0.02)_50%,_rgba(17,17,17,0.98)_80%)] px-5 py-9 text-center'>
                <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(231,76,60,0.06)_0%,_transparent_50%)]' />
                <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(231,76,60,0.04)_0%,_transparent_50%)]' />

                <span className='relative z-[1] font-mono text-[11px] font-bold tracking-[2px] text-[#e74c3c]/45 uppercase'>
                  EXCLUSIVE · TOP 8 FINALISTS
                </span>
                <div className='relative z-[1] h-0.5 w-8 rounded-full bg-gradient-to-r from-transparent via-[#e74c3c]/50 to-transparent' />
                <span className='relative z-[1] bg-gradient-to-br from-white from-30% to-[#e74c3c]/90 bg-clip-text text-[22px] font-black tracking-tight break-keep text-transparent'>
                  인게임 한정 칭호 증정
                </span>
              </div>

              <div className='mt-auto flex flex-wrap gap-1.5'>
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

        {/* ── 개발진 사인 공식 상패 카드 ── */}
        <FadeIn delay={300} className='h-full md:col-span-2 lg:col-span-1'>
          <div className='group relative h-full overflow-hidden rounded-xl border border-[#8b5cf6]/15 bg-[#111] transition-all hover:border-[#8b5cf6]/30'>
            <div className='absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-[#8b5cf6] via-[#8b5cf6]/40 to-transparent' />
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/[0.03] to-transparent' />

            <div className='relative flex h-full flex-col p-6'>
              <div className='mb-4 flex items-start gap-3.5'>
                <div className='flex size-12 shrink-0 items-center justify-center rounded-[12px] border border-[#8b5cf6]/20 bg-gradient-to-br from-[#8b5cf6]/15 to-[#8b5cf6]/[0.05] text-xl shadow-[0_0_16px_rgba(139,92,246,0.08)]'>
                  🏆
                </div>
                <div>
                  <div className='mb-1 flex flex-wrap items-center gap-1.5'>
                    <span className='font-mono text-[11px] font-bold tracking-[1.5px] text-[#8b5cf6] sm:text-[12px]'>
                      OFFICIAL PLAQUE
                    </span>
                    <span className='rounded bg-[#8b5cf6] px-1.5 py-0.5 text-[11px] leading-none font-bold text-white sm:text-[12px]'>
                      콘솔
                    </span>
                  </div>
                  <h3 className='text-[17px] font-extrabold tracking-tight break-keep'>
                    개발진 사인 공식 상패
                  </h3>
                </div>
              </div>

              <p className='mb-4 text-[13px] leading-relaxed break-keep text-white/50'>
                콘솔 부문 입상자에게 지급되는 태고의 달인 개발진 사인이 담긴
                공식 상패입니다.
              </p>

              <div className='relative mb-5 flex min-h-[320px] flex-1 flex-col items-center justify-center gap-2.5 overflow-hidden rounded-lg border border-dashed border-[#8b5cf6]/20 bg-[radial-gradient(ellipse_at_50%_55%,_rgba(139,92,246,0.08)_0%,_rgba(139,92,246,0.02)_50%,_rgba(17,17,17,0.98)_80%)] px-5 py-9 text-center'>
                <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(139,92,246,0.06)_0%,_transparent_50%)]' />
                <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(139,92,246,0.04)_0%,_transparent_50%)]' />

                <span className='relative z-[1] font-mono text-[11px] font-bold tracking-[2px] text-[#8b5cf6]/45 uppercase'>
                  CONSOLE DIVISION
                </span>
                <div className='relative z-[1] h-0.5 w-8 rounded-full bg-gradient-to-r from-transparent via-[#8b5cf6]/50 to-transparent' />
                <span className='relative z-[1] text-[12px] font-semibold text-white/30'>
                  상패 디자인 미리보기
                </span>
                <span className='relative z-[1] rounded-md bg-[#8b5cf6]/[0.06] px-2.5 py-1 font-mono text-[12px] font-bold tracking-[1.5px] text-[#8b5cf6]/40'>
                  COMING SOON
                </span>
              </div>

              <div className='mt-auto flex flex-wrap gap-1.5'>
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

      {/* ── 하단 배너 ── */}
      <FadeIn delay={400}>
        <div className='relative mt-3 overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] px-5 py-4 sm:px-6'>
          <div className='absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-[#e74c3c] to-[#f5a623]' />
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <p className='text-[13px] break-keep text-white/50'>
              <span className='font-semibold text-white/70'>
                결선 입상자 보상
              </span>
              과 직관 보상 등 자세한 보상 내역을 확인하세요.
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
