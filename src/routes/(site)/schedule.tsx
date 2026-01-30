import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'
import { cn } from '@/lib/utils'
import { useSchedule } from '@/lib/api'
import { t } from '@/text'

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
  state?: string
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

type DivisionKey = 'console' | 'arcade' | 'final'

const DIV_CONSOLE: DivisionKey = 'console'
const DIV_ARCADE: DivisionKey = 'arcade'
const DIV_FINAL: DivisionKey = 'final'

const LABEL_CONSOLE = t('schedule.tab.console')
const LABEL_ARCADE = t('schedule.tab.arcade')
const LABEL_UPCOMING = t('schedule.status.upcoming')
const LABEL_LIVE = t('schedule.status.live')
const LABEL_DONE = t('schedule.status.done')

const ASSETS = {
  consoleIcon: '/branding/v2/icon-console.png',
  arcadeIcon: '/branding/v2/icon-arcade.png',
}

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

const resolveDivision = (item: ScheduleItem): DivisionKey | null => {
  const raw = [
    item.division,
    item.category,
    item.type,
    item.track,
    item.title,
    item.note,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (!raw) return null
  if (raw.includes('final') || raw.includes('playx4') || raw.includes('결선')) {
    return DIV_FINAL
  }
  if (raw.includes('console') || raw.includes('콘솔')) {
    return DIV_CONSOLE
  }
  if (raw.includes('arcade') || raw.includes('아케이드')) {
    return DIV_ARCADE
  }
  return null
}

const normalizeStatusLabel = (item: ScheduleItem) => {
  const raw = item.status ?? item.state ?? ''
  if (!raw) return null
  const normalized = raw.toLowerCase()
  if (normalized.includes('upcoming') || normalized.includes('예정')) {
    return LABEL_UPCOMING
  }
  if (
    normalized.includes('open') ||
    normalized.includes('live') ||
    normalized.includes('진행')
  ) {
    return LABEL_LIVE
  }
  if (
    normalized.includes('done') ||
    normalized.includes('finished') ||
    normalized.includes('종료') ||
    normalized.includes('완료')
  ) {
    return LABEL_DONE
  }
  return raw
}

const getDateSource = (item: ScheduleItem) =>
  (item.dateText ?? item.start ?? item.end ?? '').trim()

const formatDateBadge = (item: ScheduleItem) => {
  const raw = getDateSource(item)
  if (!raw) return '--.--'
  const firstChunk = raw.split(' ')[0].split('~')[0].trim()
  const isoMatch = firstChunk.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (isoMatch) {
    const [, , mm, dd] = isoMatch
    return `${mm.padStart(2, '0')}.${dd.padStart(2, '0')}`
  }
  const slashMatch = firstChunk.match(/(\d{1,2})[.\-/](\d{1,2})/)
  if (slashMatch) {
    const [, mm, dd] = slashMatch
    return `${mm.padStart(2, '0')}.${dd.padStart(2, '0')}`
  }
  const koMatch = firstChunk.match(/(\d{1,2})\s*월\s*(\d{1,2})/)
  if (koMatch) {
    const [, mm, dd] = koMatch
    return `${mm.padStart(2, '0')}.${dd.padStart(2, '0')}`
  }
  return firstChunk
}

const renderRangeText = (item: ScheduleItem) => {
  if (item.start && item.end) return `${item.start} ~ ${item.end}`
  return item.start ?? item.end ?? item.dateText ?? ''
}

const resolveSubText = (item: ScheduleItem) =>
  item.note ?? item.location ?? renderRangeText(item)

const toDateValue = (item: ScheduleItem) => {
  const raw = getDateSource(item)
  if (!raw) return Number.POSITIVE_INFINITY
  const parsed = Date.parse(raw)
  if (!Number.isNaN(parsed)) return parsed
  const isoMatch = raw.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch
    return new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd)
    ).getTime()
  }
  const shortMatch = raw.match(/(\d{1,2})[.\-/](\d{1,2})/)
  if (shortMatch) {
    const nowYear = new Date().getFullYear()
    const [, mm, dd] = shortMatch
    return new Date(nowYear, Number(mm) - 1, Number(dd)).getTime()
  }
  const koMatch = raw.match(/(\d{1,2})\s*월\s*(\d{1,2})/)
  if (koMatch) {
    const nowYear = new Date().getFullYear()
    const [, mm, dd] = koMatch
    return new Date(nowYear, Number(mm) - 1, Number(dd)).getTime()
  }
  return Number.POSITIVE_INFINITY
}

const sortScheduleItems = (items: ScheduleItem[]) =>
  items
    .slice()
    .sort((a, b) => toDateValue(a) - toDateValue(b))

