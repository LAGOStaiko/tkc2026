import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Callout, Card, FadeIn, TkcIcon } from '@/components/tkc/guide-shared'

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
  { id: 'rules', label: '플레이 규정' },
]

const OVERVIEW_STATS: { value: string; label: string; sub?: string; color?: string }[] = [
  { value: '4명', label: '결선 진출자', sub: '2차 예선 통과', color: '#e74c3c' },
  { value: '단판', label: '대전 방식' },
  { value: '4곡', label: '사전 준비', color: '#e74c3c' },
  { value: '밴픽', label: '선곡 방식', color: '#f5a623' },
]

const ROUND_OVERVIEW: { name: string; info: string; highlight?: boolean }[] = [
  { name: '4강', info: '2경기 · 각 3곡' },
  { name: '3·4위', info: '1경기 · 3곡' },
  { name: '결승', info: '1경기 · 5곡', highlight: true },
]

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
  { step: 'STEP 03', player: 'A', type: 'pick' as const, note: '자기 곡에서 2곡 선택' },
  { step: 'STEP 04', player: 'B', type: 'pick' as const, note: '자기 곡에서 2곡 선택' },
] as const

const ROUND_DETAILS: { name: string; songs: string; picks: string; challenge: boolean; highlight?: boolean }[] = [
  { name: '4강', songs: '총 3곡', picks: '각 1곡 선곡', challenge: true },
  { name: '3·4위', songs: '총 3곡', picks: '각 1곡 선곡', challenge: true },
  { name: '결승', songs: '총 5곡', picks: '각 2곡 선곡', challenge: true, highlight: true },
]

const PLAY_RULES: { icon: string; title: string; body: ReactNode }[] = [
  {
    icon: 'match',
    title: '컨트롤러 규정',
    body: (
      <>
        결선에서는 <strong className='text-white/90'>BNEK가 준비한 본체 및 컨트롤러만</strong> 사용합니다.
        <br />
        해당 조건에 사전 동의한 플레이어만 참가 가능합니다.
      </>
    ),
  },
  {
    icon: 'summary',
    title: '점수 기준',
    body: (
      <>
        승패는 게임 내 <strong className='text-white/90'>스코어(점수)</strong>를 기준으로 합산하여 결정
      </>
    ),
  },
  {
    icon: 'tie',
    title: '동점 처리',
    body: (
      <>
        동점 → 마지막 곡 <strong className='text-white/90'>동일 조건 재대결</strong>
        <br />
        재대결도 동점 → <strong className='text-white/90'>양(良) 수</strong> 비교
      </>
    ),
  },
  {
    icon: 'warning',
    title: '기기 트러블',
    body: (
      <>
        기기 오류(프레임 드롭, 입력 불량 등) → 해당 곡 <strong className='text-white/90'>재경기</strong>
        <br />
        재경기 여부는 운영진 판단
      </>
    ),
  },
]

