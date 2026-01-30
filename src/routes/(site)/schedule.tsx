import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'
import {
  ScheduleLane,
  type ScheduleItem as ScheduleLaneItem,
} from '@/components/schedule/schedule-lane'
import { useSchedule } from '@/lib/api'
import { t } from '@/text'

export const Route = createFileRoute('/(site)/schedule')({
  component: SchedulePage,
})

type ApiScheduleItem = {
  id?: string | number
  order?: number
  division?: string
  title?: string
  startDate?: string
  endDate?: string
  dateText?: string
  location?: string
  status?: string
  note?: string
  start?: string
  end?: string
}

type ScheduleData = {
  schedule?: ApiScheduleItem[]
  items?: ApiScheduleItem[]
  events?: ApiScheduleItem[]
}

const ASSETS = {
  consoleIcon: '/branding/console-icon.png',
  arcadeIcon: '/branding/arcade-icon.png',
}

const getScheduleItems = (
  data: ScheduleData | ApiScheduleItem[] | undefined
) => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.schedule)) return data.schedule
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.events)) return data.events
  return []
}

const normalizeDivision = (item: ApiScheduleItem) =>
  (item.division ?? '').toLowerCase().trim()

const sortByOrder = (items: ApiScheduleItem[]) =>
  items
    .slice()
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))

const formatMmDd = (value?: string) => {
  if (!value) return null
  const isoMatch = value.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (isoMatch) {
    const [, , mm, dd] = isoMatch
    return `${mm.padStart(2, '0')}.${dd.padStart(2, '0')}`
  }
  const shortMatch = value.match(/(\d{1,2})[.\-/](\d{1,2})/)
  if (shortMatch) {
    const [, mm, dd] = shortMatch
    return `${mm.padStart(2, '0')}.${dd.padStart(2, '0')}`
  }
  return null
}

const resolveDateParts = (item: ApiScheduleItem) => {
  if (item.dateText) {
    const main = formatMmDd(item.dateText)
    if (main) return { main, sub: undefined }
    return { main: item.dateText, sub: undefined }
  }

  const startSource = item.startDate ?? item.start
  const endSource = item.endDate ?? item.end
  const start = formatMmDd(startSource)
  const end = formatMmDd(endSource)

  if (start && end) {
    if (start !== end) return { main: start, sub: `~${end}` }
    return { main: start, sub: undefined }
  }
  if (start) return { main: start, sub: undefined }
  if (end) return { main: end, sub: undefined }

  return { main: '추후', sub: '공지' }
}

const getStatusLabel = (status?: string) => {
  if (!status) return undefined
  const normalized = status.toLowerCase()
  if (normalized.includes('upcoming') || normalized.includes('예정')) {
    return t('schedule.status.upcoming')
  }
  if (
    normalized.includes('live') ||
    normalized.includes('open') ||
    normalized.includes('진행')
  ) {
    return t('schedule.status.live')
  }
  if (
    normalized.includes('done') ||
    normalized.includes('finished') ||
    normalized.includes('종료') ||
    normalized.includes('완료')
  ) {
    return t('schedule.status.done')
  }
  return status
}

const isUpcomingItem = (item: ApiScheduleItem) => {
  const status = item.status ?? ''
  const normalized = status.toLowerCase()
  return (
    normalized.includes('upcoming') ||
    normalized.includes('예정') ||
    normalized.includes('ready')
  )
}

const pickFeatured = (items: ApiScheduleItem[]) => {
  const upcoming = items.find(
    (item) => Boolean(item.dateText) && isUpcomingItem(item)
  )
  return upcoming ?? items[0]
}

const toLaneItems = (
  items: ApiScheduleItem[],
  featuredItem: ApiScheduleItem | undefined
): ScheduleLaneItem[] =>
  items.map((item, index) => {
    const dateParts = resolveDateParts(item)
    const title = item.title ?? `${t('schedule.itemFallback')} ${index + 1}`
    return {
      id: item.id ?? item.order ?? `${title}-${index}`,
      dateMain: dateParts.main,
      dateSub: dateParts.sub,
      title,
      meta1: item.location,
      meta2: item.note,
      statusLabel: getStatusLabel(item.status),
      featured: item === featuredItem,
    }
  })

const renderFinalDate = (item: ApiScheduleItem) => {
  if (item.dateText) return item.dateText
  const startSource = item.startDate ?? item.start
  const endSource = item.endDate ?? item.end
  if (startSource && endSource && startSource !== endSource) {
    return `${startSource} ~ ${endSource}`
  }
  return startSource ?? endSource ?? ''
}

function SchedulePage() {
  const { data, isLoading, isError } = useSchedule<
    ScheduleData | ApiScheduleItem[]
  >()
  const items = getScheduleItems(data)

  const consoleItems = sortByOrder(
    items.filter((item) => normalizeDivision(item) === 'console')
  )
  const arcadeItems = sortByOrder(
    items.filter((item) => normalizeDivision(item) === 'arcade')
  )
  const allItems = sortByOrder(
    items.filter((item) => normalizeDivision(item) === 'all')
  )

  const featuredConsole = pickFeatured(consoleItems)
  const featuredArcade = pickFeatured(arcadeItems)

  const consoleLaneItems = toLaneItems(consoleItems, featuredConsole)
  const arcadeLaneItems = toLaneItems(arcadeItems, featuredArcade)

  const finalItem = allItems[0]
  const finalTitle = finalItem?.title ?? '플레이엑스포 결선 토너먼트'
  const finalDate = finalItem ? renderFinalDate(finalItem) : ''
  const finalMeta = [finalDate, finalItem?.location].filter(Boolean).join(' · ')

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('schedule.title')}`
  }, [])

  return (
    <TkcSection>
      <TkcPageHeader
        title={t('schedule.title')}
        subtitle={t('schedule.subtitle')}
      />

      {isError && (
        <p className='text-sm text-destructive'>{t('schedule.failed')}</p>
      )}

      {isLoading && items.length === 0 ? (
        <p className='text-sm text-white/60'>{t('schedule.loading')}</p>
      ) : null}

      <div className='grid gap-6 lg:grid-cols-2'>
        <ScheduleLane
          iconSrc={ASSETS.consoleIcon}
          title='콘솔'
          desc='콘솔 일정 및 경기 정보를 확인하세요.'
          items={consoleLaneItems}
        />
        <ScheduleLane
          iconSrc={ASSETS.arcadeIcon}
          title='아케이드'
          desc='아케이드 일정 및 경기 정보를 확인하세요.'
          items={arcadeLaneItems}
        />
      </div>

      <section className='rounded-3xl bg-white/5 p-6 text-center ring-1 ring-white/10'>
        <div className='text-lg font-semibold text-white'>{finalTitle}</div>
        <p className='mt-2 text-sm text-white/70'>
          {finalMeta || '추후 공지됩니다.'}
        </p>
      </section>
    </TkcSection>
  )
}
