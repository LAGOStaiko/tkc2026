import { createFileRoute, Link } from '@tanstack/react-router'

import { useSite } from '@/lib/api'
import { TkcContainer } from '@/components/tkc/layout'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/(site)/')({
  component: HomePage,
})

const ASSETS = {
  hero: '/branding/v2/home-hero.jpg',
  logo: '/branding/v2/logo.png',
  consoleIcon: '/branding/v2/icon-console.png',
  arcadeIcon: '/branding/v2/icon-arcade.png',
}

type SiteData = {
  partners?: Partner[]
}

type Partner = {
  order?: number
  name: string
  logoUrl?: string
  href?: string
}

function HomePage() {
  const { data: site } = useSite<SiteData>()

  const partners: Partner[] =
    site?.partners?.length
      ? site.partners
      : [
          { order: 10, name: 'ANDAMIRO' },
          { order: 20, name: 'BANDAI NAMCO' },
          { order: 30, name: 'TAIKO LABS' },
        ]

  return (
    <TkcContainer className="space-y-6 md:space-y-8">
      {/* HERO */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-black/20 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
        <div className="relative h-[220px] sm:h-[260px] md:h-[340px] lg:h-[380px]">
          <img
            src={ASSETS.hero}
            alt="TKC2026 Hero"
            className="h-full w-full object-cover object-left"
            loading="eager"
          />
        </div>
      </section>

      {/* CONSOLE / ARCADE CARDS */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <ModeCard
          iconSrc={ASSETS.consoleIcon}
          title="콘솔"
          description="【동더! 월드 페스티벌】로 진행하는 대회입니다."
          detailTo="/console"
        />
        <ModeCard
          iconSrc={ASSETS.arcadeIcon}
          title="아케이드"
          description="【태고의 달인 니지이로 ver.】로 진행하는 대회입니다."
          detailTo="/arcade"
        />
      </section>

      {/* PLAYX4 FINAL INFO */}
      <section className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center shadow-[0_10px_40px_rgba(0,0,0,0.35)] md:px-8 md:py-8">
        <div className="text-lg font-semibold text-white/90 md:text-xl">
          플레이 엑스포 결선 안내
        </div>
        <div className="mt-1 text-sm text-white/60">추후 공개됩니다.</div>
      </section>

      {/* VIDEO PLACEHOLDER */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.35)] md:p-4">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black/40">
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm leading-relaxed text-white/60">
            영상은 추후 공개됩니다.
          </div>
        </div>
      </section>

      {/* FOOT STRIP (Partners) */}
      <section className="pb-6 pt-2">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <img
              src={ASSETS.logo}
              alt="TKC2026"
              className="h-6 w-auto opacity-80 md:h-7"
              loading="lazy"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold tracking-wide text-white/65 md:justify-end">
            {partners
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((p) => {
                const key = p.order ?? p.name
                const hasLogo = !!p.logoUrl && p.logoUrl.trim().length > 0
                const hasHref = !!p.href && p.href.trim().length > 0

                const node = hasLogo ? (
                  <img
                    src={p.logoUrl}
                    alt={p.name}
                    className="h-5 w-auto opacity-90"
                    loading="lazy"
                  />
                ) : (
                  <span>{p.name}</span>
                )

                return hasHref ? (
                  <a
                    key={key}
                    href={p.href}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white"
                  >
                    {node}
                  </a>
                ) : (
                  <span key={key}>{node}</span>
                )
              })}
          </div>

          <div className="text-xs text-white/50">
            © {new Date().getFullYear()} 태고의 달인 플레이 엑스포 토너먼트
          </div>
        </div>
      </section>
    </TkcContainer>
  )
}

function ModeCard({
  iconSrc,
  title,
  description,
  detailTo,
}: {
  iconSrc: string
  title: string
  description: string
  detailTo: '/console' | '/arcade'
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] md:p-6">
      <div className="flex items-start gap-4">
        {/* icon block (시안의 빨간 네모) */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ff2a00]">
          <img
            src={iconSrc}
            alt=""
            className="h-7 w-7"
            loading="lazy"
            draggable={false}
          />
        </div>

        <div className="min-w-0">
          <div className="text-lg font-semibold text-white md:text-xl">
            {title}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-white/65">
            {description}
          </p>
        </div>
      </div>

      {/* buttons: 모바일 full-width 스택, sm 이상 row */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          asChild
          variant="outline"
          className={cn(
            'w-full rounded-full border-white/15 bg-transparent text-white/80',
            'hover:bg-white/10 hover:text-white sm:w-auto'
          )}
        >
          <Link to={detailTo}>자세히 보기</Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className={cn(
            'w-full rounded-full border-white/15 bg-white/5 text-white/85',
            'hover:bg-white/10 hover:text-white sm:w-auto'
          )}
        >
          <Link to="/apply">대회 신청하기</Link>
        </Button>
      </div>
    </div>
  )
}
