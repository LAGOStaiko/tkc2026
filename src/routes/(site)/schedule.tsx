import { useEffect, useState, type ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { FadeIn, TkcIcon } from '@/components/tkc/guide-shared'
import { PageHero } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/schedule')({
  component: SchedulePage,
})

/* ════════════════════════════════════════════════════════════════════ */
/*  Types                                                              */
/* ════════════════════════════════════════════════════════════════════ */

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

/* ════════════════════════════════════════════════════════════════════ */
/*  Constants                                                          */
/* ════════════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { id: 'division', label: '부문별 일정' },
  { id: 'timeline', label: '전체 타임라인' },
  { id: 'finals', label: '결선 토너먼트' },
]

const FALLBACK_SCHEDULE: ApiScheduleItem[] = [
  {
    order: 1,
    division: '콘솔',
    title: '콘솔 예선',
    dateText: '2026-03-02 ~ 2026-04-30',
  },
  {
    order: 2,
    division: '아케이드',
    title: '아케이드 온라인 예선',
    dateText: '2026-03-02 ~ 2026-03-16',
  },
  {
    order: 3,
    division: '아케이드',
    title: '아케이드 오프라인 예선 (서울)',
    dateText: '2026-03-21',
    location: 'TAIKO LABS · 서울',
  },
  {
    order: 4,
    division: '아케이드',
    title: '아케이드 오프라인 예선 (대전)',
    dateText: '2026-03-28',
    location: '대전 싸이뮤직 게임월드 · 대전',
  },
  {
    order: 5,
    division: '아케이드',
    title: '아케이드 오프라인 예선 (광주)',
    dateText: '2026-04-04',
    location: '광주 게임플라자 · 광주',
  },
  {
    order: 6,
    division: '아케이드',
    title: '아케이드 오프라인 예선 (부산)',
    dateText: '2026-04-11',
    location: '게임D · 부산',
  },
  {
    order: 7,
    division: '결선',
    title: '결선',
    dateText: '2026-05-23',
    location: '킨텍스 · PlayX4 2026',
  },
]

/* ════════════════════════════════════════════════════════════════════ */
/*  Data Utilities                                                     */
/* ════════════════════════════════════════════════════════════════════ */

const DEFAULT_VENUE_IMAGE = '/branding/v2/icon-arcade.png'

type VenueAsset = {
  image: string
  dates: string[]
  keywords: string[]
}

const VENUE_ASSETS: VenueAsset[] = [
  {
    image: '/branding/venue-seoul.webp',
    dates: ['2026-03-21', '03.21', '3.21', '03-21'],
    keywords: ['taiko labs', 'taikolabs', '서울', 'seoul'],
  },
  {
    image: '/branding/venue-daejeon.webp',
    dates: ['2026-03-28', '03.28', '3.28', '03-28'],
    keywords: ['싸이뮤직', 'cygameworld', '대전', 'daejeon'],
  },
  {
    image: '/branding/venue-gwangju.webp',
    dates: ['2026-04-04', '04.04', '4.04', '04-04'],
    keywords: ['게임플라자', 'gameplaza', '광주', 'gwangju'],
  },
  {
    image: '/branding/venue-busan.webp',
    dates: ['2026-04-11', '04.11', '4.11', '04-11'],
    keywords: ['게임d', '게임디', 'game d', 'gamed', '부산', 'busan'],
  },
]

const normalizeMatchText = (value?: string) =>
  (value ?? '').toLowerCase().replace(/[\s.\-·,/()]+/g, '')

