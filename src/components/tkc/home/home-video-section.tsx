import { useState } from 'react'
import { FadeIn } from '@/components/tkc/guide-shared'
import { HomeSectionHead } from './home-section-head'

const HOME_YOUTUBE_ID = '8G2rhLcUQAA'
const HOME_YOUTUBE_EMBED = `https://www.youtube-nocookie.com/embed/${HOME_YOUTUBE_ID}?rel=0&modestbranding=1`
const YT_THUMB = `https://i.ytimg.com/vi/${HOME_YOUTUBE_ID}/hqdefault.jpg`

export function HomeVideoSection() {
  return (
    <section className='mt-16 sm:mt-16 md:mt-20'>
      <FadeIn>
        <HomeSectionHead label='Video' title='영상' />
      </FadeIn>
      <FadeIn delay={100}>
        <div className='relative'>
          <YouTubeEmbed />
        </div>
      </FadeIn>
    </section>
  )
}

function YouTubeEmbed() {
  const [playing, setPlaying] = useState(false)

  return (
    <div className='tkc-motion-surface overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] hover:border-[#2a2a2a]'>
      <div className='aspect-video bg-black'>
        {playing ? (
          <iframe
            className='h-full w-full'
            src={`${HOME_YOUTUBE_EMBED}&autoplay=1`}
            title='TKC2026 Opening Movie'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            referrerPolicy='strict-origin-when-cross-origin'
            allowFullScreen
          />
        ) : (
          <button
            type='button'
            onClick={() => setPlaying(true)}
            className='group relative h-full w-full cursor-pointer'
            aria-label='영상 재생'
          >
            <img
              src={YT_THUMB}
              alt='TKC2026 Opening Movie'
              className='h-full w-full object-cover'
              loading='lazy'
            />
            <div className='absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/15' />
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='flex size-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110 sm:size-18'>
                <svg
                  viewBox='0 0 24 24'
                  fill='#111'
                  className='ml-1 size-7 sm:size-8'
                >
                  <path d='M8 5v14l11-7z' />
                </svg>
              </div>
            </div>
          </button>
        )}
      </div>
      <div className='border-t border-[#1e1e1e] px-6 py-5'>
        <div className='text-[15px] font-semibold text-white/90'>
          TAIKO LABS
        </div>
        <div className='mt-0.5 text-sm leading-[1.55] break-keep text-white/55'>
          대회 소개 영상을 확인해 보세요.
        </div>
      </div>
    </div>
  )
}
