import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useSchedule } from '@/lib/api'
import {
  ScheduleLane,
  type ScheduleItem as LaneItem,
} from '@/components/schedule/schedule-lane'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/schedule')({
  component: SchedulePage,
})

type ApiScheduleItem = {
  id?: string | number
  order?: number | string
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

const getOrderValue = (item: ApiScheduleItem) => {
  if (typeof item.order === 'number') return item.order
  if (typeof item.order === 'string') {
    const parsed = Number(item.order)
    if (!Number.isNaN(parsed)) return parsed
  }
  return Number.POSITIVE_INFINITY
}

const sortByOrder = (items: ApiScheduleItem[]) =>
  items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const orderDiff = getOrderValue(a.item) - getOrderValue(b.item)
      return orderDiff !== 0 ? orderDiff : a.index - b.index
    })
    .map(({ item }) => item)

const splitArcadeTitle = (title: string) => {
  const patterns = [/(1\s*차)\s*\/\s*(2\s*차)/, /(3\s*차)\s*\/\s*(4\s*차)/]

  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (!match) continue
    const [full, first, second] = match
    return [title.replace(full, first), title.replace(full, second)]
  }

  return null
}

const expandArcadeItems = (items: ApiScheduleItem[]) =>
  items.flatMap((item) => {
    if (normalizeDivision(item) !== 'arcade') return [item]
    if (!item.title) return [item]

    const splitTitles = splitArcadeTitle(item.title)
    if (!splitTitles) return [item]

    return splitTitles.map((title) => ({ ...item, title }))
  })

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

const parseDateValue = (value?: string) => {
  if (!value) return null
  const isoMatch = value.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  }
  const monthDayMatch = value.match(/(\d{1,2})[.\-/](\d{1,2})/)
  if (monthDayMatch) {
    const [, mm, dd] = monthDayMatch
    const year = new Date().getFullYear()
    return new Date(year, Number(mm) - 1, Number(dd))
  }
  const koreanMatch = value.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/)
  if (koreanMatch) {
    const [, mm, dd] = koreanMatch
    const year = new Date().getFullYear()
    return new Date(year, Number(mm) - 1, Number(dd))
  }
  return null
}

const parseDateRangeFromText = (value?: string) => {
  if (!value) return { start: null, end: null }
  const matches =
    value.match(/(\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}|\d{1,2}[.\-/]\d{1,2})/g) ?? []
  const [first, second] = matches
  const start = parseDateValue(first)
  const end = parseDateValue(second)
  return { start, end }
}

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

