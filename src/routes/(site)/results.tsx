import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  ConsoleBracket4,
  type ConsoleBracketData,
} from '@/components/console-bracket-4'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useResults } from '@/lib/api'
import {
  extractController,
  extractEntryId,
  extractS1S2,
  formatNicknameWithEntryId,
} from '@/lib/results-console'
import { t } from '@/text'

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

const TAB_CONSOLE = 'console'
const TAB_ARCADE = 'arcade'

const CONSOLE_TAB_PRE1 = 'pre1'
const CONSOLE_TAB_PRE2 = 'pre2'
const CONSOLE_TAB_FINAL = 'final'

const CONSOLE_STAGE_MAP = {
  [CONSOLE_TAB_PRE1]: 'console_pre1',
  [CONSOLE_TAB_PRE2]: 'console_pre2',
  [CONSOLE_TAB_FINAL]: 'console_final',
}

const LABEL_CONSOLE = t('results.tab.console')
const LABEL_ARCADE = t('results.tab.arcade')
const LABEL_READY = t('results.status.ready')
const LABEL_LIVE = t('results.status.live')
const LABEL_DONE = t('results.status.done')
const LABEL_EMPTY = t('results.empty')

const LABEL_CONSOLE_GUIDE = t('results.console.guide')
const LABEL_CONSOLE_DASHBOARD = t('results.console.dashboardTitle')
const LABEL_CONSOLE_PRE1 = t('results.console.tab.pre1')
const LABEL_CONSOLE_PRE2 = t('results.console.tab.pre2')
const LABEL_CONSOLE_FINAL = t('results.console.tab.final')
const LABEL_CONSOLE_QUICK_VIEW = t('results.console.quickView')
const LABEL_CONSOLE_PREVIEW = t('results.console.previewTitle')
const LABEL_CONSOLE_PRE1_SUMMARY = t('results.console.summary.pre1')
const LABEL_CONSOLE_PRE2_SUMMARY = t('results.console.summary.pre2')
const LABEL_CONSOLE_FINAL_SUMMARY = t('results.console.summary.final')
const LABEL_CONSOLE_BRACKET = t('results.console.bracketPlaceholder')
const LABEL_UPDATED_AT = t('results.console.updatedAt')
const LABEL_CONTROLLER = t('results.console.column.controller')
const LABEL_NOTE = t('results.console.column.note')
const LABEL_SONG1 = t('results.console.column.song1')
const LABEL_SONG2 = t('results.console.column.song2')
const LABEL_TOTAL = t('results.console.column.total')
const LABEL_BADGE_PRE2 = t('results.console.badge.pre2')
const LABEL_BADGE_FINAL = t('results.console.badge.final')
const LABEL_SEARCH = t('results.console.searchPlaceholder')

const normalizeSearch = (value: string) =>
  value.toLowerCase().replace(/\s+/g, '')

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

const parseDate = (value?: string) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getLatestUpdatedAt = (stage?: ResultStage, rows?: ResultRow[]) => {
  const stageDate = parseDate(stage?.updatedAt)
  if (stageDate) return stageDate

  if (!rows?.length) return null
  const rowDates = rows
    .map((row) => parseDate(row.updatedAt))
    .filter((date): date is Date => Boolean(date))
  if (rowDates.length === 0) return null
  return new Date(Math.max(...rowDates.map((date) => date.getTime())))
}

const formatUpdatedAt = (value: Date | null) =>
  value ? format(value, 'yyyy-MM-dd HH:mm') : '-'

const getStatusBadge = (status?: string) => {
  if (!status) return null
  const normalized = status.toLowerCase()
  if (normalized.includes('ready')) {
    return { label: LABEL_READY, variant: 'secondary' as const }
  }
  if (normalized.includes('live') || normalized.includes('open')) {
    return { label: LABEL_LIVE, variant: 'default' as const }
  }
  if (normalized.includes('done') || normalized.includes('complete')) {
    return { label: LABEL_DONE, variant: 'outline' as const }
  }
  return { label: status, variant: 'secondary' as const }
}

