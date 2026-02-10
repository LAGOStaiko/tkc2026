import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSite } from '@/lib/api'
import { FadeIn } from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/')({
  component: HomePage,
})

const ASSETS = {
  hero: '/branding/v2/home-hero.jpg',
  logo: '/branding/v2/logo.png',
  consoleIcon: '/branding/v2/icon-console.png',
  arcadeIcon: '/branding/v2/icon-arcade.png',
}
const HOME_YOUTUBE_ID = 'DQKIfLMIgXY'
const HOME_YOUTUBE_EMBED = `https://www.youtube-nocookie.com/embed/${HOME_YOUTUBE_ID}?rel=0&modestbranding=1`

const DIVISIONS = [
  {
    iconSrc: ASSETS.consoleIcon,
    title: '콘솔',
    description: '동더! 원더풀 페스티벌로 진행하는 대회입니다.',
    accent: '#e86e3a',
    chips: ['03.02 ~ 04.30', 'ONLINE'],
    detailTo: '/console' as const,
  },
  {
    iconSrc: ASSETS.arcadeIcon,
    title: '아케이드',
    description: '태고의 달인 니지이로 ver.로 진행하는 대회입니다.',
    accent: '#f5a623',
    chips: ['03.02 ~ 04.11', 'ONLINE + OFFLINE'],
    detailTo: '/arcade' as const,
  },
]

/* ── Schedule Data ── */

type RangeEvent = {
  type: 'range'
  name: string
  detail: string
  startDate: string
  endDate: string
  division: 'console' | 'arcade'
}
type SingleEvent = {
  type: 'single'
  name: string
  fullDate: string
  venueName: string
  venueImage?: string
}
type DeadlineEvent = {
  type: 'deadline'
  name: string
  detail: string
  fullDate: string
}
type FinalsEvent = {
  type: 'finals'
  name: string
  detail: string
  fullDate: string
  venueName: string
}
type ScheduleEvent = RangeEvent | SingleEvent | DeadlineEvent | FinalsEvent

const SCHEDULE_MONTHS: {
  label: string
  labelEn: string
  isFinals?: boolean
  events: ScheduleEvent[]
}[] = [
  {
    label: '3월',
    labelEn: 'MARCH',
    events: [
      { type: 'range', name: '콘솔 예선', detail: '온라인 · 약 2개월간 진행', startDate: '2026-03-02', endDate: '2026-04-30', division: 'console' },
      { type: 'range', name: '아케이드 온라인 예선', detail: '2주간 진행', startDate: '2026-03-02', endDate: '2026-03-16', division: 'arcade' },
      { type: 'single', name: '오프라인 예선 → 서울', fullDate: '2026-03-21', venueName: 'TAIKO LABS · 서울', venueImage: '/branding/venue-seoul.png' },
      { type: 'single', name: '오프라인 예선 → 대전', fullDate: '2026-03-28', venueName: '싸이뮤직 게임월드 · 대전', venueImage: '/branding/venue-daejeon.png' },
    ],
  },
  {
    label: '4월',
    labelEn: 'APRIL',
    events: [
      { type: 'single', name: '오프라인 예선 → 광주', fullDate: '2026-04-04', venueName: '게임플라자 · 광주', venueImage: '/branding/venue-gwangju.png' },
      { type: 'single', name: '오프라인 예선 → 부산', fullDate: '2026-04-11', venueName: '게임D · 부산', venueImage: '/branding/venue-busan.png' },
      { type: 'deadline', name: '콘솔 예선 마감', detail: '온라인 예선 제출 종료', fullDate: '2026-04-30' },
    ],
  },
  {
    label: '5월',
    labelEn: 'MAY',
    isFinals: true,
    events: [
      { type: 'finals', name: '결선 → PlayX4', detail: '콘솔 · 아케이드 동시 진행', fullDate: '2026-05-23', venueName: '킨텍스 · PlayX4 2026' },
    ],
  },
]

