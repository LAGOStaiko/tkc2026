import { useEffect, useState, type ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Callout, Card, FadeIn, TkcIcon } from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/arcade/finals')({
  component: ArcadeFinalsPage,
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

type OverviewStat = { value: string; label: string; sub?: string; color?: string }
type RoundOverviewItem = { name: string; info: string; songs: string; highlight?: boolean }
type RoundDetailItem = { name: string; songs: string; picks: string; challenge: boolean; highlight?: boolean }

const OVERVIEW_STATS: OverviewStat[] = [
  { value: '8명', label: '결선 진출자', sub: '예선 4-0 · 3-1 통과', color: '#e86e3a' },
  { value: '단판', label: '대전 방식' },
  { value: '5곡', label: '사전 준비', color: '#e86e3a' },
  { value: '밴픽', label: '선곡 방식', color: '#f5a623' },
]

const ROUND_OVERVIEW: RoundOverviewItem[] = [
  { name: '8강', info: '4경기', songs: '각 3곡' },
  { name: '4강', info: '2경기', songs: '각 3곡' },
  { name: '3·4위', info: '1경기', songs: '3곡' },
  { name: '결승', info: '1경기', songs: '5곡', highlight: true },
]

const QF_MATCHES = [
  { label: 'QF 1', hi: 'A1', hiName: '4-0 시드 1위', lo: 'B4', loName: '3-1 시드 4위' },
  { label: 'QF 2', hi: 'A2', hiName: '4-0 시드 2위', lo: 'B3', loName: '3-1 시드 3위' },
  { label: 'QF 3', hi: 'A3', hiName: '4-0 시드 3위', lo: 'B2', loName: '3-1 시드 2위' },
  { label: 'QF 4', hi: 'A4', hiName: '4-0 시드 4위', lo: 'B1', loName: '3-1 시드 1위' },
] as const

