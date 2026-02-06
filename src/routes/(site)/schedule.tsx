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
  schedule?: unknown[]
  items?: unknown[]
  events?: unknown[]
  headers?: unknown[]
  rows?: unknown[]
  values?: unknown[]
}

const ASSETS = {
  consoleIcon: '/branding/console-icon.png',
  arcadeIcon: '/branding/arcade-icon.png',
}

const looksLikeDateValue = (value?: string) => {
  if (!value) return false
  const text = value.trim()
  if (!text) return false
  if (/^\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/.test(text)) return true
  if (/^\d{1,2}[.\-/]\d{1,2}/.test(text)) return true
  if (/\d{1,2}\s*월\s*\d{1,2}\s*일/.test(text)) return true
  if (/^\w{3}\s+\w{3}\s+\d{1,2}\s+\d{4}/.test(text)) return true
  const parsed = new Date(text)
  return !Number.isNaN(parsed.getTime())
}

const looksLikeUrl = (value?: string) => {
  const text = value?.trim().toLowerCase() ?? ''
  return text.startsWith('http://') || text.startsWith('https://')
}

const normalizeKey = (value: string) =>
  value
    .replace(/\uFEFF/g, '')
    .trim()
    .replace(/\s+/g, '')

const arrayToRecord = (headers: unknown[], row: unknown[]) => {
  const record: Record<string, unknown> = {}
  headers.forEach((header, index) => {
    const key =
      typeof header === 'string' && header.trim().length > 0
        ? header
        : `col_${index}`
    record[key] = row[index]
  })
  return record
}

const looksLikeHeader = (headers: unknown[]) => {
  const normalized = headers.map((value) =>
    normalizeKey(String(value ?? '')).toLowerCase()
  )
  const candidates = [
    'division',
    '날짜',
    '일자',
    '예선이름',
    '예선이름',
    '장소',
    '진행여부',
  ]
  return normalized.some((value) => candidates.includes(value))
}

const getScheduleItems = (data: ScheduleData | unknown[] | undefined) => {
  if (!data) return []
  if (Array.isArray(data)) {
    if (data.length > 0 && Array.isArray(data[0])) {
      const headerRow = data[0] as unknown[]
      if (looksLikeHeader(headerRow)) {
        return (data as unknown[]).slice(1).map((row) => {
          return Array.isArray(row) ? arrayToRecord(headerRow, row) : row
        })
      }
    }
    return data
  }
  if (Array.isArray(data.schedule)) return data.schedule
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.events)) return data.events
  if (Array.isArray(data.rows) && Array.isArray(data.headers)) {
    const headerRow = data.headers
    return data.rows.map((row) => {
      return Array.isArray(row) ? arrayToRecord(headerRow, row) : row
    })
  }
  if (Array.isArray(data.values)) return data.values
  return []
}

const inferDivision = (value?: string) => {
  const text = (value ?? '').toLowerCase().trim()
  if (!text) return ''
  if (text.includes('console') || text.includes('콘솔')) return 'console'
  if (text.includes('arcade') || text.includes('아케이드')) return 'arcade'
  if (text.includes('all') || text.includes('final') || text.includes('결선')) {
    return 'all'
  }
  return ''
}

const normalizeDivision = (item: ApiScheduleItem) => {
  const division = (item.division ?? '').trim()
  const inferredFromDivision = inferDivision(division)
  if (inferredFromDivision) return inferredFromDivision

  const inferredFromTitle = inferDivision(item.title)
  if (inferredFromTitle) return inferredFromTitle

  if (division && !looksLikeDateValue(division)) {
    return division.toLowerCase()
  }

  return ''
}

const readString = (record: Record<string, unknown>, keys: string[]) => {
  const normalizedMap = new Map<string, unknown>()
  Object.entries(record).forEach(([key, value]) => {
    normalizedMap.set(normalizeKey(key).toLowerCase(), value)
  })

  for (const key of keys) {
    const value = normalizedMap.get(normalizeKey(key).toLowerCase())
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value)
    }
  }
  return undefined
}

