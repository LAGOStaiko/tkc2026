import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { cn } from '@/lib/utils'
import { PageHero, TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/rewards')({
  component: RewardsPage,
})

type SectionHeaderProps = {
  icon: string
  iconBg: string
  iconBorder: string
  title: string
  subtitle: string
}

function SectionHeader({
  icon,
  iconBg,
  iconBorder,
  title,
  subtitle,
}: SectionHeaderProps) {
  return (
    <div className='flex items-center gap-3'>
      <div
        className='flex size-9 shrink-0 items-center justify-center rounded-[10px] text-base'
        style={{ background: iconBg, border: iconBorder }}
      >
        {icon}
      </div>
      <div>
        <div className='text-[20px] font-extrabold tracking-tight text-white'>
          {title}
        </div>
        <div className='mt-0.5 text-[13px] text-white/45'>{subtitle}</div>
      </div>
    </div>
  )
}

function useOnceInView<T extends Element>({
  threshold = 0.15,
  rootMargin = '0px',
}: {
  threshold?: number
  rootMargin?: string
} = {}) {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (seen) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setSeen(true)
        observer.disconnect()
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin, seen, threshold])

  return { ref, seen }
}

function RewardsPage() {
  const title = t('nav.rewards')

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${title}`
  }, [title])

  return (
    <TkcSection className='space-y-10 md:space-y-14'>
      <PageHero
        badge='REWARDS'
        title={title}
        subtitle='TKC 2026 참가자 및 입상자 보상 안내입니다.'
      />

      <NameplateAndTitle />
      <ParticipantBase />
      <FinalsPrizes />
      <CommonNote />
    </TkcSection>
  )
}

function BannerFrame({
  accent,
  borderClassName,
  children,
  background,
}: {
  accent: string
  borderClassName: string
  background: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[18px] bg-[#111]',
        borderClassName
      )}
    >
      <div
        className='pointer-events-none absolute inset-0'
        style={{ background }}
      />
      <div
        className='pointer-events-none absolute top-0 right-0 left-0 h-[3px]'
        style={{
          background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0), ${accent})`,
          opacity: 0.9,
        }}
      />
      <div className='relative p-7 md:p-9'>{children}</div>
    </div>
  )
}

function PreviewSlot({
  variant,
  icon,
  title,
  desc,
  pulse = false,
  className,
}: {
  variant: 'gold' | 'red'
  icon: string
  title: string
  desc: string
  pulse?: boolean
  className?: string
}) {
  const accent = variant === 'gold' ? '#f5a623' : '#e74c3c'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[14px] border border-dashed',
        className
      )}
      style={{
        borderColor: `${accent}40`,
        background: `linear-gradient(135deg, ${accent}0d 0%, ${accent}05 100%)`,
      }}
    >
      <div className='flex min-h-[200px] flex-col items-center justify-center gap-3 p-8 text-center md:p-10'>
        <div
          className='flex size-14 items-center justify-center rounded-[14px] text-2xl'
          style={{
            background: `${accent}14`,
            border: `1px solid ${accent}1f`,
          }}
        >
          {icon}
        </div>
        <div className='text-sm font-bold text-white/50'>{title}</div>
        <div className='max-w-[280px] text-xs leading-relaxed text-white/25'>
          {desc}
        </div>
        <div
          className={cn(
            'rounded-md border px-3 py-1 font-mono text-[11px] font-bold tracking-[1.5px]',
            pulse && 'rewards-coming-pulse'
          )}
          style={{
            color: `${accent}66`,
            background: `${accent}0a`,
            borderColor: `${accent}1a`,
          }}
        >
          COMING SOON
        </div>
      </div>
    </div>
  )
}