const PLAY_RULE_ICON_MAP: Record<string, string> = {
  match: '/characters/rule-controller.png',
  summary: '/characters/rule-score.png',
  tie: '/characters/rule-tie.png',
  warning: '/characters/rule-warning.png',
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Utility Components                                                 */
/* ════════════════════════════════════════════════════════════════════ */

function SectionBlock({
  id,
  num,
  title,
  desc,
  children,
}: {
  id: string
  num: string
  title: string
  desc: string
  children: ReactNode
}) {
  return (
    <section id={id} data-section={id} className='mb-20'>
      <FadeIn>
        <div className='mb-2 font-mono text-xs font-semibold tracking-[1px] text-[#e74c3c] uppercase'>
          Section {num}
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
          <span className={`font-semibold ${r.seed === '?' ? 'text-white/35' : 'text-white/90'}`}>
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
      num='01'
      title='대회 구조'
      desc='4명 단판 토너먼트. 밴픽 전략과 과제곡이 승패를 좌우합니다.'
    >
      {/* Stat Boxes */}
      <Card className='overflow-hidden p-0'>
        <div className='flex items-center gap-2.5 border-b border-[#1e1e1e] bg-[#111] px-6 py-4'>
          <span className='size-2 rounded-full bg-[#e74c3c]' />
          <span className='text-[15px] font-bold text-white/90'>
            한눈에 보기
          </span>
        </div>
        <div className='grid grid-cols-2 bg-[#111] sm:grid-cols-4'>
          {OVERVIEW_STATS.map((s, i) => (
            <div
              key={s.label}
              className={`relative flex min-h-[100px] flex-col items-center justify-center border-[#1e1e1e] px-5 pt-7 pb-4 text-center ${i < 2 ? 'border-b sm:border-b-0' : ''} ${i % 2 === 0 ? 'border-r' : i < 3 ? 'sm:border-r' : ''}`}
            >
              <div className='absolute top-2.5 left-3.5 text-[12px] font-medium tracking-wide text-white/35'>
                {s.label}
              </div>
              <div
                className='text-[24px] font-extrabold tracking-tight sm:text-[28px]'
                style={{ color: s.color ?? 'rgba(255,255,255,0.9)' }}
              >
                {s.value}
              </div>
              {s.sub && (
                <div className='mt-0.5 text-[12px] text-white/40'>
                  {s.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Callout type='info' icon={<TkcIcon name='info' />}>
        사전 조사 시 불참자가 있을 경우,{' '}
        <strong className='text-white/80'>예비번호 순서대로 올림 처리</strong>
        합니다.
      </Callout>

      {/* Round Composition */}
      <Card>
        <div className='mb-4 text-sm font-bold text-white/90'>라운드 구성</div>
        <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
          {ROUND_OVERVIEW.map((r) => (
            <div
              key={r.name}
              className={`rounded-xl p-5 text-center ${
                r.highlight
                  ? 'border border-[#f5a623]/20 bg-[#f5a623]/[0.04]'
                  : 'border border-[#e74c3c]/10 bg-[#e74c3c]/[0.04]'
              }`}
            >
              <div
                className='text-[22px] font-extrabold'
                style={{ color: r.highlight ? '#f5a623' : '#e74c3c' }}
              >
                {r.name}
              </div>
              <div className='mt-1.5 text-sm text-white/35'>
                {r.info}
              </div>
            </div>
          ))}
        </div>
      </Card>
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
      { threshold: 0.1 },
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
      num='02'
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
                className='absolute bottom-0 right-0 left-0 h-0.5 bg-[#e74c3c]'
                style={sweep(150)}
              />
              Semifinals
            </div>
            <div className='space-y-2'>
              {SF_MATCHES.map((m, i) => (
                <div key={m.label} style={anim('bracket-card-in', 250 + i * 80)}>
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
                className='absolute bottom-0 right-0 left-0 h-0.5 bg-[#e74c3c]'
                style={sweep(700)}
              />
              Grand Final
            </div>
            <div
              style={anim(
                'bracket-card-in',
                800,
                'bracket-final-glow 2s ease-in-out 1250ms',
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
                className='absolute bottom-0 right-0 left-0 h-0.5 bg-[#e74c3c]'
                style={sweep(150)}
              />
              Semifinals
            </div>
            <div className='space-y-2'>
              {SF_MATCHES.map((m, i) => (
                <div key={m.label} style={anim('bracket-card-in', 250 + i * 80)}>
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
                className='absolute bottom-0 right-0 left-0 h-0.5 bg-[#e74c3c]'
                style={sweep(700)}
              />
              Grand Final
            </div>
            <div
              style={anim(
                'bracket-card-in',
                800,
                'bracket-final-glow 2s ease-in-out 1250ms',
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
              className='absolute bottom-0 right-0 left-0 h-0.5 bg-[#f5a623]'
              style={sweep(1050)}
            />
            3·4위전
          </div>
          <div
            style={anim(
              'bracket-card-in',
              1150,
              'bracket-3rd-glow 2s ease-in-out 1600ms',
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
      num='03'
      title='곡 준비 규정'
      desc='참가자는 1인당 총 4곡을 사전에 준비하여 제출합니다. 곡 목록은 대회 전에 공개됩니다.'
    >
      {/* Flow */}
      {/* Desktop */}
      <div className='hidden items-stretch gap-0 sm:flex'>
        {[
          { num: '4', label: '사전 준비 곡', desc: '곡 선택 추후 공지', color: '#e74c3c' },
          { num: '밴', label: '상대가 제거', desc: '해당 매치 사용 불가', color: undefined },
          { num: '픽', label: '잔여 곡 선택', desc: '경기에 사용할 곡 확정', color: '#f5a623' },
        ].map((step, i) => (
          <div key={step.label} className='flex flex-1 items-center'>
            <div
              className={`flex-1 border border-[#1e1e1e] bg-[#111] px-4 py-7 text-center ${i === 0 ? 'rounded-l-2xl' : i === 2 ? 'rounded-r-2xl' : ''}`}
            >
              <div
                className='text-[36px] font-extrabold'
                style={{ color: step.color ?? 'rgba(255,255,255,0.9)' }}
              >
                {step.num}
              </div>
              <div className='mt-1.5 text-[15px] font-bold text-white/90'>{step.label}</div>
              <div className='mt-1 text-sm text-white/35'>{step.desc}</div>
            </div>
            {i < 2 && (
              <span className='shrink-0 px-1 text-lg text-[#e74c3c]'>→</span>
            )}
          </div>
        ))}
      </div>
      {/* Mobile */}
      <div className='flex flex-col gap-0 sm:hidden'>
        {[
          { num: '4', label: '사전 준비 곡', desc: '곡 선택 추후 공지', color: '#e74c3c' },
          { num: '밴', label: '상대가 제거', desc: '해당 매치 사용 불가', color: undefined },
          { num: '픽', label: '잔여 곡 선택', desc: '경기에 사용할 곡 확정', color: '#f5a623' },
        ].map((step, i) => (
          <div key={step.label}>
            <div
              className={`border border-[#1e1e1e] bg-[#111] px-4 py-6 text-center ${i === 0 ? 'rounded-t-2xl' : i === 2 ? 'rounded-b-2xl' : ''}`}
            >
              <div
                className='text-[36px] font-extrabold'
                style={{ color: step.color ?? 'rgba(255,255,255,0.9)' }}
              >
                {step.num}
              </div>
              <div className='mt-1.5 text-[15px] font-bold text-white/90'>{step.label}</div>
              <div className='mt-1 text-sm text-white/35'>{step.desc}</div>
            </div>
            {i < 2 && (
              <div className='flex justify-center py-0.5 text-[#e74c3c]'>▼</div>
            )}
          </div>
        ))}
      </div>

      {/* Song Usage Rules */}
      <Card>
        <div className='mb-3.5 text-sm font-bold text-white/90'>곡 사용 규칙</div>
        <div className='flex gap-3.5 border-b border-[#1e1e1e] py-3.5 last:border-b-0'>
          <div className='flex size-7 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-[#e74c3c] font-mono text-base font-extrabold text-[#e74c3c]'>
            1
          </div>
          <div className='text-[15px] leading-[1.55] break-keep text-white/55'>
            한 번 <strong className='text-white/90'>플레이한 곡</strong>은 이후 라운드에서 재사용할 수 있습니다.
          </div>
        </div>
      </Card>

      <Callout type='warning' icon={<TkcIcon name='warning' />}>
        결선 전체 기준으로, 해당 참가자가 한 번 사용한 곡은{' '}
        <strong className='text-white/80'>이후 라운드에서 다시 선택할 수 있습니다.</strong>
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
      { threshold: 0.15 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    const ids: ReturnType<typeof setTimeout>[] = []
    let cancelled = false

    const sched = (fn: () => void, ms: number) => {
      ids.push(setTimeout(() => { if (!cancelled) fn() }, ms))
    }

    const STEP_MS = 1200
    const PAUSE_MS = 2000
    const CYCLE = PAUSE_MS + 4 * STEP_MS

    const cycle = () => {
      if (cancelled) return
      setStep(-1)
      for (let i = 0; i < 4; i++) {
        sched(() => setStep(i), PAUSE_MS + i * STEP_MS)
      }
      sched(cycle, CYCLE)
    }

    sched(cycle, 500)
    return () => { cancelled = true; ids.forEach(clearTimeout) }
  }, [inView])

  const cellStyle = (i: number, finals = false) => ({
    transition: 'opacity 0.35s ease, box-shadow 0.35s ease',
    ...(step === i
      ? {
          boxShadow: finals && i >= 2
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
          <div
            key={i}
            className='size-1.5 rounded-full transition-all duration-300'
            style={{
              background: step === i
                ? (finals && i >= 2 ? '#f5a623' : '#e74c3c')
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

  return (
    <SectionBlock
      id='banpick'
      num='04'
      title='밴픽 절차'
      desc='시드 상위자(A)가 먼저 밴하고, 교대로 밴/픽을 진행합니다.'
    >
      <div ref={bpRef} className='space-y-5'>
        {/* Standard: SF / 3rd */}
        <Card>
          <div className='mb-4 text-sm font-bold text-white/90'>
            4강 · 3·4위전
          </div>
          {/* Desktop */}
          <div className='hidden gap-0 sm:flex'>
            {BP_STANDARD.map((s, i) => (
              <div
                key={s.step}
                className={`relative flex-1 border border-[#1e1e1e] px-3 py-6 text-center ${
                  i === 0 ? 'rounded-l-xl' : i === 3 ? 'rounded-r-xl' : ''
                } ${i > 0 ? '-ml-px' : ''}`}
                style={cellStyle(i)}
              >
                <div
                  className='absolute top-0 right-0 left-0 h-0.5'
                  style={{
                    background: s.type === 'ban' ? 'rgba(255,255,255,0.15)' : '#e74c3c',
                  }}
                />
                <div className='mb-2.5 font-mono text-[11px] font-semibold tracking-[1px] text-white/35'>
                  {s.step}
                </div>
                <div className='mb-2.5 text-[28px] font-extrabold text-white/90'>
                  {s.player}
                </div>
                {badge(s.type)}
                <div className='mt-2 text-sm text-white/35'>{s.note}</div>
              </div>
            ))}
          </div>
          {/* Mobile */}
          <div className='grid grid-cols-2 gap-0 sm:hidden'>
            {BP_STANDARD.map((s, i) => (
              <div
                key={s.step}
                className={`relative border border-[#1e1e1e] px-3 py-5 text-center ${
                  i === 0 ? 'rounded-tl-xl' : i === 1 ? 'rounded-tr-xl' : i === 2 ? 'rounded-bl-xl' : 'rounded-br-xl'
                } ${i % 2 === 1 ? '-ml-px' : ''} ${i >= 2 ? '-mt-px' : ''}`}
                style={cellStyle(i)}
              >
                <div
                  className='absolute top-0 right-0 left-0 h-0.5'
                  style={{
                    background: s.type === 'ban' ? 'rgba(255,255,255,0.15)' : '#e74c3c',
                  }}
                />
                <div className='mb-2 font-mono text-[11px] font-semibold tracking-[1px] text-white/35'>
                  {s.step}
                </div>
                <div className='mb-2 text-[28px] font-extrabold text-white/90'>
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
          {/* Desktop */}
          <div className='hidden gap-0 sm:flex'>
            {BP_FINALS.map((s, i) => (
              <div
                key={s.step}
                className={`relative flex-1 border border-[#1e1e1e] px-3 py-6 text-center ${
                  i === 0 ? 'rounded-l-xl' : i === 3 ? 'rounded-r-xl' : ''
                } ${i > 0 ? '-ml-px' : ''}`}
                style={cellStyle(i, true)}
              >
                <div
                  className='absolute top-0 right-0 left-0 h-0.5'
                  style={{
                    background: s.type === 'ban' ? 'rgba(255,255,255,0.15)' : '#f5a623',
                  }}
                />
                <div className='mb-2.5 font-mono text-[11px] font-semibold tracking-[1px] text-white/35'>
                  {s.step}
                </div>
                <div className='mb-2.5 text-[28px] font-extrabold text-white/90'>
                  {s.player}
                </div>
                {badge(s.type, true)}
                <div className='mt-2 text-sm text-white/35'>{s.note}</div>
              </div>
            ))}
          </div>
          {/* Mobile */}
          <div className='grid grid-cols-2 gap-0 sm:hidden'>
            {BP_FINALS.map((s, i) => (
              <div
                key={s.step}
                className={`relative border border-[#1e1e1e] px-3 py-5 text-center ${
                  i === 0 ? 'rounded-tl-xl' : i === 1 ? 'rounded-tr-xl' : i === 2 ? 'rounded-bl-xl' : 'rounded-br-xl'
                } ${i % 2 === 1 ? '-ml-px' : ''} ${i >= 2 ? '-mt-px' : ''}`}
                style={cellStyle(i, true)}
              >
                <div
                  className='absolute top-0 right-0 left-0 h-0.5'
                  style={{
                    background: s.type === 'ban' ? 'rgba(255,255,255,0.15)' : '#f5a623',
                  }}
                />
                <div className='mb-2 font-mono text-[11px] font-semibold tracking-[1px] text-white/35'>
                  {s.step}
                </div>
                <div className='mb-2 text-[28px] font-extrabold text-white/90'>
                  {s.player}
                </div>
                {badge(s.type, true)}
                <div className='mt-2 text-sm break-keep text-white/35'>{s.note}</div>
              </div>
            ))}
          </div>
          {dots(true)}
        </Card>
      </div>

      <Callout type='info' icon={<TkcIcon name='info' />}>
        A는 <strong className='text-white/80'>시드 상위자</strong>입니다. 밴픽
        순서 및 플레이 순서에서 선택 권한을 가집니다.
      </Callout>
    </SectionBlock>
  )
}

function RoundsSection() {
  return (
    <SectionBlock
      id='rounds'
      num='05'
      title='라운드별 규정'
      desc='각 라운드마다 선곡 수와 과제곡이 다릅니다. 과제곡은 추후 공개됩니다.'
    >
      <div className='space-y-3'>
        {ROUND_DETAILS.map((r) => (
          <div
            key={r.name}
            className={`overflow-hidden rounded-2xl border transition-colors ${
              r.highlight
                ? 'border-[#e74c3c]/35 shadow-[0_0_24px_rgba(231,76,60,0.06),inset_0_0_0_1px_rgba(231,76,60,0.05)]'
                : 'border-[#1e1e1e] hover:border-[#2a2a2a]'
            }`}
          >
            {/* Desktop */}
            <div className='hidden sm:grid sm:grid-cols-[150px_1fr]'>
              <div
                className={`flex flex-col items-center justify-center border-r border-[#1e1e1e] px-4 py-7 ${
                  r.highlight ? 'bg-[#e74c3c]/[0.06]' : 'bg-[#111]'
                }`}
              >
                <div
                  className='text-[22px] font-extrabold'
                  style={{ color: r.highlight ? '#e74c3c' : 'rgba(255,255,255,0.9)' }}
                >
                  {r.name}
                </div>
                <div className='mt-0.5 font-mono text-sm font-semibold text-[#e74c3c]'>
                  {r.songs}
                </div>
              </div>
              <div className='flex flex-col justify-center gap-3 bg-[#111] p-5'>
                <div className='flex flex-wrap gap-2'>
                  <span className='rounded-lg border border-[#1e1e1e] bg-white/[0.03] px-3.5 py-1.5 text-[15px] font-medium text-white/55'>
                    {r.picks}
                  </span>
                  <span className='rounded-lg border border-[#1e1e1e] bg-white/[0.03] px-3.5 py-1.5 text-[15px] font-medium text-white/55'>
                    + 과제곡 1곡
                  </span>
                </div>
                {r.challenge && (
                  <div className='inline-flex items-center gap-2.5 self-start rounded-xl border border-dashed border-[#e74c3c]/15 bg-[#e74c3c]/[0.03] px-4 py-3'>
                    <div className='text-xs font-semibold text-white/35'>과제곡</div>
                    <div className='font-mono text-xl font-bold tracking-[3px] text-white/35'>
                      ???
                    </div>
                    <div className='font-mono text-[11px] font-semibold text-[#e74c3c] opacity-50'>
                      추후 공개
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile */}
            <div className='sm:hidden'>
              <div
                className={`relative flex items-center gap-3 border-b border-[#1e1e1e] px-5 py-4 ${
                  r.highlight ? 'bg-[#e74c3c]/[0.06]' : 'bg-[#111]'
                }`}
              >
                <div className='absolute top-0 right-0 left-0 h-[3px] bg-[#e74c3c] opacity-40' />
                <div
                  className='text-[22px] font-extrabold'
                  style={{ color: r.highlight ? '#e74c3c' : 'rgba(255,255,255,0.9)' }}
                >
                  {r.name}
                </div>
                <div className='font-mono text-sm font-semibold text-[#e74c3c]'>
                  {r.songs}
                </div>
              </div>
              <div className='flex flex-col gap-3 bg-[#111] p-5'>
                <div className='flex flex-wrap gap-2'>
                  <span className='rounded-lg border border-[#1e1e1e] bg-white/[0.03] px-3.5 py-1.5 text-[15px] font-medium text-white/55'>
                    {r.picks}
                  </span>
                  <span className='rounded-lg border border-[#1e1e1e] bg-white/[0.03] px-3.5 py-1.5 text-[15px] font-medium text-white/55'>
                    + 과제곡 1곡
                  </span>
                </div>
                {r.challenge && (
                  <div className='inline-flex items-center gap-2.5 self-start rounded-xl border border-dashed border-[#e74c3c]/15 bg-[#e74c3c]/[0.03] px-4 py-3'>
                    <div className='text-xs font-semibold text-white/35'>과제곡</div>
                    <div className='font-mono text-xl font-bold tracking-[3px] text-white/35'>
                      ???
                    </div>
                    <div className='font-mono text-[11px] font-semibold text-[#e74c3c] opacity-50'>
                      추후 공개
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Callout type='info' icon={<TkcIcon name='info' />}>
        과제곡은 4강 / 3·4위전 / 결승에{' '}
        <strong className='text-white/80'>각각 지정</strong>되며, 추후 공지됩니다.
      </Callout>
    </SectionBlock>
  )
}

function PlayRulesSection() {
  return (
    <SectionBlock
      id='rules'
      num='06'
      title='플레이 규정'
      desc='컨트롤러, 점수 기준, 동점 처리 등 경기 규정입니다.'
    >
      <div className='grid gap-3 sm:grid-cols-2'>
        {PLAY_RULES.map((rule) => (
          <div
            key={rule.title}
            className='relative overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] p-6 transition-colors hover:border-[#2a2a2a]'
          >
            <div className='absolute top-0 right-0 left-0 h-0.5 bg-[#e74c3c] opacity-40' />
            <div className='mb-3 flex items-center gap-2.5'>
              <div className='flex size-[30px] shrink-0 items-center justify-center'>
                {PLAY_RULE_ICON_MAP[rule.icon] ? (
                  <img
                    src={PLAY_RULE_ICON_MAP[rule.icon]}
                    alt=''
                    className='size-7 object-contain'
                    loading='lazy'
                    draggable={false}
                  />
                ) : (
                  <TkcIcon name={rule.icon} className='size-6' />
                )}
              </div>
              <div className='text-[17px] font-bold text-white/90'>{rule.title}</div>
            </div>
            <div className='text-[15px] leading-[1.55] break-keep text-white/55'>
              {rule.body}
            </div>
          </div>
        ))}
      </div>

      <Callout type='danger' icon={<TkcIcon name='warning' />}>
        선수 과실에 의한 미스는{' '}
        <strong className='text-[#e74c3c]'>재경기 사유에 해당하지 않습니다.</strong>
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
        <PlayRulesSection />
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