const getDateRange = (item: ApiScheduleItem) => {
  const startSource = item.startDate ?? item.start
  const endSource = item.endDate ?? item.end
  const textRange = parseDateRangeFromText(item.dateText)

  const start = parseDateValue(startSource) ?? textRange.start
  const end = parseDateValue(endSource) ?? textRange.end

  return { start, end }
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

const normalizeStatus = (status?: string) => status?.toLowerCase().trim() ?? ''

const isLive = (item: ApiScheduleItem) => {
  const status = normalizeStatus(item.status)
  return status.includes('live') || status.includes('진행')
}

const isOpen = (item: ApiScheduleItem) => {
  const status = normalizeStatus(item.status)
  return status.includes('open') || status.includes('접수')
}

const getStatusLabel = (status?: string) => {
  const normalized = normalizeStatus(status)
  if (!normalized) return undefined
  if (normalized.includes('live') || normalized.includes('진행'))
    return '진행중'
  if (normalized.includes('open') || normalized.includes('접수'))
    return '접수중'
  if (
    normalized.includes('ready') ||
    normalized.includes('upcoming') ||
    normalized.includes('예정')
  ) {
    return '예정'
  }
  if (
    normalized.includes('done') ||
    normalized.includes('finished') ||
    normalized.includes('종료') ||
    normalized.includes('완료')
  ) {
    return '종료'
  }
  return status
}

const getFeaturedSet = (items: ApiScheduleItem[]) => {
  if (items.length === 0) return new Set<ApiScheduleItem>()

  const today = startOfDay(new Date())
  const decorated = items.map((item, index) => {
    const { start: rangeStart, end: rangeEnd } = getDateRange(item)
    const start = rangeStart ?? rangeEnd
    const end = rangeEnd ?? rangeStart
    return {
      item,
      index,
      start,
      end,
      hasDate: Boolean(start || end),
    }
  })

  const liveItems = decorated
    .filter(({ item, start, end }) => {
      const liveByStatus = isLive(item)
      const liveByDate = Boolean(start && end) && start <= today && today <= end
      return liveByStatus || liveByDate
    })
    .map(({ item }) => item)

  if (liveItems.length > 0) return new Set(liveItems)

  const isUpcoming = (
    entry: (typeof decorated)[number]
  ): entry is (typeof decorated)[number] & { start: Date } =>
    Boolean(entry.start && entry.start >= today)

  const upcoming = decorated.filter(isUpcoming).sort((a, b) => {
    const dateDiff = a.start.getTime() - b.start.getTime()
    if (dateDiff !== 0) return dateDiff
    return getOrderValue(a.item) - getOrderValue(b.item)
  })

  if (upcoming.length > 0) return new Set([upcoming[0].item])

  const hasAnyDate = decorated.some(({ hasDate }) => hasDate)
  if (hasAnyDate) return new Set<ApiScheduleItem>()

  const liveFallback = items.find((item) => isLive(item))
  if (liveFallback) return new Set([liveFallback])
  const openFallback = items.find((item) => isOpen(item))
  if (openFallback) return new Set([openFallback])
  return new Set([items[0]])
}

const toLaneItems = (
  items: ApiScheduleItem[],
  featuredSet: Set<ApiScheduleItem>
): LaneItem[] =>
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
      featured: featuredSet.has(item),
    }
  })

const renderFinalMeta = (item: ApiScheduleItem | undefined) => {
  if (!item) return '추후 공지됩니다.'

  const dateText = item.dateText
    ? item.dateText
    : (() => {
        const startSource = item.startDate ?? item.start
        const endSource = item.endDate ?? item.end
        if (startSource && endSource && startSource !== endSource) {
          return `${startSource} ~ ${endSource}`
        }
        return startSource ?? endSource ?? ''
      })()

  const pieces = [dateText, item.location, item.note].filter(Boolean)
  return pieces.length > 0 ? pieces.join(' · ') : '추후 공지됩니다.'
}

function SchedulePage() {
  const { data, isLoading, isError } = useSchedule<
    ScheduleData | ApiScheduleItem[]
  >()
  const rawItems = getScheduleItems(data)
  const expandedItems = expandArcadeItems(rawItems)

  const consoleItems = sortByOrder(
    expandedItems.filter((item) => normalizeDivision(item) === 'console')
  )
  const arcadeItems = sortByOrder(
    expandedItems.filter((item) => normalizeDivision(item) === 'arcade')
  )
  const allItems = sortByOrder(
    expandedItems.filter((item) => {
      const division = normalizeDivision(item)
      const id = String(item.id ?? '').toLowerCase()
      return division === 'all' || division === 'final' || id === 'final'
    })
  )

  const featuredConsole = getFeaturedSet(consoleItems)
  const featuredArcade = getFeaturedSet(arcadeItems)

  const consoleLaneItems = toLaneItems(consoleItems, featuredConsole)
  const arcadeLaneItems = toLaneItems(arcadeItems, featuredArcade)

  const finalItem = allItems[0]
  const finalTitle = finalItem?.title ?? '플레이엑스포 결선 토너먼트'
  const finalMeta = renderFinalMeta(finalItem)

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

      {isLoading && expandedItems.length === 0 ? (
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
        <p className='mt-2 text-sm text-white/70'>{finalMeta}</p>
      </section>
    </TkcSection>
  )
}
