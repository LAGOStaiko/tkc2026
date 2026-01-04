import { Link, Outlet } from '@tanstack/react-router'
import { useSite } from '@/lib/api'

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
  partners?: SitePartner[]
}

// Unicode escapes keep the source ASCII-only while matching the Korean labels.
const navItems = [
  { label: '\uD64D', to: '/' },
  { label: '\uCF58\uC194', to: '/console' },
  { label: '\uC544\uCF00\uC774\uB4DC', to: '/arcade' },
  { label: '\uC77C\uC815', to: '/schedule' },
  { label: '\uC21C\uC704 \uBC0F \uACB0\uACFC', to: '/results' },
  {
    label: '\uB300\uD68C \uC2E0\uCCAD\uD558\uB7EC \uAC00\uAE30',
    to: '/apply',
    emphasis: true,
  },
  { label: '\uBB38\uC758\uD558\uAE30', to: '/contact' },
]

export function SiteLayout() {
  const { data, isLoading, isError } = useSite<SiteData>()
  const siteName = data?.name ?? data?.title ?? 'TKC2026'
  const tagline = data?.catchphrase ?? data?.tagline ?? data?.slogan ?? ''
  const partners = Array.isArray(data?.partners) ? data.partners : []

  return (
    <div className='min-h-svh bg-background text-foreground'>
      <header className='fixed inset-x-0 top-0 z-50 border-b bg-background/90 backdrop-blur'>
        <div className='mx-auto flex h-16 max-w-5xl items-center gap-4 px-4'>
          <Link to='/' className='text-lg font-semibold tracking-tight'>
            TKC2026
          </Link>
          <nav className='flex flex-1 items-center justify-end gap-2 overflow-x-auto text-xs sm:gap-3 sm:text-sm'>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={
                  item.emphasis
                    ? 'whitespace-nowrap rounded-full bg-primary px-3 py-1.5 text-primary-foreground shadow-sm hover:bg-primary/90'
                    : 'whitespace-nowrap text-muted-foreground hover:text-foreground'
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className='mx-auto flex w-full max-w-5xl flex-1 px-4 pt-20 pb-28'>
        <div className='w-full'>
          <Outlet />
        </div>
      </main>

      <footer className='fixed inset-x-0 bottom-0 z-50 border-t bg-background/90 backdrop-blur'>
        <div className='mx-auto w-full max-w-5xl px-4 py-3 text-xs text-muted-foreground'>
          {isLoading && <span>Loading site info...</span>}
          {isError && <span>Failed to load site info.</span>}
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
                  Partners
                </span>
                {partners.length === 0 && <span>None listed</span>}
                {partners.map((partner, index) => {
                  const logo =
                    partner.logo ??
                    partner.logoUrl ??
                    partner.image ??
                    partner.src
                  const label = partner.name ?? 'Partner'
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
      </footer>
    </div>
  )
}
