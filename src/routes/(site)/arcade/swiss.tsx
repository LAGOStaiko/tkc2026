import { useEffect, useState, type ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ARCADE_SONGS } from '@/content/arcade-songs'
import { Callout, Card, FadeIn, TkcIcon } from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/arcade/swiss')({
  component: ArcadeSwissPage,
})

/* ════════════════════════════════════════════════════════════════════ */
/*  Constants                                                          */
/* ════════════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { id: 'overview', label: '개요' },
  { id: 'swiss', label: '스위스 스테이지' },
  { id: 'match', label: '경기 규칙' },
  { id: 'side', label: '사이드 규칙' },
  { id: 'tiebreak', label: '동점 처리' },
  { id: 'advance', label: '진출자 선발' },
  { id: 'seed', label: '시드 산정' },
]

const STAT_ITEMS = [
  { value: '4회', label: '오프라인 예선', color: '#e86e3a' },
  { value: '16명', label: '지역별 참가자', color: '#f5a623' },
  { value: '2명', label: '회차별 진출', color: '#f7d154' },
  { value: 'Top 8', label: '결선 진출 인원', color: '#f7d154' },
] as const

const REGIONS = [
  { num: 1, name: '서울', detail: '1차 예선' },
  { num: 2, name: '대전', detail: '2차 예선' },
  { num: 3, name: '광주', detail: '3차 예선' },
  { num: 4, name: '부산', detail: '4차 예선' },
] as const

const SEED_MATCHES = [
  { label: 'MATCH 1', high: '1위', low: '16위' },
  { label: 'MATCH 2', high: '2위', low: '15위' },
  { label: 'MATCH 3', high: '3위', low: '14위' },
  { label: 'MATCH 4', high: '4위', low: '13위' },
  { label: 'MATCH 5', high: '5위', low: '12위' },
  { label: 'MATCH 6', high: '6위', low: '11위' },
  { label: 'MATCH 7', high: '7위', low: '10위' },
  { label: 'MATCH 8', high: '8위', low: '9위' },
] as const

const MATCH_RULES = [
  {
    num: 'A',
    title: '동일 전적 그룹 내 매칭',
    desc: '같은 승-패 기록의 참가자끼리만 매칭합니다. (예: 1-0끼리, 0-1끼리)',
  },
  {
    num: 'B',
    title: '그룹 내 시드 기반 매칭',
    desc: '초기 시드(온라인 순위) 기준으로 정렬 후, 상위 vs 하위로 매칭합니다.',
  },
  {
    num: 'C',
    title: '홀수 인원 처리',
    desc: '노쇼·기권으로 홀수가 발생할 경우, 남는 1명에게 부전승(Bye) 1승을 부여합니다.',
  },
] as const

const FLOW_STEPS = [
  {
    title: 'A 선수의 곡',
    desc: 'A가 사전 제출한\n해당 라운드 곡',
    icon: 'song-pick',
  },
  {
    title: 'B 선수의 곡',
    desc: 'B가 사전 제출한\n해당 라운드 곡',
    icon: 'song-pick',
  },
  {
    title: '2곡 합산',
    desc: '두 곡 점수를 합산\n고득점자 승리',
    icon: 'summary',
  },
] as const

type SwissGroup = {
  record: string
  recordCls: string
  count: number
  tag: string
  tagType?: 'eliminated' | 'qualified' | 'advance'
  players: string[]
  eliminated?: boolean
}

const SWISS_ROUNDS: Record<1 | 2 | 3 | 4, SwissGroup[]> = {
  1: [
    {
      record: '1-0',
      recordCls: 'text-[#f7d154] bg-[#f7d154]/[0.08]',
      count: 8,
      tag: '승리 그룹',
      players: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'],
    },
    {
      record: '0-1',
      recordCls: 'text-[#f5a623] bg-[#f5a623]/[0.08]',
      count: 8,
      tag: '패배 1회',
      players: ['P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16'],
    },
  ],
  2: [
    {
      record: '2-0',
      recordCls: 'text-[#f7d154] bg-[#f7d154]/[0.08]',
      count: 4,
      tag: '전승 유지',
      players: ['P1', 'P2', 'P3', 'P4'],
    },
    {
      record: '1-1',
      recordCls: 'text-[#f7d154] bg-[#f7d154]/[0.08]',
      count: 8,
      tag: '생존',
      players: ['P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12'],
    },
    {
      record: '0-2',
      recordCls: 'text-[#e86e3a] bg-[#e86e3a]/[0.08]',
      count: 4,
      tag: '탈락',
      tagType: 'eliminated',
      players: ['P13', 'P14', 'P15', 'P16'],
      eliminated: true,
    },
  ],
  3: [
    {
      record: '3-0',
      recordCls: 'text-[#f7d154] bg-[#f7d154]/[0.08]',
      count: 2,
      tag: '전승 유지',
      players: ['P1', 'P2'],
    },
    {
      record: '2-1',
      recordCls: 'text-[#f5a623] bg-[#f5a623]/[0.08]',
      count: 6,
      tag: '생존',
      players: ['P3', 'P4', 'P5', 'P6', 'P7', 'P8'],
    },
    {
      record: '1-2',
      recordCls: 'text-[#e86e3a] bg-[#e86e3a]/[0.08]',
      count: 4,
      tag: '탈락',
      tagType: 'eliminated',
      players: ['P9', 'P10', 'P11', 'P12'],
      eliminated: true,
    },
  ],
  4: [
    {
      record: '4-0',
      recordCls: 'text-[#f7d154] bg-[#f7d154]/[0.08]',
      count: 1,
      tag: '자동 진출',
      tagType: 'qualified',
      players: ['P1'],
    },
    {
      record: '3-1',
      recordCls: 'text-[#f5a623] bg-[#f5a623]/[0.08]',
      count: 4,
      tag: '선발전 진출',
      tagType: 'advance',
      players: ['P2', 'P3', 'P4', 'P5'],
    },
    {
      record: '2-2',
      recordCls: 'text-[#e86e3a] bg-[#e86e3a]/[0.08]',
      count: 3,
      tag: '탈락',
      tagType: 'eliminated',
      players: ['P6', 'P7', 'P8'],
      eliminated: true,
    },
  ],
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
        <div className='mb-2 font-mono text-xs font-semibold tracking-[2px] text-[#f5a623] uppercase'>
          Section {num}
        </div>
        <h2 className='mb-3 text-2xl font-bold tracking-tight text-white/90 md:text-[32px]'>
          {title}
        </h2>
        <p className='mb-8 max-w-[640px] text-[15px] leading-relaxed font-light break-keep text-white/55'>
          {desc}
        </p>
      </FadeIn>
      <div className='space-y-5'>{children}</div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Swiss Animator                                                     */
