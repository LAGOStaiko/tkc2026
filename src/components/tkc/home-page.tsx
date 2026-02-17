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

type SiteData = {
  partners?: HomePartner[]
}

const FALLBACK_PARTNERS: HomePartner[] = [
  { order: 10, name: 'ANDAMIRO' },
  { order: 20, name: 'BANDAI NAMCO' },
  { order: 30, name: 'TAIKO LABS' },
]

export function HomePage() {
  const { data: site } = useSite<SiteData>()

  const partners: HomePartner[] = site?.partners?.length
    ? site.partners
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
