import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Gamepad2, Joystick, Play } from 'lucide-react'
import { GlassCard } from '@/components/tkc/glass-card'
import { TkcSection } from '@/components/tkc/layout'
import { Button } from '@/components/ui/button'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useSite } from '@/lib/api'
import { t } from '@/text'

type SiteData = {
  eventName?: string
}

type PartnerLogoProps = {
  src: string
  fallback: string
}

function PartnerLogo({ src, fallback }: PartnerLogoProps) {
  const [isHidden, setIsHidden] = React.useState(false)

  if (isHidden) {
    return (
      <span className='text-xs font-semibold tracking-[0.2em] text-white/60'>
        {fallback}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={fallback}
      className='h-8 w-auto object-contain'
      loading='lazy'
      decoding='async'
      onError={() => setIsHidden(true)}
    />
  )
}

export const Route = createFileRoute('/(site)/')({
  component: HomePage,
})

function HomePage() {
  const { data, isError } = useSite<SiteData>()
  const eventName = data?.eventName ?? t('meta.siteName')
  const heroTagline = t('home.heroTagline')
  const [headerLogoFailed, setHeaderLogoFailed] = React.useState(false)
  const statusMessage = isError ? t('site.loadFailed') : null
  const desktopNavItems = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.console'), to: '/console' },
    { label: t('nav.arcade'), to: '/arcade' },
    { label: t('nav.schedule'), to: '/schedule' },
    { label: t('nav.results'), to: '/results' },
    { label: t('nav.contact'), to: '/contact' },
  ]
  const partnerLogos = [
    { src: '/partners/andamiro.png', fallback: 'ANDAMIRO' },
    { src: '/partners/bandainamco.png', fallback: 'BANDAI NAMCO' },
    { src: '/partners/taikolabs.png', fallback: 'TAIKOLABS' },
  ]

  React.useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('nav.home')}`
  }, [])

  return (
    <TkcSection>
      {statusMessage && (
        <p className='text-sm text-white/60'>{statusMessage}</p>
      )}
      <div className='md:hidden'>
        <section className='relative overflow-hidden rounded-3xl border border-white/10 bg-black text-white'>
          <picture className='absolute inset-0'>
            <source
              media='(max-width: 768px)'
              srcSet='/branding/hero-taikolabs-768.webp'
            />
            <source
              media='(max-width: 1280px)'
              srcSet='/branding/hero-taikolabs-1280.webp'
            />
            <img
              src='/branding/hero-taikolabs-2048.webp'
              alt=''
              className='h-full w-full object-cover object-[50%_30%]'
              loading='eager'
              decoding='async'
              fetchPriority='high'
            />
          </picture>
          <div className='absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45' />
          <div className='absolute inset-0 bg-black/10' />
          <div className='pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/75 via-black/35 to-transparent md:h-[40%]' />
          <div className='relative z-10 flex min-h-[70vh] flex-col items-center justify-between px-4 pb-12 pt-24 text-center md:min-h-[72vh] md:pb-16'>
            <div className='mx-auto w-full max-w-[1100px] text-center'>
              <h1 className='sr-only'>{eventName}</h1>
              <div className='flex w-full justify-center'>
                <img
                  src='/branding/logo-tkc2026-playx4.webp'
                  alt='TKC2026'
                  className='block h-auto w-full max-w-[240px] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)] md:max-w-[520px]'
                  loading='eager'
                  decoding='async'
                />
              </div>
            </div>
            <div className='mx-auto flex w-full max-w-[640px] flex-col items-center gap-4 text-center'>
              <p className='tkc-serif break-keep text-xl text-white/95 drop-shadow-sm md:text-3xl'>
                {heroTagline}
              </p>
              <Button
                asChild
                size='lg'
                className='h-12 w-full bg-white px-6 text-black shadow-lg shadow-black/30 hover:bg-white/90 md:w-auto'
              >
                <Link to='/apply'>{t('home.ctaApply')}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className='grid gap-6 lg:grid-cols-2'>
          <GlassCard className='overflow-hidden'>
            <div className='relative aspect-video'>
              <img
                src='/branding/home-console-wonderful.webp'
                srcSet='/branding/home-console-wonderful-512.webp 512w, /branding/home-console-wonderful.webp 768w'
                sizes='(min-width: 1024px) 50vw, 100vw'
                alt='\uD0DC\uACE0\uC758 \uB2EC\uC778 \uCFE9\uB531! \uC6D0\uB354\uD480 \uD398\uC2A4\uD2F0\uBC8C'
                className='h-full w-full object-cover'
                loading='lazy'
                decoding='async'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent' />
            </div>
            <CardHeader className='p-5 md:p-7'>
              <CardTitle>{t('home.consoleCardTitle')}</CardTitle>
              <CardDescription className='text-white/60'>
                {t('home.consoleCardSubtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className='p-5 pt-0 md:p-7 md:pt-0'>
              <p className='text-sm text-white/85 md:text-base'>
                {t('home.consoleCardBody')}
              </p>
            </CardContent>
            <CardFooter className='p-5 pt-0 md:p-7 md:pt-0'>
              <Button variant='outline' asChild>
                <Link to='/console'>{t('home.details')}</Link>
              </Button>
            </CardFooter>
          </GlassCard>

          <GlassCard className='overflow-hidden'>
            <div className='relative aspect-video'>
              <img
                src='/branding/home-arcade-nijiiro.webp'
                srcSet='/branding/home-arcade-nijiiro-512.webp 512w, /branding/home-arcade-nijiiro-768.webp 768w, /branding/home-arcade-nijiiro.webp 1024w'
                sizes='(min-width: 1024px) 50vw, 100vw'
                alt='\uD0DC\uACE0\uC758 \uB2EC\uC778 \uC544\uCF00\uC774\uB4DC \uB2C8\uC9C0\uC774\uB85C'
                className='h-full w-full object-cover'
                loading='lazy'
                decoding='async'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent' />
            </div>
            <CardHeader className='p-5 md:p-7'>
              <CardTitle>{t('home.arcadeCardTitle')}</CardTitle>
              <CardDescription className='text-white/60'>
                {t('home.arcadeCardSubtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className='p-5 pt-0 md:p-7 md:pt-0'>
              <p className='text-sm text-white/85 md:text-base'>
                {t('home.arcadeCardBody')}
              </p>
            </CardContent>
            <CardFooter className='p-5 pt-0 md:p-7 md:pt-0'>
              <Button variant='outline' asChild>
                <Link to='/arcade'>{t('home.details')}</Link>
              </Button>
            </CardFooter>
          </GlassCard>
        </section>
      </div>

      <div className='hidden md:block'>
        <div className='mx-auto max-w-[1100px] space-y-10 px-6 py-10 text-white xl:max-w-[1200px]'>
          <section className='relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(110deg,#ff2a1a_0%,#ff2a1a_45%,#111_80%)]'>
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]' />
            <div className='absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/50' />
            <div className='relative z-10 flex min-h-[360px] flex-col justify-between gap-16 px-10 py-8'>
              <div className='flex items-center justify-between gap-6'>
                <div className='flex items-center gap-3'>
                  {!headerLogoFailed ? (
                    <img
                      src='/branding/tkc-header-logo.png'
                      alt='TKC2026'
                      className='h-10 w-auto object-contain'
                      onError={() => setHeaderLogoFailed(true)}
                    />
                  ) : (
                    <span className='text-sm font-semibold tracking-[0.2em] text-white'>
                      TKC2026
                    </span>
                  )}
                </div>
                <nav className='flex flex-1 items-center justify-center gap-6 text-sm text-white/80'>
                  {desktopNavItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className='whitespace-nowrap transition hover:text-white'
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <Button
                  asChild
                  size='lg'
                  className='h-10 rounded-full bg-white/95 px-6 text-black hover:bg-white'
                >
                  <Link to='/apply'>{t('nav.apply')}</Link>
                </Button>
              </div>
              <div className='max-w-[520px] text-left'>
                <h1 className='sr-only'>{eventName}</h1>
                <p className='tkc-serif break-keep text-3xl text-white lg:text-4xl'>
                  {heroTagline}
                </p>
                <p className='mt-3 text-sm text-white/70'>
                  2026 \uD0DC\uACE0\uC758 \uB2EC\uC778 \uD50C\uB808\uC774 \uC5D1\uC2A4\uD3EC \uD1A0\uB108\uBA3C\uD2B8
                </p>
              </div>
            </div>
          </section>

          <section className='grid grid-cols-2 gap-6'>
            <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-6'>
              <div className='flex items-start gap-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-red-600'>
                  <Gamepad2 className='h-6 w-6 text-white' />
                </div>
                <div className='space-y-1'>
                  <p className='text-lg font-semibold'>
                    {t('home.consoleCardTitle')}
                  </p>
                  <p className='text-sm text-white/60'>
                    {t('home.consoleCardSubtitle')}
                  </p>
                </div>
              </div>
              <div className='mt-6 flex items-center gap-3'>
                <Button
                  variant='outline'
                  asChild
                  className='rounded-full border-white/20 text-white/80 hover:bg-white/10 hover:text-white'
                >
                  <Link to='/console'>{t('home.details')}</Link>
                </Button>
                <Button
                  variant='outline'
                  asChild
                  className='rounded-full border-white/20 text-white/80 hover:bg-white/10 hover:text-white'
                >
                  <Link to='/apply'>{t('home.ctaApply')}</Link>
                </Button>
              </div>
            </div>

            <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-6'>
              <div className='flex items-start gap-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-red-600'>
                  <Joystick className='h-6 w-6 text-white' />
                </div>
                <div className='space-y-1'>
                  <p className='text-lg font-semibold'>
                    {t('home.arcadeCardTitle')}
                  </p>
                  <p className='text-sm text-white/60'>
                    {t('home.arcadeCardSubtitle')}
                  </p>
                </div>
              </div>
              <div className='mt-6 flex items-center gap-3'>
                <Button
                  variant='outline'
                  asChild
                  className='rounded-full border-white/20 text-white/80 hover:bg-white/10 hover:text-white'
                >
                  <Link to='/arcade'>{t('home.details')}</Link>
                </Button>
                <Button
                  variant='outline'
                  asChild
                  className='rounded-full border-white/20 text-white/80 hover:bg-white/10 hover:text-white'
                >
                  <Link to='/apply'>{t('home.ctaApply')}</Link>
                </Button>
              </div>
            </div>
          </section>

          <section className='rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 text-center'>
            <p className='text-lg font-semibold'>
              \uD50C\uB808\uC774 \uC5D1\uC2A4\uD3EC \uACB0\uC120 \uC548\uB0B4
            </p>
            <p className='mt-1 text-sm text-white/70'>
              \uCD94\uD6C4 \uACF5\uC9C0\uB429\uB2C8\uB2E4.
            </p>
          </section>

          <section className='aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black/40'>
            <div className='flex h-full w-full flex-col items-center justify-center gap-3 text-white/60'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5'>
                <Play className='h-5 w-5' />
              </div>
              <p className='text-sm'>\uC624\uD504\uB2DD \uC601\uC0C1(\uCD94\uD6C4 \uACF5\uAC1C)</p>
            </div>
          </section>

          <footer className='flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-4'>
            <div className='flex items-center gap-6'>
              {partnerLogos.map((logo) => (
                <PartnerLogo
                  key={logo.src}
                  src={logo.src}
                  fallback={logo.fallback}
                />
              ))}
            </div>
            <span className='text-xs text-white/50'>{t('footer.partners')}</span>
          </footer>
        </div>
      </div>
    </TkcSection>
  )
}
