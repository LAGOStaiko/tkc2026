import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSite } from '@/lib/api'
import { sanitizeUrl, sanitizeImgSrc } from '@/lib/sanitize-url'
import { FadeIn } from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/')({
  component: HomePage,
})

const ASSETS = {
  hero: '/branding/v2/home-hero.jpg',
  logo: '/branding/v2/logo.png',
}
const HOME_YOUTUBE_ID = 'DQKIfLMIgXY'
const HOME_YOUTUBE_EMBED = `https://www.youtube-nocookie.com/embed/${HOME_YOUTUBE_ID}?rel=0&modestbranding=1`

/* ── Character Assets ── */
const CHARS = {
  finalsDuo: '/characters/don_katsu_2_sprite_03.png',
  // Schedule decoration
  katsuRun: '/characters/don_katsu_normal_5_sprite_02.png', // 달리는 캇짱
}

const DIVISIONS = [
  {
    num: '01',
    title: '콘솔',
    description: '쿵딱! 원더풀 페스티벌로 진행하는 대회입니다.',
    accent: '#e86e3a',
    periodLabel: '온라인 예선 접수 기간',
    periodStart: '03.02',
    periodEnd: '04.30',
    detailTo: '/console' as const,
    logoSrc: '/branding/taiko-console-logo.png',
  },
  {
    num: '02',
    title: '아케이드',
    description: '태고의 달인 니지이로 ver.로 진행하는 대회입니다.',
    accent: '#f5a623',
    periodLabel: '온라인 예선 접수 기간',
    periodStart: '03.02',
    periodEnd: '04.11',
    detailTo: '/arcade' as const,
    logoSrc: '/branding/taiko-arcade-logo.png',
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
      <section className='-mt-20 overflow-hidden md:-mt-24'>
        {/* Image + desktop overlay */}
        <div className='relative h-[280px] sm:h-[360px] md:h-[520px] lg:h-[560px]'>
          <img
            src={ASSETS.hero}
            alt='TKC2026 Hero'
            className='absolute inset-0 h-full w-full object-cover object-[center_top] md:object-center'
            loading='eager'
          />
          {/* Top darkening for header readability */}
          <div className='absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent' />
          {/* Bottom gradient overlay */}
          <div className='absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent' />

          {/* Desktop: overlay buttons */}
          <div className='absolute inset-x-0 bottom-0 hidden px-8 pb-10 md:block'>
            <div className='mx-auto max-w-[1200px]'>
              <FadeIn delay={200}>
                <div className='mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#e86e3a]/20 bg-[#e86e3a]/[0.08] px-4 py-[7px] font-mono text-[11px] font-semibold tracking-[1.5px] text-[#e86e3a]'>
                  <span className='tkc-motion-dot size-1.5 rounded-full bg-[#e86e3a] shadow-[0_0_8px_#e86e3a]' />
                  TAIKO KOREA CHAMPIONSHIP
                </div>
              </FadeIn>
              <FadeIn delay={300}>
                <div className='flex flex-row items-center gap-3'>
                  <Link
                    to='/apply'
                    className='group/cta tkc-motion-lift relative inline-flex items-center justify-center rounded-lg px-7 py-3 text-[15px] font-semibold text-white'
                    style={{
                      background: '#e86e3a',
                      boxShadow: '0 4px 24px rgba(232,110,58,0.25)',
                    }}
                  >
                    <span className='transition-opacity duration-300 group-hover/cta:opacity-0'>
                      대회 신청하기
                    </span>
                    <img
                      src='/characters/don-wink.png'
                      alt=''
                      className='pointer-events-none absolute inset-0 m-auto h-9 w-9 scale-75 object-contain opacity-0 transition-all duration-300 group-hover/cta:scale-100 group-hover/cta:opacity-100'
                      draggable={false}
                    />
                  </Link>
                  <Link
                    to='/schedule'
                    className='group/cta2 tkc-motion-lift relative inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-6 py-3 text-[15px] font-semibold text-white/80 backdrop-blur-sm hover:border-white/30 hover:bg-white/[0.1] hover:text-white'
                  >
                    <span className='transition-opacity duration-300 group-hover/cta2:opacity-0'>
                      일정 보기 →
                    </span>
                    <img
                      src='/characters/katsu-wink.png'
                      alt=''
                      className='pointer-events-none absolute inset-0 m-auto h-9 w-9 scale-75 object-contain opacity-0 transition-all duration-300 group-hover/cta2:scale-100 group-hover/cta2:opacity-100'
                      draggable={false}
                    />
                  </Link>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>

        {/* Mobile: buttons below image */}
        <div className='flex flex-col gap-3 px-6 py-6 md:hidden'>
          <Link
            to='/apply'
            className='group/cta tkc-motion-lift relative inline-flex w-full items-center justify-center rounded-lg px-7 py-3 text-[15px] font-semibold text-white'
            style={{
              background: '#e86e3a',
              boxShadow: '0 4px 24px rgba(232,110,58,0.25)',
            }}
          >
            <span className='transition-opacity duration-300 group-hover/cta:opacity-0'>
              대회 신청하기
            </span>
            <img
              src='/characters/don-wink.png'
              alt=''
              className='pointer-events-none absolute inset-0 m-auto h-8 w-8 scale-75 object-contain opacity-0 transition-all duration-300 group-hover/cta:scale-100 group-hover/cta:opacity-100'
              draggable={false}
            />
          </Link>
          <Link
            to='/schedule'
            className='group/cta2 tkc-motion-lift relative inline-flex w-full items-center justify-center rounded-lg border border-[#1e1e1e] px-6 py-3 text-[15px] font-semibold text-white/65 hover:border-white/30 hover:bg-white/[0.03] hover:text-white'
          >
            <span className='transition-opacity duration-300 group-hover/cta2:opacity-0'>
              일정 보기 →
            </span>
            <img
              src='/characters/katsu-wink.png'
              alt=''
              className='pointer-events-none absolute inset-0 m-auto h-8 w-8 scale-75 object-contain opacity-0 transition-all duration-300 group-hover/cta2:scale-100 group-hover/cta2:opacity-100'
              draggable={false}
            />
          </Link>
        </div>
      </section>

      {/* ── DIVISIONS ── */}
      <section className='border-t border-[#1e1e1e]'>
        <div className='grid grid-cols-1 md:grid-cols-2'>
          {DIVISIONS.map((d, i) => (
            <DivisionPanel key={d.title} {...d} index={i} />
          ))}
        </div>
      </section>

      {/* ── SCHEDULE ── */}
      <section className='mt-10 sm:mt-10 md:mt-14'>
        <FadeIn>
          <div className='relative'>
            <SectionHead label='Schedule' title='일정'>
              <Link
                to='/schedule'
                className='text-sm text-white/55 transition-colors hover:text-[#e86e3a]'
              >
                자세히 보기 →
              </Link>
            </SectionHead>
          </div>
        </FadeIn>
        <FadeIn delay={100}>
          <ScheduleStrip />
        </FadeIn>
      </section>

      {/* ── VIDEO ── */}
      <section className='mt-16 sm:mt-16 md:mt-20'>
        <FadeIn>
          <SectionHead label='Video' title='영상' />
        </FadeIn>
        <FadeIn delay={100}>
          <div className='relative'>
            <YouTubeEmbed />
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER STRIP ── */}
      <section className='mt-16 border-t border-[#1e1e1e] pt-10 pb-9 sm:mt-16 md:mt-20'>
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
                const safeLogoUrl = sanitizeImgSrc(p.logoUrl)
                const safeHref = sanitizeUrl(p.href)
                const hasLogo = safeLogoUrl.length > 0
                const hasHref = safeHref !== '#'

                const node = hasLogo ? (
                  <img
                    src={safeLogoUrl}
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
                    href={safeHref}
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
            © {new Date().getFullYear()} 태고의 달인 PlayX4 토너먼트
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
    <div className='mb-7 flex flex-wrap items-end justify-between gap-3 sm:mb-6'>
      <div>
        <div className='mb-1.5 font-mono text-xs font-semibold tracking-[1px] text-[#e86e3a] uppercase sm:text-sm'>
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
/*  Division Panel                                                    */
/* ════════════════════════════════════════════════════════════════════ */

function DivisionPanel({
  num,
  title,
  description,
  accent,
  periodLabel,
  periodStart,
  periodEnd,
  detailTo,
  logoSrc,
  index,
}: (typeof DIVISIONS)[number] & { index: number }) {
  return (
    <FadeIn delay={index * 100}>
      <div
        className={`group relative h-full overflow-hidden p-7 transition-colors hover:bg-white/[0.015] sm:p-10 md:p-12 ${
          index === 0
            ? 'border-b border-[#1e1e1e] md:border-b-0 md:border-r'
            : ''
        }`}
      >
        {/* Top accent line */}
        <div
          className='absolute top-0 right-0 left-0 h-0.5 opacity-40 transition-opacity group-hover:opacity-100'
          style={{
            background: `linear-gradient(90deg, ${accent}, transparent 80%)`,
          }}
        />
        {/* Corner glow */}
        <div
          className='pointer-events-none absolute -top-[60px] -right-[60px] size-[200px] rounded-full opacity-0 transition-opacity group-hover:opacity-100'
          style={{
            background: `radial-gradient(circle, ${accent}0a, transparent 70%)`,
          }}
        />

        <div className='relative'>
          {/* Top row: ID + Status */}
          <div className='mb-5 flex flex-wrap items-start justify-between gap-3'>
            <div className='flex items-center gap-3.5'>
              <span className='text-4xl font-black leading-none tracking-[-2px] text-white/[0.08] sm:text-5xl'>
                {num}
              </span>
              <h3 className='text-[24px] font-extrabold tracking-[-0.5px] sm:text-[28px]'>
                {title}
              </h3>
            </div>
            <div className='inline-flex items-center gap-1.5 rounded-full border border-[#4a9eff]/20 bg-[#4a9eff]/[0.08] px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.5px] text-[#4a9eff] sm:gap-2 sm:px-3.5 sm:text-[13px]'>
              <span className='tkc-motion-dot size-2 rounded-full bg-[#4a9eff] shadow-[0_0_8px_#4a9eff]' />
              신청 중
            </div>
          </div>

          {/* Game Logo */}
          {logoSrc && (
            <img
              src={logoSrc}
              alt={title}
              className='mb-2 h-10 w-auto object-contain opacity-90 sm:h-12'
              loading='lazy'
              draggable={false}
            />
          )}

          {/* Description */}
          <p className='mb-6 text-[14px] leading-[1.7] break-keep text-white/60 sm:mb-7 sm:text-[15px]'>
            {description}
          </p>

          {/* Period block */}
          <div className='mb-7 rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-4 sm:mb-7 sm:px-5 sm:py-4'>
            <div className='mb-1 text-[12px] font-medium text-white/50'>
              {periodLabel}
            </div>
            <div
              className='text-[22px] font-extrabold tracking-[-0.5px] sm:text-[28px]'
              style={{ color: accent }}
            >
              {periodStart}{' '}
              <span className='mx-1 text-lg opacity-40 sm:text-xl'>→</span>{' '}
              {periodEnd}
            </div>
          </div>

          {/* Actions */}
          <div className='grid grid-cols-2 gap-2.5'>
            <Link
              to={detailTo}
              className='group/detail tkc-motion-surface relative inline-flex items-center justify-center rounded-lg border border-[#1e1e1e] px-6 py-2.5 text-sm font-semibold text-white/60 hover:border-white/30 hover:text-white'
            >
              <span className='transition-opacity duration-300 group-hover/detail:opacity-0'>
                자세히 보기
              </span>
              <img
                src='/characters/katsu-wink.png'
                alt=''
                className='pointer-events-none absolute inset-0 m-auto h-8 w-8 scale-75 object-contain opacity-0 transition-all duration-300 group-hover/detail:scale-100 group-hover/detail:opacity-100'
                draggable={false}
              />
            </Link>
            <Link
              to='/apply'
              className='group/cta tkc-motion-surface relative inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold'
              style={{
                background: accent,
                color: accent === '#f5a623' ? '#0a0a0a' : '#fff',
                boxShadow: `0 4px 20px ${accent}33`,
              }}
            >
              <span className='transition-opacity duration-300 group-hover/cta:opacity-0'>
                대회 신청하기
              </span>
              <img
                src='/characters/don-wink.png'
                alt=''
                className='pointer-events-none absolute inset-0 m-auto h-8 w-8 scale-75 object-contain opacity-0 transition-all duration-300 group-hover/cta:scale-100 group-hover/cta:opacity-100'
                draggable={false}
              />
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
    <div className='space-y-12'>
      {/* ── Progress Bar ── */}
      <div className='relative mt-2 mb-4 h-1 rounded-full bg-[#1e1e1e]'>
        <div
          className='absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#e86e3a] to-[#f5a623] transition-all duration-1000'
          style={{ width: `${overall}%` }}
        />
        {/* Progress bar runner — 달리는 캇짱 */}
        {overall > 0 && overall < 100 && (
          <div
            className='pointer-events-none absolute -top-5 z-10 transition-all duration-1000'
            style={{ left: `${Math.min(overall, 95)}%`, transform: 'translateX(-50%)' }}
          >
            <img
              src={CHARS.katsuRun}
              alt=''
              className='h-auto w-6 opacity-50'
              loading='lazy'
              draggable={false}
            />
          </div>
        )}
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
          <div className='space-y-3 sm:space-y-2.5'>
            {group.events.map((ev) => {
              if (ev.type === 'range') {
                const progress = getDateProgress(ev.startDate, ev.endDate)
                const status = getEventStatus(ev.startDate, ev.endDate)
                return (
                  <div
                    key={ev.name}
                    className='rounded-xl border border-[#1e1e1e] bg-[#111] transition-colors hover:border-[#2a2a2a]'
                  >
                    <div className='flex items-center gap-3 p-5 sm:gap-4 sm:p-5'>
                      <div className='flex w-[52px] shrink-0 flex-col items-start justify-center text-left sm:w-[72px] sm:items-center sm:text-center'>
                        <div className='w-[5ch] text-left text-[15px] leading-none font-bold tracking-tight tabular-nums text-white/90 sm:text-center sm:text-lg'>
                          {fmtDate(ev.startDate)}
                        </div>
                        <div className='my-1 w-[5ch] text-left text-[11px] leading-none text-white/20 sm:text-center'>
                          →
                        </div>
                        <div className='w-[5ch] text-left text-[15px] leading-none font-bold tracking-tight tabular-nums text-white/90 sm:text-center sm:text-lg'>
                          {fmtDate(ev.endDate)}
                        </div>
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='min-w-0'>
                            <div className='text-[14px] leading-[1.4] font-semibold break-keep text-white/90 sm:text-[15px] sm:leading-[1.3]'>
                              {ev.name}
                            </div>
                            <div className='mt-0.5 text-[13px] leading-[1.4] break-keep text-white/40'>
                              {ev.detail}
                            </div>
                          </div>
                          <div className='hidden shrink-0 gap-1.5 sm:flex'>
                            <span className='rounded-[5px] bg-[#4a9eff]/[0.08] px-2.5 py-1 text-[11px] leading-none font-semibold tracking-wide text-[#4a9eff]'>
                              ONLINE
                            </span>
                            <StatusTag status={status} />
                          </div>
                        </div>
                        <div className='mt-2 flex gap-1.5 sm:hidden'>
                          <span className='rounded-[5px] bg-[#4a9eff]/[0.08] px-2.5 py-1 text-[11px] leading-none font-semibold tracking-wide text-[#4a9eff]'>
                            ONLINE
                          </span>
                          <StatusTag status={status} />
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
                    </div>
                  </div>
                )
              }

              if (ev.type === 'single') {
                const status = getEventStatus(ev.fullDate)
                return (
                  <div
                    key={ev.fullDate}
                    className='rounded-xl border border-[#1e1e1e] bg-[#111] transition-colors hover:border-[#2a2a2a]'
                  >
                    <div className='flex items-center gap-3 p-5 sm:gap-4 sm:p-5'>
                      <div className='flex w-[52px] shrink-0 flex-col items-start justify-center text-left sm:w-[72px] sm:items-center sm:text-center'>
                        <div className='w-[5ch] text-left text-[15px] leading-none font-bold tracking-tight tabular-nums text-white/90 sm:text-center sm:text-xl'>
                          {fmtDate(ev.fullDate)}
                        </div>
                        <div className='mt-1 w-[5ch] text-left text-[11px] leading-none text-white/35 sm:text-center'>
                          {fmtDay(ev.fullDate)}
                        </div>
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='min-w-0'>
                            <div className='text-[14px] leading-[1.35] font-semibold break-keep text-white/90 sm:text-[15px] sm:leading-[1.3]'>
                              {ev.name}
                            </div>
                            <div className='mt-1 flex items-center gap-1.5 text-[13px] text-white/40'>
                              {ev.venueImage ? (
                                <img
                                  src={ev.venueImage}
                                  alt=''
                                  className='size-5 rounded object-cover'
                                  loading='lazy'
                                  draggable={false}
                                />
                              ) : (
                                <span className='size-1 rounded-full bg-white/20' />
                              )}
                              <span className='break-keep'>{ev.venueName}</span>
                            </div>
                          </div>
                          <div className='hidden shrink-0 gap-1.5 sm:flex'>
                            <span className='rounded-[5px] bg-[#e86e3a]/[0.08] px-2.5 py-1 text-[11px] leading-none font-semibold tracking-wide text-[#e86e3a]'>
                              OFFLINE
                            </span>
                            <StatusTag status={status} />
                          </div>
                        </div>
                        <div className='mt-2 flex gap-1.5 sm:hidden'>
                          <span className='rounded-[5px] bg-[#e86e3a]/[0.08] px-2.5 py-1 text-[11px] leading-none font-semibold tracking-wide text-[#e86e3a]'>
                            OFFLINE
                          </span>
                          <StatusTag status={status} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              if (ev.type === 'deadline') {
                return (
                  <div
                    key={ev.fullDate}
                    className='flex items-center gap-3 rounded-xl border border-dashed border-[#1e1e1e] bg-[#111]/60 px-5 py-4 sm:gap-4 sm:px-5'
                  >
                    <div className='flex w-[52px] shrink-0 flex-col items-start justify-center text-left sm:w-[72px] sm:items-center sm:text-center'>
                      <div className='w-[5ch] text-left text-[14px] leading-none font-semibold tracking-tight tabular-nums text-white/35 sm:text-center sm:text-[17px]'>
                        {fmtDate(ev.fullDate)}
                      </div>
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='text-[15px] leading-[1.3] font-medium break-keep text-white/50'>
                        {ev.name}
                      </div>
                      <div className='mt-0.5 text-[13px] leading-[1.4] break-keep text-white/30'>
                        {ev.detail}
                      </div>
                    </div>
                    <span className='shrink-0 rounded-[5px] border border-[#1e1e1e] bg-white/[0.02] px-2.5 py-1 text-[11px] leading-none font-semibold tracking-wide text-white/35'>
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
                    className='relative overflow-hidden rounded-xl border border-[#e86e3a]/20 bg-[#111] transition-colors hover:border-[#e86e3a]/30'
                  >
                    <div className='absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-[#e86e3a] to-[#f5a623]' />
                    <div className='flex items-center gap-3 p-5 sm:gap-4 sm:p-5 sm:py-5'>
                      <div className='flex w-[52px] shrink-0 flex-col items-start justify-center text-left sm:w-[72px] sm:items-center sm:text-center'>
                        <div className='w-[5ch] bg-gradient-to-br from-[#e86e3a] to-[#f5a623] bg-clip-text text-left text-lg leading-none font-extrabold tracking-tight tabular-nums text-transparent sm:text-center sm:text-2xl'>
                          {fmtDate(ev.fullDate)}
                        </div>
                        <div className='mt-1 w-[5ch] text-left text-[11px] leading-none text-[#e86e3a]/60 sm:text-center'>
                          {fmtDay(ev.fullDate)}
                        </div>
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='min-w-0'>
                            <div className='text-[16px] leading-[1.3] font-bold break-keep text-white/90'>
                              {ev.name}
                            </div>
                            <div className='mt-0.5 text-[13px] leading-[1.4] break-keep text-white/40'>
                              {ev.detail}
                            </div>
                            <div className='mt-1 flex items-center gap-1.5 text-[13px] text-white/40'>
                              <span className='size-1 rounded-full bg-[#e86e3a]/50' />
                              <span className='break-keep'>{ev.venueName}</span>
                            </div>
                          </div>
                          <div className='hidden shrink-0 gap-1.5 sm:flex'>
                            <span className='rounded-[5px] border border-[#e86e3a]/20 bg-[#e86e3a]/[0.12] px-2.5 py-1 text-[11px] leading-none font-semibold tracking-wide text-[#e86e3a]'>
                              FINALS
                            </span>
                            <StatusTag status={status} />
                          </div>
                        </div>
                        <div className='mt-2 flex gap-1.5 sm:hidden'>
                          <span className='rounded-[5px] border border-[#e86e3a]/20 bg-[#e86e3a]/[0.12] px-2.5 py-1 text-[11px] leading-none font-semibold tracking-wide text-[#e86e3a]'>
                            FINALS
                          </span>
                          <StatusTag status={status} />
                        </div>
                      </div>
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
      <div className='border-t border-[#1e1e1e] px-6 py-5'>
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
