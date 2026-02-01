import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useResults } from '@/lib/api'
import {
  extractController,
  extractEntryId,
  formatNicknameWithEntryId,
} from '@/lib/results-console'
import { cn } from '@/lib/utils'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/results')({
  component: ResultsPage,
})

type ResultRow = {
  division?: string
  stageKey?: string
  rank?: number | string
  nickname?: string
  score?: number | string
  detail?: string
  updatedAt?: string
}

type ResultStage = {
  stageKey?: string
  stageLabel?: string
  status?: string
  updatedAt?: string
  division?: string
  note?: string
  meta?: string
  extra?: string
  bracket?: unknown
  rows?: ResultRow[]
}

type ResultsData = {
  console?: ResultStage[]
  arcade?: ResultStage[]
  results_stage?: ResultStage[]
  results_rows?: ResultRow[]
}

const DIVISIONS = [
  {
    key: 'console',
    label: t('results.tab.console'),
    icon: '/branding/console-icon.png',
  },
  {
    key: 'arcade',
    label: t('results.tab.arcade'),
    icon: '/branding/arcade-icon.png',
  },
] as const

type DivisionKey = (typeof DIVISIONS)[number]['key']

const LABEL_EMPTY = t('results.empty')
const LABEL_FAILED = t('results.failed')
const LABEL_LOADING = t('results.loading')
const LABEL_RANK = t('results.label.rank')
const LABEL_NICKNAME = t('results.label.nickname')
const LABEL_SCORE = t('results.label.score')
const LABEL_CONTROLLER = t('results.console.column.controller')

const RESULT_NOTE =
  '순위는 아직 확정된 값이 아니며, 현장 운영에 의해 예고 없이 변경될 수 있습니다.'

const toNumber = (value?: number | string) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value === 'string') {
    const numeric = Number(value.replace(/,/g, ''))
    return Number.isFinite(numeric) ? numeric : undefined
  }
  return undefined
}

const formatScore = (value?: number | string) => {
  if (typeof value === 'number') {
    return value.toLocaleString('en-US')
  }
  if (typeof value === 'string') {
    return value
  }
  return '-'
}

const sortRows = (rows: ResultRow[]) => {
  const hasRank = rows.some((row) => toNumber(row.rank) !== undefined)
  return [...rows].sort((left, right) => {
    if (hasRank) {
      const leftRank = toNumber(left.rank) ?? Number.MAX_SAFE_INTEGER
      const rightRank = toNumber(right.rank) ?? Number.MAX_SAFE_INTEGER
      return leftRank - rightRank
    }
    const leftScore = toNumber(left.score) ?? 0
    const rightScore = toNumber(right.score) ?? 0
    return rightScore - leftScore
  })
}

const resolveDivision = (value?: string): DivisionKey | null => {
  if (!value) return null
  const normalized = value.toLowerCase()
  if (normalized.includes('console') || normalized.includes('콘솔')) {
    return 'console'
  }
  if (normalized.includes('arcade') || normalized.includes('아케이드')) {
    return 'arcade'
  }
  return null
}

const getRowsFromStages = (
  stages: ResultStage[] | undefined,
  division: DivisionKey
): ResultRow[] => {
  if (!Array.isArray(stages)) return []
  return stages.flatMap((stage) => {
    if (!Array.isArray(stage.rows) || stage.rows.length === 0) return []
    return stage.rows.map((row) => ({
      ...row,
      division: row.division ?? stage.division ?? division,
    }))
  })
}

const getDisplayName = (row?: ResultRow) => {
  const entryId = extractEntryId(row?.nickname, row?.detail)
  return formatNicknameWithEntryId(row?.nickname, entryId)
}

const getControllerLabel = (row?: ResultRow) => {
  const controller = extractController(row?.detail)
  if (controller) return controller
  if (row?.detail) return row.detail
  return '-'
}

function StatusMessage({
  children,
  variant = 'neutral',
}: {
  children: ReactNode
  variant?: 'neutral' | 'error'
}) {
  const textClass = variant === 'error' ? 'text-destructive' : 'text-white/60'

  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm',
        textClass
      )}
    >
      {children}
    </div>
  )
}

function HighlightCard({
  iconSrc,
  label,
  row,
  loading,
}: {
  iconSrc: string
  label: string
  row?: ResultRow
  loading?: boolean
}) {
  const title = loading ? LABEL_LOADING : row ? getDisplayName(row) : LABEL_EMPTY
  const meta = loading ? '' : getControllerLabel(row)
  const score = loading ? '-' : formatScore(row?.score)

  return (
    <div className='grid grid-cols-[48px_minmax(0,1fr)_96px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 md:grid-cols-[56px_minmax(0,1fr)_140px] md:gap-4 md:px-6 md:py-4'>
      <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff2a00] md:h-14 md:w-14'>
        <img src={iconSrc} alt='' className='h-6 w-6 md:h-7 md:w-7' />
      </div>
      <div className='min-w-0 space-y-1'>
        <div className='text-[10px] font-semibold text-white/50 md:text-[11px]'>
          {label}
        </div>
        <div className='truncate text-base font-semibold text-white md:text-lg'>
          {title}
        </div>
        {meta ? (
          <div className='text-[11px] text-white/60 md:text-xs'>{meta}</div>
        ) : null}
      </div>
      <div className='text-right text-base font-semibold text-white tabular-nums md:text-lg'>
        {score}
      </div>
    </div>
  )
}

