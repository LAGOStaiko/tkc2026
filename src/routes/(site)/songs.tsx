import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useSongs } from '@/lib/api'
import { cn } from '@/lib/utils'
import { PageHero, TkcSection } from '@/components/tkc/layout'

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

const DIFF_LABEL: Record<string, string> = {
  ura: '뒷보면',
  oni: '귀신',
}

function diffBadgeClass(level: number | null): string {
  if (level == null) return 'bg-[#e86e3a]/10 text-[#e86e3a]'
  if (level >= 10)
    return 'bg-[#e8403a]/15 text-[#e8403a] shadow-[0_0_6px_rgba(232,64,58,0.08)]'
  if (level >= 9) return 'bg-[#e8403a]/10 text-[#e8403a]'
  return 'bg-[#e86e3a]/10 text-[#e86e3a]'
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
    <TkcSection className='space-y-8'>
      <PageHero
        badge='TASK SONGS'
        title={title}
        subtitle='각 단계별 과제곡 목록입니다.'
      />

      {isError && (
        <p className='text-sm text-destructive'>
          과제곡을 불러오지 못했습니다.
        </p>
      )}

      {isLoading && !data ? (
        <p className='text-sm text-white/60'>과제곡을 불러오는 중...</p>
      ) : null}

      <div className='grid gap-14 lg:grid-cols-2'>
        <DivisionColumn
          label='콘솔 부문'
          variant='console'
          songs={consoleSongs}
          isLoading={isLoading}
        />
        <DivisionColumn
          label='아케이드 부문'
          variant='arcade'
          songs={arcadeSongs}
          isLoading={isLoading}
        />
      </div>
    </TkcSection>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Division Column                                                    */
/* ════════════════════════════════════════════════════════════════════ */

function DivisionColumn({
  label,
  variant,
  songs,
  isLoading,
}: {
  label: string
  variant: 'console' | 'arcade'
  songs: SongStage[]
  isLoading: boolean
}) {
  const accent = variant === 'console' ? '#e86e3a' : '#f5a623'

  return (
    <div>
      {/* Column header */}
      <div className='mb-8 flex items-center gap-3'>
        <div
          className='flex size-9 shrink-0 items-center justify-center rounded-lg'
          style={{
            background: `${accent}1a`,
            border: `1px solid ${accent}33`,
            boxShadow: `0 0 12px ${accent}0f`,
          }}
        >
          <span
            className='size-2 rounded-full'
            style={{ backgroundColor: accent }}
          />
        </div>
        <h2 className='text-[22px] font-extrabold tracking-tight text-white'>
          {label}
        </h2>
      </div>

      {/* Timeline */}
      {songs.length > 0 ? (
        <div className='relative pl-7'>
          <div className='absolute left-[5px] top-1.5 bottom-1.5 w-0.5 bg-[#1e1e1e]' />

          <div className='space-y-6'>
            {songs.map((song, index) => {
              const isRevealed = song.revealed && !!song.songTitle
              const isFinals =
                /final|결승/i.test(song.stageKey) ||
                /결승/.test(song.stageLabel) ||
                index === songs.length - 1

              return (
                <TaskCard
                  key={song.stageKey}
                  song={song}
                  isRevealed={isRevealed}
                  isFinals={!isRevealed && isFinals}
                />
              )
            })}
          </div>
        </div>
      ) : !isLoading ? (
        <p className='py-4 text-sm text-white/50'>
          과제곡이 아직 준비되지 않았습니다.
        </p>
      ) : null}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Task Card                                                          */
/* ════════════════════════════════════════════════════════════════════ */

function TaskCard({
  song,
  isRevealed,
  isFinals,
}: {
  song: SongStage
  isRevealed: boolean
  isFinals: boolean
}) {
  return (
    <div className='relative'>
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute -left-7 top-[18px] z-10 size-3 rounded-full',
          isRevealed
            ? 'border-2 border-[#0a0a0a] bg-[#f5a623] shadow-[0_0_0_3px_rgba(245,166,35,0.15),0_0_10px_rgba(245,166,35,0.2)]'
            : isFinals
              ? 'border-2 border-[#0a0a0a] bg-[#e86e3a] shadow-[0_0_0_3px_rgba(232,110,58,0.2),0_0_12px_rgba(232,110,58,0.3)]'
              : 'border-2 border-[#808080]/50 bg-transparent'
        )}
      />

      {/* Card */}
      <div
        className={cn(
          'overflow-hidden rounded-[14px] bg-[#111] transition-all duration-300',
          isRevealed
            ? 'border border-[#f5a623]/15 border-l-[3px] border-l-[#f5a623] hover:-translate-y-0.5 hover:border-[#f5a623]/30'
            : isFinals
              ? 'relative border border-[#e86e3a]/20 border-l-[3px] border-l-[#e86e3a] hover:-translate-y-0.5 hover:border-[#e86e3a]/35'
              : 'border border-[#1e1e1e] hover:border-[#2a2a2a]'
        )}
      >
        {isFinals && (
          <div className='pointer-events-none absolute inset-0 rounded-[14px] bg-gradient-to-br from-[#e86e3a]/[0.03] to-transparent' />
        )}

        <div className='relative p-5'>
          {/* Stage label */}
          <div className='mb-2.5 flex items-center gap-2'>
            <span
              className={cn(
                'text-sm font-semibold break-keep',
                isRevealed ? 'text-[#f5a623]' : 'text-[#e86e3a]'
              )}
            >
              {song.stageLabel}
            </span>
            {!isRevealed && (
              <span className='rounded bg-[#e86e3a]/[0.08] px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-[#e86e3a]'>
                추후 공지
              </span>
            )}
          </div>

          {/* Song content */}
          {isRevealed ? (
            <div>
              <div className='flex flex-wrap items-center gap-2.5'>
                <span className='text-[22px] font-extrabold leading-tight text-white'>
                  {song.songTitle}
                </span>
                {song.difficulty && (
                  <span className='inline-flex items-center gap-1.5 text-sm font-medium text-[#808080]'>
                    {DIFF_LABEL[song.difficulty] ?? song.difficulty}
                    {song.level != null && (
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 font-mono text-xs font-bold',
                          diffBadgeClass(song.level)
                        )}
                      >
                        ★{song.level}
                      </span>
                    )}
                  </span>
                )}
              </div>
              {song.descriptionMd && (
                <p className='mt-1 text-[15px] text-[#808080] break-keep'>
                  {song.descriptionMd}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className='font-mono text-2xl font-bold tracking-[2px] text-[#808080]/40'>
                ???
              </p>
              <p className='mt-1 text-sm text-[#808080]/60'>
                추후 공개 예정입니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
