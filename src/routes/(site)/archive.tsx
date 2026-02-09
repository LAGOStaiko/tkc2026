import { useEffect, useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  PAST_TOURNAMENTS,
  type PastTournament,
  type TournamentPhoto,
} from '@/content/archive'
import { t } from '@/text'
import { GlassCard } from '@/components/tkc/glass-card'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/archive')({
  component: ArchivePage,
})

/* ------------------------------------------------------------------ */
/*  PhotoCell                                                          */
/* ------------------------------------------------------------------ */

function PhotoCell({
  index,
  photo,
  accent,
  onClick,
}: {
  index: number
  photo: TournamentPhoto
  accent: string
  onClick: () => void
}) {
  const hue = (index * 53 + 200) % 360

  return (
    <button
      type='button'
      onClick={onClick}
      className='group relative aspect-[4/3] overflow-hidden rounded-lg border border-white/5 transition-all hover:-translate-y-0.5 hover:border-white/15 focus-visible:ring-2 focus-visible:ring-[#ff2a00]/50 focus-visible:outline-none'
      style={{
        background: photo.url
          ? '#111'
          : `linear-gradient(135deg, hsl(${hue},12%,11%), hsl(${hue},8%,7%))`,
      }}
    >
      {photo.url ? (
        <img
          src={photo.url}
          alt={photo.caption}
          className='size-full object-cover'
        />
      ) : (
        <svg viewBox='0 0 200 150' className='size-full opacity-12' aria-hidden>
          <circle
            cx='100'
            cy='70'
            r='38'
            fill='none'
            stroke={accent}
            strokeWidth='1.2'
            opacity='0.5'
          />
          <circle
            cx='100'
            cy='70'
            r='24'
            fill='none'
            stroke={accent}
            strokeWidth='0.8'
            opacity='0.35'
          />
          <circle cx='100' cy='70' r='10' fill={accent} opacity='0.2' />
          <text
            x='100'
            y='76'
            textAnchor='middle'
            dominantBaseline='middle'
            fill={accent}
            fontSize='18'
            fontFamily='serif'
            opacity='0.35'
          >
            太
          </text>
        </svg>
      )}

      {/* index badge */}
      <span className='absolute top-2 right-2 rounded bg-black/55 px-1.5 py-0.5 font-mono text-xs tracking-wider text-white/50 backdrop-blur-sm'>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* caption gradient */}
      <span className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-2.5 pt-5 pb-2'>
        <span className='text-xs break-keep text-white/70'>
          {photo.caption}
        </span>
      </span>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Lightbox                                                           */
/* ------------------------------------------------------------------ */

function Lightbox({
  photos,
  index,
  accent,
  onClose,
  onNav,
}: {
  photos: TournamentPhoto[]
  index: number | null
  accent: string
  onClose: () => void
  onNav: (dir: -1 | 1) => void
}) {
  useEffect(() => {
    if (index === null) return
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onNav(-1)
      if (e.key === 'ArrowRight') onNav(1)
    }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handler)
    }
  }, [index, onClose, onNav])

  if (index === null) return null
  const p = photos[index]

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      role='dialog'
      aria-modal='true'
      onClick={onClose}
      className='fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/92 backdrop-blur-2xl motion-safe:animate-[tkc-fade-in_0.2s_ease]'
    >
      {/* close button */}
      <button
        type='button'
        onClick={onClose}
        className='absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-lg text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none'
        aria-label='닫기'
      >
        ✕
      </button>
      {/* image area */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        onClick={(e) => e.stopPropagation()}
        className='flex aspect-[4/3] w-[min(82vw,680px)] items-center justify-center overflow-hidden rounded-xl'
        style={{
          background: p.url
            ? '#111'
            : 'linear-gradient(135deg,#1a1a1f,#111115)',
          border: `1px solid ${accent}22`,
        }}
      >
        {p.url ? (
          <img
            src={p.url}
            alt={p.caption}
            className='size-full object-contain'
          />
        ) : (
          <div className='text-center opacity-25'>
            <div className='mb-2 text-4xl'>📷</div>
            <div className='text-sm break-keep text-white/60'>{p.caption}</div>
          </div>
        )}
      </div>

      {/* nav controls */}
      <div className='mt-4 flex items-center gap-5'>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            onNav(-1)
          }}
          className='flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none'
          aria-label='이전'
        >
          ‹
        </button>
        <span className='font-mono text-xs tracking-widest text-white/50'>
          {index + 1} / {photos.length}
        </span>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            onNav(1)
          }}
          className='flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none'
          aria-label='다음'
        >
          ›
        </button>
      </div>

      <p className='mt-2.5 text-sm break-keep text-white/60'>{p.caption}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  TournamentCard                                                     */
/* ------------------------------------------------------------------ */

