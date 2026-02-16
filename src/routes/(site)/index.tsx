import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSite } from '@/lib/api'
import { sanitizeUrl, sanitizeImgSrc } from '@/lib/sanitize-url'
import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/')({
  component: HomePage,
})

const ASSETS = {
  hero: '/branding/v2/home-hero.webp',
  heroBg: '/branding/v2/hero-bg.webp',
  heroMain: '/branding/v2/hero-title.webp',
  heroSide: '/branding/v2/hero-side.webp',
  heroTitle: '/branding/v2/hero-main.webp',
  logo: '/branding/v2/logo.png',
}
const HOME_YOUTUBE_ID = 'DQKIfLMIgXY'
const HOME_YOUTUBE_EMBED = `https://www.youtube-nocookie.com/embed/${HOME_YOUTUBE_ID}?rel=0&modestbranding=1`

const DIVISIONS = [
  {
    num: '01',
    title: '콘솔',
    description: '쿵딱! 원더풀 페스티벌로 진행하는 대회입니다.',
    accent: '#e74c3c',
    periodLabel: '온라인 예선 접수 기간',
    periodStart: '03.02',
    periodEnd: '04.30',
    detailTo: '/console' as const,
    logoSrc: '/branding/taiko-console-logo.webp',
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
    logoSrc: '/branding/taiko-arcade-logo.webp',
  },
]

/* ── Schedule Data ── */

type RangeEvent = {
  type: 'range'
  name: string
  fullDate: string
  detail: string
  badge?: 'ONLINE'
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
  footerLabel: string
  footerDate: string
  footerLogoSrc?: string
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
      {
        type: 'range',
        name: '콘솔 · 아케이드 예선 시작',
        fullDate: '2026-03-02',
        detail: '온라인 접수 개시',
        badge: 'ONLINE',
      },
      { type: 'single', name: '오프라인 예선 → 서울', fullDate: '2026-03-21', venueName: 'TAIKO LABS', venueImage: '/branding/venue-seoul.webp' },
      { type: 'single', name: '오프라인 예선 → 대전', fullDate: '2026-03-28', venueName: '싸이뮤직 게임월드', venueImage: '/branding/venue-daejeon.webp' },
    ],
  },
  {
    label: '4월',
    labelEn: 'APRIL',
    events: [
      { type: 'single', name: '오프라인 예선 → 광주', fullDate: '2026-04-04', venueName: '게임플라자', venueImage: '/branding/venue-gwangju.webp' },
      { type: 'single', name: '오프라인 예선 → 부산', fullDate: '2026-04-11', venueName: '게임D', venueImage: '/branding/venue-busan.webp' },
      { type: 'deadline', name: '콘솔 예선 마감', detail: '온라인 예선 제출 종료', fullDate: '2026-04-30' },
    ],
  },
  {
    label: '5월',
    labelEn: 'MAY',
    isFinals: true,
    events: [
      {
        type: 'finals',
        name: '결선 → PlayX4',
        detail: '콘솔 + 아케이드 동시 진행',
        fullDate: '2026-05-23',
        venueName: '킨텍스',
        footerLabel: '플레이 엑스포 현장 결선',
        footerDate: '26. 5. 23 (토)',
        footerLogoSrc: '/branding/playx4-bi-white.png',
      },
    ],
  },
]

