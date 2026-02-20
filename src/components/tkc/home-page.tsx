import { useSite } from '@/lib/api'
import { HomeDivisionsSection } from '@/components/tkc/home/home-divisions-section'
import {
  HomeFooterStrip,
  type HomePartner,
} from '@/components/tkc/home/home-footer-strip'
import { HomeHeroSection } from '@/components/tkc/home/home-hero-section'
import { HomeRewardsSection } from '@/components/tkc/home/home-rewards-section'
import { HomeScheduleSection } from '@/components/tkc/home/home-schedule-section'
import { HomeVideoSection } from '@/components/tkc/home/home-video-section'
import { sanitizeImgSrc } from '@/lib/sanitize-url'

type SiteData = {
  partners?: HomePartner[]
}

const toPartnerKey = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase()

const pickNonEmpty = (...values: Array<string | undefined>) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }
  return undefined
}

const pickLogoUrl = (...values: Array<string | undefined>) => {
  for (const value of values) {
    const safe = sanitizeImgSrc(value)
    if (safe.length > 0) return safe
  }
  return undefined
}

const PARTNER_NAME_ALIASES: Record<string, string> = {
  [toPartnerKey('\ubc18\ub2e4\uc774\ub0a8\ucf54\uc775\uc2a4\ud53c\ub9ac\uc5b8\uc2a4')]:
    'BANDAI NAMCO',
  [toPartnerKey('\ubc18\ub2e4\uc774\ub0a8\ucf54\uc5d4\ud130\ud14c\uc774\uba3c\ud2b8\ucf54\ub9ac\uc544')]:
    'BANDAI NAMCO',
  [toPartnerKey('\ubc18\ub2e4\uc774\ub0a8\ucf54\uc5d4\ud130\ud14c\uc778\uba3c\ud2b8\ucf54\ub9ac\uc544')]:
    'BANDAI NAMCO',
  [toPartnerKey('Bandai Namco Experience')]: 'BANDAI NAMCO',
  [toPartnerKey('Bandai Namco Entertainment Korea')]: 'BANDAI NAMCO',
  [toPartnerKey('\uc548\ub2e4\ubbf8\ub85c')]: 'ANDAMIRO',
  [toPartnerKey('\ud0c0\uc774\ucf54\ub7a9\uc2a4')]: 'TAIKO LABS',
}

const FALLBACK_PARTNERS: HomePartner[] = [
  {
    order: 10,
    name: 'ANDAMIRO',
    logoUrl: '/branding/partners/andamiro.png',
  },
  {
    order: 20,
    name: 'BANDAI NAMCO',
    logoUrl: '/branding/partners/bandai-namco.png',
  },
  {
    order: 30,
    name: 'TAIKO LABS',
    logoUrl: '/branding/partners/taiko-labs.png',
  },
]

export function HomePage() {
  const { data: site } = useSite<SiteData>()
  const resolvePartnerName = (name: string) =>
    PARTNER_NAME_ALIASES[toPartnerKey(name)] ?? name.trim()
  const fallbackByName = new Map(
    FALLBACK_PARTNERS.map((partner) => [toPartnerKey(partner.name), partner])
  )

  const partners: HomePartner[] = site?.partners?.length
    ? Array.from(
        site.partners
          .reduce((acc, partner) => {
            const canonicalName = resolvePartnerName(partner.name)
            const canonicalKey = toPartnerKey(canonicalName)
            const fallback = fallbackByName.get(canonicalKey)
            const existing = acc.get(canonicalKey)

            acc.set(canonicalKey, {
              ...fallback,
              ...existing,
              ...partner,
              name: canonicalName,
              logoUrl: pickLogoUrl(
                partner.logoUrl,
                existing?.logoUrl,
                fallback?.logoUrl
              ),
              href: pickNonEmpty(partner.href, existing?.href, fallback?.href),
              order: partner.order ?? existing?.order ?? fallback?.order,
            })
            return acc
          }, new Map<string, HomePartner>())
          .values()
      )
    : FALLBACK_PARTNERS

  return (
    <div>
      <HomeHeroSection />
      <HomeDivisionsSection />
      <HomeScheduleSection />
      <HomeRewardsSection />
      <HomeVideoSection />
      <HomeFooterStrip partners={partners} />
    </div>
  )
}
