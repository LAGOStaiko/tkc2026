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
      <section className='relative overflow-hidden rounded-3xl border text-white'>
        <picture className='absolute inset-0' aria-hidden='true'>
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
            className='h-full w-full object-cover object-[50%_35%]'
            loading='eager'
            decoding='async'
            fetchPriority='high'
          />
        </picture>
        <div className='absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/80' />
        <div className='relative z-10 flex min-h-[60vh] flex-col justify-end px-6 pb-16 pt-24 sm:min-h-[65vh] sm:px-10 sm:pb-20 md:min-h-[70vh] lg:px-14'>
          <div className='mx-auto flex w-full max-w-3xl flex-col gap-6 text-center'>
            <h1 className='sr-only'>{eventName}</h1>
            <p className='font-serif text-2xl text-white/90 drop-shadow-[0_6px_18px_rgba(0,0,0,0.6)] sm:text-3xl md:text-4xl'>
              {heroTagline}
            </p>
            <div>
              <Button
                asChild
                size='lg'
                className='bg-white text-black shadow-lg shadow-black/30 hover:bg-white/90'
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