function ScheduleItemCard({
  item,
  isFeatured,
  fallbackIndex,
}: {
  item: ScheduleItem
  isFeatured?: boolean
  fallbackIndex: number
}) {
  const heading = item.title ?? `${t('schedule.itemFallback')} ${fallbackIndex}`
  const dateBadge = formatDateBadge(item)
  const subText = resolveSubText(item)
  const statusLabel = normalizeStatusLabel(item)

  return (
    <div
      className={cn(
        'flex items-start gap-4 rounded-2xl px-5 py-4 shadow-[0_18px_35px_rgba(0,0,0,0.25)]',
        isFeatured ? 'bg-[#ff2a2a] text-white' : 'bg-white text-black'
      )}
    >
      <div className='text-lg font-extrabold tabular-nums'>{dateBadge}</div>
      <div className='flex min-w-0 flex-1 items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='font-bold break-keep whitespace-pre-wrap'>
            {heading}
          </div>
          {subText ? (
            <div
              className={cn(
                'mt-1 text-sm opacity-80 break-keep whitespace-pre-wrap',
                isFeatured ? 'text-white/90' : 'text-black/70'
              )}
            >
              {subText}
            </div>
          ) : null}
        </div>
        {statusLabel ? (
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
              isFeatured ? 'bg-white/20 text-white' : 'bg-black/10 text-black/70'
            )}
          >
            {statusLabel}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function ScheduleLane({
  title,
  description,
  iconSrc,
  items,
  isLoading,
}: {
  title: string
  description: string
  iconSrc: string
  items: ScheduleItem[]
  isLoading?: boolean
}) {
  const ordered = sortScheduleItems(items)

  return (
    <section className='rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]'>
      <div className='flex items-center gap-3'>
        <div className='grid h-12 w-12 place-items-center rounded-xl bg-white/10'>
          <img
            src={iconSrc}
            alt=''
            className='h-7 w-7 object-contain'
            loading='lazy'
            draggable={false}
          />
        </div>
        <div>
          <div className='text-lg font-semibold text-white'>{title}</div>
          <p className='text-sm text-white/70'>{description}</p>
        </div>
      </div>

      <div className='mt-5 space-y-3'>
        {isLoading ? (
          <p className='text-sm text-white/60'>{t('schedule.loading')}</p>
        ) : ordered.length === 0 ? (
          <p className='text-sm text-white/60'>{t('schedule.empty')}</p>
        ) : (
          ordered.map((item, index) => (
            <ScheduleItemCard
              key={item.id ?? `${title}-${index}`}
              item={item}
              isFeatured={index === 0}
              fallbackIndex={index + 1}
            />
          ))
        )}
      </div>
    </section>
  )
}

function SchedulePage() {
  const { data, isLoading, isError } = useSchedule<
    ScheduleData | ScheduleItem[]
  >()
  const items = getScheduleItems(data)

  const consoleItems = items.filter(
    (item) => resolveDivision(item) === DIV_CONSOLE
  )
  const arcadeItems = items.filter(
    (item) => resolveDivision(item) === DIV_ARCADE
  )
  const finalItems = items.filter(
    (item) => resolveDivision(item) === DIV_FINAL
  )
  const finalItem = sortScheduleItems(finalItems)[0]

  const finalSubtitle = finalItem
    ? (() => {
        const base = renderRangeText(finalItem)
        const location = finalItem.location ?? finalItem.note ?? ''
        const pieces = [base, location].filter(Boolean)
        const includesPlayX4 =
          pieces.join(' ').toLowerCase().includes('playx4') ||
          pieces.join(' ').includes('플레이')
        if (!includesPlayX4) pieces.push('PlayX4')
        return pieces.join(' · ')
      })()
    : '추후 공개됩니다.'

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

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <ScheduleLane
          title={LABEL_CONSOLE}
          description='콘솔 대회 일정을 확인하세요.'
          iconSrc={ASSETS.consoleIcon}
          items={consoleItems}
          isLoading={isLoading}
        />
        <ScheduleLane
          title={LABEL_ARCADE}
          description='아케이드 대회 일정을 확인하세요.'
          iconSrc={ASSETS.arcadeIcon}
          items={arcadeItems}
          isLoading={isLoading}
        />
      </div>

      <section className='mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]'>
        <div className='text-lg font-semibold text-white'>
          플레이엑스포 결선 토너먼트
        </div>
        <p className='mt-2 text-sm text-white/70 break-keep whitespace-pre-wrap'>
          {finalSubtitle}
        </p>
      </section>
    </TkcSection>
  )
}
