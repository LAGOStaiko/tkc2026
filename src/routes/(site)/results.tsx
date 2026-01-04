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

const LABEL_CONSOLE = '\uCF58\uC194'
const LABEL_ARCADE = '\uC544\uCF00\uC774\uB4DC'
const LABEL_READY = '\uC5C5\uB370\uC774\uD2B8 \uC608\uC815'
const LABEL_LIVE = '\uC9C4\uD589 \uC911'
const LABEL_DONE = '\uC644\uB8CC'
const LABEL_EMPTY = '\uACB0\uACFC\uAC00 \uC544\uC9C1 \uC5C6\uC2B5\uB2C8\uB2E4.'

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

function StageCard({ stage }: { stage: ResultStage }) {
  const heading = stage.stageLabel ?? 'Stage'
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
          <p className='text-sm text-muted-foreground'>{LABEL_EMPTY}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[72px]'>Rank</TableHead>
                <TableHead>Nickname</TableHead>
                <TableHead className='w-[120px]'>Score</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`${heading}-${index}`}>
                  <TableCell className='font-medium'>
                    {row.rank ?? '-'}
                  </TableCell>
                  <TableCell>{row.nickname ?? '-'}</TableCell>
                  <TableCell>{row.score ?? '-'}</TableCell>
                  <TableCell>{row.detail ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function ResultsPage() {
  const { data, isLoading, isError } = useResults<ResultsData>()
  const consoleStages = getStages(data?.console)
  const arcadeStages = getStages(data?.arcade)

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <p className='text-xs uppercase tracking-[0.3em] text-muted-foreground'>
          TKC2026
        </p>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          Results
        </h1>
        <p className='text-sm text-muted-foreground'>
          Stage standings for each division.
        </p>
      </div>

      {isLoading && (
        <p className='text-sm text-muted-foreground'>Loading results...</p>
      )}
      {isError && (
        <p className='text-sm text-destructive'>Failed to load results.</p>
      )}

      <Tabs defaultValue={TAB_CONSOLE}>
        <TabsList>
          <TabsTrigger value={TAB_CONSOLE}>{LABEL_CONSOLE}</TabsTrigger>
          <TabsTrigger value={TAB_ARCADE}>{LABEL_ARCADE}</TabsTrigger>
        </TabsList>
        <TabsContent value={TAB_CONSOLE} className='mt-4 space-y-4'>
          {consoleStages.length === 0 ? (
            <p className='text-sm text-muted-foreground'>{LABEL_EMPTY}</p>
          ) : (
            consoleStages.map((stage, index) => (
              <StageCard key={`console-${index}`} stage={stage} />
            ))
          )}
        </TabsContent>
        <TabsContent value={TAB_ARCADE} className='mt-4 space-y-4'>
          {arcadeStages.length === 0 ? (
            <p className='text-sm text-muted-foreground'>{LABEL_EMPTY}</p>
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
