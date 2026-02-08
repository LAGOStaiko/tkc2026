import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { cn } from '@/lib/utils'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'
import { SWISS_SONG_POOL } from '@/content/swiss-song-pool'

export const Route = createFileRoute('/(site)/song-pool')({
  component: SongPoolPage,
})

function SongPoolPage() {
  const title = t('nav.songPool')

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${title}`
  }, [title])

  const hasUra = SWISS_SONG_POOL.some((s) => s.ura !== undefined)

  return (
    <TkcSection>
      <TkcPageHeader
        title={title}
        subtitle='아케이드 스위스 스테이지 선곡풀 목록입니다.'
      />

      <div>
        {/* Division header */}
        <div className='mb-6 flex items-center gap-3'>
          <span className='inline-block h-6 w-1 rounded-full bg-[#ff2a00]' />
          <img
            src='/branding/arcade-icon.png'
            alt=''
            className='h-7 w-7 object-contain'
          />
          <h2 className='text-xl font-bold text-white md:text-2xl'>
            아케이드 스위스 스테이지
          </h2>
          <span className='ml-auto text-sm text-white/50'>
            {SWISS_SONG_POOL.length}곡
          </span>
        </div>

        {/* Table */}
        <div className='overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]'>
          <table className='w-full text-sm md:text-base'>
            <thead>
              <tr className='border-b border-white/10 text-left text-xs font-semibold uppercase tracking-wider text-white/50'>
                <th className='px-4 py-3 text-center'>#</th>
                <th className='px-4 py-3'>곡명</th>
                <th className='px-4 py-3 text-center'>おに</th>
                {hasUra && (
                  <th className='px-4 py-3 text-center'>裏おに</th>
                )}
              </tr>
            </thead>
            <tbody>
              {SWISS_SONG_POOL.map((song, index) => (
                <tr
                  key={`${song.title}-${index}`}
                  className={cn(
                    'border-b border-white/[0.06] transition-colors hover:bg-white/[0.04]',
                    index === SWISS_SONG_POOL.length - 1 && 'border-b-0'
                  )}
                >
                  <td className='px-4 py-3 text-center text-white/40'>
                    {index + 1}
                  </td>
                  <td className='px-4 py-3 font-medium break-keep text-white'>
                    {song.title}
                  </td>
                  <td className='px-4 py-3 text-center'>
                    <LevelBadge level={song.oni} />
                  </td>
                  {hasUra && (
                    <td className='px-4 py-3 text-center'>
                      {song.ura !== undefined ? (
                        <LevelBadge level={song.ura} isUra />
                      ) : (
                        <span className='text-white/20'>—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TkcSection>
  )
}

function LevelBadge({
  level,
  isUra,
}: {
  level: number
  isUra?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        isUra
          ? 'bg-purple-500/15 text-purple-400'
          : 'bg-[#ff2a00]/10 text-[#ff8c66]'
      )}
    >
      ★{level}
    </span>
  )
}
