import { useMemo } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { t } from '@/text'
import { Menu } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useSite } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SiteContainer } from '@/components/site/site-container'

type SiteData = {
  name?: string
  title?: string
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
  { label: t('nav.songs'), to: '/songs' },
  { label: t('nav.songPool'), to: '/song-pool' },
  { label: t('nav.results'), to: '/results' },
  { label: t('nav.apply'), to: '/apply', emphasis: true },
  { label: t('nav.contact'), to: '/contact' },
]

const LOGO_SRC = '/branding/v2/logo.png'

function isActivePath(pathname: string, item: NavItem) {
  if (item.to === '/') return pathname === '/'
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function SiteHeader() {
  const { data } = useSite<SiteData>()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const siteName = data?.name ?? data?.title ?? t('meta.siteName')

  const header = useMemo(
    () => (
      <header
        // Force the site header to stay pinned to the viewport top on every page.
        id='site-header'
        data-site-header
        className='dark !fixed inset-x-0 top-0 z-50 h-16 bg-transparent text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]'
      >
        <SiteContainer className='flex h-16 items-center justify-between gap-4'>
          <Link to='/' className='flex items-center gap-3'>
            <img
              src={LOGO_SRC}
              alt='TKC2026'
              className='h-8 w-auto object-contain mix-blend-screen drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] md:h-10'
              loading='eager'
              draggable={false}
            />
            <span className='sr-only'>{siteName}</span>
          </Link>

          <div className='flex items-center gap-2'>
            <nav className='hidden items-center gap-5 text-sm font-medium tracking-tight md:flex'>
              {navItems.map((item) => {
                const isActive = isActivePath(pathname, item)
                const baseClass = item.emphasis
                  ? 'group/apply relative inline-flex h-8 items-center justify-center rounded-full bg-white/90 px-3 text-xs font-semibold text-black transition hover:bg-white'
                  : 'whitespace-nowrap text-white/85 transition hover:text-white'
                const activeClass =
                  !item.emphasis && isActive
                    ? 'text-white underline underline-offset-8 decoration-white/60'
                    : ''

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(baseClass, activeClass)}
                  >
                    {item.emphasis ? (
                      <>
                        <span className='transition-opacity duration-300 group-hover/apply:opacity-0'>
                          {item.label}
                        </span>
                        <img
                          src='/characters/don-wink.png'
                          alt=''
                          className='pointer-events-none absolute inset-0 m-auto h-5 w-5 scale-75 object-contain opacity-0 transition-all duration-300 group-hover/apply:scale-100 group-hover/apply:opacity-100'
                          loading='lazy'
                          draggable={false}
                        />
                      </>
                    ) : (
                      item.label
                    )}
                  </Link>
                )
              })}
            </nav>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  className='border-white/30 bg-transparent text-white/90 hover:bg-white/10 hover:text-white md:hidden'
                  aria-label={t('nav.openMenu')}
                >
                  <Menu className='size-4' />
                </Button>
              </SheetTrigger>
              <SheetContent side='right' className='bg-black p-0 text-white'>
                <SheetHeader className='border-b border-white/10'>
                  <SheetTitle className='text-white/90'>
                    {t('nav.menuTitle')}
                  </SheetTitle>
                </SheetHeader>
                <div className='flex flex-col gap-1 p-4'>
                  {navItems.map((item) => {
                    const isActive = isActivePath(pathname, item)
                    const baseClass = item.emphasis
                      ? 'rounded-full bg-white/90 px-3 py-2 text-center text-sm font-semibold text-black transition hover:bg-white'
                      : 'rounded-md px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white'
                    const activeClass =
                      !item.emphasis && isActive
                        ? 'bg-white/10 text-white font-semibold'
                        : ''

                    return (
                      <SheetClose asChild key={item.to}>
                        <Link
                          to={item.to}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(baseClass, activeClass)}
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
        </SiteContainer>
      </header>
    ),
    [pathname, siteName]
  )

  // Rendering via a portal makes the header immune to any parent transforms/filters
  // that could otherwise break `position: fixed` behavior.
  return typeof document === 'undefined'
    ? header
    : createPortal(header, document.body)
}
