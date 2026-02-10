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

const SCHEDULE_ITEMS = [
  {
    date: '03.02',
    fullDate: '2026-03-02',
    endDate: '2026-04-30',
    name: '콘솔 예선',
    tag: 'ONLINE',
    tagCls: 'bg-[#f5a623]/[0.08] text-[#f5a623]',
    dotCls: 'bg-[#e86e3a] shadow-[0_0_10px_rgba(232,110,58,0.4)]',
  },
  {
    date: '03.21',
    fullDate: '2026-03-21',
    name: '오프라인 예선 → 서울',
    tag: 'OFFLINE',
    tagCls: 'bg-[#e86e3a]/[0.08] text-[#e86e3a]',
    dotCls: 'bg-[#f5a623] shadow-[0_0_10px_rgba(245,166,35,0.4)]',
  },
  {
    date: '04.11',
    fullDate: '2026-04-11',
    name: '오프라인 예선 → 부산',
    tag: 'OFFLINE',
    tagCls: 'bg-[#e86e3a]/[0.08] text-[#e86e3a]',
    dotCls: 'bg-[#f5a623] shadow-[0_0_10px_rgba(245,166,35,0.4)]',
  },
  {
    date: '05.23',
    fullDate: '2026-05-23',
    name: '결선 → PlayX4',
    sub: '콘솔 · 아케이드 동시 진행',
    tag: 'FINALS',
    tagCls: 'bg-[#e86e3a]/[0.08] text-[#e86e3a]',
    dotCls: 'bg-[#e86e3a] shadow-[0_0_10px_rgba(232,110,58,0.4)]',
    highlight: true as const,
  },
]

type ScheduleStatus = '예정' | '진행중' | '종료'

function getScheduleStatus(item: (typeof SCHEDULE_ITEMS)[number]): ScheduleStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(item.fullDate + 'T00:00:00')
  const end = 'endDate' in item && item.endDate
    ? new Date(item.endDate + 'T23:59:59')
    : new Date(item.fullDate + 'T23:59:59')

  if (today < start) return '예정'
  if (today <= end) return '진행중'
  return '종료'
}

