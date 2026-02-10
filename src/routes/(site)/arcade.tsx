import { useEffect, useState, type ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ARCADE_SONGS } from '@/content/arcade-songs'
import { t } from '@/text'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { InfoCard } from '@/components/tkc/design-tokens'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/arcade')({
  component: ArcadePage,
})

/* ================================================================== */
/*  Markdown (온라인 예선 섹션용)                                      */
/* ================================================================== */

const omitNode = <T extends { node?: unknown }>(props: T) => {
  const { node, ...rest } = props
  void node
  return rest
}

const markdownComponents: Components = {
  h1: (props) => (
    <h3 className='text-lg font-bold text-white' {...omitNode(props)} />
  ),
  h2: (props) => (
    <h3 className='text-lg font-bold text-white' {...omitNode(props)} />
  ),
  h3: (props) => (
    <h4 className='text-base font-bold text-white' {...omitNode(props)} />
  ),
  p: (props) => (
    <p
      className='text-sm leading-relaxed break-keep text-white/90 md:text-base md:leading-[1.8]'
      {...omitNode(props)}
    />
  ),
  a: (props) => (
    <a
      className='font-medium text-[#ff8c66] underline underline-offset-4 hover:text-[#ff2a00]'
      {...omitNode(props)}
    />
  ),
  ul: (props) => (
    <ul className='ml-5 list-disc space-y-1.5' {...omitNode(props)} />
  ),
  ol: (props) => (
    <ol className='ml-5 list-decimal space-y-1.5' {...omitNode(props)} />
  ),
  li: (props) => (
    <li
      className='text-sm leading-relaxed break-keep text-white/90 md:text-base md:leading-[1.8]'
      {...omitNode(props)}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className='border-l-4 border-[#ff2a00]/30 pl-4 text-white/75'
      {...omitNode(props)}
    />
  ),
  table: (props) => (
    <div className='-mx-4 overflow-x-auto px-4'>
      <Table className='text-sm md:text-base'>{omitNode(props).children}</Table>
    </div>
  ),
  thead: (props) => (
    <TableHeader
      className='bg-white/[0.07] text-white/75'
      {...omitNode(props)}
    />
  ),
  tbody: (props) => (
    <TableBody className='text-white/90' {...omitNode(props)} />
  ),
  tr: (props) => (
    <TableRow
      className='border-white/[0.07] hover:bg-white/[0.04]'
      {...omitNode(props)}
    />
  ),
  th: (props) => (
    <TableHead
      className='border-white/[0.07] px-3 py-2 text-xs font-bold break-keep text-white/75 md:px-4 md:py-2.5 md:text-sm'
      {...omitNode(props)}
    />
  ),
  td: (props) => (
    <TableCell
      className='border-white/[0.07] px-3 py-2.5 align-top text-sm break-keep text-white/90 md:px-4 md:py-3 md:text-base'
      {...omitNode(props)}
    />
  ),
  hr: () => <hr className='border-white/15' />,
}