function FlowStep({
  accent,
  num,
  icon,
  title,
  desc,
  highlight,
  active,
  showHighlight,
  shimmer = false,
}: {
  accent: string
  num: number
  icon: string
  title: string
  desc: string
  highlight: string
  active: boolean
  showHighlight: boolean
  shimmer?: boolean
}) {
  return (
    <div
      className={cn(
        'rewards-step relative rounded-[14px] border px-5 pb-5 pt-3 transition-all duration-300 hover:-translate-y-0.5',
        active && 'is-on',
        shimmer && 'rewards-shimmer'
      )}
      style={
        {
          '--rewards-accent': accent,
          background: `${accent}08`,
          borderColor: `${accent}1f`,
        } as React.CSSProperties
      }
    >
      <div className='mb-3 flex items-center gap-2.5'>
        <div
          className='rewards-step-badge flex size-[22px] shrink-0 items-center justify-center rounded-[7px] text-[11px] font-black'
          style={{
            background: accent,
            color: '#0a0a0a',
            boxShadow: `0 2px 10px ${accent}55`,
          }}
        >
          {num}
        </div>
        <div className='text-2xl leading-none'>{icon}</div>
      </div>
      <div className='mt-2 text-[15px] font-extrabold text-white'>{title}</div>
      <div className='mt-1 text-xs leading-relaxed text-white/50'>{desc}</div>
      <div
        className={cn(
          'rewards-step-highlight mt-3 inline-flex rounded-md border px-2.5 py-1 text-[11px] font-bold',
          showHighlight && 'is-on'
        )}
        style={{
          color: accent,
          background: `${accent}1a`,
          borderColor: `${accent}26`,
        }}
      >
        {highlight}
      </div>
    </div>
  )
}

