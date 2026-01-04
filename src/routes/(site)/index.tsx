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
  catchphrase?: string
  heroBgType?: string
  heroBgUrl?: string
  heroBgPosterUrl?: string
}

const MD_QUERY = '(min-width: 768px)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export const Route = createFileRoute('/(site)/')({
  component: HomePage,
})

function HomePage() {
  const { data, isLoading, isError } = useSite<SiteData>()
  const canPlayVideo = useHeroVideoEnabled()
  const eventName = data?.eventName ?? t('meta.siteName')
  const catchphrase = data?.catchphrase ?? t('home.catchphraseFallback')
  const heroBgType = (data?.heroBgType ?? '').toLowerCase()
  const heroBgUrl = data?.heroBgUrl
  const heroBgPosterUrl = data?.heroBgPosterUrl
  const statusMessage = isLoading
    ? t('site.loading')
    : isError
      ? t('site.loadFailed')
      : null

  React.useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('nav.home')}`
  }, [])

  const isVideoType = heroBgType === 'video'
  const isImageType = heroBgType === 'image'
  const fallbackImageUrl = isImageType
    ? heroBgUrl
    : heroBgPosterUrl ?? heroBgUrl
  const showVideo = isVideoType && !!heroBgUrl && canPlayVideo
  const showImage =
    !!fallbackImageUrl && (isImageType || (isVideoType && !canPlayVideo))

  return (
    <div className='space-y-10'>
      {statusMessage && (
        <p className='text-sm text-muted-foreground'>{statusMessage}</p>
      )}
      <section className='relative overflow-hidden rounded-3xl border bg-muted/30'>
        {showVideo && (
          <video
            className='absolute inset-0 h-full w-full object-cover'
            autoPlay
            muted
            loop
            playsInline
            preload='metadata'
            poster={heroBgPosterUrl}
            src={heroBgUrl}
          />
        )}
        {showImage && (
          <div
            className='absolute inset-0 bg-cover bg-center'
            style={{ backgroundImage: `url(${fallbackImageUrl})` }}
          />
        )}
        <div className='absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/30' />
        <div className='relative z-10 px-6 py-16 sm:px-10 sm:py-20 lg:px-14'>
          <div className='max-w-2xl space-y-4'>
            <p className='text-xs uppercase tracking-[0.3em] text-muted-foreground'>
              {t('meta.siteName')}
            </p>
            <h1 className='text-4xl font-bold tracking-tight sm:text-5xl'>
              {eventName}
            </h1>
            <p className='text-base text-muted-foreground sm:text-lg'>
              {catchphrase}
            </p>
          </div>
          <div className='mt-8'>
            <Button asChild size='lg'>
              <Link to='/apply'>{t('home.ctaApply')}</Link>
            </Button>
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

function useHeroVideoEnabled() {
  const [enabled, setEnabled] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const mdQuery = window.matchMedia(MD_QUERY)
    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY)

    const update = () => {
      setEnabled(mdQuery.matches && !motionQuery.matches)
    }

    const handleChange = (_event: MediaQueryListEvent) => {
      update()
    }

    update()

    type LegacyMediaQueryList = MediaQueryList & {
      addListener?: (handler: (event: MediaQueryListEvent) => void) => void
      removeListener?: (handler: (event: MediaQueryListEvent) => void) => void
    }

    const addListener = (
      query: MediaQueryList,
      handler: (event: MediaQueryListEvent) => void
    ) => {
      const legacyQuery = query as LegacyMediaQueryList
      if (legacyQuery.addListener) {
        legacyQuery.addListener(handler)
      } else {
        query.addEventListener('change', handler)
      }
    }

    const removeListener = (
      query: MediaQueryList,
      handler: (event: MediaQueryListEvent) => void
    ) => {
      const legacyQuery = query as LegacyMediaQueryList
      if (legacyQuery.removeListener) {
        legacyQuery.removeListener(handler)
      } else {
        query.removeEventListener('change', handler)
      }
    }

    addListener(mdQuery, handleChange)
    addListener(motionQuery, handleChange)

    return () => {
      removeListener(mdQuery, handleChange)
      removeListener(motionQuery, handleChange)
    }
  }, [])

  return enabled
}
