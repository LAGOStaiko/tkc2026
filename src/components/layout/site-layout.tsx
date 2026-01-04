import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useSite } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { t } from '@/text'

type SitePartner = {
  name?: string
  logo?: string
  logoUrl?: string
  image?: string
  src?: string
  url?: string
}

type SiteData = {
  name?: string
  title?: string
  catchphrase?: string
  tagline?: string
  slogan?: string
  logoUrl?: string
  partners?: SitePartner[]
}

type NavItem = {
  label: string
  to: string
  emphasis?: boolean
}

const navItems: NavItem[] = [
  { label: t('nav.home'), to: '/' },
  { label: t('nav.console'), to: '/console' },
  { label: t('nav.arcade'), to: '/arcade' },
  { label: t('nav.schedule'), to: '/schedule' },
  { label: t('nav.results'), to: '/results' },
  {
    label: t('nav.apply'),
    to: '/apply',
    emphasis: true,
  },
  { label: t('nav.contact'), to: '/contact' },
]

const MOBILE_CTA_LABEL = t('home.ctaApply')

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  return (
    href === item.to ||
    href.split('?')[0] === item.to ||
    (mainNav &&
      href.split('/')[1] !== '' &&
      href.split('/')[1] === item.to.split('/')[1])
  )
}

export function SiteLayout() {
  const { data, isLoading, isError } = useSite<SiteData>()
  const href = useLocation({ select: (location) => location.href })
  const siteName = data?.name ?? data?.title ?? t('meta.siteName')
  const tagline = data?.catchphrase ?? data?.tagline ?? data?.slogan ?? ''
  const siteLogoUrl =
    data?.logoUrl ?? '/branding/logo-tkc2026-playx4.webp'
  const partners = Array.isArray(data?.partners) ? data.partners : []

  return (
    <div className='min-h-svh bg-background text-foreground'>
      <header className='fixed inset-x-0 top-0 z-50 border-b bg-background/90 backdrop-blur'>
        <div className='mx-auto flex h-16 max-w-5xl items-center gap-4 px-4'>
          <Link
            to='/'
            className='flex items-center gap-2 text-lg font-semibold tracking-tight'
          >
            <img
              src={siteLogoUrl}
              alt='TKC2026'
              className='h-8 w-8 shrink-0 object-contain'
            />
            <span>{siteName}</span>
          </Link>
          <nav className='hidden flex-1 items-center justify-end gap-2 overflow-x-auto text-xs sm:gap-3 sm:text-sm md:flex'>
            {navItems.map((item) => {
              const isActive = checkIsActive(href, item, true)
              const baseClass = item.emphasis
                ? 'whitespace-nowrap rounded-full bg-primary px-3 py-1.5 text-primary-foreground shadow-sm hover:bg-primary/90'
                : 'whitespace-nowrap text-muted-foreground hover:text-foreground'
              const activeClass = !item.emphasis && isActive ? 'text-foreground font-semibold' : ''

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={`${baseClass} ${activeClass}`.trim()}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                className='ms-auto md:hidden'
                aria-label={t('nav.openMenu')}
              >
                <Menu className='size-4' />
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='p-0'>
              <SheetHeader className='border-b'>
                <SheetTitle>{t('nav.menuTitle')}</SheetTitle>
              </SheetHeader>
              <div className='flex flex-col gap-1 p-4'>
                {navItems.map((item) => {
                  const isActive = checkIsActive(href, item, true)
                  const baseClass = item.emphasis
                    ? 'rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground shadow-sm hover:bg-primary/90'
                    : 'rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  const activeClass = !item.emphasis && isActive ? 'bg-muted text-foreground font-semibold' : ''

                  return (
                    <SheetClose asChild key={item.to}>
                      <Link
                        to={item.to}
                        aria-current={isActive ? 'page' : undefined}
                        className={`${baseClass} ${activeClass}`.trim()}
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className='mx-auto flex w-full max-w-5xl flex-1 px-4 pt-20 pb-36 md:pb-28'>
        <div className='w-full'>
          <Outlet />
        </div>
      </main>

      <footer className='fixed inset-x-0 bottom-0 z-50 border-t bg-background/90 backdrop-blur'>
        <div className='mx-auto w-full max-w-5xl px-4 py-3 text-xs text-muted-foreground'>
          {isLoading && <span>{t('site.loading')}</span>}
          {isError && <span>{t('site.loadFailed')}</span>}
          {!isLoading && !isError && (
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div className='space-y-1'>
                <div className='text-sm font-semibold text-foreground'>
                  {siteName}
                </div>
                {tagline && <div>{tagline}</div>}
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='text-[11px] uppercase tracking-wide'>
                  {t('footer.partners')}
                </span>
                {partners.length === 0 && <span>{t('footer.noneListed')}</span>}
                {partners.map((partner, index) => {
                  const logo =
                    partner.logo ??
                    partner.logoUrl ??
                    partner.image ??
                    partner.src
                  const label = partner.name ?? t('footer.partnerFallback')
                  const href = partner.url
                  const content = logo ? (
                    <img
                      src={logo}
                      alt={label}
                      className='h-6 w-auto object-contain'
                      loading='lazy'
                    />
                  ) : (
                    <span className='rounded border px-2 py-1 text-[11px]'>
                      {label}
                    </span>
                  )

                  return href ? (
                    <a
                      key={`${label}-${index}`}
                      href={href}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex items-center'
                    >
                      {content}
                    </a>
                  ) : (
                    <span key={`${label}-${index}`} className='inline-flex items-center'>
                      {content}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div className='border-t bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden'>
          <Button asChild className='w-full'>
            <Link to='/apply'>{MOBILE_CTA_LABEL}</Link>
          </Button>
        </div>
      </footer>
    </div>
  )
}