function FlowConnector({
  accent,
  active,
}: {
  accent: string
  active: boolean
}) {
  return (
    <div className='flex items-center justify-center py-1 md:px-3 md:py-0'>
      <div
        aria-hidden={true}
        className={cn('rewards-connector', active && 'is-on')}
        style={
          {
            '--rewards-accent': accent,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

function NameplateBanner() {
  const gold = '#f5a623'
  const { ref: topRef, seen: topSeen } = useOnceInView<HTMLDivElement>({
    threshold: 0.18,
  })
  const { ref: flowRef, seen: flowSeen } = useOnceInView<HTMLDivElement>({
    threshold: 0.18,
    rootMargin: '0px 0px -10% 0px',
  })
  const { ref: previewRef, seen: previewSeen } = useOnceInView<HTMLDivElement>({
    threshold: 0.18,
  })

  const hasStartedRef = useRef(false)
  const timersRef = useRef<number[]>([])

  const [flowStage, setFlowStage] = useState(0)
  const [tag1On, setTag1On] = useState(false)
  const [tag2On, setTag2On] = useState(false)
  const [tag3On, setTag3On] = useState(false)
  const [shimmerOn, setShimmerOn] = useState(false)
  const [previewReady, setPreviewReady] = useState(false)

  const previewOn = previewReady && previewSeen

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
      timersRef.current = []
    }
  }, [])

  useEffect(() => {
    if (!flowSeen) return
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    const kickId = window.setTimeout(() => {
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
      if (reduceMotion) {
         setFlowStage(5)
         setTag1On(true)
         setTag2On(true)
         setTag3On(true)
         setShimmerOn(true)
         setPreviewReady(true)
         return
       }

      const isMobile = window.matchMedia('(max-width: 767px)').matches
      const gap = isMobile ? 300 : 400
      const arrowDur = isMobile ? 240 : 260
      const cardDur = 520
      const tagDelay = isMobile ? 180 : 240
      const previewDelay = isMobile ? 400 : 500

      const schedule = (fn: () => void, ms: number) => {
        const id = window.setTimeout(fn, ms)
        timersRef.current.push(id)
      }

      const tArrow1 = gap
      const tStep2 = tArrow1 + arrowDur
      const tArrow2 = tStep2 + cardDur + gap
      const tStep3 = tArrow2 + arrowDur
      const tDone = tStep3 + cardDur

      setFlowStage(1)

      schedule(() => setTag1On(true), cardDur + tagDelay)
      schedule(() => setFlowStage(2), tArrow1)
      schedule(() => setFlowStage(3), tStep2)
      schedule(() => setTag2On(true), tStep2 + cardDur + tagDelay)
      schedule(() => setFlowStage(4), tArrow2)
      schedule(() => setFlowStage(5), tStep3)
       schedule(() => setTag3On(true), tStep3 + cardDur + tagDelay)
       schedule(() => setShimmerOn(true), tDone + 90)
       schedule(() => setPreviewReady(true), tDone + previewDelay)
     }, 0)

     timersRef.current.push(kickId)
   }, [flowSeen])

  return (
    <BannerFrame
      accent={gold}
      borderClassName='border border-[#f5a623]/20'
      background={
        'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(245,166,35,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(245,166,35,0.06) 0%, transparent 55%)'
      }
    >
      <div className='flex flex-col gap-6'>
        <div ref={topRef} className={cn('rewards-enter', topSeen && 'is-on')}>
          <div className='flex flex-col gap-4 md:flex-row md:items-start md:gap-5'>
            <div
              className='relative flex size-[68px] shrink-0 items-center justify-center rounded-[18px] text-[30px]'
              style={{
                background:
                  'linear-gradient(135deg, rgba(245,166,35,0.22), rgba(245,166,35,0.06))',
                border: '1px solid rgba(245,166,35,0.25)',
                boxShadow:
                  '0 0 30px rgba(245,166,35,0.10), 0 4px 20px rgba(0,0,0,0.30)',
              }}
            >
              <div
                className='pointer-events-none absolute -inset-[3px] rounded-[20px] border'
                style={{ borderColor: 'rgba(245,166,35,0.08)' }}
              />
              📛
            </div>

            <div className='flex-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <span
                  className='font-mono text-[11px] font-bold tracking-[2px]'
                  style={{ color: gold }}
                >
                  LIMITED NAMEPLATE
                </span>
                <span
                  className='rounded px-2 py-0.5 text-[11px] font-bold tracking-wide'
                  style={{
                    background: gold,
                    color: '#0a0a0a',
                  }}
                >
                  한정
                </span>
              </div>
              <div className='mt-1 text-[26px] font-black tracking-tight text-white md:text-[28px]'>
                TKC 2026 한정 명찰
              </div>
              <p className='mt-1 text-[14px] leading-relaxed break-keep text-white/55'>
                대회 참가와 결승 직관을 모두 완료한 참가자에게만 지급되는 한정
                명찰입니다. 아래 세 단계를 모두 충족해야 수령할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        <div
          ref={flowRef}
          className={cn('rewards-flow-shell', flowStage >= 1 && 'is-on')}
        >
          <div
            className='mb-4 font-mono text-[11px] font-bold tracking-[1.5px]'
            style={{ color: `${gold}99` }}
          >
            <span
              className={cn('rewards-flow-label', flowStage >= 1 && 'is-on')}
              style={
                {
                  '--rewards-accent': gold,
                } as React.CSSProperties
              }
            >
              ACQUISITION FLOW
            </span>
          </div>

          <div className='grid grid-cols-1 items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-0'>
            <FlowStep
              accent={gold}
              num={1}
              icon='✍️'
              title='엔트리 등록'
              desc='대회 엔트리 시 결승 직관 여부를 체크합니다.'
              highlight='직관 희망 체크'
              active={flowStage >= 1}
              showHighlight={tag1On}
            />
            <FlowConnector accent={gold} active={flowStage >= 2} />
            <FlowStep
              accent={gold}
              num={2}
              icon='✅'
              title='참가 자격 확인'
              desc='엔트리 후 실제 대회 참가 여부가 확인됩니다.'
              highlight='참가 이력 검증'
              active={flowStage >= 3}
              showHighlight={tag2On}
            />
            <FlowConnector accent={gold} active={flowStage >= 4} />
            <FlowStep
              accent={gold}
              num={3}
              icon='🎁'
              title='현장 수령'
              desc='대회 당일 전시 부스에서 자격 확인 후 지급됩니다.'
              highlight='전시 부스 방문'
              active={flowStage >= 5}
              showHighlight={tag3On}
              shimmer={shimmerOn}
            />
          </div>
        </div>

        <div ref={previewRef}>
          <PreviewSlot
            variant='gold'
            icon='📛'
            title='명찰 디자인 미리보기'
            desc='실물 명찰 디자인이 공개되면 이 영역에 표시됩니다.'
            pulse={previewOn}
            className={cn('rewards-preview-curtain', previewOn && 'is-on')}
          />
        </div>
      </div>
    </BannerFrame>
  )
}

function TitleBanner() {
  const gold = '#f5a623'
  const red = '#e74c3c'
  const { ref, seen } = useOnceInView<HTMLDivElement>({ threshold: 0.18 })
  const { ref: previewRef, seen: previewSeen } = useOnceInView<HTMLDivElement>({
    threshold: 0.18,
  })
  const { ref: calloutsRef, seen: calloutsSeen } = useOnceInView<HTMLDivElement>({
    threshold: 0.18,
  })
  const { ref: chipsRef, seen: chipsSeen } = useOnceInView<HTMLDivElement>({
    threshold: 0.18,
  })

  const hasStartedRef = useRef(false)
  const timersRef = useRef<number[]>([])
  const [stage, setStage] = useState(0)
  const [iconGlow, setIconGlow] = useState(false)
  const [tagsIn, setTagsIn] = useState(false)
  const [borderFlash, setBorderFlash] = useState(false)

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
      timersRef.current = []
    }
  }, [])

  useEffect(() => {
    if (!seen) return
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    const kickId = window.setTimeout(() => {
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
      if (reduceMotion) {
        setStage(4)
        setIconGlow(true)
        setTagsIn(true)
        return
      }

      const isMobile = window.matchMedia('(max-width: 767px)').matches
      const enhanceDelay = isMobile ? 300 : 350
      const previewDelay = isMobile ? 900 : 1000
      const calloutsDelay = isMobile ? 520 : 620
      const chipsDelay = isMobile ? 450 : 520

      const schedule = (fn: () => void, ms: number) => {
        const id = window.setTimeout(fn, ms)
        timersRef.current.push(id)
      }

      setStage(1)
      schedule(() => setIconGlow(true), enhanceDelay)
      schedule(() => setTagsIn(true), enhanceDelay + 250)
      schedule(() => setStage(2), previewDelay)
      schedule(() => setStage(3), previewDelay + calloutsDelay)
      schedule(() => {
        setStage(4)
        setBorderFlash(true)
      }, previewDelay + calloutsDelay + chipsDelay)
    }, 0)

    timersRef.current.push(kickId)
  }, [seen])

  const callouts = [
    { icon: '🇰🇷', text: '대한민국 단독 개최' },
    { icon: '🏆', text: 'TKC 2026 한정 칭호' },
    { icon: '🔒', text: '재발급 · 타 경로 획득 불가' },
  ]

  const chips = [
    { label: '👑 우승', tone: 'gold' },
    { label: '준우승', tone: 'silver' },
    { label: '3위', tone: 'bronze' },
    { label: '4위', tone: 'default' },
    { label: '파이널리스트 (5~8위)', tone: 'default' },
  ] as const

  const previewOn = stage >= 2 && previewSeen
  const calloutsOn = stage >= 3 && calloutsSeen
  const chipsOn = stage >= 4 && chipsSeen

  return (
    <div ref={ref}>
      <BannerFrame
        accent={red}
        borderClassName={cn('border border-[#e74c3c]/20', borderFlash && 'rewards-border-flash')}
        background={
          'radial-gradient(ellipse 70% 50% at 80% 0%, rgba(231,76,60,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 10% 100%, rgba(231,76,60,0.05) 0%, transparent 55%)'
        }
      >
        <div className='flex flex-col gap-6'>
          <div className={cn('rewards-enter', stage >= 1 && 'is-on')}>
            <div className='flex flex-col gap-4 md:flex-row md:items-start md:gap-5'>
              <div
                className={cn(
                  'relative flex size-[68px] shrink-0 items-center justify-center rounded-[18px] text-[30px]',
                  iconGlow && 'rewards-icon-float-glow'
                )}
                style={{
                  background:
                    'linear-gradient(135deg, rgba(231,76,60,0.22), rgba(231,76,60,0.06))',
                  border: '1px solid rgba(231,76,60,0.25)',
                  boxShadow:
                    '0 0 30px rgba(231,76,60,0.10), 0 4px 20px rgba(0,0,0,0.30)',
                }}
              >
                <div
                  className='pointer-events-none absolute -inset-[3px] rounded-[20px] border'
                  style={{ borderColor: 'rgba(231,76,60,0.08)' }}
                />
                🎖️
              </div>

              <div className='flex-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span
                    className='font-mono text-[11px] font-bold tracking-[2px]'
                    style={{ color: red }}
                  >
                    IN-GAME TITLE
                  </span>
                  <span
                    className={cn(
                      'rewards-tag-pop rounded px-2 py-0.5 text-[11px] font-bold tracking-wide text-white',
                      tagsIn && 'is-on'
                    )}
                    style={{ background: red }}
                  >
                    한정
                  </span>
                  <span
                    className={cn(
                      'rewards-tag-pop rounded border px-2 py-0.5 text-[11px] font-bold',
                      tagsIn && 'is-on'
                    )}
                    style={{
                      color: red,
                      background: 'rgba(231,76,60,0.10)',
                      borderColor: 'rgba(231,76,60,0.20)',
                      animationDelay: '120ms',
                    }}
                  >
                    🇰🇷 KR ONLY
                  </span>
                </div>

                <div className='mt-1 text-[26px] font-black tracking-tight text-white md:text-[28px]'>
                  아케이드 인게임 칭호
                </div>
                <p className='mt-1 text-[14px] leading-relaxed break-keep text-white/55'>
                  <span className='font-bold' style={{ color: red }}>
                    대한민국 TKC 2026에서만
                  </span>{' '}
                  획득할 수 있는 한정 칭호입니다. 다른 어떤 대회나 이벤트에서도
                  얻을 수 없으며, 결선 진출자{' '}
                  <span className='font-bold text-white'>TOP 8</span> 전원에게
                  지급됩니다.
                </p>
              </div>
            </div>
          </div>

          <div ref={previewRef}>
            <PreviewSlot
              variant='red'
              icon='🎖️'
              title='인게임 칭호 미리보기'
              desc='칭호 디자인이 공개되면 이 영역에 표시됩니다.'
              pulse={previewOn}
              className={cn('rewards-preview-curtain', previewOn && 'is-on')}
            />
          </div>

          <div ref={calloutsRef} className='grid gap-2 md:grid-cols-3'>
            {callouts.map((x, i) => (
              <div
                key={x.text}
                className={cn(
                  'rewards-callout flex items-center gap-2 rounded-xl border px-4 py-3 text-[13px] font-semibold text-white/75',
                  calloutsOn && 'is-on'
                )}
                style={{
                  animationDelay: `${i * 140}ms`,
                  background: 'rgba(231,76,60,0.04)',
                  borderColor: 'rgba(231,76,60,0.12)',
                }}
              >
                <span
                  className='flex size-7 items-center justify-center rounded-lg border text-sm'
                  style={{
                    background: 'rgba(231,76,60,0.10)',
                    borderColor: 'rgba(231,76,60,0.15)',
                  }}
                >
                  {x.icon}
                </span>
                {x.text}
              </div>
            ))}
          </div>

          <div ref={chipsRef} className='flex flex-wrap gap-2'>
            {chips.map((chip, i) => {
              const tone =
                chip.tone === 'gold'
                  ? {
                      bg: 'rgba(245,166,35,0.10)',
                      border: 'rgba(245,166,35,0.15)',
                      color: gold,
                    }
                  : chip.tone === 'silver'
                    ? {
                        bg: 'rgba(168,180,192,0.10)',
                        border: 'rgba(168,180,192,0.12)',
                        color: '#a8b4c0',
                      }
                    : chip.tone === 'bronze'
                      ? {
                          bg: 'rgba(205,127,50,0.10)',
                          border: 'rgba(205,127,50,0.12)',
                          color: '#cd7f32',
                        }
                      : {
                          bg: 'rgba(128,128,128,0.08)',
                          border: 'rgba(128,128,128,0.12)',
                          color: 'rgba(255,255,255,0.55)',
                        }
              return (
                <span
                  key={chip.label}
                  className={cn(
                    'rewards-chip inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold',
                    chipsOn && 'is-on'
                  )}
                  style={{
                    animationDelay: `${i * 90}ms`,
                    background: tone.bg,
                    borderColor: tone.border,
                    color: tone.color,
                  }}
                >
                  {chip.label}
                </span>
              )
            })}
          </div>
        </div>
      </BannerFrame>
    </div>
  )
}

