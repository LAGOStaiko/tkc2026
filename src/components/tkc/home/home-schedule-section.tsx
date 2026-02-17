import { Link } from '@tanstack/react-router'
import { FadeIn } from '@/components/tkc/guide-shared'
import { HomeScheduleStrip } from './home-schedule-strip'
import { HomeSectionHead } from './home-section-head'

export function HomeScheduleSection() {
  return (
    <section className='mt-10 sm:mt-10 md:mt-14'>
      <FadeIn>
        <div className='relative'>
          <HomeSectionHead label='Schedule' title='일정'>
            <Link
              to='/schedule'
              className='text-sm text-white/55 transition-colors hover:text-[#e74c3c]'
            >
              자세히 보기 →
            </Link>
          </HomeSectionHead>
        </div>
      </FadeIn>
      <FadeIn delay={100}>
        <HomeScheduleStrip />
      </FadeIn>
    </section>
  )
}