function ResultsPage() {
  const { data, isLoading, isError } = useResults<ResultsData>()
  const [activeDivision, setActiveDivision] =
    useState<DivisionKey>('console')

  const divisionRows = useMemo(() => {
    const consoleRowsFromStages = getRowsFromStages(data?.console, 'console')
    const arcadeRowsFromStages = getRowsFromStages(data?.arcade, 'arcade')
    const fallbackRows = Array.isArray(data?.results_rows)
      ? data.results_rows
      : []

    let consoleRows: ResultRow[] = consoleRowsFromStages
    let arcadeRows: ResultRow[] = arcadeRowsFromStages

    if (!consoleRows.length) {
      consoleRows = fallbackRows.filter(
        (row) => resolveDivision(row.division) === 'console'
      )
    }
    if (!arcadeRows.length) {
      arcadeRows = fallbackRows.filter(
        (row) => resolveDivision(row.division) === 'arcade'
      )
    }

    if (!consoleRows.length && !arcadeRows.length && fallbackRows.length) {
      consoleRows = fallbackRows
    }

    return { console: consoleRows, arcade: arcadeRows }
  }, [data])

  const consoleTopRow = useMemo(
    () => sortRows(divisionRows.console)[0],
    [divisionRows.console]
  )
  const arcadeTopRow = useMemo(
    () => sortRows(divisionRows.arcade)[0],
    [divisionRows.arcade]
  )

  const activeRows =
    activeDivision === 'console' ? divisionRows.console : divisionRows.arcade

  const displayRows = useMemo(() => {
    return sortRows(activeRows).map((row, index) => {
      const rankValue = row.rank ?? index + 1
      const rankNumber = toNumber(rankValue)
      return {
        key: `${row.stageKey ?? activeDivision}-${index}`,
        rank: rankValue,
        name: getDisplayName(row),
        controller: getControllerLabel(row),
        score: formatScore(row.score),
        isTop: typeof rankNumber === 'number' && rankNumber <= 3,
      }
    })
  }, [activeRows, activeDivision])

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('results.title')}`
  }, [])

  return (
    <TkcSection className='space-y-8 md:space-y-10'>
      <TkcPageHeader
        title={t('results.title')}
        subtitle={t('results.subtitle')}
      />

      {isError && (
        <StatusMessage variant='error'>{LABEL_FAILED}</StatusMessage>
      )}

      <div className='space-y-3 md:space-y-4'>
        <HighlightCard
          iconSrc={DIVISIONS[0].icon}
          label={DIVISIONS[0].label}
          row={consoleTopRow}
          loading={isLoading}
        />
        <HighlightCard
          iconSrc={DIVISIONS[1].icon}
          label={DIVISIONS[1].label}
          row={arcadeTopRow}
          loading={isLoading}
        />
      </div>

      <div className='h-px w-full bg-white/10' />

      <div className='space-y-4'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div className='inline-flex w-full max-w-[280px] rounded-full bg-white/10 p-1 md:max-w-[360px]'>
            {DIVISIONS.map((division) => {
              const isActive = activeDivision === division.key
              return (
                <button
                  key={division.key}
                  type='button'
                  onClick={() => setActiveDivision(division.key)}
                  className={cn(
                    'flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition md:px-4 md:py-2 md:text-sm',
                    isActive
                      ? 'bg-[#ff2a00] text-white'
                      : 'text-white/70 hover:text-white'
                  )}
                >
                  {division.label}
                </button>
              )
            })}
          </div>
          <p className='text-xs text-white/50'>{RESULT_NOTE}</p>
        </div>

        <div className='overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]'>
          <div className='grid grid-cols-[44px_minmax(0,1fr)_72px_96px] items-center gap-3 px-4 py-3 text-[11px] font-semibold tracking-wide text-white/50 md:grid-cols-[60px_minmax(0,1fr)_120px_140px] md:gap-4 md:px-5 md:text-xs'>
            <span>{LABEL_RANK}</span>
            <span>{LABEL_NICKNAME}</span>
            <span>{LABEL_CONTROLLER}</span>
            <span className='text-right'>{LABEL_SCORE}</span>
          </div>

          {isLoading ? (
            <div className='px-5 py-4'>
              <StatusMessage>{LABEL_LOADING}</StatusMessage>
            </div>
          ) : displayRows.length === 0 ? (
            <div className='px-5 py-4'>
              <StatusMessage>{LABEL_EMPTY}</StatusMessage>
            </div>
          ) : (
            <div className='divide-y divide-white/10'>
              {displayRows.map((row) => (
                <div
                  key={row.key}
                  className='grid grid-cols-[44px_minmax(0,1fr)_72px_96px] items-center gap-3 px-4 py-3 md:grid-cols-[60px_minmax(0,1fr)_120px_140px] md:gap-4 md:px-5 md:py-4'
                >
                  <div
                    className={cn(
                      'text-sm font-semibold md:text-lg',
                      row.isTop ? 'text-[#ff2a00]' : 'text-white'
                    )}
                  >
                    {row.rank}
                  </div>
                  <div className='min-w-0'>
                    <div className='truncate text-sm font-semibold text-white md:text-base'>
                      {row.name}
                    </div>
                  </div>
                  <div className='truncate text-xs text-white/60 md:text-sm'>
                    {row.controller}
                  </div>
                  <div className='text-right text-sm font-semibold text-white tabular-nums md:text-base'>
                    {row.score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TkcSection>
  )
}

