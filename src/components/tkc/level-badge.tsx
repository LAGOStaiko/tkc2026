import { cn } from '@/lib/utils'

const LEVEL_STYLES: Record<number, string> = {
  5: 'bg-teal-500/15 text-teal-400',
  6: 'bg-teal-500/15 text-teal-400',
  7: 'bg-sky-500/15 text-sky-400',
  8: 'bg-amber-500/15 text-amber-400',
  9: 'bg-[#ff2a00]/10 text-[#ff8c66]',
  10: 'bg-rose-500/15 text-rose-400',
}

const URA_STYLE = 'bg-purple-500/15 text-purple-400'
const FALLBACK_STYLE = 'bg-white/10 text-white/60'

/** Extract numeric level from strings like "Lv.9", "★9", or "9" */
export function parseLevelNumber(value: string): number | null {
  const m = value.match(/(\d+)/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

export function LevelBadge({
  level,
  isUra,
}: {
  level: number
  isUra?: boolean
}) {
  const style = isUra ? URA_STYLE : (LEVEL_STYLES[level] ?? FALLBACK_STYLE)

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        style
      )}
    >
      ★{level}
    </span>
  )
}
