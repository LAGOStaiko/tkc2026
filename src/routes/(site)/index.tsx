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
  logoUrl?: string
}

export const Route = createFileRoute('/(site)/')({
  component: HomePage,
})

function HomePage() {
  const { data, isLoading, isError } = useSite<SiteData>()
  const eventName = data?.eventName ?? t('meta.siteName')
  const heroTagline = t('home.heroTagline')
  const statusMessage = isLoading
    ? t('site.loading')
    : isError
      ? t('site.loadFailed')
      : null

  React.useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('nav.home')}`
  }, [])

  return (
    <div className='space-y-10'>
      {statusMessage && (
        <p className='text-sm text-muted-foreground'>{statusMessage}</p>
      )}
      <section className='relative overflow-hidden rounded-3xl border bg-gradient-to-b from-black via-slate-950 to-black text-white'>
        <div className='relative z-10 px-6 py-16 sm:px-10 sm:py-20 lg:px-14'>
          <div className='mx-auto flex max-w-3xl flex-col items-center gap-5 text-center sm:gap-6'>
            <h1 className='sr-only'>{eventName}</h1>
            <picture>
              <source
                media='(max-width: 768px)'
                srcSet='/branding/logo-tkc2026-playx4-256.webp'
              />
              <img
                src='/branding/logo-tkc2026-playx4.webp'
                alt='TKC2026'
                className='mx-auto h-auto w-[min(640px,92vw)] object-contain'
                loading='eager'
                decoding='async'
              />
            </picture>
            <p className='font-serif text-lg text-white/80 sm:text-xl md:text-2xl'>
              {heroTagline}
            </p>
            <div className='mt-2'>
              <Button
                asChild
                size='lg'
                className='bg-white text-black hover:bg-white/90'
              >
                <Link to='/apply'>{t('home.ctaApply')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className='grid gap-6 lg:grid-cols-2'>
        <Card>
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

        <Card>
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
