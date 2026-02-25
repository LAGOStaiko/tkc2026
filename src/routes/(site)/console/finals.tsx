import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Callout,
  Card,
  DetailRow,
  FadeIn,
  TkcIcon,
} from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/console/finals')({
  component: ConsoleFinalsPage,
})

/* ════════════════════════════════════════════════════════════════════ */
/*  Constants                                                          */
/* ════════════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { id: 'overview', label: '대회 구조' },
  { id: 'bracket', label: '대진표' },
  { id: 'prep', label: '곡 준비' },
  { id: 'banpick', label: '밴픽 절차' },
  { id: 'rounds', label: '라운드별 규정' },
]

const FLOW_CARDS = [
  {
    step: 'STEP 01',
    label: '결선 참가',
    value: '4명 단판\n토너먼트',
    sub: '예선 상위 4명 진출',
    hasArrow: true,
  },
  {
    step: 'STEP 02',
    label: '선곡 방식',
    value: '밴픽 시스템',
    sub: '4곡 준비, 상대 곡 1곡 밴',
    gold: true,
  },
  {
    step: '라운드 구성',
    label: '',
    value: '4강 · 3·4위 · 결승',
    sub: '4강 2경기 · 3·4위 1경기 · 결승 1경기',
  },
  {
    step: '과제곡',
    label: '',
    value: '매 라운드 1곡',
    sub: '총 3곡 · 당일 현장 공개',
  },
] as const

const SF_MATCHES = [
  { label: 'SF 1', seeds: ['1', '4'], names: ['예선 1위', '예선 4위'] },
  { label: 'SF 2', seeds: ['2', '3'], names: ['예선 2위', '예선 3위'] },
] as const

const BP_STANDARD = [
  { step: 'STEP 01', player: 'A', type: 'ban' as const, note: '상대 곡 1곡' },
  { step: 'STEP 02', player: 'B', type: 'ban' as const, note: '상대 곡 1곡' },
  { step: 'STEP 03', player: 'A', type: 'pick' as const, note: '자기 곡 1곡' },
  { step: 'STEP 04', player: 'B', type: 'pick' as const, note: '자기 곡 1곡' },
] as const

const BP_FINALS = [
  { step: 'STEP 01', player: 'A', type: 'ban' as const, note: '상대 곡 1곡' },
  { step: 'STEP 02', player: 'B', type: 'ban' as const, note: '상대 곡 1곡' },
  {
    step: 'STEP 03',
    player: 'A',
    type: 'pick' as const,
    note: '자기 곡에서 2곡 선택',
  },
  {
    step: 'STEP 04',
    player: 'B',
    type: 'pick' as const,
    note: '자기 곡에서 2곡 선택',
  },
] as const

const ROUND_DETAILS: {
  name: string
  picks: string
  total: string
  highlight?: boolean
}[] = [
  { name: '4강', picks: '각 1곡 선곡', total: '3곡' },
  { name: '3·4위', picks: '각 1곡 선곡', total: '3곡' },
  { name: '결승', picks: '각 2곡 선곡', total: '5곡', highlight: true },
]

/* ════════════════════════════════════════════════════════════════════ */
/*  Utility Components                                                 */
/* ════════════════════════════════════════════════════════════════════ */

function SectionBlock({
  id,
  category,
  title,
  desc,
  children,
}: {
  id: string
  category: string
  title: string
  desc: string
  children: ReactNode
}) {
  return (
    <section id={id} data-section={id} className='mb-20'>
      {id !== 'overview' && (
        <div className='mb-12 h-px bg-gradient-to-r from-transparent via-[#333] to-transparent' />
      )}
      <FadeIn>
        <div className='mb-2 font-mono text-xs font-semibold tracking-[1px] text-[#e74c3c] uppercase'>
          {category}
        </div>
        <h2 className='mb-3 text-2xl font-bold tracking-tight text-white/90 md:text-[32px]'>
          {title}
        </h2>
        <p className='mb-8 max-w-[640px] text-[15px] leading-[1.55] font-light break-keep text-white/55'>
          {desc}
        </p>
      </FadeIn>
      <div className='space-y-5'>{children}</div>
    </section>
  )
}

