import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Card,
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
    <div className='space-y-10'>
      {statusMessage && (
        <p className='text-sm text-muted-foreground'>{statusMessage}</p>
      )}
      <section className='relative overflow-hidden rounded-3xl border bg-black text-white'>
        <img
          src='/branding/hero-tkc2026.webp'
          alt=''
          className='absolute inset-0 h-full w-full object-contain'
          loading='eager'
          decoding='async'
          fetchPriority='high'
        />
        <div className='absolute inset-0 bg-gradient-to-b from-black/0 via-black/25 to-black/70' />
        <div className='relative z-10 flex min-h-[70vh] flex-col justify-end px-4 pb-10 pt-24 md:min-h-[78vh] md:pt-28 md:pb-14'>
          <div className='mx-auto w-full max-w-[1100px] text-center'>
            <h1 className='sr-only'>{eventName}</h1>
            <div className='mx-auto flex max-w-[92vw] flex-col items-center gap-4'>
              <p className='break-keep font-serif text-xl text-white/90 drop-shadow-[0_8px_20px_rgba(0,0,0,0.65)] md:text-3xl'>
                {heroTagline}
              </p>
              <Button
                asChild
                size='lg'
                className='h-12 bg-white px-6 text-black shadow-lg shadow-black/30 hover:bg-white/90'
              >
                <Link to='/apply'>{t('home.ctaApply')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className='grid gap-6 lg:grid-cols-2'>
        <Card className='overflow-hidden'>
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
          <CardHeader>
            <CardTitle>{t('home.consoleCardTitle')}</CardTitle>
            <CardDescription>{t('home.consoleCardSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              {t('home.consoleCardBody')}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant='outline' asChild>
              <Link to='/console'>{t('home.details')}</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className='overflow-hidden'>
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
          <CardHeader>
            <CardTitle>{t('home.arcadeCardTitle')}</CardTitle>
            <CardDescription>{t('home.arcadeCardSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              {t('home.arcadeCardBody')}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant='outline' asChild>
              <Link to='/arcade'>{t('home.details')}</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  )
}