const findVenueAsset = (item: ApiScheduleItem) => {
  const haystack = normalizeMatchText(`${item.title ?? ''} ${item.location ?? ''}`)
  const dateText = normalizeMatchText(item.dateText)
  return VENUE_ASSETS.find(
    (venue) =>
      venue.dates.some((date) => dateText.includes(normalizeMatchText(date))) ||
      venue.keywords.some((keyword) => haystack.includes(normalizeMatchText(keyword)))
  )
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

const formatDateObj = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`

const parseDateRangeFromText = (value?: string) => {
  if (!value) return { start: null, end: null }
  const matches =
    value.match(/(\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}|\d{1,2}[.\-/]\d{1,2})/g) ?? []
  const [first, second] = matches
  const start = parseDateValue(first)
  const end = parseDateValue(second)
  return { start, end }
}

const getDateRange = (item: ApiScheduleItem) => {
  const startSource = item.startDate ?? item.start
  const endSource = item.endDate ?? item.end
  const textRange = parseDateRangeFromText(item.dateText)

  const start = parseDateValue(startSource) ?? textRange.start
  const end = parseDateValue(endSource) ?? textRange.end

  return { start, end }
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

const resolveDateParts = (item: ApiScheduleItem) => {
  if (item.dateText) {
    const range = parseDateRangeFromText(item.dateText)
    if (range.start && range.end && range.start.getTime() !== range.end.getTime()) {
      return { main: formatDateObj(range.start), sub: `~ ${formatDateObj(range.end)}` }
    }
    const main = formatMmDd(item.dateText)
    if (main) return { main, sub: undefined }
    return { main: item.dateText, sub: undefined }
  }

  const startSource = item.startDate ?? item.start
  const endSource = item.endDate ?? item.end
  const start = formatMmDd(startSource)
  const end = formatMmDd(endSource)

  if (start && end) {
    if (start !== end) return { main: start, sub: `~ ${end}` }
    return { main: start, sub: undefined }
  }
  if (start) return { main: start, sub: undefined }
  if (end) return { main: end, sub: undefined }

  return { main: '추후', sub: '공지' }
}

const renderFinalMeta = (item: ApiScheduleItem | undefined) => {
  if (!item) return '추후 공개 예정입니다.'

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
  return pieces.length > 0 ? pieces.join(' · ') : '추후 공개 예정입니다.'
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Timeline Utilities                                                 */
/* ════════════════════════════════════════════════════════════════════ */

type TimelineEntry = {
  date: Date
  dateLabel: string
  division: 'console' | 'arcade' | 'all'
  title: string
  meta?: string
  mode?: 'online' | 'offline'
  isFinals?: boolean
  venueLabel?: string
  venueImage?: string
}

type TimelineGroupData = { dateLabel: string; entries: TimelineEntry[] }

const inferMode = (item: ApiScheduleItem): 'online' | 'offline' | undefined => {
  const title = (item.title ?? '').toLowerCase()
  const location = (item.location ?? '').toLowerCase()
  if (title.includes('온라인') || location === 'online' || location === '온라인')
    return 'online'
  if (title.includes('오프라인') || title.includes('결선')) return 'offline'
  if (item.location && item.location.trim().length > 0 && !looksLikeUrl(item.location))
    return 'offline'
  return undefined
}

const buildTimelineEntries = (
  groups: { items: ApiScheduleItem[]; division: 'console' | 'arcade' | 'all' }[]
): TimelineEntry[] => {
  const entries: TimelineEntry[] = []

  for (const { items, division } of groups) {
    for (const item of items) {
      const { start, end } = getDateRange(item)
      const mode = inferMode(item)
      const title = item.title ?? '일정'
      const isFinals = division === 'all'
      const locationMeta =
        item.location && !looksLikeUrl(item.location) ? item.location : undefined
      const venue = mode === 'offline' ? findVenueAsset(item) : undefined

      if (start && end && start.getTime() !== end.getTime()) {
        entries.push({
          date: start,
          dateLabel: formatDateObj(start),
          division,
          title: `${title} 시작`,
          meta: `~ ${formatDateObj(end)}까지`,
          mode,
          isFinals,
        })
        entries.push({
          date: end,
          dateLabel: formatDateObj(end),
          division,
          title: `${title} 마감`,
          isFinals,
        })
      } else {
        const d = start ?? end
        if (!d) continue
        entries.push({
          date: d,
          dateLabel: formatDateObj(d),
          division,
          title,
          meta: item.note && !looksLikeUrl(item.note) ? item.note : undefined,
          mode,
          isFinals,
          venueLabel: venue ? locationMeta ?? title : undefined,
          venueImage: venue?.image,
        })
      }
    }
  }

  entries.sort((a, b) => a.date.getTime() - b.date.getTime())
  return entries
}

const groupTimelineByDate = (entries: TimelineEntry[]): TimelineGroupData[] => {
  const groups: TimelineGroupData[] = []
  for (const entry of entries) {
    const last = groups[groups.length - 1]
    if (last && last.dateLabel === entry.dateLabel) {
      last.entries.push(entry)
    } else {
      groups.push({ dateLabel: entry.dateLabel, entries: [entry] })
    }
  }
  return groups
}

/* ════════════════════════════════════════════════════════════════════ */
/*  UI Components                                                      */
/* ════════════════════════════════════════════════════════════════════ */

function SectionBlock({
  id,
  num,
  title,
  desc,
  children,
}: {
  id: string
  num: string
  title: string
  desc: string
  children: ReactNode
}) {
  return (
    <section id={id} data-section={id} className='mb-20'>
      <FadeIn>
        <div className='mb-2 font-mono text-xs font-semibold tracking-[1px] text-[#e74c3c] uppercase'>
          Section {num}
        </div>
        <h2 className='mb-3 text-2xl font-bold tracking-tight text-white/90 md:text-[32px]'>
          {title}
        </h2>
        <p className='mb-8 max-w-[640px] text-[15px] leading-[1.55] font-light break-keep text-white/55'>
          {desc}
        </p>
      </FadeIn>
      <div className='space-y-5'>{children}</div>
    </section>
  )
}

function SectionNav({ activeId }: { activeId: string }) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className='sticky top-0 z-50 -mx-4 mb-10 border-b border-[#1e1e1e] bg-[#0a0a0a]/85 px-4 py-3 backdrop-blur-2xl md:-mx-6 md:px-6'>
      <div
        className='flex gap-1.5 overflow-x-auto'
        style={{ scrollbarWidth: 'none' }}
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type='button'
            onClick={() => scrollTo(item.id)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-medium whitespace-nowrap transition-all ${
              activeId === item.id
                ? 'border-[#2a2a2a] bg-[#111] text-white/90'
                : 'border-transparent text-white/35 hover:bg-[#111] hover:text-white/55'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

function ModeTag({ mode }: { mode: 'online' | 'offline' }) {
  return (
    <span
      className={`shrink-0 rounded-[5px] px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide ${
        mode === 'online'
          ? 'bg-[#4a9eff]/[0.08] text-[#4a9eff]'
          : 'bg-[#e74c3c]/[0.08] text-[#e74c3c]'
      }`}
    >
      {mode.toUpperCase()}
    </span>
  )
}

/* ── Division Panel ── */

type DisplayEvent = {
  dateMain: string
  dateSub?: string
  title: string
  meta?: string
  mode?: 'online' | 'offline'
  venueLabel?: string
  venueImage?: string
}

function SchedulePanel({
  icon: iconSrc,
  title,
  subtitle,
  variant,
  events,
}: {
  icon: string
  title: string
  subtitle: string
  variant: 'console' | 'arcade'
  events: DisplayEvent[]
}) {
  return (
    <div className='overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] transition-colors hover:border-[#2a2a2a]'>
      <div className='flex items-center gap-3.5 border-b border-[#1e1e1e] px-6 py-5'>
        <img
          src={iconSrc}
          alt=''
          className='h-11 w-11 shrink-0 rounded-xl object-cover'
          loading='lazy'
          draggable={false}
        />
        <div>
          <div className='text-lg font-bold text-white/90'>{title}</div>
          <div className='text-[13px] text-white/35'>{subtitle}</div>
        </div>
      </div>

      <div className='py-1.5'>
        {events.length === 0 ? (
          <div className='px-6 py-8 text-center text-sm text-white/35'>
            등록된 일정이 없습니다.
          </div>
        ) : (
          events.map((e, i) => (
            <div
              key={i}
              className='group relative flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.015] sm:items-center sm:gap-4 sm:px-6 sm:py-4'
            >
              {i < events.length - 1 && (
                <div className='absolute bottom-0 left-4 right-4 h-px bg-[#1e1e1e] sm:left-6 sm:right-6' />
              )}
              <div className='w-12 shrink-0 pt-0.5 font-mono text-[13px] font-semibold leading-tight text-white/55 sm:w-16 sm:pt-0 sm:text-[15px]'>
                {e.dateMain}
                {e.dateSub && (
                  <span className='block text-[11px] font-medium text-white/30 sm:text-xs'>
                    {e.dateSub}
                  </span>
                )}
              </div>
              <div
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full sm:mt-0 sm:h-2.5 sm:w-2.5 ${
                  variant === 'console' ? 'bg-[#e74c3c]' : 'bg-[#f5a623]'
                }`}
              />
              <div className='min-w-0 flex-1'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <div className='text-[14px] leading-[1.35] font-semibold break-keep text-white/90 sm:text-[15px]'>
                      {e.title}
                    </div>
                    {e.venueLabel ? (
                      <div className='mt-1 flex items-center gap-1.5 sm:gap-2'>
                        <img
                          src={e.venueImage ?? DEFAULT_VENUE_IMAGE}
                          alt={e.venueLabel}
                          className='size-5 rounded object-cover sm:size-6 sm:rounded-md'
                          loading='lazy'
                          onError={(event) => {
                            const image = event.currentTarget
                            if (image.dataset.fallbackApplied === 'true') return
                            image.dataset.fallbackApplied = 'true'
                            image.src = DEFAULT_VENUE_IMAGE
                          }}
                        />
                        <span className='text-[12px] text-white/40 sm:text-[13px]'>
                          {e.venueLabel}
                        </span>
                      </div>
                    ) : e.meta ? (
                      <div className='mt-0.5 text-[12px] text-white/35 sm:text-[13px]'>
                        {e.meta}
                      </div>
                    ) : null}
                    {e.venueLabel && e.meta && (
                      <div className='mt-0.5 text-[11px] text-white/30 sm:mt-1 sm:text-[12px]'>
                        {e.meta}
                      </div>
                    )}
                  </div>
                  {e.mode && (
                    <div className='hidden shrink-0 sm:block'>
                      <ModeTag mode={e.mode} />
                    </div>
                  )}
                </div>
                {e.mode && (
                  <div className='mt-1.5 sm:hidden'>
                    <ModeTag mode={e.mode} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ── Timeline ── */

function Timeline({ groups }: { groups: TimelineGroupData[] }) {
  if (groups.length === 0) {
    return (
      <div className='py-8 text-center text-sm text-white/35'>
        타임라인 데이터가 없습니다.
      </div>
    )
  }

  return (
    <div className='relative pl-9'>
      <div className='absolute top-2 bottom-2 left-[11px] w-0.5 bg-[#1e1e1e]' />

      {groups.map((group) => (
        <div key={group.dateLabel} className='mb-10 last:mb-0'>
          {/* Date marker */}
          <div className='relative mb-3.5 flex items-center gap-3'>
            <div
              className={`absolute -left-9 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-[#0a0a0a] ${
                group.entries.some((e) => e.isFinals)
                  ? 'bg-[#e74c3c] shadow-[0_0_0_3px_rgba(231,76,60,0.15),0_0_8px_rgba(231,76,60,0.3)]'
                  : 'bg-[#e74c3c] shadow-[0_0_0_2px_rgba(231,76,60,0.2)]'
              }`}
            />
            <span className='font-mono text-base font-semibold tracking-wide text-[#e74c3c]'>
              {group.dateLabel}
            </span>
          </div>

          {/* Events */}
          <div className='space-y-2.5'>
            {group.entries.map((entry, i) => (
              <div
                key={i}
                className={`flex items-center gap-3.5 rounded-xl border px-5 py-4 transition-colors hover:border-[#2a2a2a] ${
                  entry.isFinals
                    ? 'border-[#e74c3c]/25 bg-[#111]'
                    : 'border-[#1e1e1e] bg-[#111]'
                }`}
              >
                <div
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    entry.division === 'arcade' ? 'bg-[#f5a623]' : 'bg-[#e74c3c]'
                  } ${entry.isFinals ? 'shadow-[0_0_6px_rgba(231,76,60,0.4)]' : ''}`}
                />
                <div className='min-w-0 flex-1'>
                  <div className='text-[15px] font-semibold break-keep text-white/90'>
                    {entry.title}
                  </div>
                  {entry.venueLabel ? (
                    <div className='mt-1 flex items-center gap-2'>
                      <img
                        src={entry.venueImage ?? DEFAULT_VENUE_IMAGE}
                        alt={entry.venueLabel}
                        className='size-6 rounded-md object-cover'
                        loading='lazy'
                        onError={(event) => {
                          const image = event.currentTarget
                          if (image.dataset.fallbackApplied === 'true') return
                          image.dataset.fallbackApplied = 'true'
                          image.src = DEFAULT_VENUE_IMAGE
                        }}
                      />
                      <span className='text-[13px] text-white/40'>{entry.venueLabel}</span>
                    </div>
                  ) : entry.meta ? (
                    <div className='mt-0.5 text-[13px] text-white/35'>
                      {entry.meta}
                    </div>
                  ) : null}
                  {entry.venueLabel && entry.meta && (
                    <div className='mt-1 text-[12px] text-white/30'>{entry.meta}</div>
                  )}
                </div>
                {entry.mode && <ModeTag mode={entry.mode} />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Finals Teaser ── */

function FinalsTeaser({ title, meta }: { title: string; meta: string }) {
  return (
    <div className='relative overflow-hidden rounded-2xl border border-[#e74c3c]/20 bg-[#111] px-8 py-10 text-center'>
      <div className='absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#e74c3c] to-transparent' />
      <div className='pointer-events-none absolute -top-16 left-1/2 h-[200px] w-[400px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(231,76,60,0.06)_0%,transparent_70%)]' />

      <div className='relative'>
        <div className='mb-3 font-mono text-xs font-semibold tracking-[1px] text-[#e74c3c] uppercase'>
          PlayX4 2026 · Finals
        </div>
        <div className='mb-2 text-2xl font-extrabold tracking-tight text-white/90 md:text-[30px]'>
          {title}
        </div>
        <p className='text-[15px] leading-[1.55] break-keep text-white/55'>
          콘솔 · 아케이드 결선이 동시 진행됩니다.
        </p>
        <div className='mt-6 inline-flex items-center gap-2 rounded-[10px] border border-dashed border-[#e74c3c]/20 bg-[#e74c3c]/[0.06] px-6 py-3 font-mono text-[15px] font-semibold tracking-wide text-white/55'>
          {meta}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Page                                                               */
/* ════════════════════════════════════════════════════════════════════ */

function SchedulePage() {
  const [activeSection, setActiveSection] = useState('division')

  const rawItems = getScheduleItems(FALLBACK_SCHEDULE)
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

  /* Division panel events */
  const toDisplayEvents = (items: ApiScheduleItem[]): DisplayEvent[] =>
    items.map((item) => {
      const parts = resolveDateParts(item)
      const mode = inferMode(item)
      const venue = mode === 'offline' ? findVenueAsset(item) : undefined
      const metaParts = [
        !venue && item.location && !looksLikeUrl(item.location) ? item.location : undefined,
        item.note && !looksLikeUrl(item.note) ? item.note : undefined,
      ].filter(Boolean)
      return {
        dateMain: parts.main,
        dateSub: parts.sub,
        title: item.title ?? '일정',
        meta: metaParts.length > 0 ? metaParts.join(' · ') : undefined,
        mode,
        venueLabel: venue ? item.location ?? item.title : undefined,
        venueImage: venue?.image,
      }
    })

  const consoleEvents = toDisplayEvents(consoleItems)
  const arcadeEvents = toDisplayEvents(arcadeItems)

  /* Timeline */
  const timelineEntries = buildTimelineEntries([
    { items: consoleItems, division: 'console' },
    { items: arcadeItems, division: 'arcade' },
    { items: allItems, division: 'all' },
  ])
  const timelineGroups = groupTimelineByDate(timelineEntries)

  /* Finals */
  const finalItem = allItems[0]
  const finalTitle = finalItem?.title ?? 'PlayX4 결선 토너먼트'
  const finalMeta = renderFinalMeta(finalItem)

  /* Intersection observer for section nav */
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('[data-section]')
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.section
            if (id) setActiveSection(id)
          }
        }
      },
      { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' }
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('schedule.title')}`
  }, [])

  return (
    <>
      <PageHero
        badge='SCHEDULE'
        title='대회 일정'
        subtitle='콘솔과 아케이드 부문의 전체 일정을 확인하세요.'
      />
      <SectionNav activeId={activeSection} />

      {/* Section 01: Division Schedule */}
      <SectionBlock
        id='division'
        num='01'
        title='부문별 일정'
        desc='콘솔과 아케이드 부문의 예선 및 결선 일정입니다.'
      >
        <div className='grid gap-5 lg:grid-cols-2'>
          <SchedulePanel
            icon='/branding/v2/icon-console.png'
            title='콘솔'
            subtitle='콘솔 일정 및 경기 정보'
            variant='console'
            events={consoleEvents}
          />
          <SchedulePanel
            icon='/branding/v2/icon-arcade.png'
            title='아케이드'
            subtitle='아케이드 일정 및 경기 정보'
            variant='arcade'
            events={arcadeEvents}
          />
        </div>
      </SectionBlock>

      {/* Section 02: Timeline */}
      <SectionBlock
        id='timeline'
        num='02'
        title='전체 타임라인'
        desc='모든 일정을 시간순으로 확인합니다.'
      >
        <div className='mb-7 flex gap-6'>
          <div className='flex items-center gap-2.5 text-[15px] text-white/55'>
            <div className='h-2.5 w-2.5 rounded-full bg-[#e74c3c]' />
            콘솔
          </div>
          <div className='flex items-center gap-2.5 text-[15px] text-white/55'>
            <div className='h-2.5 w-2.5 rounded-full bg-[#f5a623]' />
            아케이드
          </div>
        </div>
        <Timeline groups={timelineGroups} />
      </SectionBlock>

      {/* Section 03: Finals */}
      <SectionBlock
        id='finals'
        num='03'
        title='결선 토너먼트'
        desc='예선을 통과한 선수들이 겨루는 최종 무대입니다.'
      >
        <FinalsTeaser title={finalTitle} meta={finalMeta} />
        <div className='flex items-center gap-3 rounded-xl border border-[#4a9eff]/[0.12] bg-[#4a9eff]/[0.04] p-4 text-[13px] leading-[1.55] text-white/55'>
          <TkcIcon name='info' className='size-4 shrink-0 opacity-80' />
          <span className='break-keep'>
            결선 세부 일정 및 진행 방식은 예선 종료 후{' '}
            <strong className='text-white/70'>공식 채널을 통해 공지</strong>됩니다.
          </span>
        </div>
      </SectionBlock>
    </>
  )
}