function MarkdownBlock({ body }: { body: string }) {
  return (
    <div className='space-y-4'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
}

const ONLINE_QUALIFIER_MD = `## 방식

온라인 예선은 지정 과제곡 2곡을 플레이한 뒤 **합산 점수**로 순위를 결정합니다.

| 과제곡 | 난이도 |
|---|---|
| ${ARCADE_SONGS.online1.title} | ★${ARCADE_SONGS.online1.level} |
| ${ARCADE_SONGS.online2.title} | ★${ARCADE_SONGS.online2.level} |

## 선발

- 차수별 상위 16명 오프라인 진출
- 동점 시 먼저 엔트리한 참가자 우선
- 엔트리 취소 불가`

/* ================================================================== */
/*  Section — 대형 번호 섹션 헤더                                       */
/* ================================================================== */

function Section({
  num,
  title,
  subtitle,
  children,
}: {
  num: string
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className='motion-safe:animate-[tkc-slide-up_0.5s_ease_both]'>
      <div className='mb-6 flex items-baseline gap-4'>
        <span className='font-mono text-5xl leading-none font-extrabold tracking-tighter text-white/[0.08] select-none md:text-6xl'>
          {num}
        </span>
        <div>
          <h2 className='text-xl font-bold tracking-tight text-white md:text-2xl'>
            {title}
          </h2>
          <p className='mt-0.5 text-sm tracking-wide text-white/40'>
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </section>
  )
}

/* ================================================================== */
/*  SNote — 정보 박스                                                   */
/* ================================================================== */

function SNote({ children }: { children: ReactNode }) {
  return (
    <div className='mt-5 flex gap-3 rounded-xl border border-[#6AB0F3]/10 bg-[#6AB0F3]/5 p-4'>
      <span className='mt-0.5 shrink-0 text-sm'>💡</span>
      <p className='text-sm leading-relaxed break-keep text-[#6AB0F3]/80'>
        {children}
      </p>
    </div>
  )
}

/* ================================================================== */
/*  (1) TournamentFlow — 대회 흐름 타임라인                             */
/* ================================================================== */

const FLOW_STEPS = [
  {
    num: '01',
    label: '온라인 예선',
    detail: '상위 16명 선발',
    accent: '#6AB0F3',
    desc: '각 지역별로 온라인 예선을 진행해 상위 16명을 선발합니다.',
  },
  {
    num: '02',
    label: '오프라인 예선',
    detail: '스위스 4라운드',
    accent: '#E63B2E',
    desc: '16명이 스위스 시스템으로 최대 4라운드를 치릅니다. 2패 시 탈락.',
  },
  {
    num: '03',
    label: '진출자 결정',
    detail: '지역별 2명',
    accent: '#F5A623',
    desc: '4-0 전승자 1명은 자동 진출, 3-1 기록자 중 결정전으로 1명을 추가 선발합니다.',
  },
  {
    num: '04',
    label: 'Top 8 결선',
    detail: '8강 토너먼트',
    accent: '#4CAF50',
    desc: '4개 지역 × 2명 = 총 8명이 크로스 시딩 8강 토너먼트를 진행합니다.',
  },
] as const

function TournamentFlow() {
  return (
    <div>
      {FLOW_STEPS.map((s, i) => (
        <div key={s.num} className='flex items-stretch gap-4'>
          {/* Timeline */}
          <div className='flex w-10 shrink-0 flex-col items-center'>
            <div
              className='flex size-10 items-center justify-center rounded-full font-mono text-sm font-bold'
              style={{
                background: `${s.accent}18`,
                border: `2px solid ${s.accent}55`,
                color: s.accent,
              }}
            >
              {s.num}
            </div>
            {i < FLOW_STEPS.length - 1 && (
              <div
                className='min-h-6 w-0.5 flex-1'
                style={{
                  background: `linear-gradient(to bottom, ${s.accent}30, ${FLOW_STEPS[i + 1].accent}30)`,
                }}
              />
            )}
          </div>

          {/* Content */}
          <div className={i < FLOW_STEPS.length - 1 ? 'pb-5' : ''}>
            <div className='text-base font-extrabold text-[#f0f0f0] md:text-lg'>
              {s.label}
            </div>
            <div
              className='mt-0.5 font-mono text-sm opacity-70'
              style={{ color: s.accent }}
            >
              {s.detail}
            </div>
            <div className='mt-1.5 text-sm leading-relaxed break-keep text-white/60'>
              {s.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ================================================================== */
/*  (2) PlayerChecklist — 선수 준비 체크리스트                           */
/* ================================================================== */

const CHECKLIST_ITEMS = [
  { icon: '🎵', text: 'R1~R4 선곡 4곡 미리 제출', tag: '신청 시' },
  { icon: '🏪', text: '오프라인 대회장 방문', tag: '대회 당일' },
  { icon: '🎮', text: '매치당 2곡 합산으로 승패 결정', tag: '경기 중' },
  { icon: '⚠️', text: '2패 누적 시 즉시 탈락', tag: '주의' },
] as const

function PlayerChecklist() {
  return (
    <div className='rounded-2xl border border-[#ff2a00]/20 bg-[#ff2a00]/[0.04] p-5 motion-safe:animate-[tkc-slide-up_0.5s_ease_both] md:p-6'>
      <div className='mb-2 font-mono text-sm tracking-[3px] text-[#ff2a00] uppercase opacity-60'>
        Player Checklist
      </div>
      <p className='mb-4 text-sm leading-relaxed break-keep text-white/55'>
        대회 참가 전 꼭 확인해야 할 사항들입니다.
      </p>
      <div className='flex flex-col gap-3.5'>
        {CHECKLIST_ITEMS.map((item) => (
          <div key={item.text} className='flex items-center gap-3.5'>
            <span className='shrink-0 text-xl'>{item.icon}</span>
            <span className='flex-1 text-base font-semibold break-keep text-white/75'>
              {item.text}
            </span>
            <span
              className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-sm tracking-wide ${
                item.tag === '주의'
                  ? 'border border-[#ff2a00]/20 bg-[#ff2a00]/10 text-[#ff2a00]'
                  : 'border border-white/[0.06] bg-white/[0.04] text-white/50'
              }`}
            >
              {item.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  (3) RegionTable — 예선 지역                                        */
/* ================================================================== */

const REGIONS = [
  { num: '1차', city: '서울', emoji: '🏙️' },
  { num: '2차', city: '대전', emoji: '🌆' },
  { num: '3차', city: '광주', emoji: '🌿' },
  { num: '4차', city: '부산', emoji: '🌊' },
] as const

function RegionTable() {
  return (
    <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-4'>
      {REGIONS.map((r) => (
        <div
          key={r.num}
          className='rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-5 text-center'
        >
          <div className='mb-2 text-2xl'>{r.emoji}</div>
          <div className='font-mono text-sm tracking-wider text-white/50'>
            {r.num}
          </div>
          <div className='mt-1 text-base font-bold text-white/80'>{r.city}</div>
        </div>
      ))}
    </div>
  )
}

/* ================================================================== */
/*  SeedingMatchTable — 1라운드 시드 매칭                               */
/* ================================================================== */

const SEEDING_MATCHES = [
  { match: '매치 1', pairs: ['1 vs 16', '5 vs 12'] },
  { match: '매치 2', pairs: ['2 vs 15', '6 vs 11'] },
  { match: '매치 3', pairs: ['3 vs 14', '7 vs 10'] },
  { match: '매치 4', pairs: ['4 vs 13', '8 vs 9'] },
]

function SeedingMatchTable() {
  return (
    <div className='mb-2'>
      {/* Mobile: 2-col cards */}
      <div className='md:hidden'>
        <div className='grid grid-cols-2 gap-2.5'>
          {SEEDING_MATCHES.map((m) => (
            <div
              key={m.match}
              className='rounded-lg border border-white/10 bg-white/[0.03] p-3.5'
            >
              <div className='mb-2.5 text-center text-sm font-bold tracking-wider text-[#ff2a00]'>
                {m.match}
              </div>
              {m.pairs.map((p) => (
                <div
                  key={p}
                  className='py-1.5 text-center font-mono text-sm text-white/60'
                >
                  {p}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: 4-col grid table */}
      <div className='hidden md:block'>
        <div className='overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]'>
          <div className='grid grid-cols-4 border-b border-white/10 bg-[#ff2a00]/[0.06]'>
            {SEEDING_MATCHES.map((m, i) => (
              <div
                key={m.match}
                className={`px-2 py-2.5 text-center font-mono text-sm font-bold tracking-wider text-[#ff2a00] ${
                  i < 3 ? 'border-r border-white/[0.06]' : ''
                }`}
              >
                {m.match}
              </div>
            ))}
          </div>
          <div className='grid grid-cols-4 border-b border-white/[0.06]'>
            {SEEDING_MATCHES.map((m, i) => (
              <div
                key={m.pairs[0]}
                className={`px-2 py-2.5 text-center font-mono text-sm text-white/60 ${
                  i < 3 ? 'border-r border-white/[0.06]' : ''
                }`}
              >
                {m.pairs[0]}
              </div>
            ))}
          </div>
          <div className='grid grid-cols-4'>
            {SEEDING_MATCHES.map((m, i) => (
              <div
                key={m.pairs[1]}
                className={`px-2 py-2.5 text-center font-mono text-sm text-white/60 ${
                  i < 3 ? 'border-r border-white/[0.06]' : ''
                }`}
              >
                {m.pairs[1]}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className='mt-2.5 text-center text-sm text-white/45'>
        1라운드: 온라인 순위 기반 시드 매칭
      </p>
    </div>
  )
}

/* ================================================================== */
/*  (8) BracketVisual — 8강 크로스 시딩                                 */
/* ================================================================== */

const BRACKET_MATCHES = [
  {
    qf: 'QF1',
    a: { seed: 'A1', desc: '4-0 1위' },
    b: { seed: 'B4', desc: '3-1 4위' },
  },
  {
    qf: 'QF2',
    a: { seed: 'A2', desc: '4-0 2위' },
    b: { seed: 'B3', desc: '3-1 3위' },
  },
  {
    qf: 'QF3',
    a: { seed: 'A3', desc: '4-0 3위' },
    b: { seed: 'B2', desc: '3-1 2위' },
  },
  {
    qf: 'QF4',
    a: { seed: 'A4', desc: '4-0 4위' },
    b: { seed: 'B1', desc: '3-1 1위' },
  },
] as const

function BracketVisual() {
  return (
    <div className='flex flex-col gap-2.5'>
      {/* Legend */}
      <div className='mb-1 flex justify-center gap-5'>
        <div className='flex items-center gap-2'>
          <div className='size-3 rounded-sm bg-[#4CAF50]' />
          <span className='text-sm text-white/50'>A그룹 (4-0 진출)</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='size-3 rounded-sm bg-[#3B8BE6]' />
          <span className='text-sm text-white/50'>B그룹 (3-1 진출)</span>
        </div>
      </div>

      {BRACKET_MATCHES.map((m) => (
        <div
          key={m.qf}
          className='flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5'
        >
          <div className='w-8 shrink-0 text-center font-mono text-sm tracking-wider text-white/50'>
            {m.qf}
          </div>

          <div className='flex flex-1 items-center justify-end gap-2.5'>
            <span className='text-sm text-white/50'>{m.a.desc}</span>
            <span className='min-w-10 rounded-lg bg-[#4CAF50]/10 px-3 py-1.5 text-center font-mono text-base font-bold text-[#4CAF50]'>
              {m.a.seed}
            </span>
          </div>

          <span className='font-mono text-sm text-white/40'>vs</span>

          <div className='flex flex-1 items-center gap-2.5'>
            <span className='min-w-10 rounded-lg bg-[#3B8BE6]/10 px-3 py-1.5 text-center font-mono text-base font-bold text-[#3B8BE6]'>
              {m.b.seed}
            </span>
            <span className='text-sm text-white/50'>{m.b.desc}</span>
          </div>
        </div>
      ))}

      <p className='mt-1.5 text-center text-sm break-keep text-white/45'>
        시드 과제곡: {ARCADE_SONGS.seeding.title} ★{ARCADE_SONGS.seeding.level}{' '}
        (사전 비공개)
      </p>
    </div>
  )
}

/* ================================================================== */
/*  OfflineOverview — 오프라인 예선 개요 스탯                            */
/* ================================================================== */

const OVERVIEW_STATS = [
  { value: '4회', label: '오프라인 예선', color: '#E63B2E' },
  { value: '16명', label: '지역별 참가자', color: '#F5A623' },
  { value: '2명', label: '회차별 진출', color: '#FFD700' },
  { value: 'Top 8', label: '결선 진출 인원', color: '#4CAF50' },
] as const

function OfflineOverview() {
  return (
    <div className='space-y-5'>
      {/* Stats Grid */}
      <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-4'>
        {OVERVIEW_STATS.map((s) => (
          <div
            key={s.label}
            className='relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-5 text-center'
          >
            <div
              className='absolute top-0 right-0 left-0 h-0.5'
              style={{ background: s.color }}
            />
            <div
              className='font-mono text-2xl font-extrabold'
              style={{ color: s.color }}
            >
              {s.value}
            </div>
            <div className='mt-1 text-xs text-white/50'>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Region Timeline */}
      <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-5'>
        <div className='mb-4 text-sm font-semibold text-white/50'>
          예선 일정
        </div>
        {/* Mobile */}
        <div className='flex flex-col gap-3 sm:hidden'>
          {REGIONS.map((r) => (
            <div
              key={r.num}
              className='flex items-center gap-3.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3'
            >
              <div className='flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-[#E63B2E] font-mono text-sm font-bold text-[#E63B2E]'>
                {r.num.charAt(0)}
              </div>
              <div>
                <div className='text-base font-semibold text-white/80'>
                  {r.city}
                </div>
                <div className='text-xs text-white/40'>{r.num} 예선</div>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop */}
        <div className='hidden items-center sm:flex'>
          {REGIONS.map((r, i) => (
            <div key={r.num} className='relative flex-1 text-center'>
              <div className='mx-auto mb-2.5 flex size-9 items-center justify-center rounded-full border-2 border-[#E63B2E] font-mono text-sm font-bold text-[#E63B2E]'>
                {r.num.charAt(0)}
              </div>
              <div className='text-sm font-semibold text-white/80'>
                {r.city}
              </div>
              <div className='text-xs text-white/40'>{r.num} 예선</div>
              {i < REGIONS.length - 1 && (
                <div className='absolute top-4 left-[55%] h-px w-[90%] bg-white/10' />
              )}
            </div>
          ))}
        </div>
      </div>

      <SNote>
        각 지역 온라인 예선 상위 16명이 오프라인 예선에 참가하며, 각 예선에서
        2명이 진출하여 총 8명으로 결선을 구성합니다.
      </SNote>
    </div>
  )
}

/* ================================================================== */
/*  (11) SwissStageSection — 스위스 스테이지 상세                       */
/* ================================================================== */

type SwissGroup = {
  record: string
  cls: string
  color: string
  tag: string
  count: number
  eliminated?: boolean
  qualified?: boolean
  advance?: boolean
}

const SWISS_ROUND_DATA: Record<1 | 2 | 3 | 4, SwissGroup[]> = {
  1: [
    {
      record: '1-0',
      cls: 'border-[#4CAF50]/15 bg-[#4CAF50]/[0.06]',
      color: '#4CAF50',
      tag: '승리 그룹',
      count: 8,
    },
    {
      record: '0-1',
      cls: 'border-[#F5A623]/15 bg-[#F5A623]/[0.06]',
      color: '#F5A623',
      tag: '패배 1회',
      count: 8,
    },
  ],
  2: [
    {
      record: '2-0',
      cls: 'border-[#4CAF50]/15 bg-[#4CAF50]/[0.06]',
      color: '#4CAF50',
      tag: '전승 유지',
      count: 4,
    },
    {
      record: '1-1',
      cls: 'border-[#FFD700]/15 bg-[#FFD700]/[0.06]',
      color: '#FFD700',
      tag: '생존',
      count: 8,
    },
    {
      record: '0-2',
      cls: 'border-[#F44336]/15 bg-[#F44336]/[0.06]',
      color: '#F44336',
      tag: '탈락',
      count: 4,
      eliminated: true,
    },
  ],
  3: [
    {
      record: '3-0',
      cls: 'border-[#4CAF50]/15 bg-[#4CAF50]/[0.06]',
      color: '#4CAF50',
      tag: '전승 유지',
      count: 2,
    },
    {
      record: '2-1',
      cls: 'border-[#3B8BE6]/15 bg-[#3B8BE6]/[0.06]',
      color: '#3B8BE6',
      tag: '생존',
      count: 6,
    },
    {
      record: '1-2',
      cls: 'border-[#F44336]/15 bg-[#F44336]/[0.06]',
      color: '#F44336',
      tag: '탈락',
      count: 4,
      eliminated: true,
    },
  ],
  4: [
    {
      record: '4-0',
      cls: 'border-[#4CAF50]/15 bg-[#4CAF50]/[0.06]',
      color: '#4CAF50',
      tag: '자동 진출',
      count: 1,
      qualified: true,
    },
    {
      record: '3-1',
      cls: 'border-[#F5A623]/15 bg-[#F5A623]/[0.06]',
      color: '#F5A623',
      tag: '선발전 진출',
      count: 4,
      advance: true,
    },
    {
      record: '2-2',
      cls: 'border-[#F44336]/15 bg-[#F44336]/[0.06]',
      color: '#F44336',
      tag: '탈락',
      count: 3,
      eliminated: true,
    },
  ],
}

function SwissStageSection() {
  const [activeRound, setActiveRound] = useState<1 | 2 | 3 | 4>(1)
  const groups = SWISS_ROUND_DATA[activeRound]

  return (
    <div className='space-y-5'>
      {/* Warning callout */}
      <div className='flex gap-3 rounded-xl border border-[#F44336]/15 bg-[#F44336]/[0.04] p-4'>
        <span className='mt-0.5 shrink-0 text-sm'>⚠️</span>
        <p className='text-sm leading-relaxed break-keep text-white/70'>
          <strong className='text-[#F44336]'>2패 누적 시 즉시 탈락</strong> —
          패배가 2회 누적되는 순간 스테이지가 종료되며, 이후 라운드에 배정되지
          않습니다.
        </p>
      </div>

      {/* R1 Seed Matching */}
      <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-5'>
        <div className='mb-1 text-sm font-bold text-white/80'>
          라운드 1 — 시드 매칭
        </div>
        <div className='mb-4 text-xs text-white/40'>
          온라인 예선 순위를 기반으로 상위 vs 하위 대진 편성
        </div>
        <SeedingMatchTable />
      </div>

      {/* Matching Rules */}
      <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-5'>
        <div className='mb-4 text-sm font-bold text-white/80'>
          라운드 2 이후 — 매칭 규칙
        </div>
        {[
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
        ].map((rule) => (
          <div
            key={rule.num}
            className='flex gap-3.5 border-b border-white/[0.06] py-3.5 last:border-b-0'
          >
            <div className='flex size-7 shrink-0 items-center justify-center rounded-lg border border-[#E63B2E]/40 font-mono text-sm font-bold text-[#E63B2E]'>
              {rule.num}
            </div>
            <div>
              <div className='text-sm font-semibold text-white/80'>
                {rule.title}
              </div>
              <div className='mt-0.5 text-sm break-keep text-white/50'>
                {rule.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Swiss Round Animator */}
      <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-5'>
        <div className='mb-1 text-sm font-bold text-white/80'>
          라운드별 전적 그룹 변화
        </div>
        <div className='mb-5 text-xs text-white/40'>
          라운드를 선택하여 그룹 구성 변화를 확인하세요
        </div>

        {/* Round Buttons */}
        <div className='mb-5 flex gap-1.5'>
          {([1, 2, 3, 4] as const).map((r) => (
            <button
              key={r}
              type='button'
              aria-pressed={activeRound === r}
              onClick={() => setActiveRound(r)}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[#E63B2E]/50 focus-visible:outline-none ${
                activeRound === r
                  ? 'border-[#E63B2E] bg-[#E63B2E]/[0.06] text-white'
                  : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
              }`}
            >
              R{r} 후
            </button>
          ))}
        </div>

        {/* Groups */}
        <div className='flex flex-col gap-2.5'>
          {groups.map((g) => (
            <div key={g.record} className={`rounded-xl border p-4 ${g.cls}`}>
              <div className='flex items-center gap-2.5'>
                <span
                  className='rounded-md px-2.5 py-1 font-mono text-sm font-bold'
                  style={{
                    color: g.color,
                    background: `${g.color}15`,
                  }}
                >
                  {g.record}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    g.eliminated
                      ? 'rounded bg-[#F44336]/10 px-2 py-0.5 text-[#F44336]'
                      : g.qualified
                        ? 'rounded bg-[#4CAF50]/10 px-2 py-0.5 text-[#4CAF50]'
                        : g.advance
                          ? 'rounded bg-[#F5A623]/10 px-2 py-0.5 text-[#F5A623]'
                          : 'text-white/40'
                  }`}
                >
                  {g.eliminated || g.qualified || g.advance
                    ? g.tag
                    : `${g.tag} · ${g.count}명`}
                </span>
                {(g.eliminated || g.qualified || g.advance) && (
                  <span className='text-xs text-white/40'>{g.count}명</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  (12) MatchRulesSection — 경기 규칙                                  */
/* ================================================================== */

function MatchRulesSection() {
  return (
    <div className='space-y-5'>
      {/* Match Flow */}
      <div>
        {/* Mobile: vertical */}
        <div className='flex flex-col gap-0 md:hidden'>
          {[
            {
              label: 'A 선수의 곡',
              desc: 'A가 사전 제출한 해당 라운드 곡',
              mono: 'SONG A',
            },
            {
              label: 'B 선수의 곡',
              desc: 'B가 사전 제출한 해당 라운드 곡',
              mono: 'SONG B',
            },
            {
              label: '2곡 합산',
              desc: '두 곡 점수를 합산, 고득점자 승리',
              mono: 'TOTAL',
            },
          ].map((step, i) => (
            <div key={step.mono}>
              <div className='rounded-none border border-white/10 bg-white/[0.03] px-4 py-5 text-center first:rounded-t-2xl last:rounded-b-2xl'>
                <div className='mb-1 font-mono text-xs tracking-widest text-[#E63B2E]/60'>
                  {step.mono}
                </div>
                <div className='text-sm font-bold text-white/80'>
                  {step.label}
                </div>
                <div className='mt-1 text-xs break-keep text-white/45'>
                  {step.desc}
                </div>
              </div>
              {i < 2 && (
                <div className='flex justify-center text-[#E63B2E]/40'>
                  <span className='text-xs'>▼</span>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Desktop: horizontal */}
        <div className='hidden items-stretch gap-0 md:flex'>
          {[
            {
              label: 'A 선수의 곡',
              desc: 'A가 사전 제출한\n해당 라운드 곡',
              mono: 'SONG A',
            },
            {
              label: 'B 선수의 곡',
              desc: 'B가 사전 제출한\n해당 라운드 곡',
              mono: 'SONG B',
            },
            {
              label: '2곡 합산',
              desc: '두 곡 점수를 합산\n고득점자 승리',
              mono: 'TOTAL',
            },
          ].map((step, i) => (
            <div key={step.mono} className='flex flex-1 items-center'>
              <div
                className={`flex-1 border border-white/10 bg-white/[0.03] px-4 py-5 text-center ${
                  i === 0 ? 'rounded-l-2xl' : i === 2 ? 'rounded-r-2xl' : ''
                }`}
              >
                <div className='mb-1 font-mono text-xs tracking-widest text-[#E63B2E]/60'>
                  {step.mono}
                </div>
                <div className='text-sm font-bold text-white/80'>
                  {step.label}
                </div>
                <div className='mt-1 text-xs whitespace-pre-line text-white/45'>
                  {step.desc}
                </div>
              </div>
              {i < 2 && (
                <span className='shrink-0 px-1 text-sm text-[#E63B2E]/40'>
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Song Submission R1-R4 */}
      <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-5'>
        <div className='mb-1 text-sm font-bold text-white/80'>
          사전 선곡 제출
        </div>
        <div className='mb-4 text-xs text-white/40'>
          참가자는 신청 시점에 최대 4라운드까지 사용할 곡을 미리 제출합니다
        </div>
        <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-4'>
          {(['R1', 'R2', 'R3', 'R4'] as const).map((r) => (
            <div
              key={r}
              className='relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4 text-center'
            >
              <div className='absolute top-0 right-0 left-0 h-0.5 bg-[#F5A623]/50' />
              <div className='font-mono text-xl font-extrabold text-[#F5A623]'>
                {r}
              </div>
              <div className='mt-1 text-xs text-white/40'>신청 시 제출</div>
            </div>
          ))}
        </div>
      </div>

      <SNote>
        해당 라운드 매치에서 사용되는 "자기 곡"은 사전 제출된 해당 라운드 곡으로
        고정됩니다. (예: R3 배정 시 → 자신이 제출한 R3 곡 사용)
      </SNote>
    </div>
  )
}

/* ================================================================== */
/*  (13) SideRulesSection — 사이드 규칙                                 */
/* ================================================================== */

function SideRulesSection() {
  return (
    <div className='space-y-5'>
      {/* 1P / 2P Visual */}
      <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-5'>
        {/* Mobile: vertical */}
        <div className='flex flex-col items-center gap-4 sm:hidden'>
          <div className='flex w-24 flex-col items-center justify-center rounded-xl border-2 border-[#E63B2E] bg-[#E63B2E]/[0.06] py-5'>
            <div className='mb-1 text-3xl'>🥁</div>
            <div className='font-bold text-[#E63B2E]'>1P</div>
          </div>
          <div className='text-center text-xs text-white/40'>
            자기 곡 차례에
            <br />
            <strong className='text-[#F5A623]'>곡 제공자가 선택</strong>
          </div>
          <div className='flex w-24 flex-col items-center justify-center rounded-xl border-2 border-[#3B8BE6] bg-[#3B8BE6]/[0.06] py-5'>
            <div className='mb-1 text-3xl'>🥁</div>
            <div className='font-bold text-[#3B8BE6]'>2P</div>
          </div>
        </div>
        {/* Desktop: horizontal */}
        <div className='hidden items-center justify-center gap-8 sm:flex'>
          <div className='flex w-24 flex-col items-center justify-center rounded-xl border-2 border-[#E63B2E] bg-[#E63B2E]/[0.06] py-5'>
            <div className='mb-1 text-3xl'>🥁</div>
            <div className='font-bold text-[#E63B2E]'>1P</div>
          </div>
          <div className='text-center text-xs text-white/40'>
            자기 곡 차례에
            <br />
            <strong className='text-[#F5A623]'>곡 제공자가 선택</strong>
          </div>
          <div className='flex w-24 flex-col items-center justify-center rounded-xl border-2 border-[#3B8BE6] bg-[#3B8BE6]/[0.06] py-5'>
            <div className='mb-1 text-3xl'>🥁</div>
            <div className='font-bold text-[#3B8BE6]'>2P</div>
          </div>
        </div>
      </div>

      {/* Per-song side selection */}
      <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-5'>
        <div className='mb-4 text-sm font-bold text-white/80'>
          곡별 사이드 선택
        </div>
        <div className='grid grid-cols-2 gap-2.5'>
          <div className='rounded-xl border border-[#E63B2E]/15 bg-[#E63B2E]/[0.04] p-4 text-center'>
            <div className='mb-1 text-xs font-semibold text-[#E63B2E]'>
              A의 곡 진행 시
            </div>
            <div className='text-sm font-bold text-white/80'>
              A가 사이드 선택
            </div>
          </div>
          <div className='rounded-xl border border-[#3B8BE6]/15 bg-[#3B8BE6]/[0.04] p-4 text-center'>
            <div className='mb-1 text-xs font-semibold text-[#3B8BE6]'>
              B의 곡 진행 시
            </div>
            <div className='text-sm font-bold text-white/80'>
              B가 사이드 선택
            </div>
          </div>
        </div>
      </div>

      <div className='flex gap-3 rounded-xl border border-[#F5A623]/15 bg-[#F5A623]/[0.04] p-4'>
        <span className='mt-0.5 shrink-0 text-sm'>⚡</span>
        <p className='text-sm leading-relaxed break-keep text-white/60'>
          재경기 등 운영상 우선권이 필요한 경우,{' '}
          <strong className='text-white/80'>
            온라인 예선 순위가 더 높은 선수
          </strong>
          가 사이드 선택 우선권을 가집니다.
        </p>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  (14) TiebreakSection — 동점 처리                                    */
/* ================================================================== */

function TiebreakSection() {
  const steps = [
    { title: '2곡 합산 결과', desc: '두 선수의 점수 합산이 동일' },
    { title: '선곡풀 랜덤 1곡', desc: '선곡풀에서 랜덤으로 1곡을 선정' },
    { title: '재경기 단판', desc: '1곡 재경기로 승패 결정' },
  ]

  return (
    <div className='space-y-5'>
      {/* Tiebreak Flow */}
      <div className='flex flex-col items-center gap-0'>
        {steps.map((step, i) => (
          <div
            key={step.title}
            className='flex w-full max-w-md flex-col items-center'
          >
            <div className='w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center'>
              <div className='text-sm font-bold text-white/80'>
                {step.title}
              </div>
              <div className='mt-1 text-xs text-white/45'>{step.desc}</div>
            </div>
            {i < steps.length - 1 && (
              <>
                <div className='h-5 w-0.5 bg-white/10' />
                {i === 0 && (
                  <>
                    <div className='rounded-md border border-dashed border-[#E63B2E]/25 bg-[#E63B2E]/[0.04] px-4 py-1.5 text-xs font-semibold text-[#F5A623]'>
                      동점 발생
                    </div>
                    <div className='h-5 w-0.5 bg-white/10' />
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <SNote>
        재경기 시 사이드 선택 우선권은 온라인 예선 상위 순위 선수에게
        부여됩니다.
      </SNote>
    </div>
  )
}

/* ================================================================== */
/*  (15) AdvancementSection — 진출자 선발                               */
/* ================================================================== */

function AdvancementSection() {
  return (
    <div className='space-y-5'>
      {/* Two paths */}
      <div className='grid gap-3 sm:grid-cols-2'>
        {/* 4-0 Auto */}
        <div className='relative overflow-hidden rounded-2xl border border-[#4CAF50]/20 bg-[#4CAF50]/[0.04] p-6 text-center'>
          <div className='mb-2 text-3xl'>👑</div>
          <div className='text-lg font-bold text-[#4CAF50]'>자동 진출</div>
          <div className='my-2 font-mono text-3xl font-extrabold text-[#4CAF50]'>
            4-0
          </div>
          <div className='text-sm break-keep text-white/55'>
            4승 0패 달성자는
            <br />
            자동으로 결선 진출이 확정됩니다
          </div>
        </div>
        {/* 3-1 Playoff */}
        <div className='relative overflow-hidden rounded-2xl border border-[#F5A623]/20 bg-[#F5A623]/[0.04] p-6 text-center'>
          <div className='mb-2 text-3xl'>⚔️</div>
          <div className='text-lg font-bold text-[#F5A623]'>진출자 선발전</div>
          <div className='my-2 font-mono text-3xl font-extrabold text-[#F5A623]'>
            3-1
          </div>
          <div className='text-sm break-keep text-white/55'>
            3승 1패 참가자 전원 대상
            <br />
            스코어 어택으로 1명 추가 진출
          </div>
        </div>
      </div>

      {/* Decider details */}
      <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-5'>
        <div className='mb-1 text-sm font-bold text-white/80'>
          진출자 선발전 상세
        </div>
        <div className='mb-4 text-xs text-white/40'>
          3-1 기록자 전원 대상 스코어 어택
        </div>

        <div className='relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center'>
          <div className='absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-[#b275f0] to-[#3B8BE6]' />
          <div className='text-xs tracking-widest text-white/40 uppercase'>
            과제곡
          </div>
          <div className='my-2 text-xl font-extrabold text-white/90'>
            {ARCADE_SONGS.decider31.title}
          </div>
          <div className='inline-flex items-center gap-2 text-sm text-white/50'>
            <span>귀신(오니)</span>
            <span className='rounded bg-[#F5A623] px-2 py-0.5 text-xs font-bold text-white'>
              ★{ARCADE_SONGS.decider31.level}
            </span>
          </div>
          <div className='mt-3.5 rounded-lg border border-[#F5A623]/15 bg-[#F5A623]/[0.04] px-4 py-2.5 text-sm break-keep text-white/55'>
            과제곡은 사전에 비공개 · 각 1회 플레이 · 최고점 1명이 추가 진출
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  (16) SeedingSection — 시드 산정                                     */
/* ================================================================== */

function SeedingSection() {
  return (
    <div className='space-y-5'>
      <div className='relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center'>
        <div className='absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-[#b275f0] to-[#3B8BE6]' />
        <div className='text-xs tracking-widest text-white/40 uppercase'>
          시드 산정 과제곡
        </div>
        <div className='my-2 text-xl font-extrabold text-white/90'>
          {ARCADE_SONGS.seeding.title}
        </div>
        <div className='inline-flex items-center gap-2 text-sm text-white/50'>
          <span>귀신(오니)</span>
          <span className='rounded bg-[#b275f0] px-2 py-0.5 text-xs font-bold text-white'>
            ★{ARCADE_SONGS.seeding.level}
          </span>
        </div>
        <div className='mt-3.5 rounded-lg border border-[#b275f0]/15 bg-[#b275f0]/[0.04] px-4 py-2.5 text-sm break-keep text-white/55'>
          이 단계에서는 승패로 탈락/우승을 결정하지 않으며, 순수하게 시드 산정용
          기록으로만 활용됩니다.
        </div>
      </div>

      <SNote>
        시드 과제곡은 사전에 비공개이며, 진출 확정 후 현장에서 각 1회
        플레이합니다.
      </SNote>
    </div>
  )
}

/* ================================================================== */
/*  (17) FinalsStructure — 결선 구조 테이블                             */
/* ================================================================== */

const FINALS_ROUNDS = [
  { round: '8강', method: '1:1 단판', songs: '2곡 합산' },
  { round: '4강', method: '1:1 단판', songs: '3곡 합산' },
  { round: '3·4위전', method: '1:1 단판', songs: '3곡 합산' },
  { round: '결승', method: '1:1 단판', songs: '5곡 합산' },
] as const

function FinalsStructure() {
  return (
    <>
      {/* Mobile: card list */}
      <div className='flex flex-col gap-2.5 md:hidden'>
        {FINALS_ROUNDS.map((r) => (
          <div
            key={r.round}
            className='flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5'
          >
            <span className='text-base font-semibold text-white/80'>
              {r.round}
            </span>
            <div className='text-right'>
              <div className='text-base text-white/70'>{r.method}</div>
              <div className='text-sm text-white/50'>{r.songs}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className='hidden md:block'>
        <Table className='text-base'>
          <TableHeader className='bg-white/[0.07] text-white/75'>
            <TableRow className='border-white/[0.07]'>
              <TableHead className='border-white/[0.07] px-4 py-2.5 text-sm font-bold text-white/75'>
                라운드
              </TableHead>
              <TableHead className='border-white/[0.07] px-4 py-2.5 text-sm font-bold text-white/75'>
                방식
              </TableHead>
              <TableHead className='border-white/[0.07] px-4 py-2.5 text-sm font-bold text-white/75'>
                곡 수
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='text-white/90'>
            {FINALS_ROUNDS.map((r) => (
              <TableRow
                key={r.round}
                className='border-white/[0.07] hover:bg-white/[0.04]'
              >
                <TableCell className='border-white/[0.07] px-4 py-3 text-base font-semibold text-white/80'>
                  {r.round}
                </TableCell>
                <TableCell className='border-white/[0.07] px-4 py-3 text-base text-white/70'>
                  {r.method}
                </TableCell>
                <TableCell className='border-white/[0.07] px-4 py-3 text-base text-white/70'>
                  {r.songs}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

/* ================================================================== */
/*  (11) BanPickProcedure — 밴픽 절차                                   */
/* ================================================================== */

function BanPickProcedure() {
  return (
    <div className='flex flex-col gap-3'>
      {/* 공통 순서 */}
      <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-5'>
        <div className='mb-3 font-mono text-sm tracking-[3px] text-[#ff2a00] uppercase opacity-60'>
          Common Order
        </div>
        <div className='flex items-center justify-center gap-2'>
          {['A 밴', 'B 밴', 'A 픽', 'B 픽'].map((step, i) => (
            <div key={step} className='flex items-center gap-2'>
              <span className='rounded-lg bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white/75'>
                {step}
              </span>
              {i < 3 && <span className='text-sm text-white/40'>→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 라운드별 */}
      <div className='grid grid-cols-2 gap-2.5'>
        <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center'>
          <div className='mb-2 font-mono text-sm tracking-wider text-white/50'>
            8강 / 4강 / 3·4위전
          </div>
          <div className='text-base font-semibold break-keep text-white/75'>
            각자 1곡 픽
          </div>
        </div>
        <div className='rounded-2xl border border-[#ff2a00]/[0.08] bg-[#ff2a00]/[0.03] p-4 text-center'>
          <div className='mb-2 font-mono text-sm tracking-wider text-[#ff2a00]/60'>
            결승
          </div>
          <div className='text-base font-semibold break-keep text-white/75'>
            각자 2곡 픽
          </div>
        </div>
      </div>

      <SNote>
        결선 참가자는 1인당 5곡 사전 제출. 플레이한 곡은 이후 라운드 재사용
        불가. 밴당한 곡은 소모되지 않음.
      </SNote>
    </div>
  )
}

/* ================================================================== */
/*  (12) OperationsRules — 점수/운영 규칙                               */
/* ================================================================== */

function OperationsRules() {
  return (
    <div className='flex flex-col gap-3'>
      <InfoCard icon='🎯' title='플레이/옵션'>
        <div className='rounded-xl bg-black/15 px-4 py-3.5 text-sm leading-relaxed break-keep text-white/70'>
          선곡한 곡: 해당 선수가 1P/2P 선택
          <br />
          과제곡: 합산 점수 우위자가 선택 (첫 곡이면 시드 상위자)
          <br />
          판정 조절 외 옵션(랜덤/미러 등){' '}
          <span className='font-semibold text-[#ff2a00]'>사용 불가</span>
        </div>
      </InfoCard>

      <InfoCard icon='🔄' title='동점/재경기'>
        <div className='rounded-xl bg-black/15 px-4 py-3.5 text-sm leading-relaxed break-keep text-white/70'>
          동점 시 마지막 곡 동일 조건 재대결
          <br />
          재대결도 동점이면 양(良) 개수 많은 선수 승리
          <br />
          기기 오류 → 운영진 판단 하 재경기 가능 / 선수 과실 미스 → 재경기 불가
        </div>
      </InfoCard>

      <div className='mt-2 rounded-xl border border-white/10 bg-white/[0.015] p-4 text-center'>
        <span className='text-sm leading-relaxed break-keep text-white/50'>
          ※ 본 규정집의 세부 사항은 대회 운영진의 판단에 따라 변경될 수
          있습니다.
        </span>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

const TAB_TRIGGER_CLASS =
  'flex-1 py-3.5 min-h-12 text-base font-medium transition-all data-[state=active]:bg-[#ff2a00]/10 data-[state=active]:text-[#f0f0f0] data-[state=active]:border data-[state=active]:border-[#ff2a00]/40 text-white/50 rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff2a00]/50 focus-visible:outline-none'

function ArcadePage() {
  const title = t('nav.arcade')

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${title}`
  }, [title])

  return (
    <TkcSection>
      <TkcPageHeader title={title} subtitle='아케이드 예선 공식 규정집' />

      <Tabs defaultValue='overview'>
        <TabsList className='mb-8 h-auto w-full overflow-x-auto rounded-2xl bg-white/[0.03] p-1.5 whitespace-nowrap'>
          <TabsTrigger value='overview' className={TAB_TRIGGER_CLASS}>
            📋 개요
          </TabsTrigger>
          <TabsTrigger value='offline' className={TAB_TRIGGER_CLASS}>
            🥁 오프라인 예선
          </TabsTrigger>
          <TabsTrigger value='finals' className={TAB_TRIGGER_CLASS}>
            🏆 결선/운영
          </TabsTrigger>
        </TabsList>

        {/* ──────── Tab 1: 개요 ──────── */}
        <TabsContent value='overview'>
          <div className='space-y-12 md:space-y-16'>
            <p className='text-base leading-relaxed break-keep text-white/60'>
              아케이드 부문은 온라인 예선 → 오프라인 예선(스위스) → Top 8
              결선으로 진행됩니다. 4개 지역에서 각 2명씩, 총 8명이 결선에
              진출합니다.
            </p>

            <PlayerChecklist />

            <Section num='01' title='대회 흐름' subtitle='Tournament Flow'>
              <TournamentFlow />
            </Section>

            <Section num='02' title='예선 지역' subtitle='Qualifier Regions'>
              <p className='mb-4 text-base leading-relaxed break-keep text-white/60'>
                오프라인 예선은 전국 4개 지역에서 각 1회씩 진행됩니다. 참가자는
                4개 차수 중 1개만 선택 가능하며, 탈락 후 다른 차수 재도전은
                불가합니다.
              </p>
              <RegionTable />
            </Section>

            <Section num='03' title='온라인 예선' subtitle='Online Qualifier'>
              <MarkdownBlock body={ONLINE_QUALIFIER_MD} />
            </Section>
          </div>
        </TabsContent>

        {/* ──────── Tab 2: 오프라인 예선 ──────── */}
        <TabsContent value='offline'>
          <div className='space-y-12 md:space-y-16'>
            <p className='text-base leading-relaxed break-keep text-white/60'>
              전국 4개 지역 오프라인 예선을 거쳐, 총 8명이 최종 결선에
              진출합니다. 2패 탈락 스위스 시스템의 모든 것을 안내합니다.
            </p>

            <Section num='01' title='개요' subtitle='Overview'>
              <OfflineOverview />
            </Section>

            <Section
              num='02'
              title='스위스 스테이지'
              subtitle='Swiss Stage — Double Elimination'
            >
              <p className='mb-4 text-base leading-relaxed break-keep text-white/60'>
                같은 전적의 참가자끼리 매칭하는 스위스 시스템으로 최대 4라운드를
                진행합니다.
              </p>
              <SwissStageSection />
            </Section>

            <Section
              num='03'
              title='1경기(매치) 규칙: 2곡 합산'
              subtitle='Match Rules — 2-Song Aggregate'
            >
              <p className='mb-4 text-base leading-relaxed break-keep text-white/60'>
                각 선수가 1곡씩 제공하여, 총 2곡의 점수를 합산해 승패를
                결정합니다.
              </p>
              <MatchRulesSection />
            </Section>

            <Section
              num='04'
              title='사이드(자리) 규칙'
              subtitle='Side Selection Rules'
            >
              <p className='mb-4 text-base leading-relaxed break-keep text-white/60'>
                곡 제공자가 원하는 사이드를 선택할 수 있습니다.
              </p>
              <SideRulesSection />
            </Section>

            <Section num='05' title='동점 처리' subtitle='Tiebreak'>
              <p className='mb-4 text-base leading-relaxed break-keep text-white/60'>
                2곡 합산 점수가 동점일 경우, 다음 절차로 처리합니다.
              </p>
              <TiebreakSection />
            </Section>

            <Section num='06' title='진출자 선발' subtitle='Advancement'>
              <p className='mb-4 text-base leading-relaxed break-keep text-white/60'>
                각 예선에서 총 2명이 진출합니다. 자동 진출 1명 + 선발전 1명.
              </p>
              <AdvancementSection />
            </Section>

            <Section
              num='07'
              title='결선(Top 8) 시드 산정'
              subtitle='Finals Seeding'
            >
              <p className='mb-4 text-base leading-relaxed break-keep text-white/60'>
                각 지역 진출자 2명이 시드 산정용 과제곡을 플레이합니다.
              </p>
              <SeedingSection />
            </Section>
          </div>
        </TabsContent>

        {/* ──────── Tab 3: 결선/운영 ──────── */}
        <TabsContent value='finals'>
          <div className='space-y-12 md:space-y-16'>
            <p className='text-base leading-relaxed break-keep text-white/60'>
              Top 8 결선은 크로스 시딩 8강 토너먼트입니다. 밴픽 후 합산 점수로
              승패를 결정합니다.
            </p>

            <Section
              num='01'
              title='Top 8 대진'
              subtitle='Finals Bracket — Cross Seeding'
            >
              <p className='mb-4 text-base leading-relaxed break-keep text-white/60'>
                4-0 진출자 4명(A그룹)과 3-1 진출자 4명(B그룹)을 교차 배치하여
                8강 대진을 구성합니다. 시드는 결선 과제곡 점수로 결정됩니다.
              </p>
              <BracketVisual />
            </Section>

            <Section num='02' title='결선 구조' subtitle='Finals Structure'>
              <FinalsStructure />
            </Section>

            <Section num='03' title='밴픽 절차' subtitle='Ban / Pick Procedure'>
              <BanPickProcedure />
            </Section>

            <Section
              num='04'
              title='점수/운영 규칙'
              subtitle='Scoring & Operations'
            >
              <OperationsRules />
            </Section>
          </div>
        </TabsContent>
      </Tabs>
    </TkcSection>
  )
}
