import { GlassCard } from '@/components/tkc/glass-card'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { extractEntryId, formatNicknameWithEntryId } from '@/lib/results-console'
import { cn } from '@/lib/utils'
import { t } from '@/text'

export type ConsoleBracketMatch = {
  a?: string
  aEntry?: string
  aScore?: number | string
  b?: string
  bEntry?: string
  bScore?: number | string
  winner?: 'a' | 'b'
}

export type ConsoleBracketData = {
  semi1?: ConsoleBracketMatch
  semi2?: ConsoleBracketMatch
  final?: ConsoleBracketMatch
  third?: ConsoleBracketMatch
}

type SlotProps = {
  name?: string
  entry?: string
  score?: number | string
  winner?: 'a' | 'b'
  position: 'a' | 'b'
}

const getDisplayName = (name?: string, entry?: string) => {
  const entryId = entry ?? extractEntryId(name, undefined)
  const label = formatNicknameWithEntryId(name, entryId)
  return label === '-' ? t('results.console.bracket.tbd') : label
}

function MatchSlot({ name, entry, score, winner, position }: SlotProps) {
  const isWinner = winner === position
  const displayName = getDisplayName(name, entry)
  const displayScore = score ?? '-'

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm',
        isWinner && 'border-sky-400/60 bg-sky-400/15'
      )}
    >
      <span className={cn('min-w-0 flex-1 truncate', isWinner && 'text-white')}>
        {displayName}
      </span>
      <span className={cn('ml-3 text-white/60', isWinner && 'text-white/80')}>
        {displayScore}
      </span>
    </div>
  )
}

function MatchPanel({
  title,
  match,
}: {
  title: string
  match?: ConsoleBracketMatch
}) {
  const winner =
    match?.winner === 'a' || match?.winner === 'b' ? match.winner : undefined

  return (
    <div className='rounded-xl border border-white/10 bg-white/5 p-4'>
      <p className='text-sm font-semibold text-white'>{title}</p>
      <div className='mt-3 space-y-2'>
        <MatchSlot
          name={match?.a}
          entry={match?.aEntry}
          score={match?.aScore}
          winner={winner}
          position='a'
        />
        <MatchSlot
          name={match?.b}
          entry={match?.bEntry}
          score={match?.bScore}
          winner={winner}
          position='b'
        />
      </div>
    </div>
  )
}

export function ConsoleBracket4({
  data,
}: {
  data?: ConsoleBracketData | null
}) {
  return (
    <GlassCard>
      <CardHeader className='p-5 pb-3 md:p-7 md:pb-3'>
        <CardTitle className='text-lg text-white'>
          {t('results.console.bracketTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className='p-5 pt-0 md:p-7 md:pt-0'>
        <div className='grid gap-4 lg:grid-cols-2'>
          <div className='space-y-4'>
            <MatchPanel
              title={t('results.console.bracket.semi1')}
              match={data?.semi1}
            />
            <MatchPanel
              title={t('results.console.bracket.semi2')}
              match={data?.semi2}
            />
          </div>
          <div className='space-y-4'>
            <MatchPanel
              title={t('results.console.bracket.final')}
              match={data?.final}
            />
            <MatchPanel
              title={t('results.console.bracket.third')}
              match={data?.third}
            />
          </div>
        </div>
      </CardContent>
    </GlassCard>
  )
}