const STATUS_STYLES: Record<ScheduleStatus, string> = {
  예정: 'bg-white/[0.06] text-white/60',
  진행중: 'bg-emerald-500/15 text-emerald-400',
  종료: 'bg-white/[0.05] text-white/50',
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
      <section className='relative -mt-20 overflow-hidden rounded-3xl border border-white/10 bg-black/20 shadow-[0_10px_40px_rgba(0,0,0,0.45)] md:-mt-24'>
        <div className='relative h-[300px] sm:h-[340px] md:h-[420px] lg:h-[480px]'>
          <img
            src={ASSETS.hero}
            alt='TKC2026 Hero'
            className='h-full w-full origin-left scale-[1.04] object-cover object-left'
            loading='eager'
          />

          {/* Gradient overlay */}
          <div className='absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent' />

          {/* Text + CTA */}
          <div className='absolute inset-x-0 bottom-0 flex flex-col items-end gap-4 px-6 pb-7 text-right sm:px-8 sm:pb-9 md:px-10 md:pb-10'>
            <div>
              <div className='mb-1 font-mono text-[11px] font-semibold tracking-[2.5px] text-white/70 uppercase sm:text-xs'>
                Taiko Korea Championship
              </div>
              <h1 className='bg-gradient-to-r from-[#e86e3a] to-[#f5a623] bg-clip-text text-[clamp(28px,5vw,44px)] leading-tight font-extrabold tracking-tight text-transparent'>
                2026
              </h1>
              <p className='mt-1.5 text-sm text-white/75 sm:text-[15px]'>
                지금 참가 신청을 받고 있습니다
              </p>
            </div>
            <div className='flex flex-col gap-2.5 sm:flex-row sm:items-center'>
              <Link
                to='/apply'
                className='inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 sm:w-auto'
                style={{
                  background: '#e86e3a',
                  boxShadow: '0 4px 24px rgba(232,110,58,0.35)',
                }}
              >
                대회 신청하기
              </Link>
              <Link
                to='/schedule'
                className='inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition-all hover:border-white/35 hover:bg-white/10 hover:text-white sm:w-auto'
              >
                일정 보기 →
              </Link>
            </div>
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
          <SectionHead label='Schedule' title='다가오는 일정'>
            <Link
              to='/schedule'
              className='text-sm text-white/55 transition-colors hover:text-[#e86e3a]'
            >
              전체 일정 보기 →
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

          <div className='flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm font-semibold tracking-wide text-white/65 md:justify-end'>
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
        <div className='mb-1.5 font-mono text-sm font-semibold tracking-[2px] text-[#e86e3a] uppercase'>
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
      <div className='group relative overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] transition-all duration-400 hover:-translate-y-1 hover:border-[#2a2a2a]'>
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
              className='size-11 shrink-0 rounded-xl object-contain'
              loading='lazy'
              draggable={false}
            />
            <h3 className='text-xl font-bold text-white/95 sm:text-2xl'>
              {title}
            </h3>
          </div>

          <p className='mb-5 text-[15px] leading-relaxed break-keep text-white/70'>
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
              className='flex-1 rounded-lg border border-[#2a2a2a] bg-transparent py-2.5 text-center text-sm font-semibold text-white/70 transition-all hover:border-white/30 hover:bg-white/[0.04] hover:text-white/90'
            >
              자세히 보기
            </Link>
            <Link
              to='/apply'
              className='flex-1 rounded-lg py-2.5 text-center text-sm font-semibold text-white transition-all hover:brightness-110'
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

function ScheduleStrip() {
  return (
    <Link
      to='/schedule'
      className='block overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] transition-colors hover:border-[#2a2a2a]'
    >
      {/* Desktop */}
      <div className='hidden sm:grid sm:grid-cols-4'>
        {SCHEDULE_ITEMS.map((item, i) => {
          const status = getScheduleStatus(item)
          return (
            <div
              key={item.date}
              className={`relative px-4 py-7 text-center transition-colors hover:bg-white/[0.02] ${
                'highlight' in item && item.highlight
                  ? 'bg-[#e86e3a]/[0.03]'
                  : ''
              }`}
            >
              <div
                className={`mx-auto mb-3 size-2 rounded-full ${item.dotCls}`}
              />
              <div
                className={`mb-1.5 font-mono text-[28px] font-extrabold tracking-tight ${
                  'highlight' in item && item.highlight
                    ? 'bg-gradient-to-br from-[#e86e3a] to-[#f5a623] bg-clip-text text-transparent'
                    : 'text-white/95'
                }`}
              >
                {item.date}
              </div>
              <div className='mb-1.5 text-sm font-medium text-white/75'>
                {item.name}
              </div>
              {'sub' in item && item.sub && (
                <div className='mb-2 text-[12px] text-white/50'>
                  {item.sub}
                </div>
              )}
              <div className='flex items-center justify-center gap-1.5'>
                <span
                  className={`inline-block rounded px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider ${item.tagCls}`}
                >
                  {item.tag}
                </span>
                <span
                  className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[status]}`}
                >
                  {status}
                </span>
              </div>
              {i < SCHEDULE_ITEMS.length - 1 && (
                <div className='absolute top-[20%] right-0 bottom-[20%] w-px bg-[#1e1e1e]' />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile */}
      <div className='divide-y divide-[#1e1e1e] sm:hidden'>
        {SCHEDULE_ITEMS.map((item) => {
          const status = getScheduleStatus(item)
          return (
            <div
              key={item.date}
              className={`flex items-center gap-4 px-5 py-4 ${
                'highlight' in item && item.highlight
                  ? 'bg-[#e86e3a]/[0.03]'
                  : ''
              }`}
            >
              <div
                className={`size-2 shrink-0 rounded-full ${item.dotCls}`}
              />
              <div className='w-14 shrink-0 font-mono text-lg font-extrabold tracking-tight text-white/95'>
                {item.date}
              </div>
              <div className='min-w-0 flex-1'>
                <div className='text-sm font-medium text-white/75'>
                  {item.name}
                </div>
                {'sub' in item && item.sub && (
                  <div className='text-[11px] text-white/50'>{item.sub}</div>
                )}
              </div>
              <div className='flex shrink-0 flex-col items-end gap-1'>
                <span
                  className={`rounded px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider ${item.tagCls}`}
                >
                  {item.tag}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[status]}`}
                >
                  {status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Link>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  YouTube Embed (thumbnail → click to load)                         */
/* ════════════════════════════════════════════════════════════════════ */

const YT_THUMB = `https://i.ytimg.com/vi/${HOME_YOUTUBE_ID}/hqdefault.jpg`

function YouTubeEmbed() {
  const [playing, setPlaying] = useState(false)

  return (
    <div className='overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] transition-colors hover:border-[#2a2a2a]'>
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
        <div className='mt-0.5 text-sm text-white/55'>
          이제 우리는 그 너머로 향합니다.
        </div>
      </div>
    </div>
  )
}