function getDateProgress(startDate: string, endDate: string) {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T23:59:59')
  const today = new Date()
  if (today < start) return 0
  if (today > end) return 100
  return Math.round(((today.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100)
}

function getEventStatus(fullDate: string, endDate?: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(fullDate + 'T00:00:00')
  const end = endDate ? new Date(endDate + 'T23:59:59') : new Date(fullDate + 'T23:59:59')
  if (today < start) return '예정'
  if (today <= end) return '진행중'
  return '종료'
}

function fmtDate(d: string) {
  const date = new Date(d + 'T00:00:00')
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function fmtDay(d: string) {
  return ['일', '월', '화', '수', '목', '금', '토'][new Date(d + 'T00:00:00').getDay()]
}

type Partner = {
  order?: number
  name: string
  logoUrl?: string
  href?: string
}

type SiteData = {
  partners?: Partner[]
}

function HomePage() {
  const { data: site } = useSite<SiteData>()

  const partners: Partner[] = site?.partners?.length
    ? site.partners
    : [
        { order: 10, name: 'ANDAMIRO' },
        { order: 20, name: 'BANDAI NAMCO' },
        { order: 30, name: 'TAIKO LABS' },
      ]

  return (
    <div>
      {/* ── HERO ── */}
      <section className='relative -mt-20 grid grid-cols-1 overflow-hidden md:-mt-24 md:grid-cols-2'>
        {/* ── Image side ── */}
        <div className='relative min-h-[280px] overflow-hidden sm:min-h-[320px] md:min-h-[420px] lg:min-h-[480px]'>
          <img
            src={ASSETS.hero}
            alt='TKC2026 Hero'
            className='absolute inset-0 h-full w-full object-cover object-left'
            loading='eager'
          />
          {/* Top darkening for header readability */}
          <div className='absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent' />
          {/* Mobile: bottom fade */}
          <div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black md:hidden' />
          {/* Desktop: right fade */}
          <div className='absolute inset-0 hidden bg-gradient-to-r from-transparent via-transparent to-black md:block' />
          {/* Desktop: bottom edge */}
          <div className='absolute inset-x-0 bottom-0 hidden h-20 bg-gradient-to-t from-black to-transparent md:block' />

          {/* Slogan */}
          <div className='absolute bottom-8 left-6 z-10 sm:bottom-12 sm:left-8 md:bottom-12 md:left-10'>
            <FadeIn>
              <h2
                className='text-[clamp(26px,4.5vw,48px)] leading-[1.15] font-black tracking-[-0.5px] text-white'
                style={{ textShadow: '0 2px 40px rgba(0,0,0,0.5)' }}
              >
                꿈을 현실로,
                <br />
                현실을 기적으로.
              </h2>
            </FadeIn>
            <FadeIn delay={150}>
              <p className='mt-2.5 text-[15px] tracking-[2px] text-white/70'>
                타이코 코리아 챔피언십 2026
              </p>
            </FadeIn>
          </div>
        </div>

        {/* ── Content side ── */}
        <div className='relative flex flex-col justify-center px-6 py-10 sm:px-8 md:px-12 md:py-16'>
          {/* Ambient glow */}
          <div
            className='pointer-events-none absolute top-[20%] -left-20 h-[300px] w-[300px] rounded-full blur-[40px]'
            style={{
              background:
                'radial-gradient(circle, rgba(232,110,58,0.06), transparent 70%)',
            }}
          />

          <div className='relative'>
            {/* Badge */}
            <FadeIn delay={200}>
              <div className='mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#e86e3a]/20 bg-[#e86e3a]/[0.08] px-4 py-[7px] font-mono text-[11px] font-semibold tracking-[1.5px] text-[#e86e3a]'>
                <span className='tkc-motion-dot size-1.5 rounded-full bg-[#e86e3a] shadow-[0_0_8px_#e86e3a]' />
                TAIKO KOREA CHAMPIONSHIP
              </div>
            </FadeIn>

            {/* Year */}
            <FadeIn delay={300}>
              <div className='tkc-hero-year mb-2 bg-gradient-to-br from-[#e86e3a] via-[#f5a623] to-[#ffcc5f] bg-clip-text text-[clamp(64px,10vw,100px)] leading-none font-black tracking-[-2px] text-transparent md:tracking-[-4px]'>
                2026
              </div>
            </FadeIn>

            {/* CTA text */}
            <FadeIn delay={400}>
              <p className='mb-7 text-[17px] text-white/65'>
                지금 참가 신청을 받고 있습니다
              </p>
            </FadeIn>

            {/* Actions */}
            <FadeIn delay={500}>
              <div className='flex flex-col gap-2.5 sm:flex-row'>
                <Link
                  to='/apply'
                  className='tkc-motion-lift inline-flex items-center justify-center rounded-lg px-7 py-3 text-[15px] font-semibold text-white hover:brightness-110'
                  style={{
                    background: '#e86e3a',
                    boxShadow: '0 4px 24px rgba(232,110,58,0.25)',
                  }}
                >
                  대회 신청하기
                </Link>
                <Link
                  to='/schedule'
                  className='tkc-motion-lift inline-flex items-center justify-center rounded-lg border border-[#1e1e1e] px-6 py-3 text-[15px] font-semibold text-white/65 hover:border-white/30 hover:bg-white/[0.03] hover:text-white'
                >
                  일정 보기 →
                </Link>
              </div>
            </FadeIn>

            {/* Stats */}
            <FadeIn delay={600}>
              <div className='mt-8 flex gap-5 border-t border-[#1e1e1e] pt-6 md:gap-6'>
                <div>
                  <div className='text-xl font-extrabold tracking-[-0.5px] md:text-2xl'>
                    2
                  </div>
                  <div className='mt-0.5 text-[13px] text-white/50'>
                    부문
                  </div>
                </div>
                <div>
                  <div className='text-xl font-extrabold tracking-[-0.5px] md:text-2xl'>
                    4
                  </div>
                  <div className='mt-0.5 text-[13px] text-white/50'>
                    지역
                  </div>
                </div>
                <div>
                  <div className='text-xl font-extrabold tracking-[-0.5px] md:text-2xl'>
                    05.23
                  </div>
                  <div className='mt-0.5 text-[13px] text-white/50'>
                    결선
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── DIVISIONS ── */}
      <section className='mt-10 grid grid-cols-1 gap-4 md:mt-14 md:grid-cols-2 md:gap-5'>
        {DIVISIONS.map((d) => (
          <DivisionCard key={d.title} {...d} />
        ))}
      </section>

      {/* ── SCHEDULE ── */}
      <section className='mt-16 md:mt-20'>
        <FadeIn>
          <SectionHead label='Schedule' title='일정'>
            <Link
              to='/schedule'
              className='text-sm text-white/55 transition-colors hover:text-[#e86e3a]'
            >
              자세히 보기 →
            </Link>
          </SectionHead>
        </FadeIn>
        <FadeIn delay={100}>
          <ScheduleStrip />
        </FadeIn>
      </section>

      {/* ── VIDEO ── */}
      <section className='mt-16 md:mt-20'>
        <FadeIn>
          <SectionHead label='Video' title='영상' />
        </FadeIn>
        <FadeIn delay={100}>
          <YouTubeEmbed />
        </FadeIn>
      </section>

      {/* ── FOOTER STRIP ── */}
      <section className='mt-16 border-t border-[#1e1e1e] pt-8 pb-7 md:mt-20'>
        <div className='flex flex-col items-center justify-between gap-5 md:flex-row'>
          <div className='flex items-center gap-3'>
            <img
              src={ASSETS.logo}
              alt='TKC2026'
              className='h-7 w-auto opacity-80 md:h-8'
              loading='lazy'
            />
          </div>

          <div className='flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm font-semibold tracking-normal text-white/65 md:justify-end'>
            {partners
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((p) => {
                const key = p.order ?? p.name
                const hasLogo = !!p.logoUrl && p.logoUrl.trim().length > 0
                const hasHref = !!p.href && p.href.trim().length > 0

                const node = hasLogo ? (
                  <img
                    src={p.logoUrl}
                    alt={p.name}
                    className='h-6 w-auto opacity-90'
                    loading='lazy'
                  />
                ) : (
                  <span>{p.name}</span>
                )

                return hasHref ? (
                  <a
                    key={key}
                    href={p.href}
                    target='_blank'
                    rel='noreferrer'
                    className='hover:text-white'
                  >
                    {node}
                  </a>
                ) : (
                  <span key={key}>{node}</span>
                )
              })}
          </div>

          <div className='text-sm text-white/60'>
            © {new Date().getFullYear()} 태고의 달인 플레이엑스포 토너먼트
          </div>
        </div>
      </section>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Section Head                                                      */
/* ════════════════════════════════════════════════════════════════════ */

function SectionHead({
  label,
  title,
  children,
}: {
  label: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className='mb-6 flex items-end justify-between gap-4'>
      <div>
        <div className='mb-1.5 font-mono text-sm font-semibold tracking-[1px] text-[#e86e3a] uppercase'>
          {label}
        </div>
        <h2 className='text-[clamp(24px,4vw,32px)] font-extrabold tracking-tight text-white/95'>
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Division Card                                                     */
/* ════════════════════════════════════════════════════════════════════ */

function DivisionCard({
  iconSrc,
  title,
  description,
  accent,
  chips,
  detailTo,
}: (typeof DIVISIONS)[number]) {
  return (
    <FadeIn>
      <div className='tkc-motion-lift group relative overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] hover:border-[#2a2a2a]'>
        <div
          className='absolute top-0 right-0 left-0 h-0.5'
          style={{ background: accent }}
        />
        <div
          className='pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-50 transition-opacity group-hover:opacity-100'
          style={{
            background: `radial-gradient(circle, ${accent}10, transparent 70%)`,
          }}
        />

        <div className='relative flex h-full flex-col p-6 sm:p-7'>
          <div className='mb-3.5 flex items-center gap-3.5'>
            <img
              src={iconSrc}
              alt=''
              className='size-11 shrink-0 rounded-xl object-cover'
              loading='lazy'
              draggable={false}
            />
            <h3 className='text-xl font-bold text-white/95 sm:text-2xl'>
              {title}
            </h3>
          </div>

          <p className='mb-5 text-[15px] leading-[1.55] break-keep text-white/70'>
            {description}
          </p>

          <div className='mb-5 flex flex-wrap gap-2'>
            {chips.map((chip) => (
              <span
                key={chip}
                className='rounded-md border border-[#1e1e1e] bg-white/[0.03] px-3 py-1 font-mono text-[12px] font-semibold tracking-wide text-white/65'
              >
                {chip}
              </span>
            ))}
          </div>

          <div className='mt-auto flex gap-2.5'>
            <Link
              to={detailTo}
              className='tkc-motion-surface flex-1 rounded-lg border border-[#2a2a2a] bg-transparent py-2.5 text-center text-sm font-semibold text-white/70 hover:border-white/30 hover:bg-white/[0.04] hover:text-white/90'
            >
              자세히 보기
            </Link>
            <Link
              to='/apply'
              className='tkc-motion-surface flex-1 rounded-lg py-2.5 text-center text-sm font-semibold text-white hover:brightness-110'
              style={{
                background: accent,
                boxShadow: `0 4px 20px ${accent}33`,
              }}
            >
              대회 신청하기
            </Link>
          </div>
        </div>
      </div>
    </FadeIn>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Schedule Strip                                                    */
/* ════════════════════════════════════════════════════════════════════ */

function StatusTag({ status }: { status: string }) {
  const cls =
    status === '진행중'
      ? 'bg-emerald-500/15 text-emerald-400'
      : status === '종료'
        ? 'bg-white/[0.03] text-white/35'
        : 'border border-[#1e1e1e] bg-white/[0.03] text-white/45'
  return (
    <span
      className={`rounded-[5px] px-2.5 py-1 text-[11px] leading-none font-semibold tracking-wide whitespace-nowrap ${cls}`}
    >
      {status}
    </span>
  )
}

function ScheduleStrip() {
  const overall = getDateProgress('2026-03-02', '2026-05-23')
  const monthMarkers = [
    { label: '3월', pct: 0 },
    { label: '4월', pct: 37 },
    { label: '5월', pct: 74 },
  ]

  return (
    <div className='space-y-10'>
      {/* ── Progress Bar ── */}
      <div className='relative mt-2 mb-4 h-1 rounded-full bg-[#1e1e1e]'>
        <div
          className='absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#e86e3a] to-[#f5a623] transition-all duration-1000'
          style={{ width: `${overall}%` }}
        />
        <div className='absolute -top-2 inset-x-0 flex justify-between'>
          {monthMarkers.map((m) => {
            const active = overall >= m.pct
            return (
              <div key={m.label} className='flex flex-col items-center'>
                <div
                  className={`size-2 rounded-full border-2 border-[#0a0a0a] ${
                    active
                      ? 'bg-[#e86e3a] shadow-[0_0_8px_rgba(232,110,58,0.3)]'
                      : 'bg-[#2a2a2a]'
                  }`}
                />
                <span
                  className={`mt-2.5 text-[11px] leading-none font-semibold tracking-[0.02em] ${
                    active ? 'text-[#e86e3a]' : 'text-white/35'
                  }`}
                >
                  {m.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Month Groups ── */}
      {SCHEDULE_MONTHS.map((group) => (
        <div key={group.label}>
          {/* Month label */}
          <div className='mb-3.5 flex items-center gap-2.5'>
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-[11px] leading-none font-semibold tracking-[0.08em] ${
                group.isFinals
                  ? 'border-[#e86e3a]/20 bg-[#e86e3a]/[0.04] text-[#e86e3a]'
                  : 'border-[#1e1e1e] bg-white/[0.02] text-white/40'
              }`}
            >
              {group.label} {group.labelEn}
              {group.isFinals && ' → FINALS'}
            </span>
            <div className='h-px flex-1 bg-[#1e1e1e]' />
          </div>

          {/* Events */}
          <div className='space-y-2'>
            {group.events.map((ev) => {
              if (ev.type === 'range') {
                const progress = getDateProgress(ev.startDate, ev.endDate)
                const status = getEventStatus(ev.startDate, ev.endDate)
                return (
                  <div
                    key={ev.name}
                    className='rounded-xl border border-[#1e1e1e] bg-[#111] p-4 transition-colors hover:border-[#2a2a2a] sm:p-5'
                  >
                    <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xl leading-none font-extrabold tracking-tight tabular-nums text-white/95 sm:text-[22px]'>
                          {fmtDate(ev.startDate)}
                        </span>
                        <span className='text-sm leading-none text-white/25'>
                          →
                        </span>
                        <span className='text-xl leading-none font-extrabold tracking-tight tabular-nums text-white/95 sm:text-[22px]'>
                          {fmtDate(ev.endDate)}
                        </span>
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='text-[16px] leading-[1.25] font-semibold text-white/90'>
                          {ev.name}
                        </div>
                        <div className='text-[13px] leading-[1.4] text-white/40'>
                          {ev.detail}
                        </div>
                      </div>
                      <div className='flex gap-1.5'>
                        <span className='rounded-[5px] bg-[#4a9eff]/[0.08] px-2.5 py-1 text-[11px] leading-none font-semibold tracking-wide text-[#4a9eff]'>
                          ONLINE
                        </span>
                        <StatusTag status={status} />
                      </div>
                    </div>
                    <div className='mt-3 flex items-center gap-2'>
                      <div className='h-[3px] flex-1 overflow-hidden rounded-full bg-[#1e1e1e]'>
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            ev.division === 'console'
                              ? 'bg-[#e86e3a]'
                              : 'bg-[#f5a623]'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className='text-[11px] leading-none tabular-nums text-white/40'>
                        {progress}%
                      </span>
                    </div>
                  </div>
                )
              }

              if (ev.type === 'single') {
                const status = getEventStatus(ev.fullDate)
                return (
                  <div
                    key={ev.fullDate}
                    className='flex items-center gap-4 rounded-xl border border-[#1e1e1e] bg-[#111] px-4 py-3.5 transition-colors hover:border-[#2a2a2a] sm:px-5'
                  >
                    <div className='w-[72px] shrink-0 text-center sm:w-[84px]'>
                      <div className='text-lg leading-none font-extrabold tracking-tight tabular-nums whitespace-nowrap text-white/95 sm:text-2xl'>
                        {fmtDate(ev.fullDate)}
                      </div>
                      <div className='mt-1 text-[11px] leading-none text-white/40'>
                        {fmtDay(ev.fullDate)}
                      </div>
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='text-[16px] leading-[1.25] font-semibold text-white/90'>
                        {ev.name}
                      </div>
                      <div className='mt-1 flex items-center gap-1.5 text-[13px] leading-[1.35] text-white/40'>
                        <span className='size-1 rounded-full bg-white/25' />
                        {ev.venueName}
                      </div>
                    </div>
                    <div className='flex shrink-0 gap-1.5'>
                      <span className='rounded-[5px] bg-[#e86e3a]/[0.08] px-2.5 py-1 text-[11px] leading-none font-semibold tracking-wide text-[#e86e3a]'>
                        OFFLINE
                      </span>
                      <StatusTag status={status} />
                    </div>
                  </div>
                )
              }

              if (ev.type === 'deadline') {
                return (
                  <div
                    key={ev.fullDate}
                    className='flex items-center gap-4 rounded-xl border border-dashed border-[#e86e3a]/15 bg-[#111] px-4 py-3.5 sm:px-5'
                  >
                    <div className='w-[72px] shrink-0 text-center sm:w-[84px]'>
                      <div className='text-lg leading-none font-semibold tracking-tight tabular-nums whitespace-nowrap text-white/40 sm:text-xl'>
                        {fmtDate(ev.fullDate)}
                      </div>
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='text-[16px] leading-[1.25] font-semibold text-white/55'>
                        {ev.name}
                      </div>
                      <div className='text-[13px] leading-[1.4] text-white/35'>
                        {ev.detail}
                      </div>
                    </div>
                    <span className='rounded-[5px] border border-[#1e1e1e] bg-white/[0.03] px-2.5 py-1 text-[11px] leading-none font-semibold tracking-wide text-white/40'>
                      마감
                    </span>
                  </div>
                )
              }

              if (ev.type === 'finals') {
                const status = getEventStatus(ev.fullDate)
                return (
                  <div
                    key={ev.fullDate}
                    className='flex items-center gap-4 rounded-xl border border-[#e86e3a]/20 bg-gradient-to-br from-[#e86e3a]/[0.03] to-[#111] px-5 py-5 transition-colors hover:border-[#e86e3a]/35 sm:px-6'
                  >
                    <div className='w-[72px] shrink-0 text-center sm:w-[88px]'>
                      <div className='bg-gradient-to-br from-[#e86e3a] to-[#f5a623] bg-clip-text text-2xl leading-none font-extrabold tracking-tight tabular-nums whitespace-nowrap text-transparent sm:text-[32px]'>
                        {fmtDate(ev.fullDate)}
                      </div>
                      <div className='mt-1 text-[11px] leading-none text-[#e86e3a]/70'>
                        {fmtDay(ev.fullDate)}
                      </div>
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='text-[18px] leading-[1.2] font-semibold text-white/90'>
                        {ev.name}
                      </div>
                      <div className='text-[13px] leading-[1.4] text-white/40'>
                        {ev.detail}
                      </div>
                      <div className='mt-1 flex items-center gap-1.5 text-[13px] leading-[1.35] text-white/40'>
                        <span className='size-1 rounded-full bg-white/25' />
                        {ev.venueName}
                      </div>
                    </div>
                    <div className='flex shrink-0 gap-1.5'>
                      <span className='rounded-[5px] border border-[#e86e3a]/20 bg-[#e86e3a]/[0.12] px-2.5 py-1 text-[11px] leading-none font-semibold tracking-wide text-[#e86e3a]'>
                        FINALS
                      </span>
                      <StatusTag status={status} />
                    </div>
                  </div>
                )
              }

              return null
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  YouTube Embed (thumbnail → click to load)                         */
/* ════════════════════════════════════════════════════════════════════ */

const YT_THUMB = `https://i.ytimg.com/vi/${HOME_YOUTUBE_ID}/hqdefault.jpg`

function YouTubeEmbed() {
  const [playing, setPlaying] = useState(false)

  return (
    <div className='tkc-motion-surface overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] hover:border-[#2a2a2a]'>
      <div className='aspect-video bg-black'>
        {playing ? (
          <iframe
            className='h-full w-full'
            src={`${HOME_YOUTUBE_EMBED}&autoplay=1`}
            title='TKC2026 Opening Movie'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            referrerPolicy='strict-origin-when-cross-origin'
            allowFullScreen
          />
        ) : (
          <button
            type='button'
            onClick={() => setPlaying(true)}
            className='group relative h-full w-full cursor-pointer'
            aria-label='영상 재생'
          >
            <img
              src={YT_THUMB}
              alt='TKC2026 Opening Movie'
              className='h-full w-full object-cover'
              loading='lazy'
            />
            <div className='absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/15' />
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='flex size-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110 sm:size-18'>
                <svg
                  viewBox='0 0 24 24'
                  fill='#111'
                  className='ml-1 size-7 sm:size-8'
                >
                  <path d='M8 5v14l11-7z' />
                </svg>
              </div>
            </div>
          </button>
        )}
      </div>
      <div className='border-t border-[#1e1e1e] px-5 py-4'>
        <div className='text-[15px] font-semibold text-white/90'>
          TAIKO LABS
        </div>
        <div className='mt-0.5 text-sm leading-[1.55] text-white/55'>
          이제 우리는 그 너머로 향합니다.
        </div>
      </div>
    </div>
  )
}