const SF_MATCHES = [
  { label: 'SF 1', a: 'QF1 승자', b: 'QF2 승자' },
  { label: 'SF 2', a: 'QF3 승자', b: 'QF4 승자' },
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

const SONG_RULES = [
  { num: '1', text: '한 번 플레이한 곡은 이후 라운드에서 재사용할 수 있습니다.' },
  { num: '2', text: '밴당한 곡은 해당 라운드에서만 사용 불가이며, 다음 라운드에서 다시 사용할 수 있습니다.' },
] as const

const ROUND_DETAILS: RoundDetailItem[] = [
  { name: '8강', songs: '총 3곡', picks: '각 1곡 선곡', challenge: true },
  { name: '4강', songs: '총 3곡', picks: '각 1곡 선곡', challenge: true },
  { name: '3·4위', songs: '총 3곡', picks: '각 1곡 선곡', challenge: true },
  { name: '결승', songs: '총 5곡', picks: '각 2곡 선곡', challenge: true, highlight: true },
]

const PLAY_RULES = [
  {
    icon: 'match',
    title: '사이드 선택권',
    lines: [
      { bold: '선곡곡', text: '해당 곡을 선곡한 선수' },
      { bold: '과제곡', text: '직전까지 합산 점수 높은 선수' },
      { bold: '과제곡이 첫 곡', text: '시드 상위자' },
    ],
  },
  {
    icon: 'details',
    title: '플레이 순서',
    lines: [
      { bold: '', text: '시드 상위자의 선곡곡을 먼저 플레이' },
      { bold: '', text: '과제곡은 항상 마지막에 플레이' },
    ],
  },
  {
    icon: 'song-pick',
    title: '난이도 및 옵션',
    lines: [
      { bold: '', text: '난이도는 선곡한 보면 기준' },
      { bold: '배속 조정', text: '허용' },
      { bold: '랜덤 · 미러 등', text: '불가' },
    ],
  },
  {
    icon: 'tie',
    title: '동점 · 기기 트러블',
    lines: [
      { bold: '동점', text: '마지막 곡 동일 조건 재대결' },
      { bold: '재대결도 동점', text: '양(良) 수 비교' },
      { bold: '기기 오류', text: '운영진 판단 후 재경기' },
    ],
  },
] as const

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
        <div className='mb-2 font-mono text-xs font-semibold tracking-[1px] text-[#e86e3a] uppercase'>
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
      desc='8명 단판 토너먼트. 밴픽 전략과 과제곡이 승패를 좌우합니다.'
    >
      {/* Stat Boxes */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        {OVERVIEW_STATS.map((s) => (
          <div
            key={s.label}
            className='relative flex min-h-[132px] flex-col justify-center overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] px-4 py-6 text-center'
          >
            <div className='absolute top-0 right-0 left-0 h-0.5 bg-[#e86e3a] opacity-50' />
            <div
              className='text-[32px] font-extrabold'
              style={{ color: s.color ?? 'rgba(255,255,255,0.9)' }}
            >
              {s.value}
            </div>
            <div className='mt-1 text-sm font-medium text-white/35'>{s.label}</div>
            {s.sub && (
              <div className='mt-1 text-[13px] text-white/35'>{s.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Round Composition */}
      <Card>
        <div className='mb-4 text-sm font-bold text-white/90'>라운드 구성</div>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
          {ROUND_OVERVIEW.map((r) => (
            <div
              key={r.name}
              className={`rounded-xl p-5 text-center ${
                r.highlight
                  ? 'border border-[#f5a623]/20 bg-[#f5a623]/[0.04]'
                  : 'border border-[#e86e3a]/10 bg-[#e86e3a]/[0.04]'
              }`}
            >
              <div
                className='text-[22px] font-extrabold'
                style={{ color: r.highlight ? '#f5a623' : '#e86e3a' }}
              >
                {r.name}
              </div>
              <div className='mt-1.5 text-sm text-white/35'>
                {r.info} · {r.songs}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </SectionBlock>
  )
}

function BracketSection() {
  const tbd = 'bg-white/[0.03] text-white/35'
  const hi = 'bg-[#e86e3a]/10 text-[#e86e3a]'
  const lo = 'bg-[#f5a623]/[0.08] text-[#f5a623]'

  return (
    <SectionBlock
      id='bracket'
      num='02'
      title='8강 대진표 — 크로스 시딩'
      desc='예선 A그룹(4-0 진출)과 B그룹(3-1 진출)을 교차 배치합니다.'
    >
      {/* Desktop Bracket */}
      <div className='hidden gap-4 sm:grid sm:grid-cols-3'>
        {/* Quarterfinals */}
        <div>
          <div className='mb-2.5 border-b-2 border-[#e86e3a] pb-2 text-center font-mono text-xs font-semibold tracking-[1px] text-white/35 uppercase'>
            Quarterfinals
          </div>
          <div className='space-y-2'>
            {QF_MATCHES.map((m) => (
              <MatchCard
                key={m.label}
                label={m.label}
                rows={[
                  { seed: m.hi, name: m.hiName, seedCls: hi },
                  { seed: m.lo, name: m.loName, seedCls: lo },
                ]}
              />
            ))}
          </div>
        </div>

        {/* Semifinals */}
        <div>
          <div className='mb-2.5 border-b-2 border-[#e86e3a] pb-2 text-center font-mono text-xs font-semibold tracking-[1px] text-white/35 uppercase'>
            Semifinals
          </div>
          <div className='space-y-2'>
            {SF_MATCHES.map((m) => (
              <MatchCard
                key={m.label}
                label={m.label}
                rows={[
                  { seed: '?', name: m.a, seedCls: tbd },
                  { seed: '?', name: m.b, seedCls: tbd },
                ]}
              />
            ))}
          </div>
        </div>

        {/* Grand Final */}
        <div>
          <div className='mb-2.5 border-b-2 border-[#e86e3a] pb-2 text-center font-mono text-xs font-semibold tracking-[1px] text-white/35 uppercase'>
            Grand Final
          </div>
          <MatchCard
            label='Final'
            rows={[
              { seed: '?', name: 'SF1 승자', seedCls: tbd },
              { seed: '?', name: 'SF2 승자', seedCls: tbd },
            ]}
          />
        </div>
      </div>

      {/* Mobile Bracket */}
      <div className='space-y-4 sm:hidden'>
        <div>
          <div className='mb-2.5 border-b-2 border-[#e86e3a] pb-2 text-center font-mono text-xs font-semibold tracking-[1px] text-white/35 uppercase'>
            Quarterfinals
          </div>
          <div className='space-y-2'>
            {QF_MATCHES.map((m) => (
              <MatchCard
                key={m.label}
                label={m.label}
                rows={[
                  { seed: m.hi, name: m.hiName, seedCls: hi },
                  { seed: m.lo, name: m.loName, seedCls: lo },
                ]}
              />
            ))}
          </div>
        </div>
        <div className='py-1 text-center font-mono text-[11px] font-semibold tracking-[1px] text-[#e86e3a] opacity-60'>
          ▼ 승자 진출
        </div>
        <div>
          <div className='mb-2.5 border-b-2 border-[#e86e3a] pb-2 text-center font-mono text-xs font-semibold tracking-[1px] text-white/35 uppercase'>
            Semifinals
          </div>
          <div className='space-y-2'>
            {SF_MATCHES.map((m) => (
              <MatchCard
                key={m.label}
                label={m.label}
                rows={[
                  { seed: '?', name: m.a, seedCls: tbd },
                  { seed: '?', name: m.b, seedCls: tbd },
                ]}
              />
            ))}
          </div>
        </div>
        <div className='py-1 text-center font-mono text-[11px] font-semibold tracking-[1px] text-[#e86e3a] opacity-60'>
          ▼ 승자 진출
        </div>
        <div>
          <div className='mb-2.5 border-b-2 border-[#e86e3a] pb-2 text-center font-mono text-xs font-semibold tracking-[1px] text-white/35 uppercase'>
            Grand Final
          </div>
          <MatchCard
            label='Final'
            rows={[
              { seed: '?', name: 'SF1 승자', seedCls: tbd },
              { seed: '?', name: 'SF2 승자', seedCls: tbd },
            ]}
          />
        </div>
      </div>

      {/* 3rd Place Match */}
      <FadeIn delay={100}>
        <div className='mx-auto max-w-[300px]'>
          <div className='mb-2.5 border-b-2 border-[#f5a623] pb-2 text-center font-mono text-xs font-semibold tracking-[1px] text-white/35 uppercase'>
            3·4위전
          </div>
          <MatchCard
            label='3rd Place'
            rows={[
              { seed: '?', name: 'SF1 패자', seedCls: tbd },
              { seed: '?', name: 'SF2 패자', seedCls: tbd },
            ]}
          />
        </div>
      </FadeIn>
    </SectionBlock>
  )
}

function PrepSection() {
  return (
    <SectionBlock
      id='prep'
      num='03'
      title='곡 준비 규정'
      desc='참가자는 선곡풀에서 5곡을 사전에 준비하여 제출합니다. 곡 목록은 대회 전에 공개됩니다.'
    >
      {/* Flow */}
      {/* Desktop */}
      <div className='hidden items-stretch gap-0 sm:flex'>
        {[
          { num: '5', label: '사전 준비 곡', desc: '선곡풀에서 선택', color: '#e86e3a' },
          { num: '밴', label: '상대가 제거', desc: '해당 라운드 사용 불가', color: undefined },
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
              <span className='shrink-0 px-1 text-lg text-[#e86e3a]'>→</span>
            )}
          </div>
        ))}
      </div>
      {/* Mobile */}
      <div className='flex flex-col gap-0 sm:hidden'>
        {[
          { num: '5', label: '사전 준비 곡', desc: '선곡풀에서 선택', color: '#e86e3a' },
          { num: '밴', label: '상대가 제거', desc: '해당 라운드 사용 불가', color: undefined },
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
              <div className='flex justify-center py-0.5 text-[#e86e3a]'>▼</div>
            )}
          </div>
        ))}
      </div>

      {/* Song Usage Rules */}
      <Card>
        <div className='mb-3.5 text-sm font-bold text-white/90'>곡 사용 규칙</div>
        {SONG_RULES.map((rule) => (
          <div
            key={rule.num}
            className='flex gap-3.5 border-b border-[#1e1e1e] py-3.5 last:border-b-0'
          >
            <div className='flex size-7 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-[#e86e3a] font-mono text-base font-extrabold text-[#e86e3a]'>
              {rule.num}
            </div>
            <div className='text-[15px] leading-[1.55] break-keep text-white/55'>
              {rule.text}
            </div>
          </div>
        ))}
      </Card>

      <Callout type='warning' icon={<TkcIcon name='warning' />}>
        밴당한 곡은 "사용"으로 치지 않으므로{' '}
        <strong className='text-white/80'>다음 라운드에서 재사용 가능</strong>
        합니다. 한 번 플레이한 곡만 소모됩니다.
      </Callout>
    </SectionBlock>
  )
}

function BanPickSection() {
  return (
    <SectionBlock
      id='banpick'
      num='04'
      title='밴픽 절차'
      desc='시드 상위자(A)가 먼저 밴하고, 교대로 밴/픽을 진행합니다.'
    >
      {/* Standard: QF / SF / 3rd */}
      <Card>
        <div className='mb-4 text-sm font-bold text-white/90'>
          8강 · 4강 · 3·4위전
        </div>
        {/* Desktop */}
        <div className='hidden gap-0 sm:flex'>
          {BP_STANDARD.map((s, i) => (
            <div
              key={s.step}
              className={`relative flex-1 border border-[#1e1e1e] px-3 py-6 text-center ${
                i === 0 ? 'rounded-l-xl' : i === 3 ? 'rounded-r-xl' : ''
              } ${i > 0 ? '-ml-px' : ''}`}
            >
              <div
                className='absolute top-0 right-0 left-0 h-0.5'
                style={{
                  background: s.type === 'ban' ? 'rgba(255,255,255,0.15)' : '#e86e3a',
                }}
              />
              <div className='mb-2.5 font-mono text-[11px] font-semibold tracking-[1px] text-white/35'>
                {s.step}
              </div>
              <div className='mb-2.5 text-[28px] font-extrabold text-white/90'>
                {s.player}
              </div>
              <span
                className={`inline-block rounded-[5px] px-3 py-1 font-mono text-xs font-semibold tracking-[1px] ${
                  s.type === 'ban'
                    ? 'bg-white/[0.05] text-white/55'
                    : 'bg-[#e86e3a]/10 text-[#e86e3a]'
                }`}
              >
                {s.type.toUpperCase()}
              </span>
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
            >
              <div
                className='absolute top-0 right-0 left-0 h-0.5'
                style={{
                  background: s.type === 'ban' ? 'rgba(255,255,255,0.15)' : '#e86e3a',
                }}
              />
              <div className='mb-2 font-mono text-[11px] font-semibold tracking-[1px] text-white/35'>
                {s.step}
              </div>
              <div className='mb-2 text-[28px] font-extrabold text-white/90'>
                {s.player}
              </div>
              <span
                className={`inline-block rounded-[5px] px-3 py-1 font-mono text-xs font-semibold tracking-[1px] ${
                  s.type === 'ban'
                    ? 'bg-white/[0.05] text-white/55'
                    : 'bg-[#e86e3a]/10 text-[#e86e3a]'
                }`}
              >
                {s.type.toUpperCase()}
              </span>
              <div className='mt-2 text-sm text-white/35'>{s.note}</div>
            </div>
          ))}
        </div>
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
            >
              <div
                className='absolute top-0 right-0 left-0 h-0.5'
                style={{
                  background: s.type === 'ban' ? 'rgba(255,255,255,0.15)' : '#e86e3a',
                }}
              />
              <div className='mb-2.5 font-mono text-[11px] font-semibold tracking-[1px] text-white/35'>
                {s.step}
              </div>
              <div className='mb-2.5 text-[28px] font-extrabold text-white/90'>
                {s.player}
              </div>
              <span
                className={`inline-block rounded-[5px] px-3 py-1 font-mono text-xs font-semibold tracking-[1px] ${
                  s.type === 'ban'
                    ? 'bg-white/[0.05] text-white/55'
                    : 'bg-[#e86e3a]/10 text-[#e86e3a]'
                }`}
              >
                {s.type.toUpperCase()}
              </span>
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
            >
              <div
                className='absolute top-0 right-0 left-0 h-0.5'
                style={{
                  background: s.type === 'ban' ? 'rgba(255,255,255,0.15)' : '#e86e3a',
                }}
              />
              <div className='mb-2 font-mono text-[11px] font-semibold tracking-[1px] text-white/35'>
                {s.step}
              </div>
              <div className='mb-2 text-[28px] font-extrabold text-white/90'>
                {s.player}
              </div>
              <span
                className={`inline-block rounded-[5px] px-3 py-1 font-mono text-xs font-semibold tracking-[1px] ${
                  s.type === 'ban'
                    ? 'bg-white/[0.05] text-white/55'
                    : 'bg-[#e86e3a]/10 text-[#e86e3a]'
                }`}
              >
                {s.type.toUpperCase()}
              </span>
              <div className='mt-2 text-sm break-keep text-white/35'>{s.note}</div>
            </div>
          ))}
        </div>
      </Card>

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
                ? 'border-[#e86e3a]/35 shadow-[0_0_24px_rgba(232,110,58,0.06),inset_0_0_0_1px_rgba(232,110,58,0.05)]'
                : 'border-[#1e1e1e] hover:border-[#2a2a2a]'
            }`}
          >
            {/* Desktop */}
            <div className='hidden sm:grid sm:grid-cols-[150px_1fr]'>
              <div
                className={`flex flex-col items-center justify-center border-r border-[#1e1e1e] px-4 py-7 ${
                  r.highlight ? 'bg-[#e86e3a]/[0.06]' : 'bg-[#111]'
                }`}
              >
                <div
                  className='text-[22px] font-extrabold'
                  style={{ color: r.highlight ? '#e86e3a' : 'rgba(255,255,255,0.9)' }}
                >
                  {r.name}
                </div>
                <div className='mt-0.5 font-mono text-sm font-semibold text-[#e86e3a]'>
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
                  <div className='inline-flex items-center gap-2.5 self-start rounded-xl border border-dashed border-[#e86e3a]/15 bg-[#e86e3a]/[0.03] px-4 py-3'>
                    <div className='text-xs font-semibold text-white/35'>과제곡</div>
                    <div className='font-mono text-xl font-bold tracking-[3px] text-white/35'>
                      ???
                    </div>
                    <div className='font-mono text-[11px] font-semibold text-[#e86e3a] opacity-50'>
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
                  r.highlight ? 'bg-[#e86e3a]/[0.06]' : 'bg-[#111]'
                }`}
              >
                <div className='absolute top-0 right-0 left-0 h-[3px] bg-[#e86e3a] opacity-40' />
                <div
                  className='text-[22px] font-extrabold'
                  style={{ color: r.highlight ? '#e86e3a' : 'rgba(255,255,255,0.9)' }}
                >
                  {r.name}
                </div>
                <div className='font-mono text-sm font-semibold text-[#e86e3a]'>
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
                  <div className='inline-flex items-center gap-2.5 self-start rounded-xl border border-dashed border-[#e86e3a]/15 bg-[#e86e3a]/[0.03] px-4 py-3'>
                    <div className='text-xs font-semibold text-white/35'>과제곡</div>
                    <div className='font-mono text-xl font-bold tracking-[3px] text-white/35'>
                      ???
                    </div>
                    <div className='font-mono text-[11px] font-semibold text-[#e86e3a] opacity-50'>
                      추후 공개
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionBlock>
  )
}