function fmtDate(d: string) {
  const date = new Date(d + 'T00:00:00')
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
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
  const [heroAnimOn, setHeroAnimOn] = useState(false)

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setHeroAnimOn(true))
    return () => window.cancelAnimationFrame(raf)
  }, [])

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
      <section
        className={cn(
          '-mx-4 -mt-20 overflow-hidden md:mx-0 md:-mt-24',
          heroAnimOn && 'hero-anim'
        )}
      >
        <div className='relative h-[340px] sm:h-[380px] md:h-[520px] lg:h-[560px]'>
          {/* Layer 1: Background */}
          <div className='hero-layer hero-layer-bg absolute inset-0 z-[1] flex items-center justify-center'>
            <img
              src={ASSETS.heroBg}
              alt=''
              className='h-full w-full object-cover object-[center_top] md:object-center'
              loading='eager'
              draggable={false}
            />
          </div>

          {/* Layer 2: Side characters */}
          <div className='hero-layer hero-layer-side absolute inset-0 z-[2] flex items-center justify-center'>
            <img
              src={ASSETS.heroSide}
              alt=''
              className='h-full w-full object-cover object-[center_top] md:object-center'
              loading='eager'
              draggable={false}
            />
          </div>

          {/* Layer 3: Main character */}
          <div className='hero-layer hero-layer-main absolute inset-0 z-[3] flex items-center justify-center'>
            <img
              src={ASSETS.heroMain}
              alt=''
              className='h-full w-full object-cover object-[center_top] md:object-center'
              loading='eager'
              draggable={false}
            />
          </div>

          {/* Layer 4: Title logo */}
          <div className='hero-layer hero-layer-title absolute inset-0 z-[4] flex items-center justify-center'>
            <img
              src={ASSETS.heroTitle}
              alt=''
              className='h-full w-full object-cover object-[center_top] md:object-center'
              loading='eager'
              draggable={false}
            />
          </div>

          {/* Flash effect (synced with title) */}
          <div className='hero-flash pointer-events-none absolute inset-0 z-10' />

          {/* Top darkening for header readability */}
          <div className='hero-grad-top absolute inset-x-0 top-0 z-[5] h-32 bg-gradient-to-b from-black/60 to-transparent' />
          {/* Bottom gradient overlay */}
          <div className='hero-grad-bottom absolute inset-x-0 bottom-0 z-[5] h-3/4 bg-gradient-to-t from-black via-black/70 to-transparent' />

          {/* Mobile: overlay text on hero */}
          <div className='hero-cta absolute inset-x-0 bottom-0 z-[6] px-6 pb-6 md:hidden'>
            <div className='mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-[7px] font-mono text-[11px] font-semibold tracking-[1.5px] text-[#e74c3c] backdrop-blur-md'>
              <span className='tkc-motion-dot size-1.5 rounded-full bg-[#e74c3c] shadow-[0_0_8px_#e74c3c]' />
              TAIKO KOREA CHAMPIONSHIP
            </div>
            <h1 className='text-[28px] leading-[1.15] font-extrabold tracking-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]'>
              <span className='bg-gradient-to-br from-[#e74c3c] to-[#f5a623] bg-clip-text text-transparent'>
                태고의 달인
              </span>
              <br />
              <span className='text-white'>코리아 챔피언십 2026</span>
            </h1>
            <p className='mt-2 text-[13px] leading-[1.55] font-light text-white/60 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]'>
              PlayX4 2026에서 만나는 태고의 달인 공식 대회
            </p>
          </div>

          {/* Desktop: overlay buttons */}
          <div className='hero-cta absolute inset-x-0 bottom-0 z-[6] hidden px-8 pb-10 md:block'>
            <div className='mx-auto max-w-[1200px]'>
              <div className='mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#e74c3c]/20 bg-[#e74c3c]/[0.08] px-4 py-[7px] font-mono text-[11px] font-semibold tracking-[1.5px] text-[#e74c3c]'>
                <span className='tkc-motion-dot size-1.5 rounded-full bg-[#e74c3c] shadow-[0_0_8px_#e74c3c]' />
                TAIKO KOREA CHAMPIONSHIP
              </div>
              <div className='flex flex-row items-center gap-3'>
                <Link
                  to='/apply'
                  className='group/cta tkc-motion-lift relative inline-flex items-center justify-center rounded-lg px-7 py-3 text-[15px] font-semibold text-white'
                  style={{
                    background: '#e74c3c',
                    boxShadow: '0 4px 24px rgba(231,76,60,0.25)',
                  }}
                >
                  <span className='transition-opacity duration-300 md:group-hover/cta:opacity-0 group-active/cta:opacity-0'>
                    대회 신청하기
                  </span>
                  <img
                    src='/characters/don-wink.png'
                    alt=''
                    className='pointer-events-none absolute inset-0 m-auto h-9 w-9 scale-75 object-contain opacity-0 transition-all duration-300 md:group-hover/cta:scale-100 md:group-hover/cta:opacity-100 group-active/cta:scale-100 group-active/cta:opacity-100'
                    draggable={false}
                  />
                </Link>
                <Link
                  to='/schedule'
                  className='group/cta2 tkc-motion-lift relative inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-6 py-3 text-[15px] font-semibold text-white/80 backdrop-blur-sm hover:border-white/30 hover:bg-white/[0.1] hover:text-white'
                >
                  <span className='transition-opacity duration-300 md:group-hover/cta2:opacity-0 group-active/cta2:opacity-0'>
                    일정 보기 →
                  </span>
                  <img
                    src='/characters/katsu-wink.png'
                    alt=''
                    className='pointer-events-none absolute inset-0 m-auto h-9 w-9 scale-75 object-contain opacity-0 transition-all duration-300 md:group-hover/cta2:scale-100 md:group-hover/cta2:opacity-100 group-active/cta2:scale-100 group-active/cta2:opacity-100'
                    draggable={false}
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: buttons below image */}
        <div className='flex flex-col gap-2.5 px-6 pt-4 pb-6 md:hidden'>
          <Link
            to='/apply'
            className='group/cta tkc-motion-lift relative inline-flex w-full items-center justify-center rounded-lg px-7 py-3 text-[15px] font-semibold text-white'
            style={{
              background: '#e74c3c',
              boxShadow: '0 4px 24px rgba(231,76,60,0.25)',
            }}
          >
            <span className='transition-opacity duration-300 group-active/cta:opacity-0'>
              대회 신청하기
            </span>
            <img
              src='/characters/don-wink.png'
              alt=''
              className='pointer-events-none absolute inset-0 m-auto h-8 w-8 scale-75 object-contain opacity-0 transition-all duration-300 group-active/cta:scale-100 group-active/cta:opacity-100'
              draggable={false}
            />
          </Link>
          <Link
            to='/schedule'
            className='group/cta2 tkc-motion-lift relative inline-flex w-full items-center justify-center rounded-lg border border-[#1e1e1e] px-6 py-3 text-[15px] font-semibold text-white/65 hover:border-white/30 hover:bg-white/[0.03] hover:text-white'
          >
            <span className='transition-opacity duration-300 group-active/cta2:opacity-0'>
              일정 보기 →
            </span>
            <img
              src='/characters/katsu-wink.png'
              alt=''
              className='pointer-events-none absolute inset-0 m-auto h-8 w-8 scale-75 object-contain opacity-0 transition-all duration-300 group-active/cta2:scale-100 group-active/cta2:opacity-100'
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
                className='text-sm text-white/55 transition-colors hover:text-[#e74c3c]'
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

      {/* ── REWARDS ── */}
      <section className='mt-8 sm:mt-8 md:mt-10'>
        <FadeIn>
          <SectionHead label='Rewards' title='보상'>
            <Link
              to='/rewards'
              className='text-sm text-white/55 transition-colors hover:text-[#f5a623]'
            >
              자세히 보기 →
            </Link>
          </SectionHead>
        </FadeIn>

        <div className='grid gap-3 md:grid-cols-2'>
          {/* ── 한정 명찰 ── */}
          <FadeIn delay={100}>
            <div className='group relative overflow-hidden rounded-xl border border-[#f5a623]/15 bg-[#111] transition-all hover:border-[#f5a623]/30'>
              <div className='absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-[#f5a623] via-[#f5a623]/40 to-transparent' />
              <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-[#f5a623]/[0.03] to-transparent' />

              <div className='relative p-6'>
                <div className='mb-4 flex items-start gap-3.5'>
                  <div className='flex size-12 shrink-0 items-center justify-center rounded-[12px] border border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/15 to-[#f5a623]/[0.05] text-xl shadow-[0_0_16px_rgba(245,166,35,0.08)]'>
                    🏷
                  </div>
                  <div>
                    <div className='mb-1 flex flex-wrap items-center gap-1.5'>
                      <span className='font-mono text-[10px] font-bold tracking-[1.5px] text-[#f5a623]'>
                        LIMITED NAMEPLATE
                      </span>
                      <span className='rounded bg-[#f5a623] px-1.5 py-0.5 text-[9px] font-bold leading-none text-[#0a0a0a]'>
                        한정
                      </span>
                    </div>
                    <h3 className='text-[17px] font-extrabold tracking-tight'>
                      TKC 2026 한정 명찰
                    </h3>
                  </div>
                </div>

                <p className='mb-4 text-[13px] leading-relaxed text-white/50'>
                  대회 참가 + 결선 직관을 모두 완료한 참가자 한정
                </p>

                <div className='mb-5 overflow-hidden rounded-lg border border-dashed border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/[0.02] to-transparent'>
                  <div className='flex flex-col items-center justify-center gap-2 py-8 text-center'>
                    <span className='text-2xl opacity-40'>🏷</span>
                    <span className='text-[12px] font-semibold text-white/30'>
                      명찰 디자인 미리보기
                    </span>
                    <span className='rounded-md bg-[#f5a623]/[0.06] px-2.5 py-1 font-mono text-[9px] font-bold tracking-[1.5px] text-[#f5a623]/40'>
                      COMING SOON
                    </span>
                  </div>
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                  {[
                    { num: '1', label: '엔트리 등록' },
                    { num: '2', label: '참가 확인' },
                    { num: '3', label: '현장 수령' },
                  ].map((step, i) => (
                    <div key={step.num} className='flex items-center'>
                      {i > 0 && (
                        <span className='text-[11px] text-[#f5a623]/30'>
                          →
                        </span>
                      )}
                      <div className='flex items-center gap-1.5'>
                        <span className='flex size-[18px] items-center justify-center rounded-[5px] bg-[#f5a623]/10 text-[10px] font-extrabold text-[#f5a623]'>
                          {step.num}
                        </span>
                        <span className='text-[12px] font-medium text-white/55'>
                          {step.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* ── 인게임 칭호 ── */}
          <FadeIn delay={200}>
            <div className='group relative overflow-hidden rounded-xl border border-[#e74c3c]/15 bg-[#111] transition-all hover:border-[#e74c3c]/30'>
              <div className='absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-[#e74c3c] via-[#e74c3c]/40 to-transparent' />
              <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-[#e74c3c]/[0.03] to-transparent' />

              <div className='relative p-6'>
                <div className='mb-4 flex items-start gap-3.5'>
                  <div className='flex size-12 shrink-0 items-center justify-center rounded-[12px] border border-[#e74c3c]/20 bg-gradient-to-br from-[#e74c3c]/15 to-[#e74c3c]/[0.05] text-xl shadow-[0_0_16px_rgba(231,76,60,0.08)]'>
                    🏅
                  </div>
                  <div>
                    <div className='mb-1 flex flex-wrap items-center gap-1.5'>
                      <span className='font-mono text-[10px] font-bold tracking-[1.5px] text-[#e74c3c]'>
                        IN-GAME TITLE
                      </span>
                      <span className='rounded bg-[#e74c3c] px-1.5 py-0.5 text-[9px] font-bold leading-none text-white'>
                        한정
                      </span>
                      <span className='rounded border border-[#e74c3c]/20 bg-[#e74c3c]/10 px-1.5 py-0.5 text-[9px] font-bold leading-none text-[#e74c3c]'>
                        🇰🇷 KR ONLY
                      </span>
                    </div>
                    <h3 className='text-[17px] font-extrabold tracking-tight'>
                      아케이드 인게임 칭호
                    </h3>
                  </div>
                </div>

                <p className='mb-4 text-[13px] leading-relaxed text-white/50'>
                  대한민국 TKC 2026에서만 획득 가능 · 결선 TOP 8 전원 지급
                </p>

                <div className='mb-5 overflow-hidden rounded-lg border border-dashed border-[#e74c3c]/20 bg-gradient-to-br from-[#e74c3c]/[0.02] to-transparent'>
                  <div className='flex flex-col items-center justify-center gap-2 py-8 text-center'>
                    <span className='text-2xl opacity-40'>🏅</span>
                    <span className='text-[12px] font-semibold text-white/30'>
                      칭호 디자인 미리보기
                    </span>
                    <span className='rounded-md bg-[#e74c3c]/[0.06] px-2.5 py-1 font-mono text-[9px] font-bold tracking-[1.5px] text-[#e74c3c]/40'>
                      COMING SOON
                    </span>
                  </div>
                </div>

                <div className='flex flex-wrap gap-1.5'>
                  <span className='inline-flex items-center gap-1 rounded-md border border-[#f5a623]/15 bg-[#f5a623]/10 px-2 py-1 text-[11px] font-semibold text-[#f5a623]'>
                    🏆 우승
                  </span>
                  <span className='inline-flex rounded-md border border-[#a8b4c0]/12 bg-[#a8b4c0]/10 px-2 py-1 text-[11px] font-semibold text-[#a8b4c0]'>
                    준우승
                  </span>
                  <span className='inline-flex rounded-md border border-[#cd7f32]/12 bg-[#cd7f32]/10 px-2 py-1 text-[11px] font-semibold text-[#cd7f32]'>
                    3위
                  </span>
                  <span className='inline-flex rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/50'>
                    4위
                  </span>
                  <span className='inline-flex rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/50'>
                    5~8위
                  </span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={300}>
          <div className='relative mt-3 overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] px-6 py-4'>
            <div className='absolute bottom-0 left-0 top-0 w-[3px] bg-gradient-to-b from-[#e74c3c] to-[#f5a623]' />
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <p className='text-[13px] text-white/50'>
                <span className='font-semibold text-white/70'>결선 수상자</span>{' '}
                상장 및 트로피 지급 · 콘솔 부문은 개발진 사인 공식 상패 지급
              </p>
              <Link
                to='/rewards'
                className='shrink-0 rounded-lg border border-[#1e1e1e] px-4 py-2 text-[12px] font-semibold text-white/50 transition-all hover:border-white/20 hover:text-white'
              >
                전체 보상 보기 →
              </Link>
            </div>
          </div>
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
                    className='inline-block h-6 w-auto opacity-90'
                    loading='lazy'
                  />
                ) : (
                  <span className='leading-none'>{p.name}</span>
                )

                return hasHref ? (
                  <a
                    key={key}
                    href={safeHref}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex h-6 items-center hover:text-white'
                  >
                    {node}
                  </a>
                ) : (
                  <span key={key} className='inline-flex h-6 items-center'>
                    {node}
                  </span>
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
        <div className='mb-1.5 font-mono text-xs font-semibold tracking-[1px] text-[#e74c3c] uppercase sm:text-sm'>
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
          <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2'>
            <Link
              to={detailTo}
              className='group/detail tkc-motion-surface relative inline-flex items-center justify-center rounded-lg border border-[#1e1e1e] px-6 py-2.5 text-sm font-semibold text-white/60 hover:border-white/30 hover:text-white'
            >
              <span className='transition-opacity duration-300 md:group-hover/detail:opacity-0 group-active/detail:opacity-0'>
                자세히 보기
              </span>
              <img
                src='/characters/katsu-wink.png'
                alt=''
                className='pointer-events-none absolute inset-0 m-auto h-8 w-8 scale-75 object-contain opacity-0 transition-all duration-300 md:group-hover/detail:scale-100 md:group-hover/detail:opacity-100 group-active/detail:scale-100 group-active/detail:opacity-100'
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
              <span className='transition-opacity duration-300 md:group-hover/cta:opacity-0 group-active/cta:opacity-0'>
                대회 신청하기
              </span>
              <img
                src='/characters/don-wink.png'
                alt=''
                className='pointer-events-none absolute inset-0 m-auto h-8 w-8 scale-75 object-contain opacity-0 transition-all duration-300 md:group-hover/cta:scale-100 md:group-hover/cta:opacity-100 group-active/cta:scale-100 group-active/cta:opacity-100'
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

function VenueThumb({ src }: { src?: string }) {
  const [failed, setFailed] = useState(!src)

  if (!src || failed) {
    return (
      <span className='flex size-7 shrink-0 items-center justify-center rounded-md border border-[#e74c3c]/20 bg-[#e74c3c]/12 text-[10px] leading-none text-[#e74c3c]/80'>
        •
      </span>
    )
  }

  return (
    <img
      src={src}
      alt=''
      className='size-7 shrink-0 rounded-md border border-white/10 object-cover'
      loading='lazy'
      draggable={false}
      onError={() => setFailed(true)}
    />
  )
}

function ScheduleStrip() {
  return (
    <div>
      <div className='grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3'>
        {SCHEDULE_MONTHS.map((group, idx) => {
          const monthNum = group.label.replace('월', '')
          const finalsEvent = group.events.find(
            (event): event is FinalsEvent => event.type === 'finals'
          )
          const tag = group.isFinals
            ? {
                label: 'FINALS',
                cls: 'border-[#e74c3c]/20 bg-[#e74c3c]/10 text-[#e74c3c]',
              }
            : idx === 0
              ? {
                  label: '예선 시작',
                  cls: 'border-[#4a9eff]/15 bg-[#4a9eff]/8 text-[#4a9eff]',
                }
              : {
                  label: '예선 마감',
                  cls: 'border-[#4a9eff]/15 bg-[#4a9eff]/8 text-[#4a9eff]',
                }

          return (
            <div
              key={group.label}
              className={`overflow-hidden border bg-[#111] transition-all duration-300 ${
                group.isFinals
                  ? 'border-[#e74c3c]/20 md:hover:border-[#e74c3c]/35'
                  : 'border-[#1e1e1e] md:hover:border-[#2a2a2a]'
              } rounded-[14px] md:hover:-translate-y-0.5`}
            >
              <div
                className={`h-[3px] ${
                  group.isFinals
                    ? 'bg-gradient-to-r from-[#e74c3c] to-[#f5a623]'
                    : 'bg-gradient-to-r from-[#1e1e1e] to-transparent'
                }`}
              />

              <div className='p-5'>
                <div className='mb-4 flex items-center justify-between gap-2'>
                  <div className='flex items-baseline gap-1.5'>
                    <span
                      className={`text-[28px] leading-none font-black tracking-[-1px] ${
                        group.isFinals
                          ? 'bg-gradient-to-br from-[#e74c3c] to-[#f5a623] bg-clip-text text-transparent opacity-60'
                          : 'text-white/[0.12]'
                      }`}
                    >
                      {monthNum}
                    </span>
                    <span
                      className={`text-[15px] font-bold ${
                        group.isFinals ? 'text-white/80' : 'text-white/60'
                      }`}
                    >
                      {group.labelEn}
                    </span>
                  </div>
                  <span
                    className={`rounded-[4px] border px-2 py-[3px] font-mono text-[9px] font-bold tracking-[1.5px] ${tag.cls}`}
                  >
                    {tag.label}
                  </span>
                </div>

                <div className='space-y-2'>
                  {group.events.map((ev) => {
                    if (ev.type === 'range') {
                      return (
                        <div
                          key={`${ev.name}-${ev.fullDate}`}
                          className='flex items-center gap-2.5 rounded-lg border border-white/[0.03] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04]'
                        >
                          <span className='w-[44px] shrink-0 text-[14px] font-extrabold tracking-tight tabular-nums text-white/75'>
                            {fmtDate(ev.fullDate)}
                          </span>
                          <span className='size-1.5 shrink-0 rounded-full bg-[#4a9eff] shadow-[0_0_6px_rgba(74,158,255,0.3)]' />
                          <div className='min-w-0 flex-1'>
                            <div className='truncate text-[13px] font-semibold text-white/80'>
                              {ev.name}
                            </div>
                            <div className='truncate text-[11px] text-white/35'>
                              {ev.detail}
                            </div>
                          </div>
                          {ev.badge && (
                            <span className='shrink-0 rounded-[4px] bg-[#4a9eff]/8 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#4a9eff]'>
                              {ev.badge}
                            </span>
                          )}
                        </div>
                      )
                    }

                    if (ev.type === 'single') {
                      return (
                        <div
                          key={`${ev.name}-${ev.fullDate}`}
                          className='flex items-center gap-2.5 rounded-lg border border-white/[0.03] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04]'
                        >
                          <span className='w-[44px] shrink-0 text-[14px] font-extrabold tracking-tight tabular-nums text-white/75'>
                            {fmtDate(ev.fullDate)}
                          </span>
                          <VenueThumb src={ev.venueImage} />
                          <div className='min-w-0 flex-1'>
                            <div className='truncate text-[13px] font-semibold text-white/80'>
                              {ev.name}
                            </div>
                            <div className='truncate text-[11px] text-white/35'>
                              {ev.venueName}
                            </div>
                          </div>
                        </div>
                      )
                    }

                    if (ev.type === 'deadline') {
                      return (
                        <div
                          key={`${ev.name}-${ev.fullDate}`}
                          className='flex items-center gap-2.5 rounded-lg border border-white/[0.03] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04]'
                        >
                          <span className='w-[44px] shrink-0 text-[14px] font-extrabold tracking-tight tabular-nums text-white/55'>
                            {fmtDate(ev.fullDate)}
                          </span>
                          <span className='size-1.5 shrink-0 rounded-full bg-white/25' />
                          <div className='min-w-0 flex-1'>
                            <div className='truncate text-[13px] font-semibold text-white/55'>
                              {ev.name}
                            </div>
                            <div className='truncate text-[11px] text-white/30'>
                              {ev.detail}
                            </div>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={`${ev.name}-${ev.fullDate}`}
                        className='rounded-lg border border-[#e74c3c]/12 bg-gradient-to-br from-[#e74c3c]/[0.04] to-[#f5a623]/[0.02] px-3 py-3.5'
                      >
                        <div className='flex items-center gap-2.5'>
                          <span className='w-[44px] shrink-0 bg-gradient-to-br from-[#e74c3c] to-[#f5a623] bg-clip-text text-[14px] font-extrabold tracking-tight tabular-nums text-transparent'>
                            {fmtDate(ev.fullDate)}
                          </span>
                          <span className='size-1.5 shrink-0 rounded-full bg-[#f5a623] shadow-[0_0_6px_rgba(245,166,35,0.35)]' />
                          <div className='min-w-0 flex-1'>
                            <div className='truncate text-[14px] font-bold text-white/90'>
                              {ev.name}
                            </div>
                            <div className='truncate text-[11px] text-white/40'>
                              {ev.venueName} · {ev.detail}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {group.isFinals && finalsEvent && (
                  <div className='mt-3.5 flex items-center gap-3 border-t border-[#e74c3c]/10 pt-3.5'>
                    {finalsEvent.footerLogoSrc && (
                      <img
                        src={finalsEvent.footerLogoSrc}
                        alt='PlayX4'
                        className='h-4 w-auto shrink-0 object-contain opacity-50'
                        loading='lazy'
                        draggable={false}
                      />
                    )}
                    <div className='flex flex-col gap-0.5'>
                      <span className='text-[10px] text-white/35'>
                        {finalsEvent.footerLabel}
                      </span>
                      <span className='bg-gradient-to-br from-[#e74c3c] to-[#f5a623] bg-clip-text text-[13px] font-extrabold tracking-[-0.3px] text-transparent'>
                        {finalsEvent.footerDate}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className='mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#1e1e1e] pt-3.5'>
        <span className='inline-flex items-center gap-1.5 text-[11px] text-white/35'>
          <span className='size-1.5 rounded-full bg-[#4a9eff]' />
          온라인
        </span>
        <span className='inline-flex items-center gap-1.5 text-[11px] text-white/35'>
          <span className='size-1.5 rounded-full bg-[#e74c3c]' />
          오프라인
        </span>
        <span className='inline-flex items-center gap-1.5 text-[11px] text-white/35'>
          <span className='size-1.5 rounded-full bg-[#f5a623]' />
          결선
        </span>
      </div>
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
