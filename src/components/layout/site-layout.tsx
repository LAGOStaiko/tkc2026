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

export function SiteLayout() {
  const { data } = useSite<SiteData>()
  const href = useLocation({ select: (location) => location.href })
  const siteName = data?.name ?? data?.title ?? t('meta.siteName')
  const headerLogoUrl = '/branding/logo-tkc2026-playx4-128.webp'
  const headerLogoFallback = '/branding/logo-tkc2026-playx4.webp'
  const headerLogoSrcSet = data?.logoUrl
    ? `${headerLogoUrl} 1x, ${data.logoUrl} 2x`
    : `${headerLogoUrl} 1x, ${headerLogoFallback} 2x`

  return (
    <div className='dark min-h-svh bg-black text-foreground'>
      <header
        className='fixed inset-x-0 top-0 z-50 border-b bg-black/90 backdrop-blur'
        style={{
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <div className='mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 md:px-8'>
          <Link to='/' className='flex items-center gap-3'>
            <img
              src={headerLogoUrl}
              srcSet={headerLogoSrcSet}
              alt='TKC2026'
              className='h-10 w-10 shrink-0 object-contain md:h-12 md:w-12'
              onError={(event) => {
                event.currentTarget.onerror = null
                event.currentTarget.src = headerLogoFallback
              }}
            />
            <span className='sr-only'>{siteName}</span>
          </Link>
          <div className='flex items-center gap-2'>
            <nav className='hidden items-center gap-2 overflow-x-auto text-xs sm:gap-3 sm:text-sm md:flex'>
              {navItems.map((item) => {
                const isActive = checkIsActive(href, item, true)
                const baseClass = item.emphasis
                  ? 'whitespace-nowrap rounded-full bg-primary px-3 py-1.5 text-primary-foreground shadow-sm hover:bg-primary/90'
                  : 'whitespace-nowrap text-muted-foreground hover:text-foreground'
                const activeClass =
                  !item.emphasis && isActive ? 'text-foreground font-semibold' : ''

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
                      ? 'rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground shadow-sm hover:bg-primary/90'
                      : 'rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    const activeClass =
                      !item.emphasis && isActive
                        ? 'bg-muted text-foreground font-semibold'
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
        </div>
      </header>

      <main className='mx-auto flex w-full max-w-6xl flex-1 bg-black px-4 pt-16 pb-16 md:px-8 md:pb-20'>
        <div className='w-full'>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
