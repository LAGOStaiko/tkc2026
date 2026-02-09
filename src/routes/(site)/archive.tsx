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
      <span className='absolute top-2.5 right-2.5 rounded bg-black/55 px-2 py-0.5 font-mono text-xs tracking-wider text-white/60 backdrop-blur-sm'>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* caption gradient */}
      <span className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-6 pb-2.5'>
        <span className='text-sm break-keep text-white/80'>
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
        className='absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-lg text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none'
        aria-label='닫기'
      >
        ✕
      </button>
      {/* image area */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        onClick={(e) => e.stopPropagation()}
        className='flex aspect-[4/3] w-[min(88vw,720px)] items-center justify-center overflow-hidden rounded-xl'
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
            <div className='mb-2 text-5xl'>📷</div>
            <div className='text-base break-keep text-white/65'>
              {p.caption}
            </div>
          </div>
        )}
      </div>

      {/* nav controls */}
      <div className='mt-5 flex items-center gap-6'>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            onNav(-1)
          }}
          className='flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-lg text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none'
          aria-label='이전'
        >
          ‹
        </button>
        <span className='font-mono text-sm tracking-widest text-white/60'>
          {index + 1} / {photos.length}
        </span>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            onNav(1)
          }}
          className='flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-lg text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none'
          aria-label='다음'
        >
          ›
        </button>
      </div>

      <p className='mt-3 text-base break-keep text-white/70'>{p.caption}</p>
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
    ...(tm.finalSong ? [{ icon: '🎵', value: tm.finalSong }] : []),
  ]

  return (
    <>
      <article className='motion-safe:animate-[tkc-slide-up_0.65s_cubic-bezier(0.16,1,0.3,1)_both]'>
        {/* ── Year & Title ── */}
        <div className='mb-8'>
          <div className='flex items-baseline gap-4'>
            <span
              className='font-mono text-6xl leading-none font-extrabold tracking-[-3px] opacity-12 select-none md:text-7xl'
              style={{ color: tm.accent }}
            >
              {tm.year}
            </span>
            <div>
              <h2 className='text-lg font-bold tracking-tight break-keep text-white/90 md:text-xl'>
                {tm.titleKr}
              </h2>
              <p className='mt-0.5 font-mono text-sm tracking-wider text-white/65 uppercase'>
                {tm.title}
              </p>
              {tm.subtitle && (
                <p className='mt-1 text-sm text-white/50 italic'>
                  {tm.subtitle}
                </p>
              )}
            </div>
          </div>

          <div className='mt-4 flex flex-wrap gap-x-6 gap-y-1.5 pl-0.5'>
            {meta.map((m) => (
              <span
                key={m.value}
                className='flex items-center gap-1.5 text-sm text-white/65'
              >
                <span className='text-sm'>{m.icon}</span>
                {m.value}
              </span>
            ))}
          </div>
        </div>

        {/* ── Champion / Runner-up ── */}
        <div className='mb-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/[0.03] sm:grid-cols-2'>
          {/* Champion */}
          <div
            className='relative overflow-hidden px-7 py-8 md:px-8 md:py-10'
            style={{
              background: `linear-gradient(155deg, ${tm.accent}12, ${tm.accent}04)`,
            }}
          >
            <div
              className='absolute -top-4 -right-1.5 text-[100px] leading-none opacity-[0.035]'
              aria-hidden
            >
              🏆
            </div>
            <div
              className='mb-4 font-mono text-sm tracking-[3px] uppercase opacity-70'
              style={{ color: tm.accent }}
            >
              Champion
            </div>
            <div className='mb-3 text-5xl'>🥇</div>
            <div className='text-2xl font-extrabold text-[#f0f0f0]'>
              {tm.champion.name}
            </div>
            <div className='mt-1 text-sm text-white/70'>
              {tm.champion.title}
            </div>
          </div>

          {/* Runner-up */}
          <div className='relative overflow-hidden bg-white/[0.03] px-7 py-8 md:px-8 md:py-10'>
            <div
              className='absolute -top-4 -right-1.5 text-[100px] leading-none opacity-[0.025]'
              aria-hidden
            >
              🥈
            </div>
            <div className='mb-4 font-mono text-sm tracking-[3px] text-white/65 uppercase'>
              Runner-up
            </div>
            <div className='mb-3 text-5xl'>🥈</div>
            <div className='text-2xl font-extrabold text-[#B0B0B0]'>
              {tm.runnerUp.name}
            </div>
            <div className='mt-1 text-sm text-white/70'>
              {tm.runnerUp.title}
            </div>
          </div>
        </div>

        {/* ── Note (e.g. team results) ── */}
        {tm.note && (
          <div className='mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4'>
            <span className='text-base text-white/75'>{tm.note}</span>
          </div>
        )}

        {/* ── Gallery ── */}
        {tm.photos.length > 0 && (
          <div>
            <div className='mb-5 flex items-center gap-3'>
              <div
                className='h-px w-5'
                style={{ background: `${tm.accent}44` }}
              />
              <span className='font-mono text-sm tracking-[3px] text-white/60 uppercase'>
                Gallery
              </span>
              <div className='h-px flex-1 bg-white/[0.05]' />
              <span className='font-mono text-sm tracking-wider text-white/60'>
                {tm.photos.length} photos
              </span>
            </div>

            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3'>
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
        )}
      </article>

      {tm.photos.length > 0 && (
        <Lightbox
          photos={tm.photos}
          index={lbIdx}
          accent={tm.accent}
          onClose={handleClose}
          onNav={handleNav}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Coming Next                                                        */
/* ------------------------------------------------------------------ */

function ComingNext() {
  return (
    <GlassCard
      className='border-[#ff2a00]/[0.08] p-12 text-center motion-safe:animate-[tkc-slide-up_0.5s_ease_both]'
      style={{
        background:
          'linear-gradient(135deg, rgba(255,42,0,0.04), rgba(255,42,0,0.01))',
      }}
    >
      <div className='mb-4 font-mono text-sm tracking-[4px] text-[#ff2a00] uppercase opacity-70'>
        Coming Next
      </div>
      <h2 className='text-3xl font-extrabold text-[#f0f0f0]'>TKC 2026</h2>
      <p className='mt-2.5 text-base text-white/60 italic'>
        현실에서 기적으로 —
      </p>
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

      <div className='space-y-16 md:space-y-24'>
        {PAST_TOURNAMENTS.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>

      <ComingNext />
    </TkcSection>
  )
}
