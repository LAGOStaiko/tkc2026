import { sanitizeImgSrc, sanitizeUrl } from '@/lib/sanitize-url'

export type HomePartner = {
  order?: number
  name: string
  logoUrl?: string
  href?: string
}

export function HomeFooterStrip({
  partners,
  logoSrc = '/branding/v2/logo.png',
}: {
  partners: HomePartner[]
  logoSrc?: string
}) {
  return (
    <section className='mt-16 border-t border-[#1e1e1e] pt-10 pb-9 sm:mt-16 md:mt-20'>
      <div className='flex flex-col items-center justify-between gap-5 md:flex-row'>
        <div className='flex items-center gap-3'>
          <img
            src={logoSrc}
            alt='TKC2026'
            className='h-7 w-auto opacity-80 md:h-8'
            loading='lazy'
          />
        </div>

        <div className='flex flex-wrap content-center items-center justify-center gap-x-6 gap-y-3 text-[13px] font-semibold tracking-normal text-white/65 sm:text-sm md:justify-end'>
          {partners
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((p) => {
              const key = p.order ?? p.name
              const safeLogoUrl = sanitizeImgSrc(p.logoUrl)
              const safeHref = sanitizeUrl(p.href)
              const hasLogo = safeLogoUrl.length > 0
              const hasHref = safeHref !== '#'

              const node = hasLogo ? (
                <img
                  src={safeLogoUrl}
                  alt={p.name}
                  className='block h-5 w-auto opacity-90 sm:h-6'
                  loading='lazy'
                />
              ) : (
                <span className='leading-none'>{p.name}</span>
              )

              return hasHref ? (
                <a
                  key={key}
                  href={safeHref}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex h-7 items-center hover:text-white'
                >
                  {node}
                </a>
              ) : (
                <span key={key} className='inline-flex h-7 items-center'>
                  {node}
                </span>
              )
            })}
        </div>

        <div className='text-sm text-white/60'>
          © {new Date().getFullYear()} 태고의 달인 PlayX4 토너먼트
        </div>
      </div>
    </section>
  )
}
