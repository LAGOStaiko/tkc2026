import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { t } from '@/text'

export const Route = createFileRoute('/(site)/results')({
  component: ResultsPage,
})

type ResultRow = {
  rank?: number | string
  nickname?: string
  score?: number | string
  detail?: string
}

type ResultStage = {
  stageLabel?: string
  status?: string
  rows?: ResultRow[]
}

type ResultsData = {
  console?: ResultStage[]
  arcade?: ResultStage[]
}

const TAB_CONSOLE = 'console'
const TAB_ARCADE = 'arcade'

const LABEL_CONSOLE = t('results.tab.console')
const LABEL_ARCADE = t('results.tab.arcade')
const LABEL_READY = t('results.status.ready')
const LABEL_LIVE = t('results.status.live')
const LABEL_DONE = t('results.status.done')
const LABEL_EMPTY = t('results.empty')

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

function ResultsPage() {
  const { data, isLoading, isError } = useResults<ResultsData>()
  const consoleStages = getStages(data?.console)
  const arcadeStages = getStages(data?.arcade)

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('results.title')}`
  }, [])

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

      {isLoading && <StatusMessage>{t('results.loading')}</StatusMessage>}
      {isError && (
        <StatusMessage variant='error'>{t('results.failed')}</StatusMessage>
      )}

      <Tabs defaultValue={TAB_CONSOLE}>
        <TabsList className='w-full justify-start gap-2 overflow-x-auto'>
          <TabsTrigger value={TAB_CONSOLE} className='shrink-0'>
            {LABEL_CONSOLE}
          </TabsTrigger>
          <TabsTrigger value={TAB_ARCADE} className='shrink-0'>
            {LABEL_ARCADE}
          </TabsTrigger>
        </TabsList>
        <TabsContent value={TAB_CONSOLE} className='mt-4 space-y-4'>
          {consoleStages.length === 0 ? (
            <StatusMessage>{LABEL_EMPTY}</StatusMessage>
          ) : (
            consoleStages.map((stage, index) => (
              <StageCard key={`console-${index}`} stage={stage} />
            ))
          )}
        </TabsContent>
        <TabsContent value={TAB_ARCADE} className='mt-4 space-y-4'>
          {arcadeStages.length === 0 ? (
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