function TournamentCard({ tournament: tm }: { tournament: PastTournament }) {
  const [lbIdx, setLbIdx] = useState<number | null>(null)

  const handleNav = useCallback(
    (dir: -1 | 1) => {
      setLbIdx((prev) =>
        prev === null
          ? null
          : (prev + dir + tm.photos.length) % tm.photos.length
      )
    },
    [tm.photos.length]
  )

  const handleClose = useCallback(() => setLbIdx(null), [])

  const meta = [
    { icon: '📅', value: tm.date },
    { icon: '📍', value: tm.venue },
    { icon: '👥', value: `${tm.participants}명` },
    { icon: '🎵', value: tm.finalSong },
  ]

  return (
    <>
      <article className='motion-safe:animate-[tkc-slide-up_0.65s_cubic-bezier(0.16,1,0.3,1)_both]'>
        {/* ── Year & Title ── */}
        <div className='mb-6'>
          <div className='flex items-baseline gap-3.5'>
            <span
              className='font-mono text-5xl leading-none font-bold opacity-15 md:text-6xl'
              style={{ color: tm.accent, letterSpacing: -2 }}
            >
              {tm.year}
            </span>
            <div>
              <h2 className='text-sm font-normal tracking-wider break-keep text-white/70'>
                {tm.titleKr}
              </h2>
              <h3 className='mt-0.5 font-mono text-xs font-normal tracking-wider text-white/55 uppercase'>
                {tm.title}
              </h3>
            </div>
          </div>

          <div className='mt-3 flex flex-wrap gap-x-5 gap-y-1 pl-0.5'>
            {meta.map((m) => (
              <span
                key={m.value}
                className='flex items-center gap-1 text-xs text-white/50'
              >
                <span className='text-xs'>{m.icon}</span>
                {m.value}
              </span>
            ))}
          </div>
        </div>

        {/* ── Champion / Runner-up ── */}
        <div className='mb-4 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/[0.03] sm:grid-cols-2'>
          {/* Champion */}
          <div
            className='relative overflow-hidden px-6 py-7 md:px-7 md:py-8'
            style={{
              background: `linear-gradient(155deg, ${tm.accent}12, ${tm.accent}04)`,
            }}
          >
            <div
              className='absolute -top-4 -right-1.5 text-[90px] leading-none opacity-[0.035]'
              aria-hidden
            >
              🏆
            </div>
            <div
              className='mb-3.5 font-mono text-xs tracking-[3px] uppercase opacity-65'
              style={{ color: tm.accent }}
            >
              Champion
            </div>
            <div className='mb-2.5 text-[42px]'>🥇</div>
            <div className='text-xl font-extrabold text-[#f0f0f0]'>
              {tm.champion.name}
            </div>
            <div className='mt-0.5 text-xs text-white/50'>
              {tm.champion.title}
            </div>
          </div>

          {/* Runner-up */}
          <div className='relative overflow-hidden bg-white/[0.03] px-6 py-7 md:px-7 md:py-8'>
            <div
              className='absolute -top-4 -right-1.5 text-[90px] leading-none opacity-[0.025]'
              aria-hidden
            >
              🥈
            </div>
            <div className='mb-3.5 font-mono text-xs tracking-[3px] text-white/55 uppercase'>
              Runner-up
            </div>
            <div className='mb-2.5 text-[42px]'>🥈</div>
            <div className='text-xl font-extrabold text-[#B0B0B0]'>
              {tm.runnerUp.name}
            </div>
            <div className='mt-0.5 text-xs text-white/50'>
              {tm.runnerUp.title}
            </div>
          </div>
        </div>

        {/* ── 3rd / 4th ── */}
        <div className='mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2'>
          {tm.top4.map((p) => (
            <div
              key={p.rank}
              className='flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3'
            >
              <span className='text-xl'>{p.rank === 3 ? '🥉' : '4️⃣'}</span>
              <div>
                <div
                  className='text-sm font-bold'
                  style={{
                    color: p.rank === 3 ? '#CD7F32' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {p.name}
                </div>
                <div className='font-mono text-xs tracking-wider text-white/55'>
                  {p.rank === 3 ? '3RD PLACE' : '4TH PLACE'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Gallery ── */}
        <div>
          <div className='mb-4 flex items-center gap-2.5'>
            <div
              className='h-px w-[18px]'
              style={{ background: `${tm.accent}33` }}
            />
            <span className='font-mono text-xs tracking-[3px] text-white/55 uppercase'>
              Gallery
            </span>
            <div className='h-px flex-1 bg-white/[0.035]' />
            <span className='font-mono text-xs tracking-wider text-white/55'>
              {tm.photos.length} photos
            </span>
          </div>

          <div className='grid grid-cols-1 gap-1.5 sm:grid-cols-2 md:grid-cols-3'>
            {tm.photos.map((photo, i) => (
              <PhotoCell
                key={photo.id}
                index={i}
                photo={photo}
                accent={tm.accent}
                onClick={() => setLbIdx(i)}
              />
            ))}
          </div>
        </div>
      </article>

      <Lightbox
        photos={tm.photos}
        index={lbIdx}
        accent={tm.accent}
        onClose={handleClose}
        onNav={handleNav}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Coming Next                                                        */
/* ------------------------------------------------------------------ */

function ComingNext() {
  return (
    <GlassCard
      className='border-[#E63B2E]/[0.07] p-10 text-center motion-safe:animate-[tkc-slide-up_0.5s_ease_both]'
      style={{
        background:
          'linear-gradient(135deg, rgba(230,59,46,0.045), rgba(230,59,46,0.01))',
      }}
    >
      <div className='mb-3.5 font-mono text-xs tracking-[4px] text-[#E63B2E] uppercase opacity-55'>
        Coming Next
      </div>
      <h2 className='text-2xl font-extrabold text-[#f0f0f0]'>TKC 2026</h2>
      <p className='mt-2 text-sm text-white/50 italic'>현실에서 기적으로 —</p>
    </GlassCard>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function ArchivePage() {
  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('nav.archive')}`
  }, [])

  return (
    <TkcSection>
      <TkcPageHeader
        title='대회 아카이브'
        subtitle='꿈의 시작부터, 현실에서 기적으로 — 우리가 함께 만들어온 무대의 기록'
      />

      <div className='space-y-10 md:space-y-16'>
        {PAST_TOURNAMENTS.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>

      <ComingNext />
    </TkcSection>
  )
}
