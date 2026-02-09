import { useEffect, type ReactNode } from 'react'
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
import { SectionHeader, InfoCard } from '@/components/tkc/design-tokens'
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
/*  공통 헬퍼                                                          */
/* ================================================================== */

function SNote({ children }: { children: ReactNode }) {
  return (
    <div className='mt-3.5 flex gap-2.5 rounded-lg border border-[#6AB0F3]/10 bg-[#6AB0F3]/5 p-3 align-top'>
      <span className='mt-0.5 shrink-0 text-xs'>💡</span>
      <p className='text-xs leading-[1.75] break-keep text-[#6AB0F3]/80'>
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
    <div className='mb-6'>
      {FLOW_STEPS.map((s, i) => (
        <div key={s.num} className='flex items-stretch gap-3.5'>
          {/* Timeline */}
          <div className='flex w-8 shrink-0 flex-col items-center'>
            <div
              className='flex size-7 items-center justify-center rounded-full font-mono text-xs font-bold'
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
                className='min-h-5 w-0.5 flex-1'
                style={{
                  background: `linear-gradient(to bottom, ${s.accent}30, ${FLOW_STEPS[i + 1].accent}30)`,
                }}
              />
            )}
          </div>

          {/* Content */}
          <div className={i < FLOW_STEPS.length - 1 ? 'pb-4' : ''}>
            <div className='text-sm font-extrabold text-[#f0f0f0] md:text-base'>
              {s.label}
            </div>
            <div
              className='mt-0.5 font-mono text-xs opacity-70'
              style={{ color: s.accent }}
            >
              {s.detail}
            </div>
            <div className='mt-1.5 text-xs leading-[1.65] break-keep text-white/65'>
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
    <div className='mb-6 rounded-2xl border border-[#ff2a00]/30 bg-[#ff2a00]/[0.06] px-4 py-5 motion-safe:animate-[tkc-slide-up_0.5s_ease_both]'>
      <div className='mb-1.5 font-mono text-xs tracking-[3px] text-[#ff2a00] uppercase opacity-60'>
        Player Checklist
      </div>
      <p className='mb-3.5 text-xs leading-[1.7] break-keep text-white/60'>
        대회 참가 전 꼭 확인해야 할 사항들입니다.
      </p>
      <div className='flex flex-col gap-3'>
        {CHECKLIST_ITEMS.map((item) => (
          <div key={item.text} className='flex items-center gap-3'>
            <span className='shrink-0 text-lg'>{item.icon}</span>
            <span className='flex-1 text-sm font-semibold break-keep text-white/70'>
              {item.text}
            </span>
            <span
              className={`shrink-0 rounded px-2 py-0.5 font-mono text-xs tracking-wide ${
                item.tag === '주의'
                  ? 'border border-[#ff2a00]/20 bg-[#ff2a00]/10 text-[#ff2a00]'
                  : 'border border-white/[0.06] bg-white/[0.04] text-white/55'
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
    <div className='grid grid-cols-2 gap-1.5 sm:grid-cols-4'>
      {REGIONS.map((r) => (
        <div
          key={r.num}
          className='rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3.5 text-center'
        >
          <div className='mb-1.5 text-xl'>{r.emoji}</div>
          <div className='font-mono text-xs tracking-wider text-white/55'>
            {r.num}
          </div>
          <div className='mt-0.5 text-sm font-bold text-white/75'>{r.city}</div>
        </div>
      ))}
    </div>
  )
}

/* ================================================================== */
/*  (4) MatchVisual — 1경기 = 2곡 합산                                 */
/* ================================================================== */

function MatchVisual() {
  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='flex w-full gap-2'>
        <div className='flex-1 rounded-2xl border border-[#E63B2E]/[0.12] bg-[#E63B2E]/[0.06] px-3.5 py-4 text-center'>
          <div className='mb-2 font-mono text-xs tracking-widest text-[#E63B2E]'>
            SONG 1
          </div>
          <div className='mb-1 text-xl'>🥁</div>
          <div className='text-xs font-semibold text-white/70'>
            내가 고른 곡
          </div>
          <div className='mt-1 text-xs text-white/50'>내가 사이드 선택</div>
        </div>
        <div className='flex-1 rounded-2xl border border-[#3B8BE6]/[0.12] bg-[#3B8BE6]/[0.06] px-3.5 py-4 text-center'>
          <div className='mb-2 font-mono text-xs tracking-widest text-[#3B8BE6]'>
            SONG 2
          </div>
          <div className='mb-1 text-xl'>🥁</div>
          <div className='text-xs font-semibold text-white/70'>
            상대가 고른 곡
          </div>
          <div className='mt-1 text-xs text-white/50'>상대가 사이드 선택</div>
        </div>
      </div>

      <svg
        width='24'
        height='20'
        viewBox='0 0 24 20'
        className='opacity-20'
        aria-hidden
      >
        <path
          d='M12 0 L12 14 M6 10 L12 16 L18 10'
          stroke='#f0f0f0'
          strokeWidth='2'
          fill='none'
        />
      </svg>

      <div className='w-full rounded-2xl border border-[#FFD700]/10 bg-[#FFD700]/5 p-3.5 text-center'>
        <span className='text-sm font-bold break-keep text-[#FFD700]/70'>
          2곡 합산 점수 → 고득점자 승리 🏆
        </span>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  (5) SwissVisual — 스위스 라운드 R1-R4                               */
/* ================================================================== */

const SWISS_DATA = [
  {
    round: 'R1',
    groups: [
      { record: '1-0', count: 8, color: '#4CAF50', status: '진행' },
      { record: '0-1', count: 8, color: '#FF9800', status: '진행' },
    ],
  },
  {
    round: 'R2',
    groups: [
      { record: '2-0', count: 4, color: '#4CAF50', status: '진행' },
      { record: '1-1', count: 8, color: '#FF9800', status: '진행' },
      { record: '0-2', count: 4, color: '#F44336', status: '탈락' },
    ],
  },
  {
    round: 'R3',
    groups: [
      { record: '3-0', count: 2, color: '#4CAF50', status: '진행' },
      { record: '2-1', count: 6, color: '#FF9800', status: '진행' },
      { record: '1-2', count: 4, color: '#F44336', status: '탈락' },
    ],
  },
  {
    round: 'R4',
    groups: [
      { record: '4-0', count: 1, color: '#4CAF50', status: '자동 진출' },
      { record: '3-1', count: 4, color: '#F5A623', status: '결정전' },
      { record: '2-2', count: 3, color: '#F44336', status: '탈락' },
    ],
  },
] as const

function SwissGroupRow({
  g,
}: {
  g: { record: string; count: number; color: string; status: string }
}) {
  return (
    <div
      className='flex items-center justify-between rounded-md px-2 py-1.5'
      style={{
        background:
          g.status === '탈락'
            ? 'rgba(244,67,54,0.06)'
            : g.status === '자동 진출'
              ? 'rgba(76,175,80,0.08)'
              : 'rgba(255,255,255,0.02)',
        border: `1px solid ${g.color}20`,
      }}
    >
      <span className='font-mono text-sm font-bold' style={{ color: g.color }}>
        {g.record}
      </span>
      <span className='text-xs opacity-65' style={{ color: g.color }}>
        {g.status}
      </span>
    </div>
  )
}

function SwissVisual() {
  return (
    <>
      {/* Mobile: vertical stack */}
      <div className='md:hidden'>
        <div className='flex flex-col gap-2'>
          {SWISS_DATA.map((r) => (
            <div
              key={r.round}
              className='rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3'
            >
              <div className='mb-2 font-mono text-xs font-bold tracking-widest text-white/50'>
                {r.round}
              </div>
              <div className='flex flex-col gap-1.5'>
                {r.groups.map((g) => (
                  <SwissGroupRow key={g.record} g={g} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: horizontal 4-col */}
      <div className='hidden md:block'>
        <div className='overflow-x-auto'>
          <div className='flex min-w-[520px] gap-1.5'>
            {SWISS_DATA.map((r) => (
              <div
                key={r.round}
                className='min-w-[120px] flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-2.5 py-3'
              >
                <div className='mb-2.5 text-center font-mono text-xs font-bold tracking-widest text-white/50'>
                  {r.round}
                </div>
                <div className='flex flex-col gap-1.5'>
                  {r.groups.map((g) => (
                    <SwissGroupRow key={g.record} g={g} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className='mt-2 text-center text-xs text-white/50'>
            ← 스크롤 →
          </div>
        </div>
      </div>
    </>
  )
}

/* ================================================================== */
/*  (6) SeedingMatchTable — 1라운드 시드 매칭                           */
/* ================================================================== */

const SEEDING_MATCHES = [
  { match: '매치 1', pairs: ['1 vs 16', '5 vs 12'] },
  { match: '매치 2', pairs: ['2 vs 15', '6 vs 11'] },
  { match: '매치 3', pairs: ['3 vs 14', '7 vs 10'] },
  { match: '매치 4', pairs: ['4 vs 13', '8 vs 9'] },
]

function SeedingMatchTable() {
  return (
    <div className='mb-6'>
      {/* Mobile: 2-col cards */}
      <div className='md:hidden'>
        <div className='grid grid-cols-2 gap-2'>
          {SEEDING_MATCHES.map((m) => (
            <div
              key={m.match}
              className='rounded-lg border border-white/10 bg-white/[0.03] p-3'
            >
              <div className='mb-2 text-center text-xs font-bold tracking-wider text-[#ff2a00]'>
                {m.match}
              </div>
              {m.pairs.map((p) => (
                <div
                  key={p}
                  className='py-1 text-center font-mono text-xs text-white/55'
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
                className={`px-1.5 py-2 text-center font-mono text-xs font-bold tracking-wider text-[#ff2a00] ${
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
                className={`px-1.5 py-2 text-center font-mono text-xs text-white/55 ${
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
                className={`px-1.5 py-2 text-center font-mono text-xs text-white/55 ${
                  i < 3 ? 'border-r border-white/[0.06]' : ''
                }`}
              >
                {m.pairs[1]}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='mt-1.5 text-center text-xs text-white/50'>
        1라운드: 온라인 순위 기반 시드 매칭
      </div>
    </div>
  )
}

/* ================================================================== */
/*  (7) QualificationPath — 진출 조건                                   */
/* ================================================================== */

function QualificationPath() {
  return (
    <div className='flex flex-col gap-2.5'>
      {/* 4-0 자동 진출 */}
      <div className='flex items-center gap-3.5 rounded-2xl border border-[#4CAF50]/15 bg-[#4CAF50]/[0.06] p-4'>
        <div className='flex size-11 shrink-0 items-center justify-center rounded-full bg-[#4CAF50]/[0.12] text-xl'>
          ✅
        </div>
        <div>
          <div className='font-mono text-base font-bold text-[#4CAF50]'>
            4-0 → 자동 진출
          </div>
          <div className='mt-0.5 text-xs break-keep text-white/60'>
            전승 기록자 1명 바로 확정
          </div>
        </div>
      </div>

      {/* 3-1 결정전 */}
      <div className='rounded-2xl border border-[#F5A623]/15 bg-[#F5A623]/[0.06] p-4'>
        <div className='mb-3 flex items-center gap-3.5'>
          <div className='flex size-11 shrink-0 items-center justify-center rounded-full bg-[#F5A623]/[0.12] text-xl'>
            ⚔️
          </div>
          <div>
            <div className='font-mono text-base font-bold text-[#F5A623]'>
              3-1 → 결정전
            </div>
            <div className='mt-0.5 text-xs break-keep text-white/60'>
              스코어 어택으로 1명 추가 선발
            </div>
          </div>
        </div>
        <div className='flex flex-col gap-1 rounded-lg bg-black/20 px-3.5 py-2.5'>
          <div className='flex justify-between'>
            <span className='text-xs text-white/50'>방식</span>
            <span className='text-xs font-semibold text-white/70'>
              스코어 어택 1회
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-xs text-white/50'>과제곡</span>
            <span className='text-xs font-semibold text-white/70'>
              {ARCADE_SONGS.decider31.title} ★{ARCADE_SONGS.decider31.level}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-xs text-white/50'>비고</span>
            <span className='text-xs font-semibold text-[#ff2a00]'>
              사전 비공개
            </span>
          </div>
        </div>
      </div>

      {/* 2패 탈락 */}
      <div className='flex items-center gap-3.5 rounded-2xl border border-[#F44336]/10 bg-[#F44336]/[0.04] p-3.5 opacity-60'>
        <div className='flex size-11 shrink-0 items-center justify-center rounded-full bg-[#F44336]/10 text-lg'>
          ❌
        </div>
        <div className='font-mono text-sm font-bold text-[#F44336]'>
          2패 → 탈락
        </div>
      </div>
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
    <div className='flex flex-col gap-2'>
      {/* Legend */}
      <div className='mb-2 flex justify-center gap-4'>
        <div className='flex items-center gap-1.5'>
          <div className='size-2.5 rounded-sm bg-[#4CAF50]' />
          <span className='text-xs text-white/50'>A그룹 (4-0 진출)</span>
        </div>
        <div className='flex items-center gap-1.5'>
          <div className='size-2.5 rounded-sm bg-[#3B8BE6]' />
          <span className='text-xs text-white/50'>B그룹 (3-1 진출)</span>
        </div>
      </div>

      {BRACKET_MATCHES.map((m) => (
        <div
          key={m.qf}
          className='flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3'
        >
          <div className='w-7 shrink-0 text-center font-mono text-xs tracking-wider text-white/55'>
            {m.qf}
          </div>

          <div className='flex flex-1 items-center justify-end gap-2'>
            <span className='text-xs text-white/55'>{m.a.desc}</span>
            <span className='min-w-9 rounded-md bg-[#4CAF50]/10 px-2.5 py-1 text-center font-mono text-sm font-bold text-[#4CAF50]'>
              {m.a.seed}
            </span>
          </div>

          <span className='font-mono text-xs text-white/50'>vs</span>

          <div className='flex flex-1 items-center gap-2'>
            <span className='min-w-9 rounded-md bg-[#3B8BE6]/10 px-2.5 py-1 text-center font-mono text-sm font-bold text-[#3B8BE6]'>
              {m.b.seed}
            </span>
            <span className='text-xs text-white/55'>{m.b.desc}</span>
          </div>
        </div>
      ))}

      <div className='mt-1 text-center text-xs break-keep text-white/50'>
        시드 과제곡: {ARCADE_SONGS.seeding.title} ★{ARCADE_SONGS.seeding.level}{' '}
        (사전 비공개)
      </div>
    </div>
  )
}

/* ================================================================== */
/*  (9) SideAndTiebreakRules                                           */
/* ================================================================== */

function SideAndTiebreakRules() {
  return (
    <div className='flex flex-col gap-2.5'>
      <InfoCard icon='🎮' title='사이드(자리) 규칙'>
        <div className='flex gap-2'>
          <div className='flex-1 rounded-lg bg-[#E63B2E]/5 px-3 py-2.5 text-center'>
            <div className='mb-1 font-mono text-xs tracking-wider text-[#E63B2E]'>
              내 곡
            </div>
            <div className='text-xs font-semibold text-white/70'>내가 선택</div>
          </div>
          <div className='flex-1 rounded-lg bg-[#3B8BE6]/5 px-3 py-2.5 text-center'>
            <div className='mb-1 font-mono text-xs tracking-wider text-[#3B8BE6]'>
              상대 곡
            </div>
            <div className='text-xs font-semibold text-white/70'>
              상대가 선택
            </div>
          </div>
        </div>
      </InfoCard>

      <InfoCard icon='⚖️' title='동점 시'>
        <div className='rounded-lg bg-black/15 px-3.5 py-2.5 text-xs leading-[1.8] break-keep text-white/70'>
          선곡풀에서{' '}
          <span className='font-semibold text-[#F5A623]'>랜덤 1곡</span> 선정 →
          단판 재경기
          <br />
          사이드: 온라인 순위 상위자가 선택
        </div>
      </InfoCard>
    </div>
  )
}

/* ================================================================== */
/*  (10) FinalsStructure — 결선 구조 테이블                             */
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
      <div className='flex flex-col gap-2 md:hidden'>
        {FINALS_ROUNDS.map((r) => (
          <div
            key={r.round}
            className='flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3'
          >
            <span className='text-sm font-semibold text-white/80'>
              {r.round}
            </span>
            <div className='text-right'>
              <div className='text-sm text-white/70'>{r.method}</div>
              <div className='text-xs text-white/50'>{r.songs}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className='hidden md:block'>
        <Table className='text-sm'>
          <TableHeader className='bg-white/[0.07] text-white/75'>
            <TableRow className='border-white/[0.07]'>
              <TableHead className='border-white/[0.07] px-3 py-2 text-xs font-bold text-white/75'>
                라운드
              </TableHead>
              <TableHead className='border-white/[0.07] px-3 py-2 text-xs font-bold text-white/75'>
                방식
              </TableHead>
              <TableHead className='border-white/[0.07] px-3 py-2 text-xs font-bold text-white/75'>
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
                <TableCell className='border-white/[0.07] px-3 py-2.5 text-sm font-semibold text-white/80'>
                  {r.round}
                </TableCell>
                <TableCell className='border-white/[0.07] px-3 py-2.5 text-sm text-white/70'>
                  {r.method}
                </TableCell>
                <TableCell className='border-white/[0.07] px-3 py-2.5 text-sm text-white/70'>
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
    <div className='flex flex-col gap-2.5'>
      {/* 공통 순서 */}
      <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-4'>
        <div className='mb-2.5 font-mono text-xs tracking-[3px] text-[#ff2a00] uppercase opacity-60'>
          Common Order
        </div>
        <div className='flex items-center justify-center gap-1.5'>
          {['A 밴', 'B 밴', 'A 픽', 'B 픽'].map((step, i) => (
            <div key={step} className='flex items-center gap-1.5'>
              <span className='rounded-md bg-white/[0.06] px-2.5 py-1.5 text-xs font-semibold text-white/70'>
                {step}
              </span>
              {i < 3 && <span className='text-xs text-white/50'>→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 라운드별 */}
      <div className='grid grid-cols-2 gap-2'>
        <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-center'>
          <div className='mb-1.5 font-mono text-xs tracking-wider text-white/55'>
            8강 / 4강 / 3·4위전
          </div>
          <div className='text-sm font-semibold break-keep text-white/70'>
            각자 1곡 픽
          </div>
        </div>
        <div className='rounded-2xl border border-[#ff2a00]/[0.08] bg-[#ff2a00]/[0.03] p-3.5 text-center'>
          <div className='mb-1.5 font-mono text-xs tracking-wider text-[#ff2a00]/60'>
            결승
          </div>
          <div className='text-sm font-semibold break-keep text-white/70'>
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
    <div className='flex flex-col gap-2.5'>
      <InfoCard icon='🎯' title='플레이/옵션'>
        <div className='rounded-lg bg-black/15 px-3.5 py-2.5 text-xs leading-[1.8] break-keep text-white/70'>
          선곡한 곡: 해당 선수가 1P/2P 선택
          <br />
          과제곡: 합산 점수 우위자가 선택 (첫 곡이면 시드 상위자)
          <br />
          판정 조절 외 옵션(랜덤/미러 등){' '}
          <span className='font-semibold text-[#ff2a00]'>사용 불가</span>
        </div>
      </InfoCard>

      <InfoCard icon='🔄' title='동점/재경기'>
        <div className='rounded-lg bg-black/15 px-3.5 py-2.5 text-xs leading-[1.8] break-keep text-white/70'>
          동점 시 마지막 곡 동일 조건 재대결
          <br />
          재대결도 동점이면 양(良) 개수 많은 선수 승리
          <br />
          기기 오류 → 운영진 판단 하 재경기 가능 / 선수 과실 미스 → 재경기 불가
        </div>
      </InfoCard>

      <div className='mt-2 rounded-lg border border-white/10 bg-white/[0.015] p-3.5 text-center'>
        <span className='text-xs leading-[1.7] break-keep text-white/50'>
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
  'flex-1 py-3 min-h-11 text-sm font-medium transition-all data-[state=active]:bg-[#ff2a00]/10 data-[state=active]:text-[#f0f0f0] data-[state=active]:border data-[state=active]:border-[#ff2a00]/40 text-white/55 rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff2a00]/50 focus-visible:outline-none'

function ArcadePage() {
  const title = t('nav.arcade')

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${title}`
  }, [title])

  return (
    <TkcSection>
      <TkcPageHeader title={title} subtitle='아케이드 예선 공식 규정집' />

      <Tabs defaultValue='overview'>
        <TabsList className='mb-6 h-auto w-full overflow-x-auto rounded-2xl bg-white/[0.03] p-1 whitespace-nowrap'>
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
          <div className='mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5'>
            <p className='text-sm leading-[1.8] break-keep text-white/75'>
              아케이드 부문은 온라인 예선 → 오프라인 예선(스위스) → Top 8
              결선으로 진행됩니다. 4개 지역에서 각 2명씩, 총 8명이 결선에
              진출합니다.
            </p>
          </div>

          <PlayerChecklist />

          <SectionHeader
            label='01'
            title='대회 흐름'
            subtitle='Tournament Flow'
          >
            <TournamentFlow />
          </SectionHeader>

          <SectionHeader
            label='02'
            title='예선 지역'
            subtitle='Qualifier Regions'
          >
            <p className='mb-3.5 text-sm leading-relaxed break-keep text-white/75'>
              오프라인 예선은 전국 4개 지역에서 각 1회씩 진행됩니다. 참가자는
              4개 차수 중 1개만 선택 가능하며, 탈락 후 다른 차수 재도전은
              불가합니다.
            </p>
            <RegionTable />
          </SectionHeader>

          <SectionHeader
            label='03'
            title='온라인 예선'
            subtitle='Online Qualifier'
          >
            <MarkdownBlock body={ONLINE_QUALIFIER_MD} />
          </SectionHeader>
        </TabsContent>

        {/* ──────── Tab 2: 오프라인 예선 ──────── */}
        <TabsContent value='offline'>
          <div className='mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5'>
            <p className='text-sm leading-[1.8] break-keep text-white/75'>
              스위스 시스템 4라운드로 진행됩니다. 각 매치는 양측이 1곡씩
              제공하여 2곡 합산으로 승패를 결정하며, 2패 시 탈락합니다.
            </p>
          </div>

          <SectionHeader
            label='01'
            title='1경기 = 2곡 합산'
            subtitle='Match = 2-Song Aggregate'
          >
            <p className='mb-3.5 text-sm leading-relaxed break-keep text-white/75'>
              한 매치에서 나와 상대가 각각 1곡씩 제공합니다. 두 곡 모두 양쪽이
              플레이한 뒤, 2곡 점수 합산으로 승패가 결정됩니다.
            </p>
            <MatchVisual />
            <SNote>
              선곡은 대회 신청 시 R1~R4 각 라운드별로 미리 제출해야 합니다. 해당
              라운드에 배정되면 사전 제출한 곡이 그대로 사용됩니다.
            </SNote>
          </SectionHeader>

          <SectionHeader
            label='02'
            title='스위스 라운드'
            subtitle='Swiss Round Progression'
          >
            <p className='mb-3.5 text-sm leading-relaxed break-keep text-white/75'>
              매 라운드마다 같은 전적의 선수끼리 매칭됩니다. 1라운드는 온라인
              순위 시드로, 2라운드부터는 전적 그룹 내에서 매칭됩니다.
            </p>
            <SeedingMatchTable />
            <SwissVisual />
            <SNote>
              2패가 누적되면 즉시 탈락하며, 이후 라운드에 배정되지 않습니다.
              홀수 인원이 발생하면 남는 1명에게 부전승(Bye)이 부여됩니다.
            </SNote>
          </SectionHeader>

          <SectionHeader
            label='03'
            title='진출 조건'
            subtitle='Qualification Path'
          >
            <p className='mb-3.5 text-sm leading-relaxed break-keep text-white/75'>
              각 예선에서 2명이 Top 8 결선에 진출합니다. 진출 방식은 아래 두
              가지입니다.
            </p>
            <QualificationPath />
          </SectionHeader>

          <details className='mb-8'>
            <summary className='cursor-pointer text-sm font-semibold text-white/50 transition-colors hover:text-white/70 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-[#ff2a00]/50 focus-visible:outline-none'>
              추가 규칙 (사이드/동점)
            </summary>
            <div className='mt-4'>
              <p className='mb-3.5 text-sm leading-relaxed break-keep text-white/75'>
                사이드(1P/2P) 선택권과 동점 시 처리 방식입니다.
              </p>
              <SideAndTiebreakRules />
            </div>
          </details>
        </TabsContent>

        {/* ──────── Tab 3: 결선/운영 ──────── */}
        <TabsContent value='finals'>
          <div className='mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5'>
            <p className='text-sm leading-[1.8] break-keep text-white/75'>
              Top 8 결선은 크로스 시딩 8강 토너먼트입니다. 밴픽 후 합산 점수로
              승패를 결정합니다.
            </p>
          </div>

          <SectionHeader
            label='01'
            title='Top 8 대진'
            subtitle='Finals Bracket — Cross Seeding'
          >
            <p className='mb-3.5 text-sm leading-relaxed break-keep text-white/75'>
              4-0 진출자 4명(A그룹)과 3-1 진출자 4명(B그룹)을 교차 배치하여 8강
              대진을 구성합니다. 시드는 결선 과제곡 점수로 결정됩니다.
            </p>
            <BracketVisual />
          </SectionHeader>

          <SectionHeader
            label='02'
            title='결선 구조'
            subtitle='Finals Structure'
          >
            <FinalsStructure />
          </SectionHeader>

          <SectionHeader
            label='03'
            title='밴픽 절차'
            subtitle='Ban / Pick Procedure'
          >
            <p className='mb-3.5 text-sm leading-relaxed break-keep text-white/75'>
              공통 순서: A 밴 → B 밴 → A 픽 → B 픽
            </p>
            <BanPickProcedure />
          </SectionHeader>

          <details className='mb-8'>
            <summary className='cursor-pointer text-sm font-semibold text-white/50 transition-colors hover:text-white/70 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-[#ff2a00]/50 focus-visible:outline-none'>
              점수/운영 규칙
            </summary>
            <div className='mt-4'>
              <OperationsRules />
            </div>
          </details>
        </TabsContent>
      </Tabs>
    </TkcSection>
  )
}