const normalizeItem = (item: unknown): ApiScheduleItem => {
  if (Array.isArray(item)) {
    const [division, dateText, title, location, status, note] = item
    return {
      division:
        typeof division === 'string' || typeof division === 'number'
          ? String(division)
          : undefined,
      dateText:
        typeof dateText === 'string' || typeof dateText === 'number'
          ? String(dateText)
          : undefined,
      title:
        typeof title === 'string' || typeof title === 'number'
          ? String(title)
          : undefined,
      location:
        typeof location === 'string' || typeof location === 'number'
          ? String(location)
          : undefined,
      status:
        typeof status === 'string' || typeof status === 'number'
          ? String(status)
          : undefined,
      note:
        typeof note === 'string' || typeof note === 'number'
          ? String(note)
          : undefined,
    }
  }

  const base = (item ?? {}) as ApiScheduleItem
  const record = base as Record<string, unknown>
  const dateTextValue =
    base.dateText ?? readString(record, ['dateText', 'date', '날짜', '일자'])
  const title =
    base.title ??
    readString(record, ['title', 'name', '예선 이름', '예선이름', '행사명'])
  const location =
    base.location ?? readString(record, ['location', 'place', '장소'])
  const status =
    base.status ??
    readString(record, ['status', 'state', '진행 여부', '진행여부'])
  const note =
    base.note ??
    readString(record, [
      'note',
      'memo',
      '비고',
      '위치 링크',
      '위치링크',
      'href',
      'link',
      'url',
      'map',
    ])
  const division =
    base.division ?? readString(record, ['division', '구분', '종목', 'type'])
  const order =
    base.order ?? readString(record, ['order', '순서', '정렬', '번호'])
  const id = base.id ?? readString(record, ['id', 'ID', '식별자'])

  const divisionText =
    typeof division === 'string' ? division.trim() : undefined
  const divisionHasDate = looksLikeDateValue(divisionText)

  let dateText = dateTextValue
  let normalizedNote = note
  if (divisionHasDate && (!dateText || looksLikeUrl(dateText))) {
    if (dateText && looksLikeUrl(dateText) && !normalizedNote) {
      normalizedNote = dateText
    }
    dateText = divisionText
  }

  return {
    ...(base as ApiScheduleItem),
    id,
    order,
    division,
    title,
    dateText,
    location,
    status,
    note: normalizedNote,
  }
}

const getOrderValue = (item: ApiScheduleItem) => {
  if (typeof item.order === 'number') return item.order
  if (typeof item.order === 'string') {
    const parsed = Number(item.order)
    if (!Number.isNaN(parsed)) return parsed
  }
  return Number.POSITIVE_INFINITY
}

const getFallbackDate = (item: ApiScheduleItem) => {
  const divisionDateCandidate =
    typeof item.division === 'string' && looksLikeDateValue(item.division)
      ? item.division
      : undefined
  const startSource =
    item.startDate ?? item.start ?? item.dateText ?? divisionDateCandidate
  const endSource = item.endDate ?? item.end
  return parseDateValue(startSource) ?? parseDateValue(endSource)
}

const sortByOrder = (items: ApiScheduleItem[]) =>
  items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const orderDiff = getOrderValue(a.item) - getOrderValue(b.item)
      if (orderDiff !== 0) return orderDiff
      const aDate = getFallbackDate(a.item)
      const bDate = getFallbackDate(b.item)
      if (aDate && bDate) return aDate.getTime() - bDate.getTime()
      if (aDate) return -1
      if (bDate) return 1
      return a.index - b.index
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
  const parsed = parseDateValue(value)
  if (parsed) {
    return `${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(
      parsed.getDate()
    ).padStart(2, '0')}`
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
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
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
      if (start && end) {
        return liveByStatus || (start <= today && today <= end)
      }
      return liveByStatus
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
  const normalizedItems = rawItems.map(normalizeItem)
  const expandedItems = expandArcadeItems(normalizedItems)

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
