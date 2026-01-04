import { createFileRoute } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSchedule } from '@/lib/api'

export const Route = createFileRoute('/(site)/schedule')({
  component: SchedulePage,
})

type ScheduleItem = {
  id?: string | number
  title?: string
  start?: string
  end?: string
  dateText?: string
  location?: string
  note?: string
  status?: string
  division?: string
  category?: string
  type?: string
  track?: string
}

type ScheduleData = {
  schedule?: ScheduleItem[]
  items?: ScheduleItem[]
  events?: ScheduleItem[]
}

const TAB_ALL = 'all'
const TAB_CONSOLE = 'console'
const TAB_ARCADE = 'arcade'

const LABEL_ALL = '\uC804\uCCB4'
const LABEL_CONSOLE = '\uCF58\uC194'
const LABEL_ARCADE = '\uC544\uCF00\uC774\uB4DC'
const LABEL_UPCOMING = '\uC608\uC815'
const LABEL_LIVE = '\uC9C4\uD589 \uC911'
const LABEL_DONE = '\uC644\uB8CC'

const getScheduleItems = (
  data: ScheduleData | ScheduleItem[] | undefined
) => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.schedule)) return data.schedule
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.events)) return data.events
  return []
}

const normalizeDivision = (item: ScheduleItem) => {
  const raw = String(
    item.division ?? item.category ?? item.type ?? item.track ?? ''
  ).toLowerCase()
  if (!raw) return null
  if (raw.includes('console') || raw.includes('\uCF58\uC194')) {
    return TAB_CONSOLE
  }
  if (raw.includes('arcade') || raw.includes('\uC544\uCF00\uC774\uB4DC')) {
    return TAB_ARCADE
  }
  return null
}

const getStatusBadge = (status?: string) => {
  if (!status) return null
  const normalized = status.toLowerCase()
  if (normalized.includes('upcoming') || normalized.includes('\uC608\uC815')) {
    return { label: LABEL_UPCOMING, variant: 'secondary' as const }
  }
  if (
    normalized.includes('open') ||
    normalized.includes('live') ||
    normalized.includes('\uC9C4\uD589')
  ) {
    return { label: LABEL_LIVE, variant: 'default' as const }
  }
  if (normalized.includes('done') || normalized.includes('\uC644\uB8CC')) {
    return { label: LABEL_DONE, variant: 'outline' as const }
  }
  return { label: status, variant: 'secondary' as const }
}

const renderDate = (item: ScheduleItem) => {
  if (item.dateText) return item.dateText
  if (item.start && item.end) return `${item.start} ~ ${item.end}`
  return item.start ?? item.end ?? ''
}

const renderLocation = (item: ScheduleItem) =>
  item.location ? item.location : ''

function ScheduleList({ items }: { items: ScheduleItem[] }) {
  if (items.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>No schedule items yet.</p>
    )
  }

  return (
    <div className='grid gap-4'>
      {items.map((item, index) => {
        const heading = item.title ?? `Schedule ${index + 1}`
        const badge = getStatusBadge(item.status)
        const dateText = renderDate(item)
        const location = renderLocation(item)
        const note = item.note ?? ''

        return (
          <Card key={`${heading}-${index}`}>
            <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
              <div className='space-y-1'>
                <CardTitle className='text-lg'>{heading}</CardTitle>
                {dateText && (
                  <p className='text-sm text-muted-foreground'>{dateText}</p>
                )}
              </div>
              {badge && (
                <Badge variant={badge.variant} className='shrink-0'>
                  {badge.label}
                </Badge>
              )}
            </CardHeader>
            <CardContent className='space-y-2 text-sm text-muted-foreground'>
              {location && <div>{location}</div>}
              {note && <div className='text-foreground/80'>{note}</div>}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function SchedulePage() {
  const { data, isLoading, isError } = useSchedule<
    ScheduleData | ScheduleItem[]
  >()
  const items = getScheduleItems(data)
  const consoleItems = items.filter(
    (item) => normalizeDivision(item) === TAB_CONSOLE
  )
  const arcadeItems = items.filter(
    (item) => normalizeDivision(item) === TAB_ARCADE
  )

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <p className='text-xs uppercase tracking-[0.3em] text-muted-foreground'>
          TKC2026
        </p>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          Schedule
        </h1>
        <p className='text-sm text-muted-foreground'>
          Daily program and match details.
        </p>
      </div>

      {isLoading && (
        <p className='text-sm text-muted-foreground'>Loading schedule...</p>
      )}
      {isError && (
        <p className='text-sm text-destructive'>Failed to load schedule.</p>
      )}

      <Tabs defaultValue={TAB_ALL}>
        <TabsList>
          <TabsTrigger value={TAB_ALL}>{LABEL_ALL}</TabsTrigger>
          <TabsTrigger value={TAB_CONSOLE}>{LABEL_CONSOLE}</TabsTrigger>
          <TabsTrigger value={TAB_ARCADE}>{LABEL_ARCADE}</TabsTrigger>
        </TabsList>
        <TabsContent value={TAB_ALL} className='mt-4'>
          <ScheduleList items={items} />
        </TabsContent>
        <TabsContent value={TAB_CONSOLE} className='mt-4'>
          <ScheduleList items={consoleItems} />
        </TabsContent>
        <TabsContent value={TAB_ARCADE} className='mt-4'>
          <ScheduleList items={arcadeItems} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