const getStages = (list?: ResultStage[]) => (Array.isArray(list) ? list : [])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const parseBracketData = (value: unknown): ConsoleBracketData | null => {
  if (!value) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    try {
      return parseBracketData(JSON.parse(trimmed))
    } catch {
      return null
    }
  }
  if (isRecord(value)) {
    return value as ConsoleBracketData
  }
  return null
}

const getBracketData = (stage?: ResultStage) => {
  if (!stage) return null
  const direct = parseBracketData(stage.bracket)
  if (direct) return direct
  return parseBracketData(stage.note ?? stage.meta ?? stage.extra)
}

const hasBracketContent = (data?: ConsoleBracketData | null) => {
  if (!data) return false
  const matches = [data.semi1, data.semi2, data.final, data.third]
  return matches.some((match) => {
    if (!match) return false
    return Boolean(
      match.a ||
        match.b ||
        match.aEntry ||
        match.bEntry ||
        match.aScore !== undefined ||
        match.bScore !== undefined
    )
  })
}

const isConsoleDivision = (value?: string) => {
  if (!value) return true
  const normalized = value.toLowerCase()
  return normalized.includes('console') || normalized.includes('\uCF58\uC194')
}

const matchConsoleStageLabel = (label: string, tabKey: string) => {
  const normalized = label.toLowerCase()
  if (tabKey === CONSOLE_TAB_PRE1) {
    return (
      /pre[-\s]?1/.test(normalized) ||
      /1st/.test(normalized) ||
      /\uC77C\uCC28/.test(normalized) ||
      /\uC608\uC120\s*1/.test(normalized)
    )
  }
  if (tabKey === CONSOLE_TAB_PRE2) {
    return (
      /pre[-\s]?2/.test(normalized) ||
      /2nd/.test(normalized) ||
      /\uC774\uCC28/.test(normalized) ||
      /\uC608\uC120\s*2/.test(normalized)
    )
  }
  return (
    normalized.includes('final') ||
    normalized.includes('\uACB0\uC120') ||
    normalized.includes('\uCD5C\uC885')
  )
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

type PreviewRow = {
  rank: number | string
  name: string
  score: number | string
}

const buildPreviewRows = (rows: ResultRow[], limit: number) =>
  rows.slice(0, limit).map((row) => {
    const entryId = extractEntryId(row.nickname, row.detail)
    return {
      rank: row.rank ?? '-',
      name: formatNicknameWithEntryId(row.nickname, entryId),
      score: row.score ?? '-',
    }
  })

function StatusMessage({
  children,
  variant = 'neutral',
}: {
  children: React.ReactNode
  variant?: 'neutral' | 'error'
}) {
  const textClass =
    variant === 'error' ? 'text-destructive' : 'text-muted-foreground'

  return (
    <div className={`rounded-lg border bg-muted/30 p-4 text-sm ${textClass}`}>
      {children}
    </div>
  )
}

function ResultRowCard({ row }: { row: ResultRow }) {
  const rank = row.rank ?? '-'
  const nickname = row.nickname ?? '-'
  const score = row.score ?? '-'
  const detail = row.detail ?? '-'

  return (
    <div className='rounded-lg border bg-background p-3 shadow-xs'>
      <div className='grid grid-cols-[72px_minmax(0,1fr)] gap-3'>
        <div className='flex flex-col items-center justify-center rounded-md bg-muted/40 p-2 text-center'>
          <div className='text-2xl font-semibold leading-none'>{rank}</div>
          <div className='mt-1 text-[10px] uppercase tracking-wide text-muted-foreground'>
            {t('results.label.rank')}
          </div>
        </div>
        <div className='space-y-1'>
          <div className='text-base font-semibold'>{nickname}</div>
          <div className='text-sm text-muted-foreground'>
            {t('results.scorePrefix')}
            {score}
          </div>
          <div className='text-sm text-muted-foreground break-words'>
            {detail}
          </div>
        </div>
      </div>
    </div>
  )
}

function StageCard({ stage }: { stage: ResultStage }) {
  const heading = stage.stageLabel ?? t('results.stageFallback')
  const badge = getStatusBadge(stage.status)
  const rows = Array.isArray(stage.rows) ? stage.rows : []

  return (
    <Card>
      <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
        <CardTitle className='text-lg'>{heading}</CardTitle>
        {badge && (
          <Badge variant={badge.variant} className='shrink-0'>
            {badge.label}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <StatusMessage>{LABEL_EMPTY}</StatusMessage>
        ) : (
          <>
            <div className='space-y-3 md:hidden'>
              {rows.map((row, index) => (
                <ResultRowCard key={`${heading}-card-${index}`} row={row} />
              ))}
            </div>
            <div className='hidden md:block'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[72px]'>
                      {t('results.label.rank')}
                    </TableHead>
                    <TableHead>{t('results.label.nickname')}</TableHead>
                    <TableHead className='w-[120px]'>
                      {t('results.label.score')}
                    </TableHead>
                    <TableHead>{t('results.label.detail')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={`${heading}-row-${index}`}>
                      <TableCell className='font-medium'>
                        {row.rank ?? '-'}
                      </TableCell>
                      <TableCell>{row.nickname ?? '-'}</TableCell>
                      <TableCell>{row.score ?? '-'}</TableCell>
                      <TableCell className='break-words'>
                        {row.detail ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

type ConsoleDashboardCardProps = {
  title: string
  summary: string
  updatedAt: Date | null
  previewRows: PreviewRow[]
  onQuickView: () => void
}

function ConsoleDashboardCard({
  title,
  summary,
  updatedAt,
  previewRows,
  onQuickView,
}: ConsoleDashboardCardProps) {
  return (
    <Card>
      <CardHeader className='space-y-2'>
        <CardTitle className='text-lg'>{title}</CardTitle>
        <p className='text-sm text-muted-foreground'>{summary}</p>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <span>{LABEL_UPDATED_AT}</span>
          <span>{formatUpdatedAt(updatedAt)}</span>
        </div>
        <Button variant='secondary' size='sm' onClick={onQuickView}>
          {LABEL_CONSOLE_QUICK_VIEW}
        </Button>
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground'>
            {LABEL_CONSOLE_PREVIEW}
          </p>
          {previewRows.length === 0 ? (
            <p className='text-xs text-muted-foreground'>{LABEL_EMPTY}</p>
          ) : (
            <div className='space-y-2'>
              {previewRows.map((row, index) => (
                <div
                  key={`${title}-preview-${index}`}
                  className='flex items-center justify-between rounded-md border bg-muted/10 px-3 py-2 text-sm'
                >
                  <div className='flex min-w-0 items-center gap-2'>
                    <span className='text-xs text-muted-foreground'>
                      {row.rank}
                    </span>
                    <span className='truncate font-medium'>{row.name}</span>
                  </div>
                  <span className='text-xs text-muted-foreground'>
                    {row.score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ResultsPage() {
  const { data, isLoading, isError } = useResults<ResultsData>()
  const consoleStages = getStages(data?.console)
  const arcadeStages = getStages(data?.arcade)
  const stageMetaList = Array.isArray(data?.results_stage)
    ? data?.results_stage
    : []
  const stageRows = Array.isArray(data?.results_rows) ? data?.results_rows : []

  const [consoleTab, setConsoleTab] = useState(CONSOLE_TAB_PRE1)
  const [searchTerm, setSearchTerm] = useState('')

  const consoleStageData = useMemo(() => {
    const stagesByKey = new Map<string, ResultStage>()

    for (const stage of stageMetaList) {
      if (!stage.stageKey) continue
      if (!isConsoleDivision(stage.division)) continue
      stagesByKey.set(stage.stageKey, stage)
    }

    const rowsByKey = stageRows.reduce<Record<string, ResultRow[]>>(
      (acc, row) => {
        if (!row.stageKey) return acc
        if (!isConsoleDivision(row.division)) return acc
        acc[row.stageKey] = acc[row.stageKey] ?? []
        acc[row.stageKey].push(row)
        return acc
      },
      {}
    )

    const legacyStageByKey = new Map<string, ResultStage>()
    for (const stage of consoleStages) {
      if (stage.stageKey) {
        legacyStageByKey.set(stage.stageKey, stage)
        continue
      }
      if (stage.stageLabel) {
        const matchedKey = Object.values(CONSOLE_STAGE_MAP).find((key) =>
          matchConsoleStageLabel(stage.stageLabel ?? '', key)
        )
        if (matchedKey && !legacyStageByKey.has(matchedKey)) {
          legacyStageByKey.set(matchedKey, stage)
        }
      }
    }

    return Object.entries(CONSOLE_STAGE_MAP).reduce(
      (acc, [tabKey, stageKey]) => {
        const meta = stagesByKey.get(stageKey) ?? legacyStageByKey.get(stageKey)
        const rows =
          rowsByKey[stageKey] ??
          (Array.isArray(meta?.rows) ? meta?.rows : [])

        acc[tabKey] = {
          stageKey,
          stageLabel: meta?.stageLabel,
          status: meta?.status,
          updatedAt: meta?.updatedAt,
          bracket: meta?.bracket,
          rows,
        }
        return acc
      },
      {} as Record<string, ResultStage>
    )
  }, [consoleStages, stageMetaList, stageRows])

  const normalizedQuery = useMemo(
    () => normalizeSearch(searchTerm.trim()),
    [searchTerm]
  )

  const filterRows = (rows: ResultRow[]) => {
    if (!normalizedQuery) return rows
    return rows.filter((row) => {
      const entryId = extractEntryId(row.nickname, row.detail)
      const target = normalizeSearch(
        `${row.nickname ?? ''} ${entryId ?? ''}`
      )
      return target.includes(normalizedQuery)
    })
  }

  const pre1Stage = consoleStageData[CONSOLE_TAB_PRE1]
  const pre2Stage = consoleStageData[CONSOLE_TAB_PRE2]
  const finalStage = consoleStageData[CONSOLE_TAB_FINAL]

  const pre1Sorted = sortRows(pre1Stage?.rows ?? [])
  const pre2Sorted = sortRows(pre2Stage?.rows ?? [])
  const finalSorted = sortRows(finalStage?.rows ?? [])

  const pre1Rows = filterRows(pre1Sorted)
  const pre2Rows = filterRows(pre2Sorted)
  const finalRows = filterRows(finalSorted).slice(0, 4)

  const pre1Preview = buildPreviewRows(pre1Sorted, 5)
  const pre2Preview = buildPreviewRows(pre2Sorted, 5)
  const finalPreview = buildPreviewRows(finalSorted, 5)

  const pre1UpdatedAt = getLatestUpdatedAt(pre1Stage, pre1Stage?.rows ?? [])
  const pre2UpdatedAt = getLatestUpdatedAt(pre2Stage, pre2Stage?.rows ?? [])
  const finalUpdatedAt = getLatestUpdatedAt(finalStage, finalStage?.rows ?? [])

  const finalBracket = useMemo(() => getBracketData(finalStage), [finalStage])
  const hasFinalBracket = hasBracketContent(finalBracket)

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('results.title')}`
  }, [])

  const handleQuickView = (tab: string) => {
    setConsoleTab(tab)
    if (typeof document === 'undefined') return
    const anchor = document.getElementById('console-stage-tabs')
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <p className='text-xs uppercase tracking-[0.3em] text-muted-foreground'>
          {t('meta.siteName')}
        </p>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          {t('results.title')}
        </h1>
        <p className='text-sm text-muted-foreground'>
          {t('results.subtitle')}
        </p>
      </div>

      {isError && (
        <StatusMessage variant='error'>{t('results.failed')}</StatusMessage>
      )}

      <Tabs defaultValue={TAB_CONSOLE}>
        <TabsList className='no-scrollbar w-full justify-start gap-2 overflow-x-auto whitespace-nowrap'>
          <TabsTrigger value={TAB_CONSOLE} className='shrink-0'>
            {LABEL_CONSOLE}
          </TabsTrigger>
          <TabsTrigger value={TAB_ARCADE} className='shrink-0'>
            {LABEL_ARCADE}
          </TabsTrigger>
        </TabsList>
        <TabsContent value={TAB_CONSOLE} className='mt-4 space-y-6'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-semibold'>
                {LABEL_CONSOLE_DASHBOARD}
              </h2>
            </div>
            <div className='grid gap-4 lg:grid-cols-3'>
              <ConsoleDashboardCard
                title={LABEL_CONSOLE_PRE1}
                summary={LABEL_CONSOLE_PRE1_SUMMARY}
                updatedAt={pre1UpdatedAt}
                previewRows={pre1Preview}
                onQuickView={() => handleQuickView(CONSOLE_TAB_PRE1)}
              />
              <ConsoleDashboardCard
                title={LABEL_CONSOLE_PRE2}
                summary={LABEL_CONSOLE_PRE2_SUMMARY}
                updatedAt={pre2UpdatedAt}
                previewRows={pre2Preview}
                onQuickView={() => handleQuickView(CONSOLE_TAB_PRE2)}
              />
              <ConsoleDashboardCard
                title={LABEL_CONSOLE_FINAL}
                summary={LABEL_CONSOLE_FINAL_SUMMARY}
                updatedAt={finalUpdatedAt}
                previewRows={finalPreview}
                onQuickView={() => handleQuickView(CONSOLE_TAB_FINAL)}
              />
            </div>
          </div>

          <div id='console-stage-tabs'>
            <Tabs value={consoleTab} onValueChange={setConsoleTab}>
              <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                <Button asChild variant='secondary' className='shrink-0'>
                  <Link to='/console'>{LABEL_CONSOLE_GUIDE}</Link>
                </Button>
                <TabsList className='no-scrollbar w-full justify-start gap-2 overflow-x-auto whitespace-nowrap rounded-full bg-muted/40 p-1 md:w-auto md:overflow-visible'>
                  <TabsTrigger
                    value={CONSOLE_TAB_PRE1}
                    className='shrink-0 flex-none rounded-full px-4'
                  >
                    {LABEL_CONSOLE_PRE1}
                  </TabsTrigger>
                  <TabsTrigger
                    value={CONSOLE_TAB_PRE2}
                    className='shrink-0 flex-none rounded-full px-4'
                  >
                    {LABEL_CONSOLE_PRE2}
                  </TabsTrigger>
                  <TabsTrigger
                    value={CONSOLE_TAB_FINAL}
                    className='shrink-0 flex-none rounded-full px-4'
                  >
                    {LABEL_CONSOLE_FINAL}
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className='max-w-sm'>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={LABEL_SEARCH}
                />
              </div>

              <TabsContent value={CONSOLE_TAB_PRE1} className='space-y-4'>
                <p className='text-sm text-muted-foreground'>
                  {LABEL_CONSOLE_PRE1_SUMMARY}
                </p>
                {isLoading ? null : pre1Rows.length === 0 ? (
                  <StatusMessage>{LABEL_EMPTY}</StatusMessage>
                ) : (
                  <div className='-mx-4 px-4 overflow-x-auto'>
                    <Table className='min-w-[720px]'>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-[72px]'>
                            {t('results.label.rank')}
                          </TableHead>
                          <TableHead>{t('results.label.nickname')}</TableHead>
                          <TableHead className='w-[120px]'>
                            {LABEL_CONTROLLER}
                          </TableHead>
                          <TableHead className='w-[120px]'>
                            {t('results.label.score')}
                          </TableHead>
                          <TableHead>{LABEL_NOTE}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pre1Rows.map((row, index) => {
                          const entryId = extractEntryId(
                            row.nickname,
                            row.detail
                          )
                          const displayName = formatNicknameWithEntryId(
                            row.nickname,
                            entryId
                          )
                          const controller = extractController(row.detail) || '-'
                          const rankValue = toNumber(row.rank)
                          const isAdvance =
                            typeof rankValue === 'number' && rankValue <= 16

                          return (
                            <TableRow key={`pre1-${index}`}>
                              <TableCell className='font-medium'>
                                {row.rank ?? '-'}
                              </TableCell>
                              <TableCell>{displayName}</TableCell>
                              <TableCell>{controller}</TableCell>
                              <TableCell>{row.score ?? '-'}</TableCell>
                              <TableCell>
                                {isAdvance ? (
                                  <Badge variant='secondary'>
                                    {LABEL_BADGE_PRE2}
                                  </Badge>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {pre1UpdatedAt && (
                  <p className='text-xs text-muted-foreground'>
                    {LABEL_UPDATED_AT}: {formatUpdatedAt(pre1UpdatedAt)}
                  </p>
                )}
              </TabsContent>

              <TabsContent value={CONSOLE_TAB_PRE2} className='space-y-4'>
                <p className='text-sm text-muted-foreground'>
                  {LABEL_CONSOLE_PRE2_SUMMARY}
                </p>
                {isLoading ? null : pre2Rows.length === 0 ? (
                  <StatusMessage>{LABEL_EMPTY}</StatusMessage>
                ) : (
                  <div className='-mx-4 px-4 overflow-x-auto'>
                    <Table className='min-w-[720px]'>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-[72px]'>
                            {t('results.label.rank')}
                          </TableHead>
                          <TableHead>{t('results.label.nickname')}</TableHead>
                          <TableHead className='w-[120px]'>
                            {LABEL_SONG1}
                          </TableHead>
                          <TableHead className='w-[120px]'>
                            {LABEL_SONG2}
                          </TableHead>
                          <TableHead className='w-[140px]'>
                            {LABEL_TOTAL}
                          </TableHead>
                          <TableHead>{LABEL_NOTE}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pre2Rows.map((row, index) => {
                          const entryId = extractEntryId(
                            row.nickname,
                            row.detail
                          )
                          const displayName = formatNicknameWithEntryId(
                            row.nickname,
                            entryId
                          )
                          const rankValue = toNumber(row.rank)
                          const isAdvance =
                            typeof rankValue === 'number' && rankValue <= 4
                          const scores = extractS1S2(row.detail)
                          const s1 = scores.s1 ?? '-'
                          const s2 = scores.s2 ?? '-'

                          return (
                            <TableRow key={`pre2-${index}`}>
                              <TableCell className='font-medium'>
                                {row.rank ?? '-'}
                              </TableCell>
                              <TableCell>{displayName}</TableCell>
                              <TableCell>{s1}</TableCell>
                              <TableCell>{s2}</TableCell>
                              <TableCell>{row.score ?? '-'}</TableCell>
                              <TableCell>
                                {isAdvance ? (
                                  <Badge variant='secondary'>
                                    {LABEL_BADGE_FINAL}
                                  </Badge>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {pre2UpdatedAt && (
                  <p className='text-xs text-muted-foreground'>
                    {LABEL_UPDATED_AT}: {formatUpdatedAt(pre2UpdatedAt)}
                  </p>
                )}
              </TabsContent>

              <TabsContent value={CONSOLE_TAB_FINAL} className='space-y-4'>
                <ConsoleBracket4 data={finalBracket} />
                {!hasFinalBracket && (
                  <p className='text-xs text-muted-foreground'>
                    {LABEL_CONSOLE_BRACKET}
                  </p>
                )}
                {isLoading ? null : finalRows.length === 0 ? (
                  <StatusMessage>{LABEL_EMPTY}</StatusMessage>
                ) : (
                  <div className='-mx-4 px-4 overflow-x-auto'>
                    <Table className='min-w-[720px]'>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-[72px]'>
                            {t('results.label.rank')}
                          </TableHead>
                          <TableHead>{t('results.label.nickname')}</TableHead>
                          <TableHead className='w-[140px]'>
                            {t('results.label.score')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {finalRows.map((row, index) => {
                          const entryId = extractEntryId(
                            row.nickname,
                            row.detail
                          )
                          const displayName = formatNicknameWithEntryId(
                            row.nickname,
                            entryId
                          )

                          return (
                            <TableRow key={`final-${index}`}>
                              <TableCell className='font-medium'>
                                {row.rank ?? '-'}
                              </TableCell>
                              <TableCell>{displayName}</TableCell>
                              <TableCell>{row.score ?? '-'}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {finalUpdatedAt && (
                  <p className='text-xs text-muted-foreground'>
                    {LABEL_UPDATED_AT}: {formatUpdatedAt(finalUpdatedAt)}
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value={TAB_ARCADE} className='mt-4 space-y-4'>
          {isLoading ? null : arcadeStages.length === 0 ? (
            <StatusMessage>{LABEL_EMPTY}</StatusMessage>
          ) : (
            arcadeStages.map((stage, index) => (
              <StageCard key={`arcade-${index}`} stage={stage} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