function NameplateAndTitle() {
  return (
    <div className='space-y-6 md:space-y-8'>
      <SectionHeader
        icon='🏷️'
        iconBg='rgba(245,166,35,0.10)'
        iconBorder='1px solid rgba(245,166,35,0.20)'
        title='명찰 · 칭호'
        subtitle='오프라인 한정 명찰 및 인게임 한정 칭호 안내'
      />
      <NameplateBanner />
      <TitleBanner />
    </div>
  )
}

function ParticipantBase() {
  return (
    <div className='space-y-5'>
      <SectionHeader
        icon='🎮'
        iconBg='rgba(128,128,128,0.08)'
        iconBorder='1px solid rgba(128,128,128,0.15)'
        title='참가자 공통'
        subtitle='대회 참가자 전원에게 제공되는 보상'
      />

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {[
          {
            icon: '📁',
            title: '대전 기록 아카이브',
            desc: '대회 홈페이지에 자신의 대전 기록이 영구 보존됩니다.',
          },
          {
            icon: '🎬',
            title: '엔딩크레딧 등재',
            desc: '대회 공식 엔딩크레딧에 이름이 등재됩니다.',
          },
          {
            icon: '📛',
            title: '직관 리워드',
            desc: '대회 참가 + 결승 직관 시 한정 명찰을 지급합니다.',
          },
        ].map((card) => (
          <div
            key={card.title}
            className='rounded-xl border border-white/10 bg-[#111] px-5 py-4 transition-colors hover:border-white/15'
          >
            <div className='text-xl'>{card.icon}</div>
            <div className='mt-2 text-sm font-bold text-white'>
              {card.title}
            </div>
            <div className='mt-1 text-xs leading-relaxed text-white/45'>
              {card.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

type PrizeCardTone = 'gold' | 'silver' | 'bronze' | 'neutral' | 'faint'

function PrizeCard({
  tone,
  badge,
  division,
  rank,
  title,
  desc,
  items,
}: {
  tone: PrizeCardTone
  badge: string
  division: 'ARCADE' | 'CONSOLE'
  rank: string
  title: string
  desc: string
  items: string[]
}) {
  const palette =
    tone === 'gold'
      ? {
          accent: '#f5a623',
          border: 'rgba(245,166,35,0.20)',
          left: '#f5a623',
          badgeBg:
            'linear-gradient(135deg, rgba(245,166,35,0.20), rgba(245,166,35,0.08))',
          badgeBorder: 'rgba(245,166,35,0.25)',
          tagBg: 'rgba(245,166,35,0.08)',
          tagBorder: 'rgba(245,166,35,0.12)',
          tagText: '#f5a623',
        }
      : tone === 'silver'
        ? {
            accent: '#a8b4c0',
            border: 'rgba(168,180,192,0.18)',
            left: '#a8b4c0',
            badgeBg:
              'linear-gradient(135deg, rgba(168,180,192,0.16), rgba(168,180,192,0.05))',
            badgeBorder: 'rgba(168,180,192,0.20)',
            tagBg: 'rgba(168,180,192,0.08)',
            tagBorder: 'rgba(168,180,192,0.12)',
            tagText: '#a8b4c0',
          }
        : tone === 'bronze'
          ? {
              accent: '#cd7f32',
              border: 'rgba(205,127,50,0.18)',
              left: '#cd7f32',
              badgeBg:
                'linear-gradient(135deg, rgba(205,127,50,0.16), rgba(205,127,50,0.05))',
              badgeBorder: 'rgba(205,127,50,0.20)',
              tagBg: 'rgba(205,127,50,0.08)',
              tagBorder: 'rgba(205,127,50,0.12)',
              tagText: '#cd7f32',
            }
          : tone === 'faint'
            ? {
                accent: 'rgba(255,255,255,0.45)',
                border: 'rgba(128,128,128,0.15)',
                left: 'rgba(255,255,255,0.18)',
                badgeBg: 'rgba(128,128,128,0.06)',
                badgeBorder: 'rgba(128,128,128,0.12)',
                tagBg: 'rgba(128,128,128,0.05)',
                tagBorder: 'rgba(128,128,128,0.08)',
                tagText: 'rgba(255,255,255,0.45)',
              }
            : {
                accent: 'rgba(255,255,255,0.55)',
                border: 'rgba(128,128,128,0.12)',
                left: 'rgba(255,255,255,0.22)',
                badgeBg: 'rgba(128,128,128,0.08)',
                badgeBorder: 'rgba(128,128,128,0.15)',
                tagBg: 'rgba(128,128,128,0.06)',
                tagBorder: 'rgba(128,128,128,0.10)',
                tagText: 'rgba(255,255,255,0.55)',
              }

  const divisionTag =
    division === 'ARCADE'
      ? {
          color: '#f5a623',
          bg: 'rgba(245,166,35,0.08)',
          border: 'rgba(245,166,35,0.12)',
        }
      : {
          color: '#e74c3c',
          bg: 'rgba(231,76,60,0.08)',
          border: 'rgba(231,76,60,0.12)',
        }

  return (
    <div
      className='relative overflow-hidden rounded-[14px] border bg-[#111] transition-all duration-300 hover:-translate-y-0.5'
      style={{
        borderColor: palette.border,
        borderLeftWidth: 3,
        borderLeftColor: palette.left,
      }}
    >
      <div
        className='pointer-events-none absolute inset-0 opacity-60'
        style={{
          background:
            tone === 'gold'
              ? 'linear-gradient(135deg, rgba(245,166,35,0.06) 0%, transparent 60%)'
              : tone === 'silver'
                ? 'linear-gradient(135deg, rgba(168,180,192,0.05) 0%, transparent 60%)'
                : tone === 'bronze'
                  ? 'linear-gradient(135deg, rgba(205,127,50,0.05) 0%, transparent 60%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%)',
        }}
      />

      <div className='relative flex gap-4 px-5 py-5 md:gap-5 md:px-7'>
        <div
          className='flex size-12 shrink-0 items-center justify-center rounded-[13px] text-lg font-black'
          style={{
            background: palette.badgeBg,
            border: `1px solid ${palette.badgeBorder}`,
            color: palette.accent,
          }}
        >
          {badge}
        </div>

        <div className='min-w-0 flex-1'>
          <span
            className='inline-flex rounded border px-2 py-0.5 font-mono text-[11px] font-bold tracking-[1.2px]'
            style={{
              color: divisionTag.color,
              background: divisionTag.bg,
              borderColor: divisionTag.border,
            }}
          >
            {division}
          </span>
          <div
            className='mt-1 font-mono text-[11px] font-bold tracking-[1.5px]'
            style={{ color: palette.accent }}
          >
            {rank}
          </div>
          <div className='text-[20px] font-extrabold tracking-tight text-white'>
            {title}
          </div>
          <div className='mt-0.5 text-[13px] leading-relaxed text-white/45'>
            {desc}
          </div>

          <div className='mt-3 flex flex-wrap gap-2'>
            {items.map((it) => (
              <span
                key={it}
                className='inline-flex items-center rounded-lg border px-3 py-1.5 text-[13px] font-semibold'
                style={{
                  background: palette.tagBg,
                  borderColor: palette.tagBorder,
                  color: palette.tagText,
                }}
              >
                {it}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DivisionSub({
  dot,
  label,
  note,
}: {
  dot: string
  label: string
  note: string
}) {
  return (
    <div className='flex items-center gap-2'>
      <span
        className='inline-block size-1.5 shrink-0 rounded-full'
        style={{ background: dot }}
      />
      <span className='text-sm font-bold text-white/90'>{label}</span>
      <span className='ml-auto text-xs text-white/40'>{note}</span>
    </div>
  )
}

function FinalsPrizes() {
  return (
    <div className='space-y-5'>
      <SectionHeader
        icon='🏆'
        iconBg='rgba(231,76,60,0.10)'
        iconBorder='1px solid rgba(231,76,60,0.20)'
        title='결선 입상자 상품'
        subtitle='각 부문별 결선 순위에 따른 상품 안내'
      />

      <div className='space-y-6'>
        <DivisionSub
          dot='#f5a623'
          label='아케이드 부문'
          note='인게임 칭호 + 시상식 판넬'
        />
        <div className='space-y-3'>
          <PrizeCard
            tone='gold'
            badge='👑'
            division='ARCADE'
            rank='CHAMPION'
            title='우승'
            desc='아케이드 부문 최종 우승자'
            items={['🎖️ 인게임 칭호 (우승)', '🖼️ 시상식 판넬']}
          />
          <PrizeCard
            tone='silver'
            badge='2'
            division='ARCADE'
            rank='RUNNER-UP'
            title='준우승'
            desc='아케이드 부문 결승 진출자'
            items={['🎖️ 인게임 칭호 (준우승)', '🖼️ 시상식 판넬']}
          />
          <PrizeCard
            tone='bronze'
            badge='3'
            division='ARCADE'
            rank='3RD PLACE'
            title='3위'
            desc='아케이드 부문 4강 진출자'
            items={['🎖️ 인게임 칭호 (3위)', '🖼️ 시상식 판넬']}
          />
          <PrizeCard
            tone='neutral'
            badge='4'
            division='ARCADE'
            rank='4TH PLACE'
            title='4위'
            desc='아케이드 부문 4강 진출자'
            items={['🎖️ 인게임 칭호 (4위)', '🖼️ 시상식 판넬']}
          />
          <PrizeCard
            tone='faint'
            badge='5–8'
            division='ARCADE'
            rank='FINALIST'
            title='파이널리스트'
            desc='아케이드 부문 결선 5~8위'
            items={['🎖️ 인게임 칭호 (파이널리스트)']}
          />
        </div>

        <div className='h-px bg-white/10' />

        <DivisionSub
          dot='#e74c3c'
          label='콘솔 부문'
          note='개발진 사인 상패 + 시상식 판넬'
        />
        <div className='space-y-3'>
          <PrizeCard
            tone='gold'
            badge='👑'
            division='CONSOLE'
            rank='CHAMPION'
            title='우승'
            desc='콘솔 부문 최종 우승자'
            items={['🏅 개발진 사인 공식 상패', '🖼️ 시상식 판넬']}
          />
          <PrizeCard
            tone='silver'
            badge='2'
            division='CONSOLE'
            rank='RUNNER-UP'
            title='준우승'
            desc='콘솔 부문 결승 진출자'
            items={['🏅 개발진 사인 공식 상패', '🖼️ 시상식 판넬']}
          />
          <PrizeCard
            tone='faint'
            badge='3–4'
            division='CONSOLE'
            rank='FINALIST'
            title='파이널리스트'
            desc='콘솔 부문 결선 3~4위'
            items={['🏅 개발진 사인 공식 상패']}
          />
        </div>
      </div>
    </div>
  )
}

function CommonNote() {
  return (
    <div className='relative overflow-hidden rounded-[14px] border border-white/10 bg-[#111] p-6'>
      <div
        className='pointer-events-none absolute inset-y-0 left-0 w-[3px]'
        style={{
          background: 'linear-gradient(180deg, #e74c3c, #f5a623)',
        }}
      />
      <div className='text-[15px] font-bold text-white'>공통 안내</div>
      <div className='mt-2 space-y-1 text-[13px] leading-relaxed text-white/45'>
        <div>
          · 시상식 판넬은 아케이드 상위 4명, 콘솔 상위 2명에게 지급됩니다.
        </div>
        <div>· 아케이드 인게임 칭호는 결선 진출자 8명 전원에게 지급됩니다.</div>
        <div>
          · 콘솔 공식 상패에는 개발진 사인이 포함되어 소장 가치를 높였습니다.
        </div>
        <div>· 보상 내용은 사정에 따라 변경될 수 있습니다.</div>
      </div>
    </div>
  )
}
