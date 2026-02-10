import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useSongPools } from '@/lib/api'
import { cn } from '@/lib/utils'
import { PageHero, TkcSection } from '@/components/tkc/layout'
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

type TabDef = {
  key: string
  label: string
  dotColor: string
  pool: GroupedSong[]
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

  const tabs: TabDef[] = useMemo(
    () => [
      {
        key: 'arcadeSwiss',
        label: '아케이드 스위스 스테이지',
        dotColor: '#f5a623',
        pool: arcadeSwiss,
      },
      {
        key: 'arcadeFinals',
        label: '아케이드 결선',
        dotColor: '#f5a623',
        pool: arcadeFinals,
      },
      {
        key: 'consoleFinals',
        label: '콘솔 결선',
        dotColor: '#e86e3a',
        pool: consoleFinals,
      },
    ],
    [arcadeSwiss, arcadeFinals, consoleFinals]
  )

  const [activeTab, setActiveTab] = useState(tabs[0].key)
  const active = tabs.find((t) => t.key === activeTab) ?? tabs[0]
  const isEmpty = tabs.every((t) => t.pool.length === 0)

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${title}`
  }, [title])

  return (
    <TkcSection className='space-y-8'>
      <PageHero
        badge='SONG POOL'
        title={title}
        subtitle='대회에서 사용되는 선곡풀 목록입니다.'
        accentColor='#f5a623'
        gradientTo='#f7d154'
      />

      {isError && (
        <p className='text-sm text-destructive'>
          선곡풀을 불러오지 못했습니다.
        </p>
      )}

      {isLoading && !data ? (
        <p className='text-sm text-white/60'>선곡풀을 불러오는 중...</p>
      ) : isEmpty ? (
        <div className='rounded-2xl border border-[#1e1e1e] bg-[#111] px-6 py-8 text-center'>
          <p className='text-sm text-white/50'>표시할 선곡풀이 없습니다.</p>
          <p className='mt-1 text-xs text-white/40'>
            시트 데이터 또는 difficulty 값(oni/ura)을 확인해 주세요.
          </p>
        </div>
      ) : (
        <div className='space-y-8'>
          {/* Tab bar */}
          <div className='flex gap-1.5'>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type='button'
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm',
                  activeTab === tab.key
                    ? 'border-[#2a2a2a] bg-[#1a1a1a] text-white'
                    : 'border-transparent text-white/40 hover:bg-[#111] hover:text-white/60'
                )}
              >
                <span
                  className='size-1.5 shrink-0 rounded-full sm:size-2'
                  style={{ backgroundColor: tab.dotColor }}
                />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active pool */}
          <PoolSection
            label={active.label}
            dotColor={active.dotColor}
            pool={active.pool}
          />
        </div>
      )}
    </TkcSection>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Pool Section                                                       */
/* ════════════════════════════════════════════════════════════════════ */

function PoolSection({
  label,
  dotColor,
  pool,
}: {
  label: string
  dotColor: string
  pool: GroupedSong[]
}) {
  if (pool.length === 0) return null

  const revealedCount = pool.filter((s) => s.revealed).length
  const totalCount = pool.length
  const countLabel =
    revealedCount === totalCount
      ? `${totalCount}곡`
      : `${revealedCount}/${totalCount}곡`

  return (
    <div>
      {/* Pool header */}
      <div className='mb-5 flex items-center justify-between gap-4'>
        <div className='flex items-center gap-2.5'>
          <span
            className='size-2.5 shrink-0 rounded-full'
            style={{ backgroundColor: dotColor }}
          />
          <h2 className='text-xl font-bold tracking-tight md:text-2xl'>
            {label}
          </h2>
        </div>
        <span className='shrink-0 rounded-lg border border-[#1e1e1e] bg-[#111] px-3 py-1 font-mono text-sm font-semibold text-white/40'>
          {countLabel}
        </span>
      </div>

      {/* Mobile: card list */}
      <div className='space-y-2 md:hidden'>
        {pool.map((song, index) => (
          <div
            key={`m-${song.title || `tbd-${index}`}-${index}`}
            className={cn(
              'rounded-xl border px-4 py-3',
              song.revealed
                ? 'border-[#1e1e1e] bg-[#111] hover:border-[#2a2a2a]'
                : 'border-[#1e1e1e] bg-[#111]/60'
            )}
          >
            {song.revealed ? (
              <>
                <div className='flex items-start gap-3'>
                  <span className='mt-0.5 shrink-0 font-mono text-xs font-semibold text-white/25'>
                    {index + 1}
                  </span>
                  <p className='flex-1 leading-relaxed font-semibold break-words text-white'>
                    {song.title}
                  </p>
                </div>
                <div className='mt-2 flex items-center gap-4 pl-6'>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-xs text-white/35'>귀신</span>
                    {song.oni != null ? (
                      <LevelBadge level={song.oni} />
                    ) : (
                      <span className='text-xs text-white/15'>—</span>
                    )}
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-xs text-white/35'>뒷보면</span>
                    {song.ura != null ? (
                      <LevelBadge level={song.ura} isUra />
                    ) : (
                      <span className='text-xs text-white/15'>—</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className='flex items-center gap-3'>
                <span className='shrink-0 font-mono text-xs font-semibold text-white/25'>
                  {index + 1}
                </span>
                <span className='font-semibold tracking-widest text-white/25'>
                  ???
                </span>
                <span className='rounded bg-[#e86e3a]/[0.08] px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-[#e86e3a]'>
                  추후 공지
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className='hidden overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] md:block'>
        <table className='w-full text-[15px]'>
          <caption className='sr-only'>{label} 선곡풀</caption>
          <thead>
            <tr className='border-b border-[#1e1e1e] bg-[#1a1a1a]'>
              <th className='w-12 px-4 py-3.5 text-center font-mono text-[11px] font-semibold tracking-wider text-white/35 uppercase'>
                #
              </th>
              <th className='px-4 py-3.5 text-left font-mono text-[11px] font-semibold tracking-wider text-white/35 uppercase'>
                곡명
              </th>
              <th className='w-20 px-4 py-3.5 text-center font-mono text-[11px] font-semibold tracking-wider text-white/35 uppercase'>
                귀신
              </th>
              <th className='w-20 px-4 py-3.5 text-center font-mono text-[11px] font-semibold tracking-wider text-white/35 uppercase'>
                뒷보면
              </th>
            </tr>
          </thead>
          <tbody>
            {pool.map((song, index) => (
              <tr
                key={`${song.title || `tbd-${index}`}-${index}`}
                className={cn(
                  'border-b border-[#1e1e1e]/60 transition-colors last:border-b-0',
                  song.revealed && 'hover:bg-white/[0.02]'
                )}
              >
                <td className='px-4 py-3.5 text-center font-mono text-sm font-semibold text-white/20'>
                  {index + 1}
                </td>
                {song.revealed ? (
                  <>
                    <td className='px-4 py-3.5 font-semibold text-white'>
                      {song.title}
                    </td>
                    <td className='px-4 py-3.5 text-center'>
                      {song.oni != null ? (
                        <LevelBadge level={song.oni} />
                      ) : (
                        <span className='font-mono text-sm text-white/10'>
                          —
                        </span>
                      )}
                    </td>
                    <td className='px-4 py-3.5 text-center'>
                      {song.ura != null ? (
                        <LevelBadge level={song.ura} isUra />
                      ) : (
                        <span className='font-mono text-sm text-white/10'>
                          —
                        </span>
                      )}
                    </td>
                  </>
                ) : (
                  <>
                    <td className='px-4 py-3.5'>
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold tracking-widest text-white/25'>
                          ???
                        </span>
                        <span className='rounded bg-[#e86e3a]/[0.08] px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-[#e86e3a]'>
                          추후 공지
                        </span>
                      </div>
                    </td>
                    <td className='px-4 py-3.5 text-center'>
                      <span className='font-mono text-sm text-white/10'>
                        —
                      </span>
                    </td>
                    <td className='px-4 py-3.5 text-center'>
                      <span className='font-mono text-sm text-white/10'>
                        —
                      </span>
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
