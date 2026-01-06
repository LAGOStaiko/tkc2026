import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
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

export const Route = createFileRoute('/(site)/')({
  component: HomePage,
})

function HomePage() {
  const { data, isError } = useSite<SiteData>()
  const eventName = data?.eventName ?? t('meta.siteName')
  const heroTagline = t('home.heroTagline')
  const statusMessage = isError ? t('site.loadFailed') : null

  React.useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('nav.home')}`
  }, [])

  return (
    <TkcSection>
      {statusMessage && (
        <p className='text-sm text-white/60'>{statusMessage}</p>
      )}
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
        <div className='absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70' />
        <div className='absolute inset-0 bg-black/25' />
        <div className='relative z-10 flex min-h-[70vh] flex-col items-center justify-center px-4 pb-10 pt-24 text-center md:min-h-[72vh]'>
          <div className='relative z-10 flex w-full flex-col items-center text-center'>
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
              <div className='mx-auto mt-4 flex w-full max-w-[640px] flex-col items-center gap-4 rounded-2xl border border-white/10 bg-black/35 px-6 py-5 backdrop-blur-md md:mt-6'>
                <p className='tkc-serif break-keep text-xl text-white/90 drop-shadow-[0_8px_20px_rgba(0,0,0,0.65)] md:text-3xl'>
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
    </TkcSection>
  )
}