function PlayRulesSection() {
  return (
    <SectionBlock
      id='rules'
      num='06'
      title='플레이 규정'
      desc='사이드 선택, 플레이 순서, 옵션, 동점 처리 등 경기 규정입니다.'
    >
      <div className='grid gap-3 sm:grid-cols-2'>
        {PLAY_RULES.map((rule) => (
          <div
            key={rule.title}
            className='relative overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] p-6 transition-colors hover:border-[#2a2a2a]'
          >
            <div className='absolute top-0 right-0 left-0 h-0.5 bg-[#e86e3a] opacity-40' />
            <div className='mb-3 flex items-center gap-2.5'>
              <div className='flex size-[30px] shrink-0 items-center justify-center'>
                <TkcIcon name={rule.icon} className='size-6' />
              </div>
              <div className='text-[17px] font-bold text-white/90'>{rule.title}</div>
            </div>
            <div className='space-y-1.5 text-[15px] leading-[1.55] text-white/55'>
              {rule.lines.map((line, i) => (
                <div key={i}>
                  {line.bold ? (
                    <>
                      <strong className='text-white/90'>{line.bold}</strong> — {line.text}
                    </>
                  ) : (
                    line.text
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Callout type='danger' icon={<TkcIcon name='warning' />}>
        선수 과실에 의한 미스는{' '}
        <strong className='text-[#e86e3a]'>재경기 사유에 해당하지 않습니다.</strong>
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

function ArcadeFinalsPage() {
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
