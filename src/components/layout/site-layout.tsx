import { Link, Outlet, useLocation, useRouterState } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useSite } from '@/lib/api'
import { TkcContainer } from '@/components/tkc/layout'
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

type SiteData = {
  name?: string
  title?: string
  logoUrl?: string
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

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  return (
    href === item.to ||
    href.split('?')[0] === item.to ||
    (mainNav &&
      href.split('/')[1] !== '' &&
      href.split('/')[1] === item.to.split('/')[1])
  )
}

type PublicHeaderProps = {
  variant?: 'default' | 'hero'
}

export function PublicHeader({ variant = 'default' }: PublicHeaderProps) {
  const { data } = useSite<SiteData>()
  const href = useLocation({ select: (location) => location.href })
  const siteName = data?.name ?? data?.title ?? t('meta.siteName')
  const headerLogoUrl = '/branding/v2/logo.png'
  const headerLogoFallback = '/branding/v2/logo.png'
  const headerLogoSrcSet = data?.logoUrl
    ? `${headerLogoUrl} 1x, ${data.logoUrl} 2x`
    : `${headerLogoUrl} 1x, ${headerLogoFallback} 2x`
  const isHero = variant === 'hero'

  return (
    <header
      className={
        isHero
          ? 'absolute inset-x-0 top-0 z-50 bg-transparent text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
          : 'fixed inset-x-0 top-0 z-50 border-b bg-black/90 backdrop-blur'
      }
      style={{
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      <TkcContainer
        className={`flex items-center justify-between ${
          isHero ? 'w-full py-3 md:py-4 px-6 md:px-8' : 'h-14'
        }`}
      >
        <Link to='/' className='flex items-center gap-3'>
          <img
            src={headerLogoUrl}
            srcSet={headerLogoSrcSet}
            alt='TKC2026'
            className='h-6 w-auto shrink-0 object-contain sm:h-7 md:h-8'
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = headerLogoFallback
            }}
          />
          <span className='sr-only'>{siteName}</span>
        </Link>
        <div className='flex items-center gap-2'>
          <nav
            className={
              isHero
                ? 'hidden items-center gap-5 text-sm font-medium tracking-tight md:flex'
                : 'hidden items-center gap-2 overflow-x-auto text-xs sm:gap-3 sm:text-sm md:flex'
            }
          >
            {navItems.map((item) => {
              const isActive = checkIsActive(href, item, true)
              const baseClass = item.emphasis
                ? isHero
                  ? 'inline-flex h-8 items-center rounded-full bg-white/90 px-3 text-xs font-semibold text-black transition hover:bg-white'
                  : 'whitespace-nowrap rounded-full border border-sky-400/30 bg-sky-400/20 px-3 py-1.5 text-sky-100 shadow-sm transition hover:bg-sky-400/30'
                : isHero
                  ? 'whitespace-nowrap text-white/90 transition hover:text-white'
                  : 'whitespace-nowrap text-white/70 transition hover:text-white'
              const activeClass =
                !item.emphasis && isActive
                  ? isHero
                    ? 'text-white underline underline-offset-8 decoration-white/60'
                    : 'text-white underline underline-offset-8 decoration-sky-400/80'
                  : ''

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
                className='md:hidden'
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
                    ? 'rounded-md border border-sky-400/30 bg-sky-400/20 px-3 py-2 text-sm text-sky-100 shadow-sm transition hover:bg-sky-400/30'
                    : 'rounded-md px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white'
                  const activeClass =
                    !item.emphasis && isActive
                      ? 'bg-white/10 text-white font-semibold'
                      : ''

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
      </TkcContainer>
    </header>
  )
}

export function SiteLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isHome = pathname === '/'

  return (
    <div className='dark min-h-svh bg-black text-foreground'>
      {!isHome ? <PublicHeader /> : null}

      <main
        className={`flex w-full flex-1 bg-black pb-16 md:pb-20 ${isHome ? 'pt-0' : 'pt-16'}`}
      >
        <TkcContainer className='w-full'>
          <Outlet />
        </TkcContainer>
      </main>
    </div>
  )
}
