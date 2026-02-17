import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useCanHover } from '@/components/tkc/home/use-can-hover'

const HERO_ASSETS = {
  heroBg: '/branding/v2/hero-bg.webp',
  heroMain: '/branding/v2/hero-title.webp',
  heroSide: '/branding/v2/hero-side.webp',
  heroTitle: '/branding/v2/hero-main.webp',
}

const HERO_LAYER_COUNT = 4

export function HomeHeroSection() {
  const canHover = useCanHover()
  const [heroAnimOn, setHeroAnimOn] = useState(false)
  const [loadedLayerCount, setLoadedLayerCount] = useState(0)
  const [mobilePressedButton, setMobilePressedButton] = useState<
    'apply' | 'schedule' | null
  >(null)
  const heroAnimStartedRef = useRef(false)
  const heroAnimRafRef = useRef<number | null>(null)
  const heroAnimFallbackTimerRef = useRef<number | null>(null)
  const mobilePressedTimerRef = useRef<number | null>(null)

  const startHeroAnimation = () => {
    if (heroAnimStartedRef.current) return
    heroAnimStartedRef.current = true
    heroAnimRafRef.current = window.requestAnimationFrame(() =>
      setHeroAnimOn(true)
    )
  }

  const markHeroLayerReady = () => {
    setLoadedLayerCount((prev) => Math.min(prev + 1, HERO_LAYER_COUNT))
  }

  const triggerMobileButtonFx = (button: 'apply' | 'schedule') => {
    setMobilePressedButton(button)
    if (mobilePressedTimerRef.current != null) {
      window.clearTimeout(mobilePressedTimerRef.current)
    }
    mobilePressedTimerRef.current = window.setTimeout(() => {
      setMobilePressedButton(null)
      mobilePressedTimerRef.current = null
    }, 220)
  }

  useEffect(() => {
    if (loadedLayerCount >= HERO_LAYER_COUNT) startHeroAnimation()
  }, [loadedLayerCount])

  useEffect(() => {
    heroAnimFallbackTimerRef.current = window.setTimeout(() => {
      startHeroAnimation()
    }, 1200)

    return () => {
      if (heroAnimFallbackTimerRef.current != null) {
        window.clearTimeout(heroAnimFallbackTimerRef.current)
      }
      if (heroAnimRafRef.current != null) {
        window.cancelAnimationFrame(heroAnimRafRef.current)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (mobilePressedTimerRef.current != null) {
        window.clearTimeout(mobilePressedTimerRef.current)
      }
    }
  }, [])

  return (
    <section
      className={cn(
        '-mx-4 -mt-20 overflow-hidden md:-mx-6 md:-mt-24',
        heroAnimOn && 'hero-anim'
      )}
    >
      <div className='relative h-[340px] sm:h-[380px] md:h-[520px] lg:h-[560px]'>
        <div className='hero-layer hero-layer-bg absolute inset-0 z-[1] flex items-center justify-center'>
          <img
            src={HERO_ASSETS.heroBg}
            alt=''
            className='h-full w-full object-cover object-[center_top] md:object-center'
            loading='eager'
            draggable={false}
            onLoad={markHeroLayerReady}
            onError={markHeroLayerReady}
          />
        </div>

        <div className='hero-layer hero-layer-side absolute inset-0 z-[2] flex items-center justify-center'>
          <img
            src={HERO_ASSETS.heroSide}
            alt=''
            className='h-full w-full object-cover object-[center_top] md:object-center'
            loading='eager'
            draggable={false}
            onLoad={markHeroLayerReady}
            onError={markHeroLayerReady}
          />
        </div>

        <div className='hero-layer hero-layer-main absolute inset-0 z-[3] flex items-center justify-center'>
          <img
            src={HERO_ASSETS.heroMain}
            alt=''
            className='h-full w-full object-cover object-[center_top] md:object-center'
            loading='eager'
            draggable={false}
            onLoad={markHeroLayerReady}
            onError={markHeroLayerReady}
          />
        </div>

        <div className='hero-layer hero-layer-title absolute inset-0 z-[4] flex items-center justify-center'>
          <img
            src={HERO_ASSETS.heroTitle}
            alt=''
            className='h-full w-full object-cover object-[center_top] md:object-center'
            loading='eager'
            draggable={false}
            onLoad={markHeroLayerReady}
            onError={markHeroLayerReady}
          />
        </div>

        <div className='hero-flash pointer-events-none absolute inset-0 z-10' />
        <div className='hero-grad-top absolute inset-x-0 top-0 z-[5] h-32 bg-gradient-to-b from-black/60 to-transparent' />
        <div className='hero-grad-bottom absolute inset-x-0 bottom-0 z-[5] h-3/4 bg-gradient-to-t from-black via-black/70 to-transparent' />

        <div className='hero-cta absolute inset-x-0 bottom-0 z-[6] px-6 pb-6 md:hidden'>
          <div className='mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-[7px] font-mono text-[12px] font-semibold tracking-[1.5px] text-[#e74c3c] backdrop-blur-md'>
            <span className='tkc-motion-dot size-1.5 rounded-full bg-[#e74c3c] shadow-[0_0_8px_#e74c3c]' />
            TAIKO KOREA CHAMPIONSHIP
          </div>
          <h1 className='text-[28px] leading-[1.15] font-extrabold tracking-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]'>
            <span className='bg-gradient-to-br from-[#e74c3c] to-[#f5a623] bg-clip-text text-transparent'>
              태고의 달인
            </span>
            <br />
            <span className='text-white'>코리아 챔피언십 2026</span>
          </h1>
          <p className='mt-2 text-[13px] leading-[1.55] font-light break-keep text-white/60 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]'>
            PlayX4 2026에서 만나는 태고의 달인 공식 대회
          </p>
        </div>

        <div className='hero-cta absolute inset-x-0 bottom-0 z-[6] hidden px-8 pb-10 md:block'>
          <div className='mx-auto max-w-[1200px]'>
            <div className='mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#e74c3c]/20 bg-[#e74c3c]/[0.08] px-4 py-[7px] font-mono text-[12px] font-semibold tracking-[1.5px] text-[#e74c3c]'>
              <span className='tkc-motion-dot size-1.5 rounded-full bg-[#e74c3c] shadow-[0_0_8px_#e74c3c]' />
              TAIKO KOREA CHAMPIONSHIP
            </div>
            <div className='flex flex-row items-center gap-3'>
              <Link
                to='/apply'
                className='group/cta tkc-motion-lift relative inline-flex items-center justify-center rounded-lg px-7 py-3 text-[15px] font-semibold text-white'
                style={{
                  background: '#e74c3c',
                  boxShadow: '0 4px 24px rgba(231,76,60,0.25)',
                }}
              >
                <span
                  className={cn(
                    canHover &&
                      'transition-opacity duration-300 md:group-hover/cta:opacity-0'
                  )}
                >
                  대회 신청하기
                </span>
                <img
                  src='/characters/don-wink.png'
                  alt=''
                  className={cn(
                    'pointer-events-none invisible absolute inset-0 m-auto h-9 w-9 scale-75 object-contain opacity-0',
                    canHover &&
                      'transition-all duration-300 md:group-hover/cta:visible md:group-hover/cta:scale-100 md:group-hover/cta:opacity-100'
                  )}
                  draggable={false}
                />
              </Link>
              <Link
                to='/schedule'
                className='group/cta2 tkc-motion-lift relative inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-6 py-3 text-[15px] font-semibold text-white/80 backdrop-blur-sm hover:border-white/30 hover:bg-white/[0.1] hover:text-white'
              >
                <span
                  className={cn(
                    canHover &&
                      'transition-opacity duration-300 md:group-hover/cta2:opacity-0'
                  )}
                >
                  일정 보기 →
                </span>
                <img
                  src='/characters/katsu-wink.png'
                  alt=''
                  className={cn(
                    'pointer-events-none invisible absolute inset-0 m-auto h-9 w-9 scale-75 object-contain opacity-0',
                    canHover &&
                      'transition-all duration-300 md:group-hover/cta2:visible md:group-hover/cta2:scale-100 md:group-hover/cta2:opacity-100'
                  )}
                  draggable={false}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-2.5 px-6 pt-4 pb-6 md:hidden'>
        <Link
          to='/apply'
          className='group/cta tkc-motion-lift relative inline-flex w-full items-center justify-center rounded-lg px-7 py-3 text-[15px] font-semibold text-white'
          onClick={() => triggerMobileButtonFx('apply')}
          style={{
            background: '#e74c3c',
            boxShadow: '0 4px 24px rgba(231,76,60,0.25)',
          }}
        >
          <span
            className={cn(
              'transition-opacity duration-200',
              mobilePressedButton === 'apply' && 'opacity-0'
            )}
          >
            대회 신청하기
          </span>
          <img
            src='/characters/don-wink.png'
            alt=''
            className={cn(
              'pointer-events-none absolute inset-0 m-auto h-8 w-8 object-contain transition-all duration-200',
              mobilePressedButton === 'apply'
                ? 'visible scale-100 opacity-100'
                : 'invisible scale-75 opacity-0'
            )}
            draggable={false}
          />
        </Link>
        <Link
          to='/schedule'
          className='group/cta2 tkc-motion-lift relative inline-flex w-full items-center justify-center rounded-lg border border-[#1e1e1e] px-6 py-3 text-[15px] font-semibold text-white/65 hover:border-white/30 hover:bg-white/[0.03] hover:text-white'
          onClick={() => triggerMobileButtonFx('schedule')}
        >
          <span
            className={cn(
              'transition-opacity duration-200',
              mobilePressedButton === 'schedule' && 'opacity-0'
            )}
          >
            일정 보기 →
          </span>
          <img
            src='/characters/katsu-wink.png'
            alt=''
            className={cn(
              'pointer-events-none absolute inset-0 m-auto h-8 w-8 object-contain transition-all duration-200',
              mobilePressedButton === 'schedule'
                ? 'visible scale-100 opacity-100'
                : 'invisible scale-75 opacity-0'
            )}
            draggable={false}
          />
        </Link>
      </div>
    </section>
  )
}
