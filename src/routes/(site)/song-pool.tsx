import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { cn } from '@/lib/utils'
import { useSongPools } from '@/lib/api'
import { LevelBadge } from '@/components/tkc/level-badge'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/song-pool')({
  component: SongPoolPage,
})

type PoolEntry = {
  title: string
  difficulty: string
  level: number | null
  note: string
}

type SongPoolsData = {
  consoleFinals?: PoolEntry[]
  arcadeFinals?: PoolEntry[]
  arcadeSwiss?: PoolEntry[]
}

type GroupedSong = {
  title: string
  oni?: number
  ura?: number
}

function groupByTitle(entries: PoolEntry[]): GroupedSong[] {
  const map = new Map<string, { oni?: number; ura?: number }>()
  const order: string[] = []
  for (const e of entries) {
    if (!map.has(e.title)) {
      map.set(e.title, {})
      order.push(e.title)
    }
    const grouped = map.get(e.title)!
    if (e.difficulty === 'oni' && e.level != null) grouped.oni = e.level
    if (e.difficulty === 'ura' && e.level != null) grouped.ura = e.level
  }
  return order.map((title) => ({ title, ...map.get(title)! }))
}

function SongPoolPage() {
  const { data, isLoading, isError } = useSongPools<SongPoolsData>()
  const title = t('nav.songPool')

  const arcadeFinals = useMemo(
    () => groupByTitle(data?.arcadeFinals ?? []),
    [data?.arcadeFinals]
  )
  const arcadeSwiss = useMemo(
    () => groupByTitle(data?.arcadeSwiss ?? []),
    [data?.arcadeSwiss]
  )

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${title}`
  }, [title])

  return (
    <TkcSection>
      <TkcPageHeader
        title={title}
        subtitle='대회에서 사용되는 선곡풀 목록입니다.'
      />

      {isError && (
        <p className='text-sm text-destructive'>
          선곡풀을 불러오지 못했습니다.
        </p>
      )}

      {isLoading && !data ? (
        <p className='text-sm text-white/60'>선곡풀을 불러오는 중...</p>
      ) : arcadeFinals.length === 0 && arcadeSwiss.length === 0 ? (
        <p className='text-sm text-white/40'>
          표시할 선곡풀이 없습니다.
        </p>
      ) : (
        <div className='space-y-14'>
          <SongPoolSection
            label='아케이드 결선'
            iconSrc='/branding/arcade-icon.png'
            pool={arcadeFinals}
          />
          <SongPoolSection
            label='아케이드 스위스 스테이지'
            iconSrc='/branding/arcade-icon.png'
            pool={arcadeSwiss}
          />
        </div>
      )}
    </TkcSection>
  )
}

function SongPoolSection({
  label,
  iconSrc,
  pool,
}: {
  label: string
  iconSrc: string
  pool: GroupedSong[]
}) {
  const hasUra = pool.some((s) => s.ura !== undefined)

  if (pool.length === 0) return null

  return (
    <div>
      <div className='mb-6 flex items-center gap-3'>
        <img src={iconSrc} alt='' className='h-7 w-7 rounded-lg object-contain' />
        <h2 className='text-xl font-bold text-white md:text-2xl'>{label}</h2>
        <span className='ml-auto text-sm text-white/50'>{pool.length}곡</span>
      </div>

      <div className='overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]'>
        <table className='w-full text-sm md:text-base'>
          <thead>
            <tr className='border-b border-white/10 text-left text-xs font-semibold uppercase tracking-wider text-white/50'>
              <th className='px-4 py-3 text-center'>#</th>
              <th className='px-4 py-3'>곡명</th>
              <th className='px-4 py-3 text-center'>귀신</th>
              {hasUra && <th className='px-4 py-3 text-center'>뒷보면</th>}
            </tr>
          </thead>
          <tbody>
            {pool.map((song, index) => (
              <tr
                key={`${song.title}-${index}`}
                className={cn(
                  'border-b border-white/[0.06] transition-colors hover:bg-white/[0.04]',
                  index === pool.length - 1 && 'border-b-0'
                )}
              >
                <td className='px-4 py-3 text-center text-white/40'>
                  {index + 1}
                </td>
                <td className='px-4 py-3 font-medium break-keep text-white'>
                  {song.title}
                </td>
                <td className='px-4 py-3 text-center'>
                  {song.oni != null ? (
                    <LevelBadge level={song.oni} />
                  ) : (
                    <span className='text-white/20'>—</span>
                  )}
                </td>
                {hasUra && (
                  <td className='px-4 py-3 text-center'>
                    {song.ura != null ? (
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
  )
}

