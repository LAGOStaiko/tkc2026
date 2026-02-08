import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useSongs } from '@/lib/api'
import { cn } from '@/lib/utils'
import { LevelBadge } from '@/components/tkc/level-badge'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/(site)/songs')({
  component: SongsPage,
})

type SongStage = {
  division: string
  stageKey: string
  stageLabel: string
  order: number
  songTitle: string
  difficulty: string
  level: number | null
  descriptionMd: string
  revealed: boolean
}

type SongsData = {
  songs?: SongStage[]
}

function SongsPage() {
  const { data, isLoading, isError } = useSongs<SongsData>()
  const title = t('nav.songs')

  const consoleSongs = useMemo(() => {
    if (!data?.songs) return []
    return data.songs
      .filter((s) => s.division === 'console')
      .sort((a, b) => a.order - b.order)
  }, [data])

  const arcadeSongs = useMemo(() => {
    if (!data?.songs) return []
    return data.songs
      .filter((s) => s.division === 'arcade')
      .sort((a, b) => a.order - b.order)
  }, [data])

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${title}`
  }, [title])

  return (
    <TkcSection>
      <TkcPageHeader
        title={title}
        subtitle='결승전까지 가는 여정 —'
      />

      {isError && (
        <p className='text-sm text-destructive'>
          과제곡을 불러오지 못했습니다.
        </p>
      )}

      {isLoading && !data ? (
        <p className='text-sm text-white/60'>과제곡을 불러오는 중...</p>
      ) : null}

      <div className='grid gap-12 md:gap-14 lg:grid-cols-2'>
        <DivisionTimeline
          label='콘솔 부문'
          iconSrc='/branding/console-icon.png'
          songs={consoleSongs}
          emptyText='콘솔 과제곡이 아직 준비되지 않았습니다.'
          isLoading={isLoading}
        />
        <DivisionTimeline
          label='아케이드 부문'
          iconSrc='/branding/arcade-icon.png'
          songs={arcadeSongs}
          emptyText='아케이드 과제곡이 아직 준비되지 않았습니다.'
          isLoading={isLoading}
        />
      </div>
    </TkcSection>
  )
}

function DivisionTimeline({
  label,
  iconSrc,
  songs,
  emptyText,
  isLoading,
}: {
  label: string
  iconSrc: string
  songs: SongStage[]
  emptyText: string
  isLoading: boolean
}) {
  return (
    <div>
      {/* Division header */}
      <div className='mb-8 flex items-center gap-3'>
        <img src={iconSrc} alt='' className='h-7 w-7 rounded-lg object-contain' />
        <h2 className='text-xl font-bold text-white md:text-2xl'>{label}</h2>
      </div>

      {songs.length > 0 ? (
        <div className='relative pl-6 md:pl-8'>
          {/* Vertical connector line */}
          <div className='absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-[#ff2a00]/60 via-white/15 to-[#ff2a00]/80 md:left-[15px]' />

          {/* Stage nodes */}
          <div className='space-y-5 md:space-y-6'>
            {songs.map((song, index) => (
              <TimelineNode
                key={song.stageKey}
                song={song}
                isFinals={
                  /final|결승/i.test(song.stageKey) ||
                  /결승/.test(song.stageLabel) ||
                  index === songs.length - 1
                }
              />
            ))}
          </div>
        </div>
      ) : !isLoading ? (
        <p className='py-4 text-sm text-white/50'>{emptyText}</p>
      ) : null}
    </div>
  )
}

function TimelineNode({
  song,
  isFinals,
}: {
  song: SongStage
  isFinals: boolean
}) {
  const isRevealed = song.revealed && !!song.songTitle

  return (
    <div className='relative'>
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute top-4 z-10',
          isFinals
            ? '-left-6 -ml-[4px] md:-left-8 md:-ml-[4px]'
            : '-left-6 -ml-[1px] md:-left-8 md:-ml-[1px]'
        )}
      >
        <div
          className={cn(
            'rounded-full',
            isFinals
              ? 'h-4 w-4 bg-[#ff2a00] shadow-[0_0_12px_rgba(255,42,0,0.6)]'
              : isRevealed
                ? 'h-2.5 w-2.5 bg-[#ff2a00]'
                : 'h-2.5 w-2.5 border-2 border-white/30 bg-white/10'
          )}
        />
        {isFinals && (
          <div className='absolute -inset-1 animate-pulse rounded-full border border-[#ff2a00]/40' />
        )}
      </div>

      {/* Card */}
      <div
        className={cn(
          'rounded-2xl border p-5 transition-colors duration-300 md:p-6',
          isFinals
            ? 'border-[#ff2a00]/30 bg-[#ff2a00]/[0.06] shadow-[0_0_30px_rgba(255,42,0,0.08)]'
            : isRevealed
              ? 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
              : 'border-white/[0.06] bg-white/[0.015]'
        )}
      >
        {/* Stage label */}
        <div className='flex items-center gap-2.5'>
          <span
            className={cn(
              'text-sm font-bold whitespace-nowrap md:text-base',
              isFinals ? 'text-[#ff2a00]' : 'text-[#ff8c66]'
            )}
          >
            {song.stageLabel}
          </span>
          {!isRevealed && (
            <Badge
              variant='outline'
              className='border-[#ff2a00]/30 bg-[#ff2a00]/5 text-[#ff8c66]'
            >
              추후 공지
            </Badge>
          )}
        </div>

        {/* Song content */}
        <div className='mt-3'>
          {isRevealed ? (
            <div className='space-y-2'>
              <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
                <span
                  className={cn(
                    'font-bold text-white',
                    isFinals ? 'text-lg md:text-xl' : 'text-base md:text-lg'
                  )}
                >
                  {song.songTitle}
                </span>
                {song.difficulty && (
                  <span className='text-sm text-white/70 md:text-base'>
                    {song.difficulty === 'ura' ? '뒷보면' : song.difficulty === 'oni' ? '귀신' : song.difficulty}
                  </span>
                )}
                {song.level != null && (
                  <LevelBadge level={song.level} isUra={song.difficulty === 'ura'} />
                )}
              </div>
              {song.descriptionMd && (
                <p className='text-sm leading-relaxed break-keep text-white/75 md:text-base'>
                  {song.descriptionMd}
                </p>
              )}
            </div>
          ) : (
            <div className='flex items-center gap-2 text-white/30'>
              <span className='text-2xl font-bold tracking-widest'>???</span>
              <span className='text-sm'>추후 공개 예정입니다.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
