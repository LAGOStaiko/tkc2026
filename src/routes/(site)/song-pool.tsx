import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useSongPools } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'
import { LevelBadge } from '@/components/tkc/level-badge'

export const Route = createFileRoute('/(site)/song-pool')({
  component: SongPoolPage,
})

type PoolEntry = {
  title: string
  difficulty: string
  level: number | null
  note: string
  revealed?: boolean
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
  revealed: boolean
}

function groupByTitle(entries: PoolEntry[]): GroupedSong[] {
  const map = new Map<string, { oni?: number; ura?: number }>()
  const order: string[] = []
  const hidden: GroupedSong[] = []
  for (const e of entries) {
    if (e.revealed === false) {
      hidden.push({ title: '', revealed: false })
      continue
    }
    if (!map.has(e.title)) {
      map.set(e.title, {})
      order.push(e.title)
    }
    const grouped = map.get(e.title)!
    if (e.difficulty === 'oni' && e.level != null) grouped.oni = e.level
    if (e.difficulty === 'ura' && e.level != null) grouped.ura = e.level
  }
  return [
    ...order.map((title) => ({ title, revealed: true, ...map.get(title)! })),
    ...hidden,
  ]
}

function SongPoolPage() {
  const { data, isLoading, isError } = useSongPools<SongPoolsData>()
  const title = t('nav.songPool')

  const arcadeSwiss = useMemo(
    () => groupByTitle(data?.arcadeSwiss ?? []),
    [data?.arcadeSwiss]
  )
  const arcadeFinals = useMemo(
    () => groupByTitle(data?.arcadeFinals ?? []),
    [data?.arcadeFinals]
  )
  const consoleFinals = useMemo(
    () => groupByTitle(data?.consoleFinals ?? []),
    [data?.consoleFinals]
  )

  const tabs = useMemo(
    () =>
      [
        {
          key: 'arcadeSwiss',
          label: '아케이드 스위스',
          iconSrc: '/branding/arcade-icon.png',
          pool: arcadeSwiss,
        },
        {
          key: 'arcadeFinals',
          label: '아케이드 결선',
          iconSrc: '/branding/arcade-icon.png',
          pool: arcadeFinals,
        },
        {
          key: 'consoleFinals',
          label: '콘솔 결선',
          iconSrc: '/branding/console-icon.png',
          pool: consoleFinals,
        },
      ] as const,
    [arcadeSwiss, arcadeFinals, consoleFinals]
  )

  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['key']>(
    tabs[0].key
  )
  const active = tabs.find((t) => t.key === activeTab) ?? tabs[0]
  const isEmpty = tabs.every((t) => t.pool.length === 0)

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${title}`
  }, [title])

  return (
    <TkcSection className='space-y-8'>
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
      ) : isEmpty ? (
        <div className='rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 text-center'>
          <p className='text-sm text-white/50'>표시할 선곡풀이 없습니다.</p>
          <p className='mt-1 text-xs text-white/30'>
            시트 데이터 또는 difficulty 값(oni/ura)을 확인해 주세요.
          </p>
        </div>
      ) : (
        <div className='space-y-6'>
          {/* Tab buttons */}
          <div className='flex gap-2 overflow-x-auto'>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type='button'
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors',
                  activeTab === tab.key
                    ? 'border-[#ff2a00]/40 bg-[#ff2a00]/10 text-white'
                    : 'border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white/70'
                )}
              >
                <img
                  src={tab.iconSrc}
                  alt=''
                  className='h-5 w-5 rounded object-contain'
                />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active pool content */}
          <SongPoolSection
            label={active.label}
            iconSrc={active.iconSrc}
            pool={active.pool}
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
  if (pool.length === 0) return null

  return (
    <div>
      <div className='mb-4 flex items-center gap-3 md:mb-6'>
        <img
          src={iconSrc}
          alt=''
          className='h-7 w-7 rounded-lg object-contain'
        />
        <h2 className='text-xl font-bold text-white md:text-2xl'>{label}</h2>
        <span className='ml-auto text-sm text-white/50'>{pool.length}곡</span>
      </div>

      {/* Mobile: Card list */}
      <div className='space-y-2.5 md:hidden'>
        {pool.map((song, index) => (
          <div
            key={`m-${song.title || `hidden-${index}`}-${index}`}
            className={cn(
              'rounded-xl border px-4 py-3',
              song.revealed
                ? 'border-white/10 bg-white/[0.03]'
                : 'border-white/[0.06] bg-white/[0.015]'
            )}
          >
            {song.revealed ? (
              <>
                <p className='leading-relaxed font-medium break-words text-white'>
                  {song.title}
                </p>
                <div className='mt-2 flex items-center gap-4'>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-xs text-white/50'>귀신</span>
                    {song.oni != null ? (
                      <LevelBadge level={song.oni} />
                    ) : (
                      <span className='text-xs text-white/40'>—</span>
                    )}
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-xs text-white/50'>뒷보면</span>
                    {song.ura != null ? (
                      <LevelBadge level={song.ura} isUra />
                    ) : (
                      <span className='text-xs text-white/40'>—</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className='leading-relaxed font-medium text-white/30'>
                  <span className='font-bold tracking-widest'>???</span>
                  <Badge
                    variant='outline'
                    className='ml-2 border-[#ff2a00]/30 bg-[#ff2a00]/5 text-[#ff8c66]'
                  >
                    추후 공지
                  </Badge>
                </p>
                <div className='mt-2 flex items-center gap-4'>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-xs text-white/50'>귀신</span>
                    <span className='text-xs text-white/40'>—</span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-xs text-white/50'>뒷보면</span>
                    <span className='text-xs text-white/40'>—</span>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className='hidden overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] md:block'>
        <table className='w-full text-sm md:text-base'>
          <caption className='sr-only'>{label} 선곡풀</caption>
          <thead>
            <tr className='border-b border-white/10 text-left text-xs font-semibold tracking-wider text-white/50 uppercase'>
              <th className='px-4 py-3 text-center'>#</th>
              <th className='px-4 py-3'>곡명</th>
              <th className='px-4 py-3 text-center'>귀신</th>
              <th className='px-4 py-3 text-center'>뒷보면</th>
            </tr>
          </thead>
          <tbody>
            {pool.map((song, index) => (
              <tr
                key={`${song.title || `hidden-${index}`}-${index}`}
                className={cn(
                  'border-b border-white/[0.06] transition-colors',
                  song.revealed && 'hover:bg-white/[0.04]',
                  index === pool.length - 1 && 'border-b-0'
                )}
              >
                <td className='px-4 py-3 text-center text-white/40'>
                  {index + 1}
                </td>
                {song.revealed ? (
                  <>
                    <td className='px-4 py-3 leading-relaxed font-medium break-words text-white'>
                      {song.title}
                    </td>
                    <td className='px-4 py-3 text-center'>
                      {song.oni != null ? (
                        <LevelBadge level={song.oni} />
                      ) : (
                        <span className='text-white/20'>—</span>
                      )}
                    </td>
                    <td className='px-4 py-3 text-center'>
                      {song.ura != null ? (
                        <LevelBadge level={song.ura} isUra />
                      ) : (
                        <span className='text-white/20'>—</span>
                      )}
                    </td>
                  </>
                ) : (
                  <>
                    <td className='px-4 py-3 leading-relaxed font-medium text-white/30'>
                      <div className='flex items-center gap-2'>
                        <span className='font-bold tracking-widest'>???</span>
                        <Badge
                          variant='outline'
                          className='border-[#ff2a00]/30 bg-[#ff2a00]/5 text-[#ff8c66]'
                        >
                          추후 공지
                        </Badge>
                      </div>
                    </td>
                    <td className='px-4 py-3 text-center'>
                      <span className='text-white/20'>—</span>
                    </td>
                    <td className='px-4 py-3 text-center'>
                      <span className='text-white/20'>—</span>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
