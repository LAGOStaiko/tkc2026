import { useEffect, useMemo } from 'react'
import { t } from '@/text'
import { useSongs } from '@/lib/api'
import { PageHero, TkcSection } from '@/components/tkc/layout'
import { LevelBadge } from '@/components/tkc/level-badge'

/* ════════════════════════════════════════════════════════════════════ */
/*  Types                                                              */
/* ════════════════════════════════════════════════════════════════════ */

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

type StageGroup = {
  stageLabel: string
  songs: SongStage[]
  isFinals: boolean
}

const DIFF_LABEL: Record<string, string> = {
  ura: '뒷보면',
  oni: '귀신',
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                            */
/* ════════════════════════════════════════════════════════════════════ */

const FINALS_RE = /final|결선|결승/i

function isFinalStage(stageKey: string, stageLabel: string): boolean {
  return FINALS_RE.test(stageKey) || FINALS_RE.test(stageLabel)
}

function isGrandFinal(stageKey: string, stageLabel: string): boolean {
  return /grand.?final|결승/i.test(stageKey) || /결승/.test(stageLabel)
}

/** Group flat song list into stage groups, preserving order. */
function groupByStage(songs: SongStage[]): StageGroup[] {
  const map = new Map<string, StageGroup>()
  const order: string[] = []

  for (const song of songs) {
    const key = song.stageLabel
    if (!map.has(key)) {
      map.set(key, {
        stageLabel: key,
        songs: [],
        isFinals: isFinalStage(song.stageKey, song.stageLabel),
      })
      order.push(key)
    }
    map.get(key)!.songs.push(song)
  }

  return order.map((k) => map.get(k)!)
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Page                                                               */
/* ════════════════════════════════════════════════════════════════════ */

export function SongsPage() {
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
      <style>{`
        @keyframes shimmer {
          0%   { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes pulse-grand {
          0%, 100% { box-shadow: 0 0 16px rgba(245,166,35,0.06); }
          50%      { box-shadow: 0 0 28px rgba(245,166,35,0.14); }
        }
      `}</style>

      <PageHero
        badge='TASK SONGS'
        title={title}
        subtitle='각 단계별 과제곡 목록입니다.'
      />

      {isError && (
        <p className='text-sm text-destructive'>
          과제곡이 잠시 숨어버렸습니다. 새로고침하면 돌아올지도…?
        </p>
      )}

      {isLoading && !data ? (
        <p className='text-sm text-white/60'>과제곡이 찾아오는 중…</p>
      ) : null}

      <div className='grid gap-12 lg:grid-cols-2'>
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
  const accent = variant === 'console' ? '#e74c3c' : '#f5a623'
  const groups = useMemo(() => groupByStage(songs), [songs])

  return (
    <div>
      {/* Division header — simple dot + name */}
      <div className='mb-6 flex items-center gap-2.5'>
        <div
          className='size-3 shrink-0 rounded-full'
          style={{ backgroundColor: accent }}
        />
        <h2 className='text-[22px] font-black tracking-tight text-white'>
          {label}
        </h2>
      </div>

      {/* Timeline */}
      {groups.length > 0 ? (
        <div className='relative pl-7'>
          {/* Vertical timeline line */}
          <div className='absolute top-2 bottom-2 left-[5px] w-[2px] bg-[#1e1e1e]' />

          <div className='space-y-7'>
            {groups.map((group) => (
              <StageGroupSection
                key={group.stageLabel}
                group={group}
                variant={variant}
              />
            ))}
          </div>
        </div>
      ) : !isLoading ? (
        <p className='py-4 text-sm text-white/50'>
          아직 과제곡이 공개되지 않았습니다. 조금만 기다려 주세요!
        </p>
      ) : null}

    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Stage Group                                                        */
/* ════════════════════════════════════════════════════════════════════ */

function StageGroupSection({
  group,
  variant,
}: {
  group: StageGroup
  variant: 'console' | 'arcade'
}) {
  return (
    <div>
      {/* Stage label */}
      <p className='mb-2.5 font-mono text-[11px] font-bold uppercase tracking-[1.5px] text-white/30'>
        {group.stageLabel}
      </p>

      {/* Song cards */}
      <div className='space-y-3'>
        {group.songs.map((song) => {
          const isRevealed = song.revealed && !!song.songTitle
          const grandFinal =
            !isRevealed && isGrandFinal(song.stageKey, song.stageLabel)
          const finalsMystery =
            !isRevealed && group.isFinals && !grandFinal

          return (
            <TimelineItem
              key={song.stageKey}
              dotType={
                isRevealed
                  ? 'revealed'
                  : grandFinal
                    ? 'grand'
                    : finalsMystery
                      ? 'finals'
                      : 'empty'
              }
              variant={variant}
            >
              {isRevealed ? (
                <RevealedCard song={song} variant={variant} />
              ) : grandFinal ? (
                <GrandFinalCard song={song} />
              ) : finalsMystery ? (
                <FinalsMysteryCard song={song} />
              ) : (
                <UnrevealedCard song={song} />
              )}
            </TimelineItem>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Timeline Item (dot + card wrapper)                                 */
/* ════════════════════════════════════════════════════════════════════ */

function TimelineItem({
  dotType,
  variant,
  children,
}: {
  dotType: 'empty' | 'revealed' | 'finals' | 'grand'
  variant: 'console' | 'arcade'
  children: React.ReactNode
}) {
  const dotClass = (() => {
    switch (dotType) {
      case 'revealed':
        return variant === 'console'
          ? 'border-2 border-[#0a0a0a] bg-[#e74c3c] shadow-[0_0_0_3px_rgba(231,76,60,0.15)]'
          : 'border-2 border-[#0a0a0a] bg-[#f5a623] shadow-[0_0_0_3px_rgba(245,166,35,0.15)]'
      case 'finals':
        return 'border-2 border-[#0a0a0a] bg-[#e74c3c] shadow-[0_0_0_3px_rgba(231,76,60,0.2),0_0_10px_rgba(231,76,60,0.15)]'
      case 'grand':
        return 'border-2 border-[#0a0a0a] bg-[#f5a623] shadow-[0_0_0_3px_rgba(245,166,35,0.2),0_0_12px_rgba(245,166,35,0.2)]'
      default:
        return 'border-2 border-[rgba(128,128,128,0.4)] bg-transparent'
    }
  })()

  return (
    <div className='relative'>
      {/* Timeline dot */}
      <div
        className={`absolute top-[24px] -left-7 z-[2] size-3 rounded-full ${dotClass}`}
      />
      {children}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Revealed Card                                                      */
/* ════════════════════════════════════════════════════════════════════ */

function RevealedCard({
  song,
  variant,
}: {
  song: SongStage
  variant: 'console' | 'arcade'
}) {
  const isConsole = variant === 'console'
  const accent = isConsole ? '#e74c3c' : '#f5a623'

  return (
    <div
      className='group relative overflow-hidden rounded-[14px] bg-[#111] transition-all duration-[250ms]
        hover:-translate-y-0.5'
      style={{
        border: `1px solid ${accent}26`,
      }}
    >
      {/* Top shimmer bar */}
      <div
        className='absolute top-0 right-0 left-0 h-[2px] overflow-hidden'
        style={{ background: accent }}
      >
        <div className='absolute top-0 -left-full h-full w-3/5 animate-[shimmer_3.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/35 to-transparent' />
      </div>

      {/* Content */}
      <div className='px-5 py-[18px]'>
        <span className='text-[clamp(18px,3vw,24px)] font-black leading-tight tracking-tight text-white'>
          {song.songTitle}
        </span>

        <div className='mt-1.5 flex flex-wrap items-center gap-2'>
          {song.difficulty && (
            <span
              className='text-[13px] font-semibold'
              style={{ color: `${accent}cc` }}
            >
              {DIFF_LABEL[song.difficulty] ?? song.difficulty}
            </span>
          )}
          {song.level != null && (
            <LevelBadge
              level={song.level}
              isUra={song.difficulty === 'ura'}
            />
          )}
        </div>

        {song.descriptionMd && (
          <p className='mt-1 text-[13px] break-keep text-white/30'>
            {song.descriptionMd}
          </p>
        )}
      </div>

      {/* Hover glow */}
      <div
        className='pointer-events-none absolute inset-0 rounded-[14px] opacity-0 transition-opacity duration-[250ms] group-hover:opacity-100'
        style={{
          boxShadow: `0 6px 24px ${accent}0f`,
          borderColor: `${accent}4d`,
        }}
      />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Unrevealed Card                                                    */
/* ════════════════════════════════════════════════════════════════════ */

function UnrevealedCard({ song }: { song: SongStage }) {
  return (
    <div className='overflow-hidden rounded-[14px] border border-[#1e1e1e] bg-[#111] transition-all duration-[250ms] hover:-translate-y-0.5 hover:border-[#2a2a2a]'>
      <div className='flex items-center gap-3.5 px-5 py-4'>
        {/* Mystery icon */}
        <div className='flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-dashed border-[#808080]/25 bg-[#808080]/[0.03] font-mono text-lg font-bold text-white/30'>
          ?
        </div>
        <div>
          <p className='text-sm font-semibold text-white/35'>
            {song.stageLabel}
          </p>
          <p className='mt-0.5 text-[11px] text-white/20'>추후 공개 예정</p>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Finals Mystery Card                                                */
/* ════════════════════════════════════════════════════════════════════ */

function FinalsMysteryCard({ song }: { song: SongStage }) {
  return (
    <div className='group relative overflow-hidden rounded-[14px] bg-gradient-to-br from-[#111] to-[#e74c3c]/[0.03] transition-all duration-[250ms] hover:-translate-y-0.5' style={{ border: '1px solid rgba(231,76,60,0.2)' }}>
      <div className='relative flex items-center gap-3.5 px-5 py-[18px]'>
        {/* Mystery icon */}
        <div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-dashed border-[#e74c3c]/25 bg-[#e74c3c]/[0.04] font-mono text-xl font-bold text-[#e74c3c]/45'>
          ?
        </div>
        <div>
          <p className='text-[15px] font-bold text-[#e74c3c]/75'>
            {song.stageLabel}
          </p>
          <p className='mt-0.5 text-xs text-white/30'>
            대회 당일 현장에서 공개
          </p>
        </div>

        {/* Badge */}
        <span className='absolute top-2.5 right-3.5 font-mono text-[10px] font-bold uppercase tracking-[1.5px] text-[#e74c3c]/30'>
          Finals
        </span>
      </div>

      {/* Hover glow */}
      <div className='pointer-events-none absolute inset-0 rounded-[14px] opacity-0 shadow-[0_6px_24px_rgba(231,76,60,0.05)] transition-opacity duration-[250ms] group-hover:opacity-100' />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Grand Final Card                                                   */
/* ════════════════════════════════════════════════════════════════════ */

function GrandFinalCard({ song }: { song: SongStage }) {
  return (
    <div className='group relative overflow-hidden rounded-[14px] bg-gradient-to-br from-[#111] to-[#f5a623]/[0.04] transition-all duration-[250ms] hover:-translate-y-[3px]' style={{ border: '1px solid rgba(245,166,35,0.25)' }}>
      {/* Animated gradient bar */}
      <div className='absolute top-0 right-0 left-0 h-[3px] animate-[gradient-shift_4s_ease_infinite] bg-[length:200%_100%] bg-gradient-to-r from-[#f5a623] via-[#e74c3c] to-[#f5a623]' />

      <div className='relative flex items-center gap-3.5 px-5 py-[22px]'>
        {/* Mystery icon with pulse */}
        <div className='flex size-12 shrink-0 animate-[pulse-grand_3s_ease-in-out_infinite] items-center justify-center rounded-[14px] border border-dashed border-[#f5a623]/30 bg-[#f5a623]/[0.05] font-mono text-[22px] font-bold text-[#f5a623]/50'>
          ?
        </div>
        <div>
          <p className='text-[17px] font-extrabold text-[#f5a623]/85'>
            {song.stageLabel}
          </p>
          <p className='mt-0.5 text-xs text-white/30'>
            대회 당일 현장에서 공개됩니다
          </p>
        </div>

        {/* Badge */}
        <span className='absolute top-2.5 right-3.5 font-mono text-[10px] font-bold uppercase tracking-[1.5px] text-[#f5a623]/40'>
          Grand Final
        </span>
      </div>

      {/* Hover glow */}
      <div
        className='pointer-events-none absolute inset-0 rounded-[14px] opacity-0 transition-opacity duration-[250ms] group-hover:opacity-100'
        style={{
          boxShadow:
            '0 8px 32px rgba(245,166,35,0.07), 0 0 0 1px rgba(245,166,35,0.15)',
        }}
      />
    </div>
  )
}