function MatchCard({
  label,
  rows,
}: {
  label: string
  rows: { seed: string; name: string; seedCls: string }[]
}) {
  return (
    <div className='overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] transition-colors hover:border-[#2a2a2a]'>
      <div className='border-b border-[#1e1e1e] bg-white/[0.02] px-3 py-1.5 text-center font-mono text-[11px] font-semibold tracking-[1px] text-white/35 uppercase'>
        {label}
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-2.5 text-[15px] ${i < rows.length - 1 ? 'border-b border-[#1e1e1e]' : ''}`}
        >
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-semibold ${r.seedCls}`}
          >
            {r.seed}
          </span>
          <span
            className={`font-semibold ${r.seed === '?' ? 'text-white/35' : 'text-white/90'}`}
          >
            {r.name}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Sections                                                           */
/* ════════════════════════════════════════════════════════════════════ */

function OverviewSection() {
  return (
    <SectionBlock
      id='overview'
      category='OVERVIEW'
      title='대회 구조'
      desc='4명 단판 토너먼트. 밴픽 전략과 과제곡이 승패를 좌우합니다.'
    >
      {/* Main 2×2 flow grid + Bottom strip */}
      <div>
        <div className='grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#2a2a2a] sm:grid-cols-2'>
          {FLOW_CARDS.map((card) => (
            <div
              key={card.step}
              className='relative bg-[#141414] px-6 py-7 transition-colors hover:bg-[#1a1a1a]'
            >
              <div className='mb-1.5 font-mono text-[11px] font-bold tracking-[1.5px] text-[#b83a30] uppercase'>
                {card.step}
              </div>
              {card.label && (
                <div className='mb-1 text-[12px] text-white/50'>
                  {card.label}
                </div>
              )}
              <div
                className={`text-[22px] leading-[1.3] font-black tracking-tight whitespace-pre-line ${
                  'gold' in card && card.gold
                    ? 'text-[#f5a623]'
                    : 'text-white/90'
                }`}
              >
                {card.value}
              </div>
              <div className='mt-1.5 text-[12px] leading-relaxed whitespace-pre-line text-white/40'>
                {card.sub}
              </div>
              {'hasArrow' in card && card.hasArrow && (
                <span className='absolute top-1/2 right-0 z-[2] hidden translate-x-1/2 -translate-y-1/2 text-sm text-[#b83a30] sm:block'>
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        <div className='mt-0.5 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] sm:grid-cols-2'>
          <div className='flex items-center gap-3.5 bg-[#141414] px-6 py-5 transition-colors hover:bg-[#1a1a1a]'>
            <div className='flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-[#e74c3c]/15 bg-[#e74c3c]/[0.08]'>
              <svg
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='#e74c3c'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <circle cx='12' cy='12' r='10' />
                <polyline points='12 6 12 12 16 14' />
              </svg>
            </div>
            <div>
              <div className='text-[11px] text-white/50'>대회 일시</div>
              <div className='text-[15px] font-bold text-white/90'>
                추후 공지
              </div>
            </div>
          </div>
          <div className='flex items-center gap-3.5 bg-[#141414] px-6 py-5 transition-colors hover:bg-[#1a1a1a]'>
            <div className='flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-[#e74c3c]/15 bg-[#e74c3c]/[0.08]'>
              <svg
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='#e74c3c'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z' />
                <circle cx='12' cy='10' r='3' />
              </svg>
            </div>
            <div>
              <div className='text-[11px] text-white/50'>대회 장소</div>
              <div className='text-[15px] font-bold text-white/90'>PlayX4</div>
            </div>
          </div>
        </div>
      </div>

      <Callout type='info' icon={<TkcIcon name='info' />}>
        사전 조사 시 불참자가 있을 경우,{' '}
        <strong className='text-white/80'>예비번호 순서대로 올림 처리</strong>
        합니다.
      </Callout>
    </SectionBlock>
  )
}

function BracketSection() {
  const [inView, setInView] = useState(false)
  const bracketRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bracketRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const tbd = 'bg-white/[0.03] text-white/35'
  const hi = 'bg-[#e74c3c]/10 text-[#e74c3c]'
  const lo = 'bg-[#f5a623]/[0.08] text-[#f5a623]'

  const anim = (name: string, delay: number, extra = '') =>
    inView
      ? {
          opacity: 0 as const,
          animation: `${name} 0.45s ease-out ${delay}ms forwards${extra ? `, ${extra}` : ''}`,
        }
      : { opacity: 0 as const }

  const sweep = (delay: number) =>
    inView
      ? {
          transformOrigin: 'left' as const,
          transform: 'scaleX(0)',
          animation: `bracket-sweep 0.5s ease-out ${delay}ms forwards`,
        }
      : { transform: 'scaleX(0)' }

  return (
    <SectionBlock
      id='bracket'
      category='BRACKET'
      title='4강 대진표'
      desc='예선 결과에 따라 시드를 배치합니다. 1위 vs 4위, 2위 vs 3위.'
    >
      <style>{`
        @keyframes bracket-col-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bracket-card-in {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes bracket-sweep {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes bracket-arrow-bounce {
          0% { opacity: 0; transform: translateY(-8px); }
          70% { opacity: 0.6; transform: translateY(2px); }
          100% { opacity: 0.6; transform: translateY(0); }
        }
        @keyframes bracket-final-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(231,76,60,0); border-radius: 12px; }
          50% { box-shadow: 0 0 20px 4px rgba(231,76,60,0.12); border-radius: 12px; }
        }
        @keyframes bracket-3rd-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,166,35,0); border-radius: 12px; }
          50% { box-shadow: 0 0 20px 4px rgba(245,166,35,0.12); border-radius: 12px; }
        }
      `}</style>

      <div ref={bracketRef}>
        {/* Desktop Bracket */}
        <div className='hidden gap-4 sm:grid sm:grid-cols-2'>
          {/* Semifinals */}
          <div style={anim('bracket-col-in', 0)}>
            <div className='relative mb-2.5 pb-2 text-center font-mono text-xs font-semibold tracking-[1px] text-white/35 uppercase'>
              <div
                className='absolute right-0 bottom-0 left-0 h-0.5 bg-[#e74c3c]'
                style={sweep(150)}
              />
              Semifinals
            </div>
            <div className='space-y-2'>
              {SF_MATCHES.map((m, i) => (
                <div
                  key={m.label}
                  style={anim('bracket-card-in', 250 + i * 80)}
                >
                  <MatchCard
                    label={m.label}
                    rows={[
                      { seed: m.seeds[0], name: m.names[0], seedCls: hi },
                      { seed: m.seeds[1], name: m.names[1], seedCls: lo },
                    ]}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Grand Final */}
          <div style={anim('bracket-col-in', 550)}>
            <div className='relative mb-2.5 pb-2 text-center font-mono text-xs font-semibold tracking-[1px] text-white/35 uppercase'>
              <div
                className='absolute right-0 bottom-0 left-0 h-0.5 bg-[#e74c3c]'
                style={sweep(700)}
              />
              Grand Final
            </div>
            <div
              style={anim(
                'bracket-card-in',
                800,
                'bracket-final-glow 2s ease-in-out 1250ms'
              )}
            >
              <MatchCard
                label='Final'
                rows={[
                  { seed: '?', name: 'SF1 승자', seedCls: tbd },
                  { seed: '?', name: 'SF2 승자', seedCls: tbd },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Mobile Bracket */}
        <div className='space-y-4 sm:hidden'>
          <div style={anim('bracket-col-in', 0)}>
            <div className='relative mb-2.5 pb-2 text-center font-mono text-xs font-semibold tracking-[1px] text-white/35 uppercase'>
              <div
                className='absolute right-0 bottom-0 left-0 h-0.5 bg-[#e74c3c]'
                style={sweep(150)}
              />
              Semifinals
            </div>
            <div className='space-y-2'>
              {SF_MATCHES.map((m, i) => (
                <div
                  key={m.label}
                  style={anim('bracket-card-in', 250 + i * 80)}
                >
                  <MatchCard
                    label={m.label}
                    rows={[
                      { seed: m.seeds[0], name: m.names[0], seedCls: hi },
                      { seed: m.seeds[1], name: m.names[1], seedCls: lo },
                    ]}
                  />
                </div>
              ))}
            </div>
          </div>
          <div
            className='py-1 text-center font-mono text-[11px] font-semibold tracking-[1px] text-[#e74c3c]'
            style={
              inView
                ? {
                    opacity: 0 as const,
                    animation:
                      'bracket-arrow-bounce 0.5s ease-out 480ms forwards',
                  }
                : { opacity: 0 as const }
            }
          >
            ▼ 승자 진출
          </div>
          <div style={anim('bracket-col-in', 550)}>
            <div className='relative mb-2.5 pb-2 text-center font-mono text-xs font-semibold tracking-[1px] text-white/35 uppercase'>
              <div
                className='absolute right-0 bottom-0 left-0 h-0.5 bg-[#e74c3c]'
                style={sweep(700)}
              />
              Grand Final
            </div>
            <div
              style={anim(
                'bracket-card-in',
                800,
                'bracket-final-glow 2s ease-in-out 1250ms'
              )}
            >
              <MatchCard
                label='Final'
                rows={[
                  { seed: '?', name: 'SF1 승자', seedCls: tbd },
                  { seed: '?', name: 'SF2 승자', seedCls: tbd },
                ]}
              />
            </div>
          </div>
        </div>

        {/* 3rd Place Match */}
        <div
          className='mx-auto mt-5 max-w-[300px]'
          style={anim('bracket-col-in', 950)}
        >
          <div className='relative mb-2.5 pb-2 text-center font-mono text-xs font-semibold tracking-[1px] text-white/35 uppercase'>
            <div
              className='absolute right-0 bottom-0 left-0 h-0.5 bg-[#f5a623]'
              style={sweep(1050)}
            />
            3·4위전
          </div>
          <div
            style={anim(
              'bracket-card-in',
              1150,
              'bracket-3rd-glow 2s ease-in-out 1600ms'
            )}
          >
            <MatchCard
              label='3rd Place'
              rows={[
                { seed: '?', name: 'SF1 패자', seedCls: tbd },
                { seed: '?', name: 'SF2 패자', seedCls: tbd },
              ]}
            />
          </div>
        </div>
      </div>

      <Callout type='warning' icon={<TkcIcon name='warning' />}>
        4강 <strong className='text-white/80'>패자</strong>는 3·4위전, 4강{' '}
        <strong className='text-white/80'>승자</strong>는 결승에 진출합니다.
      </Callout>
    </SectionBlock>
  )
}

function PrepSection() {
  return (
    <SectionBlock
      id='prep'
      category='SONG PREP'
      title='곡 준비 규정'
      desc='참가자는 1인당 총 4곡을 사전에 준비하여 제출합니다. 곡 목록은 대회 전에 공개됩니다.'
    >
      {/* Flow — unified responsive */}
      <div className='flex flex-col gap-0 sm:flex-row sm:items-stretch'>
        {[
          {
            num: '4',
            label: '사전 준비 곡',
            desc: '곡 선택 추후 공지',
            color: '#e74c3c',
          },
          {
            num: '밴',
            label: '상대가 제거',
            desc: '해당 매치 사용 불가',
            color: undefined,
          },
          {
            num: '픽',
            label: '잔여 곡 선택',
            desc: '경기에 사용할 곡 확정',
            color: '#f5a623',
          },
        ].map((step, i) => (
          <div key={step.label} className='flex flex-1 flex-col sm:flex-row sm:items-center'>
            <div
              className={`flex-1 border border-[#1e1e1e] bg-[#111] px-4 py-6 text-center sm:py-7 ${
                i === 0
                  ? 'rounded-t-2xl sm:rounded-none sm:rounded-l-2xl'
                  : i === 2
                    ? 'rounded-b-2xl sm:rounded-none sm:rounded-r-2xl'
                    : ''
              }`}
            >
              <div
                className='text-[36px] font-extrabold'
                style={{ color: step.color ?? 'rgba(255,255,255,0.9)' }}
              >
                {step.num}
              </div>
              <div className='mt-1.5 text-[15px] font-bold text-white/90'>
                {step.label}
              </div>
              <div className='mt-1 text-sm text-white/35'>{step.desc}</div>
            </div>
            {i < 2 && (
              <>
                <span className='hidden shrink-0 px-1 text-lg text-[#e74c3c] sm:block'>→</span>
                <div className='flex justify-center py-0.5 text-[#e74c3c] sm:hidden'>▼</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Song Usage Rules */}
      <Card>
        <div className='mb-3.5 text-sm font-bold text-white/90'>
          곡 사용 규칙
        </div>
        <div className='flex gap-3.5 border-b border-[#1e1e1e] py-3.5 last:border-b-0'>
          <div className='flex size-7 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-[#e74c3c] font-mono text-base font-extrabold text-[#e74c3c]'>
            1
          </div>
          <div className='text-[15px] leading-[1.55] break-keep text-white/55'>
            한 번 <strong className='text-white/90'>플레이한 곡</strong>은 이후
            라운드에서 재사용할 수 없습니다.
          </div>
        </div>
      </Card>

      <Callout type='danger' icon={<TkcIcon name='warning' />}>
        결선 전체 기준으로, 해당 참가자가 한 번 사용한 곡은{' '}
        <strong className='text-[#e74c3c]'>
          이후 라운드에서 다시 선택할 수 없습니다.
        </strong>
      </Callout>

      <Callout type='info' icon={<TkcIcon name='info' />}>
        결선에서는 주최 측이 제공하는{' '}
        <strong className='text-white/80'>태고 컨트롤러+북채</strong> 또는{' '}
        <strong className='text-white/80'>조이콘</strong>만 사용 가능합니다.
        개인 장비는 사용할 수 없습니다.
      </Callout>

      <Callout type='info' icon={<TkcIcon name='info' />}>
        허용 옵션은{' '}
        <strong className='text-white/80'>음표 위치 조정</strong>,{' '}
        <strong className='text-white/80'>목소리</strong>만 사용 가능합니다. 그
        외 옵션은 사용할 수 없습니다.
      </Callout>
    </SectionBlock>
  )
}

function BanPickSection() {
  const [step, setStep] = useState(-1)
  const [inView, setInView] = useState(false)
  const bpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bpRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    const ids: ReturnType<typeof setTimeout>[] = []
    let cancelled = false

    const sched = (fn: () => void, ms: number) => {
      ids.push(
        setTimeout(() => {
          if (!cancelled) fn()
        }, ms)
      )
    }

    const STEP_MS = 1200
    const PAUSE_MS = 2000

    const cycle = () => {
      if (cancelled) return
      setStep(-1)
      for (let i = 0; i < 4; i++) {
        sched(() => setStep(i), PAUSE_MS + i * STEP_MS)
      }
      // Stop after one cycle
      sched(() => setStep(-1), PAUSE_MS + 4 * STEP_MS + 1500)
    }

    sched(cycle, 500)
    return () => {
      cancelled = true
      ids.forEach(clearTimeout)
    }
  }, [inView])

  const cellStyle = (i: number, finals = false) => ({
    transition: 'opacity 0.35s ease, box-shadow 0.35s ease',
    ...(step === i
      ? {
          boxShadow:
            finals && i >= 2
              ? '0 0 20px 3px rgba(245,166,35,0.15)'
              : '0 0 20px 3px rgba(231,76,60,0.15)',
          zIndex: 10 as const,
        }
      : step >= 0
        ? { opacity: 0.3 }
        : {}),
  })

  const dots = (finals = false) => (
    <div className='flex items-center justify-center gap-3 pt-4 pb-1'>
      <span className='text-[11px] font-medium tracking-wide text-white/20'>
        순서
      </span>
      <div className='flex gap-1.5'>
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            onClick={() => setStep(step === i ? -1 : i)}
            className='size-1.5 rounded-full transition-all duration-300'
            style={{
              background:
                step === i
                  ? finals && i >= 2
                    ? '#f5a623'
                    : '#e74c3c'
                  : 'rgba(255,255,255,0.12)',
              transform: step === i ? 'scale(1.4)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  )

  const badge = (type: 'ban' | 'pick', finals = false) => {
    if (type === 'pick' && finals) {
      return (
        <span className='inline-block rounded-[5px] bg-[#f5a623]/10 px-3 py-1 font-mono text-xs font-semibold tracking-[1px] text-[#f5a623]'>
          PICK ×2
        </span>
      )
    }
    return (
      <span
        className={`inline-block rounded-[5px] px-3 py-1 font-mono text-xs font-semibold tracking-[1px] ${
          type === 'ban'
            ? 'bg-white/[0.05] text-white/55'
            : 'bg-[#e74c3c]/10 text-[#e74c3c]'
        }`}
      >
        {type.toUpperCase()}
      </span>
    )
  }

  const CORNER_CLS = [
    'rounded-tl-xl sm:rounded-none sm:rounded-l-xl',
    'rounded-tr-xl sm:rounded-none',
    'rounded-bl-xl sm:rounded-none',
    'rounded-br-xl sm:rounded-none sm:rounded-r-xl',
  ]
  const MARGIN_CLS = [
    '',
    '-ml-px',
    '-mt-px sm:mt-0 sm:-ml-px',
    '-ml-px -mt-px sm:mt-0',
  ]

  return (
    <SectionBlock
      id='banpick'
      category='BAN/PICK'
      title='밴픽 절차'
      desc='시드 상위자(A)가 먼저 밴하고, 교대로 밴/픽을 진행합니다.'
    >
      <div ref={bpRef} className='space-y-5'>
        {/* Standard: SF / 3rd */}
        <Card>
          <div className='mb-4 text-sm font-bold text-white/90'>
            4강 · 3·4위전
          </div>
          <div className='grid grid-cols-2 sm:flex'>
            {BP_STANDARD.map((s, i) => (
              <div
                key={s.step}
                className={`relative cursor-pointer border border-[#1e1e1e] px-3 py-5 text-center sm:flex-1 sm:py-6 ${CORNER_CLS[i]} ${MARGIN_CLS[i]}`}
                style={cellStyle(i)}
                onClick={() => setStep(step === i ? -1 : i)}
              >
                <div
                  className='absolute top-0 right-0 left-0 h-0.5'
                  style={{
                    background:
                      s.type === 'ban' ? 'rgba(255,255,255,0.15)' : '#e74c3c',
                  }}
                />
                <div className='mb-2 font-mono text-[11px] font-semibold tracking-[1px] text-white/35 sm:mb-2.5'>
                  {s.step}
                </div>
                <div className='mb-2 text-[28px] font-extrabold text-white/90 sm:mb-2.5'>
                  {s.player}
                </div>
                {badge(s.type)}
                <div className='mt-2 text-sm text-white/35'>{s.note}</div>
              </div>
            ))}
          </div>
          {dots()}
        </Card>

        {/* Finals */}
        <Card>
          <div className='mb-1 text-sm font-bold text-white/90'>결승</div>
          <div className='mb-4 text-[13px] text-white/35'>
            각자 2곡씩 선곡, 총 5곡(선곡 4 + 과제곡 1)
          </div>
          <div className='grid grid-cols-2 sm:flex'>
            {BP_FINALS.map((s, i) => (
              <div
                key={s.step}
                className={`relative cursor-pointer border border-[#1e1e1e] px-3 py-5 text-center sm:flex-1 sm:py-6 ${CORNER_CLS[i]} ${MARGIN_CLS[i]}`}
                style={cellStyle(i, true)}
                onClick={() => setStep(step === i ? -1 : i)}
              >
                <div
                  className='absolute top-0 right-0 left-0 h-0.5'
                  style={{
                    background:
                      s.type === 'ban' ? 'rgba(255,255,255,0.15)' : '#f5a623',
                  }}
                />
                <div className='mb-2 font-mono text-[11px] font-semibold tracking-[1px] text-white/35 sm:mb-2.5'>
                  {s.step}
                </div>
                <div className='mb-2 text-[28px] font-extrabold text-white/90 sm:mb-2.5'>
                  {s.player}
                </div>
                {badge(s.type, true)}
                <div className='mt-2 text-sm break-keep text-white/35'>
                  {s.note}
                </div>
              </div>
            ))}
          </div>
          {dots(true)}
        </Card>
      </div>

      <Callout type='info' icon={<TkcIcon name='info' />}>
        A는 <strong className='text-white/80'>시드 상위자</strong>입니다. 밴을
        먼저 진행합니다.
      </Callout>

      <Card>
        <div className='mb-3.5 text-sm font-bold text-white/90'>
          경기 진행 규칙
        </div>
        <DetailRow
          label='점수 기준'
          value='게임 내 스코어(점수) 합산'
          accentColor='#e74c3c'
        />
        <DetailRow
          label='선곡곡 사이드'
          value='해당 곡을 선곡한 선수'
          accentColor='#e74c3c'
        />
        <DetailRow
          label='과제곡 사이드'
          value='직전까지 합산 점수 높은 선수'
          accentColor='#e74c3c'
        />
        <DetailRow
          label='과제곡이 첫 곡'
          value='시드 상위자'
          accentColor='#e74c3c'
        />
        <DetailRow
          label='시드 상위자 선곡곡'
          value='먼저 플레이'
          accentColor='#e74c3c'
        />
        <DetailRow
          label='과제곡 순서'
          value='항상 마지막에 플레이'
          accentColor='#e74c3c'
        />
      </Card>
    </SectionBlock>
  )
}

function RoundsSection() {
  return (
    <SectionBlock
      id='rounds'
      category='ROUNDS'
      title='라운드별 규정'
      desc='각 라운드마다 선곡 수와 과제곡이 다릅니다.'
    >
      <style>{`
        @keyframes slot-pulse {
          0%, 100% { border-color: rgba(231,76,60,0.15); }
          50% { border-color: rgba(231,76,60,0.35); }
        }
        @keyframes slot-shimmer {
          0%, 100% { transform: translateX(-60%) translateY(-60%); }
          50% { transform: translateX(60%) translateY(60%); }
        }
      `}</style>

      {/* Compact Table */}
      <Card className='overflow-hidden p-0'>
        <div className='grid grid-cols-[70px_1fr_1fr_60px] border-b border-[#1e1e1e] bg-white/[0.02] px-3.5 py-3 text-[11px] font-semibold tracking-[0.5px] text-white/35 sm:grid-cols-[90px_1fr_1fr_80px] sm:px-5'>
          <span>라운드</span>
          <span>선곡</span>
          <span>과제곡</span>
          <span>총 곡수</span>
        </div>
        {ROUND_DETAILS.map((r, i) => (
          <div
            key={r.name}
            className={`grid grid-cols-[70px_1fr_1fr_60px] items-center px-3.5 py-3.5 transition-colors sm:grid-cols-[90px_1fr_1fr_80px] sm:px-5 sm:py-4 ${
              i < ROUND_DETAILS.length - 1 ? 'border-b border-[#1e1e1e]' : ''
            } ${r.highlight ? 'bg-[#e74c3c]/[0.03]' : 'hover:bg-white/[0.015]'}`}
          >
            <div
              className='text-[15px] font-extrabold sm:text-[17px]'
              style={{ color: r.highlight ? '#e74c3c' : undefined }}
            >
              {r.name}
            </div>
            <div
              className={`text-[13px] font-medium text-white/55 sm:text-sm ${r.highlight ? '!font-bold !text-white/90' : ''}`}
            >
              {r.picks}
            </div>
            <div className='text-[13px] font-semibold text-[#e74c3c] sm:text-sm'>
              + 1곡
            </div>
            <div>
              <span
                className={`inline-block rounded-md px-2.5 py-0.5 font-mono text-[11px] font-bold sm:text-[12px] ${
                  r.highlight
                    ? 'bg-[#f5a623]/10 text-[#f5a623]'
                    : 'bg-[#e74c3c]/[0.08] text-[#e74c3c]'
                }`}
              >
                {r.total}
              </span>
            </div>
          </div>
        ))}
      </Card>

      {/* Challenge Song Area */}
      <div className='relative overflow-hidden rounded-2xl border border-[#e74c3c]/20 bg-[#111] px-6 py-12 text-center'>
        <div className='absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-transparent via-[#e74c3c] to-[#f5a623]' />
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,_rgba(231,76,60,0.08)_0%,_transparent_70%)]' />
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_50%_100%,_rgba(245,166,35,0.05)_0%,_transparent_70%)]' />

        <div className='relative'>
          <div className='mb-5 font-mono text-[11px] font-bold tracking-[3px] text-[#e74c3c]/60 uppercase'>
            Challenge Song
          </div>
          <div className='mb-4 text-sm font-semibold text-white/35'>
            각 라운드 과제곡
          </div>

          <div className='mb-2 flex justify-center gap-3'>
            {['4강', '3·4위', '결승'].map((label, i) => {
              const isFinal = i === 2
              return (
                <div key={label} className='flex flex-col items-center'>
                  <div
                    className='relative flex h-16 w-12 items-center justify-center overflow-hidden rounded-xl border border-dashed font-mono text-xl font-bold sm:h-[72px] sm:w-14 sm:text-2xl'
                    style={{
                      borderColor: isFinal
                        ? 'rgba(245,166,35,0.25)'
                        : 'rgba(231,76,60,0.25)',
                      background: isFinal
                        ? 'rgba(245,166,35,0.04)'
                        : 'rgba(231,76,60,0.03)',
                      color: isFinal
                        ? 'rgba(245,166,35,0.5)'
                        : 'rgba(255,255,255,0.35)',
                      animation: `slot-pulse 3s ease-in-out ${i * 0.5}s infinite`,
                    }}
                  >
                    ?
                    <div
                      className='pointer-events-none absolute -top-1/2 -left-1/2 h-[200%] w-[200%]'
                      style={{
                        background:
                          'linear-gradient(135deg, transparent 40%, rgba(231,76,60,0.04) 50%, transparent 60%)',
                        animation: 'slot-shimmer 4s ease-in-out infinite',
                      }}
                    />
                  </div>
                  <span
                    className='mt-1.5 text-[11px] font-semibold'
                    style={{
                      color: isFinal ? '#f5a623' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {label}
                  </span>
                </div>
              )
            })}
          </div>

          <div className='mt-6 text-[13px] text-white/35'>
            과제곡은{' '}
            <strong className='text-[#e74c3c]'>대회 당일 현장에서 공개</strong>
            됩니다
          </div>
          <div className='mt-3 flex items-center justify-center gap-4'>
            <Link
              to='/songs'
              className='inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e74c3c]/70 transition-colors hover:text-[#e74c3c]'
            >
              과제곡 목록 보기 →
            </Link>
            <Link
              to='/song-pool'
              search={{ tab: 'consoleFinals' }}
              className='inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e74c3c]/70 transition-colors hover:text-[#e74c3c]'
            >
              결선 선곡풀 보기 →
            </Link>
          </div>
        </div>
      </div>

      <Callout type='info' icon={<TkcIcon name='info' />}>
        모든 라운드에 <strong className='text-white/80'>과제곡 1곡</strong>이
        포함됩니다. 과제곡은 항상 마지막에 플레이합니다.
      </Callout>

      <Callout type='danger' icon={<TkcIcon name='warning' />}>
        동점 시 마지막 곡 동일 조건 재대결.{' '}
        <strong className='text-[#e74c3c]'>
          재대결도 동점 시 良(양) 수 비교.
        </strong>
      </Callout>

      <Callout type='info' icon={<TkcIcon name='info' />}>
        기기 오류 발생 시 운영진 판단 후 재경기. 선수 과실에 의한 미스는{' '}
        <strong className='text-white/80'>
          재경기 사유에 해당하지 않습니다.
        </strong>
      </Callout>
    </SectionBlock>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Section Nav                                                        */
/* ════════════════════════════════════════════════════════════════════ */

function SectionNav({ activeId }: { activeId: string }) {
  return (
    <nav className='sticky top-0 z-50 -mx-4 mb-10 border-b border-[#1e1e1e] bg-[#0a0a0a]/85 px-4 py-3 backdrop-blur-2xl md:-mx-6 md:px-6'>
      <div className='relative'>
        <div
          className='flex gap-1.5 overflow-x-auto'
          style={{ scrollbarWidth: 'none' }}
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-medium whitespace-nowrap transition-all ${
                activeId === item.id
                  ? 'border-[#2a2a2a] bg-[#111] text-white/90'
                  : 'border-transparent text-white/35 hover:bg-[#111] hover:text-white/55'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className='pointer-events-none absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent sm:hidden' />
      </div>
    </nav>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Page                                                               */
/* ════════════════════════════════════════════════════════════════════ */

function ConsoleFinalsPage() {
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('[data-section]')
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.section
            if (id) setActiveSection(id)
          }
        }
      },
      { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' }
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <SectionNav activeId={activeSection} />
      <div>
        <OverviewSection />
        <BracketSection />
        <PrepSection />
        <BanPickSection />
        <RoundsSection />
      </div>

      {/* ── Back Link ── */}
      <FadeIn>
        <div className='mt-4 mb-8 text-center'>
          <Link
            to='/console'
            className='inline-flex items-center gap-1.5 text-[13px] font-medium text-[#e74c3c] transition-colors hover:text-[#f5a623]'
          >
            ← 온라인 예선 안내로 돌아가기
          </Link>
        </div>
      </FadeIn>
    </>
  )
}