/* ════════════════════════════════════════════════════════════════════ */

function SwissAnimator() {
  const [activeRound, setActiveRound] = useState<1 | 2 | 3 | 4>(1)
  const [autoPlay, setAutoPlay] = useState(true)
  const groups = SWISS_ROUNDS[activeRound]

  useEffect(() => {
    if (!autoPlay) return
    const id = setInterval(() => {
      setActiveRound((prev) => (prev >= 4 ? 1 : ((prev + 1) as 1 | 2 | 3 | 4)))
    }, 3000)
    return () => clearInterval(id)
  }, [autoPlay])

  return (
    <Card>
      <div className='mb-1 text-sm font-bold text-white/90'>
        라운드별 전적 그룹 변화
      </div>
      <div className='mb-5 text-xs text-white/35'>
        라운드를 클릭하여 그룹 구성 변화를 확인하세요
      </div>

      {/* Round Buttons */}
      <div className='mb-7 flex gap-1.5'>
        {([1, 2, 3, 4] as const).map((r) => (
          <button
            key={r}
            type='button'
            onClick={() => {
              setAutoPlay(false)
              setActiveRound(r)
            }}
            className={`relative flex-1 overflow-hidden rounded-xl border py-2.5 text-[13px] font-semibold transition-all ${
              activeRound === r
                ? 'border-[#f5a623] bg-[#f5a623]/[0.05] text-white/90'
                : 'border-[#1e1e1e] text-white/35 hover:border-[#2a2a2a] hover:text-white/55'
            }`}
          >
            R{r} 후
            {activeRound === r && (
              <span className='absolute right-0 bottom-0 left-0 h-0.5 bg-[#f5a623]' />
            )}
          </button>
        ))}
      </div>

      {/* Groups */}
      <div className='flex flex-col gap-2.5'>
        {groups.map((g) => (
          <div
            key={g.record}
            className='rounded-xl border border-[#1e1e1e] bg-white/[0.015] p-4'
          >
            <div className='mb-2.5 flex items-center gap-2.5'>
              <span
                className={`rounded-md px-2.5 py-0.5 font-mono text-sm font-semibold tracking-wider ${g.recordCls}`}
              >
                {g.record}
              </span>
              {g.tagType ? (
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                    g.tagType === 'eliminated'
                      ? 'bg-[#e86e3a]/[0.08] text-[#e86e3a]'
                      : g.tagType === 'qualified'
                        ? 'bg-[#f7d154]/[0.08] text-[#f7d154]'
                        : 'bg-[#f5a623]/[0.08] text-[#f5a623]'
                  }`}
                >
                  {g.tag}
                </span>
              ) : (
                <span className='text-[11px] text-white/35'>
                  {g.tag} · {g.count}명
                </span>
              )}
              {g.tagType && (
                <span className='text-[11px] text-white/35'>{g.count}명</span>
              )}
            </div>
            <div className='flex flex-wrap gap-1.5'>
              {g.players.map((p) => (
                <span
                  key={p}
                  className={`rounded-md border px-2.5 py-1 font-mono text-xs ${
                    g.eliminated
                      ? 'border-transparent text-white/20 line-through opacity-30'
                      : 'border-[#1e1e1e] bg-white/[0.04] text-white/55'
                  }`}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Sections                                                           */
/* ════════════════════════════════════════════════════════════════════ */

function OverviewSection() {
  return (
    <SectionBlock
      id='overview'
      num='00'
      title='개요 및 전반 구조'
      desc='전국 4개 지역 오프라인 예선을 거쳐, 총 8명이 최종 결선에 진출합니다.'
    >
      {/* Stats */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        {STAT_ITEMS.map((s) => (
          <div
            key={s.label}
            className='relative overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] px-4 py-5 text-center'
          >
            <div
              className='absolute top-0 right-0 left-0 h-0.5'
              style={{ background: s.color }}
            />
            <div
              className='text-[28px] font-extrabold'
              style={{ color: s.color }}
            >
              {s.value}
            </div>
            <div className='mt-1 text-xs font-medium text-white/35'>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Region Timeline */}
      <Card>
        <div className='mb-4 text-[13px] font-semibold text-white/35'>
          예선 일정
        </div>
        {/* Mobile */}
        <div className='flex flex-col gap-3 sm:hidden'>
          {REGIONS.map((r) => (
            <div
              key={r.num}
              className='flex items-center gap-3.5 rounded-lg border border-[#1e1e1e] bg-white/[0.02] px-4 py-3'
            >
              <div className='flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-[#f5a623] font-mono text-sm font-bold text-[#f5a623]'>
                {r.num}
              </div>
              <div>
                <div className='text-sm font-semibold text-white/90'>
                  {r.name}
                </div>
                <div className='text-[11px] text-white/35'>{r.detail}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop */}
        <div className='hidden items-center py-5 sm:flex'>
          {REGIONS.map((r, i) => (
            <div key={r.num} className='relative flex-1 text-center'>
              <div className='relative z-10 mx-auto mb-2.5 flex size-9 items-center justify-center rounded-full border-2 border-[#f5a623] bg-[#111] font-mono text-sm font-bold text-[#f5a623]'>
                {r.num}
              </div>
              <div className='text-sm font-semibold text-white/90'>
                {r.name}
              </div>
              <div className='text-[11px] text-white/35'>{r.detail}</div>
              {i < REGIONS.length - 1 && (
                <div className='absolute top-[18px] left-1/2 h-px w-full bg-[#2a2a2a]' />
              )}
            </div>
          ))}
        </div>
      </Card>

      <Callout type='info' icon={<TkcIcon name='info' />}>
        각 지역 온라인 예선 상위 16명이 오프라인 예선에 참가하며, 각 예선에서
        2명이 진출하여 총 8명으로 결선을 구성합니다.
      </Callout>
    </SectionBlock>
  )
}

function SwissSection() {
  return (
    <SectionBlock
      id='swiss'
      num='01'
      title='스위스 스테이지 (2패 탈락)'
      desc='같은 전적의 참가자끼리 매칭하는 스위스 시스템. 패배가 2회 누적되면 즉시 탈락합니다.'
    >
      <Callout type='danger' icon={<TkcIcon name='warning' />}>
        <strong className='text-[#e86e3a]'>2패 누적 시 즉시 탈락</strong> — 0-2,
        1-2, 2-2 등 패배가 2회 누적되는 순간 스테이지가 종료되며, 이후 라운드에
        배정되지 않습니다.
      </Callout>

      {/* R1 Seed Matching */}
      <Card>
        <div className='mb-1 text-sm font-bold text-white/90'>
          라운드 1 — 시드 매칭
        </div>
        <div className='mb-4 text-xs text-white/35'>
          온라인 예선 순위를 기반으로 상위 vs 하위 대진 편성
        </div>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
          {SEED_MATCHES.map((m) => (
            <div
              key={m.label}
              className='rounded-xl border border-[#f5a623]/10 bg-[#f5a623]/[0.04] p-3.5 text-center'
            >
              <div className='mb-2 font-mono text-[10px] tracking-[1px] text-white/35'>
                {m.label}
              </div>
              <div className='text-sm font-semibold'>
                <span className='text-[#f5a623]'>{m.high}</span>
                <span className='mx-1 text-[11px] text-white/35'>vs</span>
                <span className='text-white/55'>{m.low}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Matching Rules */}
      <Card>
        <div className='mb-3.5 text-sm font-bold text-white/90'>
          라운드 2 이후 — 매칭 규칙
        </div>
        {MATCH_RULES.map((rule) => (
          <div
            key={rule.num}
            className='flex gap-3.5 border-b border-[#1e1e1e] py-3.5 last:border-b-0'
          >
            <div className='flex size-7 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-[#f5a623] font-mono text-base font-extrabold text-[#f5a623]'>
              {rule.num}
            </div>
            <div>
              <div className='text-sm font-bold text-white/90'>
                {rule.title}
              </div>
              <div className='mt-0.5 text-xs break-keep text-white/35'>
                {rule.desc}
              </div>
            </div>
          </div>
        ))}
      </Card>

      <SwissAnimator />
    </SectionBlock>
  )
}

function MatchSection() {
  return (
    <SectionBlock
      id='match'
      num='02'
      title='1경기(매치) 규칙: 2곡 합산'
      desc='각 선수가 1곡씩 제공하여, 총 2곡의 점수를 합산해 승패를 결정합니다.'
    >
      {/* Match Flow — Mobile */}
      <div className='flex flex-col gap-0 sm:hidden'>
        {FLOW_STEPS.map((step, i) => (
          <div key={step.title}>
            <div
              className={`border border-[#1e1e1e] bg-[#111] px-4 py-5 text-center ${i === 0 ? 'rounded-t-2xl' : i === 2 ? 'rounded-b-2xl' : ''}`}
            >
              <div className='mb-2'>
                <TkcIcon name={step.icon} className='mx-auto size-7' />
              </div>
              <div className='text-[13px] font-bold text-white/90'>
                {step.title}
              </div>
              <div className='mt-1 text-[11px] leading-relaxed whitespace-pre-line text-white/35'>
                {step.desc}
              </div>
            </div>
            {i < 2 && (
              <div className='flex justify-center py-0.5 text-[#f5a623]'>▼</div>
            )}
          </div>
        ))}
      </div>

      {/* Match Flow — Desktop */}
      <div className='hidden items-stretch gap-0 sm:flex'>
        {FLOW_STEPS.map((step, i) => (
          <div key={step.title} className='flex flex-1 items-center'>
            <div
              className={`flex-1 border border-[#1e1e1e] bg-[#111] px-4 py-5 text-center ${i === 0 ? 'rounded-l-2xl' : i === 2 ? 'rounded-r-2xl' : ''}`}
            >
              <div className='mb-2'>
                <TkcIcon name={step.icon} className='mx-auto size-7' />
              </div>
              <div className='text-[13px] font-bold text-white/90'>
                {step.title}
              </div>
              <div className='mt-1 text-[11px] leading-relaxed whitespace-pre-line text-white/35'>
                {step.desc}
              </div>
            </div>
            {i < 2 && (
              <span className='shrink-0 px-1 text-base text-[#f5a623]'>→</span>
            )}
          </div>
        ))}
      </div>

      {/* Song Submission */}
      <Card>
        <div className='mb-1 text-sm font-bold text-white/90'>
          사전 선곡 제출
        </div>
        <div className='mb-4 text-xs text-white/35'>
          참가자는 신청 시점에 최대 4라운드까지 사용할 곡을 미리 제출합니다
        </div>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
          {(['R1', 'R2', 'R3', 'R4'] as const).map((r) => (
            <div
              key={r}
              className='relative overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] px-3 py-4 text-center'
            >
              <div className='absolute top-0 right-0 left-0 h-0.5 bg-[#f5a623]/60' />
              <div className='text-xl font-extrabold text-[#f5a623]'>{r}</div>
              <div className='mt-1 text-[11px] text-white/35'>신청 시 제출</div>
            </div>
          ))}
        </div>
      </Card>

      <Callout type='info' icon={<TkcIcon name='info' />}>
        해당 라운드 매치에서 사용되는 "자기 곡"은 사전 제출된 해당 라운드 곡으로
        고정됩니다. (예: R3 배정 시 → 자신이 제출한 R3 곡 사용)
      </Callout>
    </SectionBlock>
  )
}

function SideSection() {
  return (
    <SectionBlock
      id='side'
      num='03'
      title='사이드(자리) 규칙'
      desc='곡 제공자가 원하는 사이드를 선택할 수 있습니다.'
    >
      <Card>
        {/* Mobile */}
        <div className='flex flex-col items-center gap-4 sm:hidden'>
          <div className='flex h-[130px] w-[100px] flex-col items-center justify-center rounded-xl border-2 border-[#e86e3a] bg-[#e86e3a]/[0.06]'>
            <TkcIcon name='match' className='mb-1.5 size-8' />
            <div className='text-sm font-bold text-[#e86e3a]'>1P</div>
          </div>
          <div className='text-center text-xs leading-relaxed text-white/35'>
            자기 곡 차례에
            <br />
            <strong className='text-[#f5a623]'>곡 제공자가 선택</strong>
          </div>
          <div className='flex h-[130px] w-[100px] flex-col items-center justify-center rounded-xl border-2 border-[#f7d154] bg-[#f7d154]/[0.06]'>
            <TkcIcon name='match' className='mb-1.5 size-8' />
            <div className='text-sm font-bold text-[#f7d154]'>2P</div>
          </div>
        </div>
        {/* Desktop */}
        <div className='hidden items-center justify-center gap-8 py-7 sm:flex'>
          <div className='flex h-[130px] w-[100px] flex-col items-center justify-center rounded-xl border-2 border-[#e86e3a] bg-[#e86e3a]/[0.06]'>
            <TkcIcon name='match' className='mb-1.5 size-8' />
            <div className='text-sm font-bold text-[#e86e3a]'>1P</div>
          </div>
          <div className='text-center text-[13px] leading-relaxed text-white/35'>
            자기 곡 차례에
            <br />
            <strong className='text-[#f5a623]'>곡 제공자가 선택</strong>
          </div>
          <div className='flex h-[130px] w-[100px] flex-col items-center justify-center rounded-xl border-2 border-[#f7d154] bg-[#f7d154]/[0.06]'>
            <TkcIcon name='match' className='mb-1.5 size-8' />
            <div className='text-sm font-bold text-[#f7d154]'>2P</div>
          </div>
        </div>
      </Card>

      {/* Per-song side selection */}
      <Card>
        <div className='mb-3.5 text-sm font-bold text-white/90'>
          곡별 사이드 선택
        </div>
        <div className='grid grid-cols-2 gap-2'>
          <div className='rounded-xl border border-[#e86e3a]/[0.12] bg-[#e86e3a]/[0.04] p-4 text-center'>
            <div className='mb-1 text-[13px] font-semibold text-[#e86e3a]'>
              A의 곡 진행 시
            </div>
            <div className='text-[15px] font-bold text-white/90'>
              A가 사이드 선택
            </div>
          </div>
          <div className='rounded-xl border border-[#f7d154]/[0.12] bg-[#f7d154]/[0.04] p-4 text-center'>
            <div className='mb-1 text-[13px] font-semibold text-[#f7d154]'>
              B의 곡 진행 시
            </div>
            <div className='text-[15px] font-bold text-white/90'>
              B가 사이드 선택
            </div>
          </div>
        </div>
      </Card>

      <Callout type='warning' icon={<TkcIcon name='warning' />}>
        재경기 등 운영상 우선권이 필요한 경우,{' '}
        <strong className='text-white/80'>
          온라인 예선 순위가 더 높은 선수
        </strong>
        가 사이드 선택 우선권을 가집니다.
      </Callout>
    </SectionBlock>
  )
}

function TiebreakSection() {
  return (
    <SectionBlock
      id='tiebreak'
      num='04'
      title='동점 처리'
      desc='2곡 합산 점수가 동점일 경우, 다음 절차로 처리합니다.'
    >
      <div className='flex flex-col items-center gap-0'>
        {/* Node 1 */}
        <div className='w-full max-w-md rounded-xl border border-[#1e1e1e] bg-[#111] px-7 py-[18px] text-center'>
          <div className='text-[15px] font-bold text-white/90'>
            2곡 합산 결과
          </div>
          <div className='mt-1 text-xs text-white/35'>
            두 선수의 점수 합산이 동일
          </div>
        </div>
        <div className='relative h-7 w-0.5 bg-[#2a2a2a]'>
          <span className='absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-[#f5a623]'>
            ▼
          </span>
        </div>
        <div className='rounded-lg border border-dashed border-[#f5a623]/30 bg-[#f5a623]/[0.06] px-5 py-2 text-xs font-semibold text-[#f5a623]'>
          동점 발생
        </div>
        <div className='relative h-7 w-0.5 bg-[#2a2a2a]'>
          <span className='absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-[#f5a623]'>
            ▼
          </span>
        </div>
        {/* Node 2 */}
        <div className='w-full max-w-md rounded-xl border border-[#1e1e1e] bg-[#111] px-7 py-[18px] text-center'>
          <div className='text-[15px] font-bold text-white/90'>
            선곡풀 랜덤 1곡
          </div>
          <div className='mt-1 text-xs text-white/35'>
            선곡풀에서 랜덤으로 1곡을 선정
          </div>
        </div>
        <div className='relative h-7 w-0.5 bg-[#2a2a2a]'>
          <span className='absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-[#f5a623]'>
            ▼
          </span>
        </div>
        {/* Node 3 */}
        <div className='w-full max-w-md rounded-xl border border-[#1e1e1e] bg-[#111] px-7 py-[18px] text-center'>
          <div className='text-[15px] font-bold text-white/90'>재경기 단판</div>
          <div className='mt-1 text-xs text-white/35'>
            1곡 재경기로 승패 결정
          </div>
        </div>
      </div>

      <Callout type='info' icon={<TkcIcon name='info' />}>
        재경기 시 사이드 선택 우선권은{' '}
        <strong className='text-white/80'>온라인 예선 상위 순위</strong>{' '}
        선수에게 부여됩니다.
      </Callout>
    </SectionBlock>
  )
}

function AdvanceSection() {
  return (
    <SectionBlock
      id='advance'
      num='05'
      title='스위스 종료 후: 진출자 선발'
      desc='각 예선에서 총 2명이 진출합니다. 자동 진출 1명 + 선발전 1명.'
    >
      <div className='grid gap-4 sm:grid-cols-2'>
        {/* 4-0 Auto */}
        <div className='relative overflow-hidden rounded-2xl border border-[#f7d154]/20 bg-[#f7d154]/[0.04] p-6 text-center'>
          <TkcIcon name='champion' className='mx-auto mb-2.5 size-10' />
          <div className='text-xl font-bold text-[#f7d154]'>자동 진출</div>
          <div className='my-2 font-mono text-[28px] font-extrabold text-[#f7d154]'>
            4-0
          </div>
          <div className='text-[13px] leading-relaxed break-keep text-white/55'>
            4승 0패 달성자는
            <br />
            자동으로 결선 진출이 확정됩니다
          </div>
        </div>
        {/* 3-1 Playoff */}
        <div className='relative overflow-hidden rounded-2xl border border-[#f5a623]/20 bg-[#f5a623]/[0.04] p-6 text-center'>
          <TkcIcon name='playoff' className='mx-auto mb-2.5 size-10' />
          <div className='text-xl font-bold text-[#f5a623]'>진출자 선발전</div>
          <div className='my-2 font-mono text-[28px] font-extrabold text-[#f5a623]'>
            3-1
          </div>
          <div className='text-[13px] leading-relaxed break-keep text-white/55'>
            3승 1패 참가자 전원 대상
            <br />
            스코어 어택으로 1명 추가 진출
          </div>
        </div>
      </div>

      {/* Decider Details */}
      <Card>
        <div className='mb-1 text-sm font-bold text-white/90'>
          진출자 선발전 상세
        </div>
        <div className='mb-4 text-xs text-white/35'>
          3-1 기록자 전원 대상 스코어 어택
        </div>
        <div className='relative overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] p-7 text-center'>
          <div className='absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-[#f5a623] to-[#f5a623]' />
          <div className='text-[11px] tracking-[1px] text-white/35 uppercase'>
            과제곡
          </div>
          <div className='my-2 text-[22px] font-extrabold text-white/90'>
            {ARCADE_SONGS.decider31.title}
          </div>
          <div className='inline-flex items-center gap-2 text-[13px] text-white/35'>
            <span>귀신(오니)</span>
            <span className='rounded bg-[#f5a623] px-2 py-0.5 text-xs font-bold text-white'>
              ★{ARCADE_SONGS.decider31.level}
            </span>
          </div>
          <div className='mt-3.5 rounded-lg border border-[#f5a623]/15 bg-[#f5a623]/[0.04] px-4 py-3 text-[13px] break-keep text-white/55'>
            과제곡은 사전에 비공개 · 각 1회 플레이 · 최고점 1명이 추가 진출
          </div>
        </div>
      </Card>
    </SectionBlock>
  )
}

function SeedSection() {
  return (
    <SectionBlock
      id='seed'
      num='06'
      title='결선(Top 8) 시드 산정'
      desc='각 지역 진출자 2명이 시드 산정용 과제곡을 플레이합니다.'
    >
      <div className='relative overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] p-7 text-center'>
        <div className='absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-[#b275f0] to-[#f5a623]' />
        <div className='text-[11px] tracking-[1px] text-white/35 uppercase'>
          시드 산정 과제곡
        </div>
        <div className='my-2 text-[22px] font-extrabold text-white/90'>
          {ARCADE_SONGS.seeding.title}
        </div>
        <div className='inline-flex items-center gap-2 text-[13px] text-white/35'>
          <span>귀신(오니)</span>
          <span className='rounded bg-[#b275f0] px-2 py-0.5 text-xs font-bold text-white'>
            ★{ARCADE_SONGS.seeding.level}
          </span>
        </div>
        <div className='mt-3.5 rounded-lg border border-[#b275f0]/15 bg-[#b275f0]/[0.05] px-4 py-3 text-[13px] break-keep text-white/55'>
          이 단계에서는 승패로 탈락/우승을 결정하지 않으며, 순수하게 시드 산정용
          기록으로만 활용됩니다.
        </div>
      </div>

      <Callout type='info' icon={<TkcIcon name='info' />}>
        시드 과제곡은 사전에 비공개이며, 진출 확정 후 현장에서 각 1회
        플레이합니다.
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

function ArcadeSwissPage() {
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
        <SwissSection />
        <MatchSection />
        <SideSection />
        <TiebreakSection />
        <AdvanceSection />
        <SeedSection />
      </div>
    </>
  )
}
