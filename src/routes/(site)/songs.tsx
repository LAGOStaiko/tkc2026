import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useSongs } from '@/lib/api'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'
import { TkcRuleSheet, TkcField } from '@/components/tkc-rule-sheet'

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
        subtitle='대회 과제곡을 부문별로 확인하세요.'
      />

      {isError && (
        <p className='text-sm text-destructive'>
          과제곡을 불러오지 못했습니다.
        </p>
      )}

      {isLoading && !data ? (
        <p className='text-sm text-white/60'>과제곡을 불러오는 중...</p>
      ) : null}

      <div className='grid gap-10 md:gap-12 lg:grid-cols-2'>
        <TkcRuleSheet id='console-songs' title='콘솔 부문' className='h-fit'>
          {consoleSongs.length > 0 ? (
            consoleSongs.map((song) => (
              <SongCard key={song.stageKey} song={song} />
            ))
          ) : !isLoading ? (
            <p className='py-4 text-sm text-white/50'>
              콘솔 과제곡이 아직 준비되지 않았습니다.
            </p>
          ) : null}
        </TkcRuleSheet>

        <TkcRuleSheet id='arcade-songs' title='아케이드 부문' className='h-fit'>
          {arcadeSongs.length > 0 ? (
            arcadeSongs.map((song) => (
              <SongCard key={song.stageKey} song={song} />
            ))
          ) : !isLoading ? (
            <p className='py-4 text-sm text-white/50'>
              아케이드 과제곡이 아직 준비되지 않았습니다.
            </p>
          ) : null}
        </TkcRuleSheet>
      </div>
    </TkcSection>
  )
}

function SongCard({ song }: { song: SongStage }) {
  const isRevealed = song.revealed && !!song.songTitle

  return (
    <TkcField
      label={song.stageLabel}
      badges={isRevealed ? undefined : ['추후 공지']}
    >
      {isRevealed ? (
        <div className='space-y-2'>
          <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
            <span className='text-base font-bold text-white md:text-lg'>
              {song.songTitle}
            </span>
            {song.difficulty && (
              <span className='text-sm text-white/70 md:text-base'>
                {song.difficulty}
              </span>
            )}
            {song.level != null && (
              <span className='inline-flex items-center rounded-full bg-[#ff2a00]/10 px-2.5 py-0.5 text-xs font-semibold text-[#ff8c66]'>
                Lv.{song.level}
              </span>
            )}
          </div>
          {song.descriptionMd && (
            <p className='text-sm leading-relaxed break-keep text-white/75 md:text-base'>
              {song.descriptionMd}
            </p>
          )}
        </div>
      ) : (
        <div className='flex items-center gap-2 text-white/40'>
          <span className='text-2xl font-bold tracking-widest'>???</span>
          <span className='text-sm'>추후 공개 예정입니다.</span>
        </div>
      )}
    </TkcField>
  )
}
