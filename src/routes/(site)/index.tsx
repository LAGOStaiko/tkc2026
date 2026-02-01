import { createFileRoute, Link } from '@tanstack/react-router'
import { useSite } from '@/lib/api'

export const Route = createFileRoute('/(site)/')({
  component: HomePage,
})

const ASSETS = {
  hero: '/branding/v2/home-hero.jpg',
  logo: '/branding/v2/logo.png',
  consoleIcon: '/branding/v2/icon-console.png',
  arcadeIcon: '/branding/v2/icon-arcade.png',
}
const HOME_YOUTUBE_ID = '6UkPLBMEruQ'
const HOME_YOUTUBE_EMBED = `https://www.youtube-nocookie.com/embed/${HOME_YOUTUBE_ID}?rel=0&modestbranding=1`

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
    <div className='space-y-7 md:space-y-9'>
      {/* HERO */}
      <section className='relative -mt-20 overflow-hidden rounded-3xl border border-white/10 bg-black/20 shadow-[0_10px_40px_rgba(0,0,0,0.45)] md:-mt-24'>
        <div className='relative h-[250px] sm:h-[300px] md:h-[400px] lg:h-[440px]'>
          <img
            src={ASSETS.hero}
            alt='TKC2026 Hero'
            className='h-full w-full object-cover object-left'
            loading='eager'
          />
        </div>
      </section>

      {/* CONSOLE / ARCADE CARDS */}
      <section className='grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-7'>
        <ModeCard
          iconSrc={ASSETS.consoleIcon}
          title='콘솔'
          description='동더! 원더풀 페스티벌로 진행하는 대회입니다.'
          detailTo='/console'
        />
        <ModeCard
          iconSrc={ASSETS.arcadeIcon}
          title='아케이드'
          description='태고의 달인 니지이로 ver.로 진행하는 대회입니다.'
          detailTo='/arcade'
        />
      </section>

      {/* PLAYX4 FINAL INFO */}
      <section className='rounded-2xl border border-white/10 bg-white/5 px-5 py-7 text-center shadow-[0_10px_40px_rgba(0,0,0,0.35)] md:px-9 md:py-9'>
        <div className='text-xl font-semibold text-white/90 md:text-2xl'>
          플레이 엑스포 결선 안내
        </div>
        <div className='mt-2 text-base text-white/60'>추후 공개됩니다.</div>
      </section>

      {/* VIDEO */}
      <section className='rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] md:p-6'>
        <div className='mx-auto w-full max-w-[1100px]'>
          <div className='aspect-video overflow-hidden rounded-xl border border-white/10 bg-black'>
            <iframe
              className='h-full w-full'
              src={HOME_YOUTUBE_EMBED}
              title='TKC2026 Opening Movie'
              loading='lazy'
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
              referrerPolicy='strict-origin-when-cross-origin'
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* FOOT STRIP (Partners) */}
      <section className='pt-3 pb-7'>
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

          <div className='text-sm text-white/50'>
            © {new Date().getFullYear()} 태고의 달인 플레이 엑스포 토너먼트
          </div>
        </div>
      </section>
    </div>
  )
}

function ModeCard({
  iconSrc,
  title,
  description,
  detailTo,
}: {
  iconSrc: string
  title: string
  description: string
  detailTo: '/console' | '/arcade'
}) {
  return (
    <div className='flex flex-col rounded-2xl bg-white/5 p-7 shadow-[0_10px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/10'>
      <div className='flex items-start gap-5'>
        {/* icon block (시안의 빨간 네모) */}
        <div className='grid h-14 w-14 place-items-center rounded-xl bg-[#ff2d00]'>
          <img
            src={iconSrc}
            alt=''
            className='h-8 w-8 object-contain'
            loading='lazy'
            draggable={false}
          />
        </div>

        <div className='min-w-0'>
          <h3 className='text-xl font-bold text-white'>{title}</h3>
          <p className='mt-2 text-base break-keep text-white/70'>
            {description}
          </p>
        </div>
      </div>

      {/* buttons: 모바일 full-width 스택, sm 이상 row */}
      <div className='mt-auto grid grid-cols-1 gap-3 pt-6 sm:grid-cols-2'>
        <Link
          className='grid h-11 place-items-center rounded-full border border-white/15 bg-white/5 text-base text-white hover:bg-white/10'
          to={detailTo}
        >
          자세히 보기
        </Link>
        <Link
          className='grid h-11 place-items-center rounded-full border border-white/15 bg-white/5 text-base text-white hover:bg-white/10'
          to='/apply'
        >
          대회 신청하기
        </Link>
      </div>
    </div>
  )
}
