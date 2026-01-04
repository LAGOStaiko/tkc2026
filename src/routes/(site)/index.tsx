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

type SiteData = {
  eventName?: string
  catchphrase?: string
  heroBgType?: string
  heroBgUrl?: string
  heroBgPosterUrl?: string
}

const CTA_LABEL = '\uB300\uD68C \uC2E0\uCCAD\uD558\uAE30'
const DETAILS_LABEL = '\uC790\uC138\uD788 \uBCF4\uAE30'
const CONSOLE_LABEL = '\uCF58\uC194'
const ARCADE_LABEL = '\uC544\uCF00\uC774\uB4DC'

export const Route = createFileRoute('/(site)/')({
  component: HomePage,
})

function HomePage() {
  const { data, isLoading, isError } = useSite<SiteData>()
  const eventName = data?.eventName ?? 'TKC2026'
  const catchphrase = data?.catchphrase ?? 'Official Taiko Competition'
  const heroBgType = (data?.heroBgType ?? '').toLowerCase()
  const heroBgUrl = data?.heroBgUrl
  const heroBgPosterUrl = data?.heroBgPosterUrl
  const statusMessage = isLoading
    ? 'Loading site info...'
    : isError
      ? 'Site info unavailable.'
      : null

  const showVideo = heroBgType === 'video' && !!heroBgUrl
  const showImage = heroBgType === 'image' && !!heroBgUrl

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
            poster={heroBgPosterUrl}
            src={heroBgUrl}
          />
        )}
        {showImage && (
          <div
            className='absolute inset-0 bg-cover bg-center'
            style={{ backgroundImage: `url(${heroBgUrl})` }}
          />
        )}
        <div className='absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/30' />
        <div className='relative z-10 px-6 py-16 sm:px-10 sm:py-20 lg:px-14'>
          <div className='max-w-2xl space-y-4'>
            <p className='text-xs uppercase tracking-[0.3em] text-muted-foreground'>
              TKC2026
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
              <Link to='/apply'>{CTA_LABEL}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>{CONSOLE_LABEL}</CardTitle>
            <CardDescription>Console division overview and rules.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              Explore qualifying formats, scoring, and how to participate in the
              console bracket.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant='outline' asChild>
              <Link to='/console'>{DETAILS_LABEL}</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{ARCADE_LABEL}</CardTitle>
            <CardDescription>Arcade division preview and entry flow.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              Find match schedules, machine info, and on-site participation
              details for arcade play.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant='outline' asChild>
              <Link to='/arcade'>{DETAILS_LABEL}</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  )
}
