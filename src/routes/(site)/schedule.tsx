import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { t } from '@/text'
import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/tkc/guide-shared'
import { PageHero, TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/schedule')({
  component: SchedulePage,
})

/* ════════════════════════════════════════════════════════════════════ */
/*  Types                                                              */
/* ════════════════════════════════════════════════════════════════════ */

type ScheduleEvent = {
  id: string
  date: string
  endDate?: string
  title: string
  subtitle?: string
  location?: string
  address?: string
  mapUrl?: string
  mapQuery?: string
  venueImage?: string
  mode: 'online' | 'offline' | 'finals'
  division: 'console' | 'arcade' | 'all'
  participants?: string[]
  qualified?: string[]
}

type MonthGroup = {
  month: number
  label: string
  labelEn: string
  events: ScheduleEvent[]
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Data                                                               */
/* ════════════════════════════════════════════════════════════════════ */

const SCHEDULE: MonthGroup[] = [
  {
    month: 3,
    label: '3월',
    labelEn: 'MARCH',
    events: [
      {
        id: 'online-start',
        date: '2026-03-02',
        title: '콘솔 · 아케이드 예선 시작',
        subtitle: '온라인 접수 개시',
        mode: 'online',
        division: 'all',
      },
      {
        id: 'seoul',
        date: '2026-03-21',
        title: '오프라인 예선 → 서울',
        location: 'TAIKO LABS',
        venueImage: '/branding/venue-seoul.webp',
        mapQuery: 'TAIKO LABS 서울',
        mode: 'offline',
        division: 'arcade',
        participants: [],
        qualified: [],
      },
      {
        id: 'daejeon',
        date: '2026-03-28',
        title: '오프라인 예선 → 대전',
        location: '싸이뮤직 게임월드',
        venueImage: '/branding/venue-daejeon.webp',
        mapQuery: '싸이뮤직 게임월드 대전',
        mode: 'offline',
        division: 'arcade',
        participants: [],
        qualified: [],
      },
    ],
  },
  {
    month: 4,
    label: '4월',
    labelEn: 'APRIL',
    events: [
      {
        id: 'gwangju',
        date: '2026-04-04',
        title: '오프라인 예선 → 광주',
        location: '게임플라자',
        venueImage: '/branding/venue-gwangju.webp',
        mapQuery: '게임플라자 광주',
        mode: 'offline',
        division: 'arcade',
        participants: [],
        qualified: [],
      },
      {
        id: 'busan',
        date: '2026-04-11',
        title: '오프라인 예선 → 부산',
        location: '게임D',
        venueImage: '/branding/venue-busan.webp',
        mapQuery: '게임D 부산',
        mode: 'offline',
        division: 'arcade',
        participants: [],
        qualified: [],
      },
      {
        id: 'console-deadline',
        date: '2026-04-30',
        title: '콘솔 예선 마감',
        subtitle: '온라인 예선 제출 종료',
        mode: 'online',
        division: 'console',
      },
    ],
  },
  {
    month: 5,
    label: '5월',
    labelEn: 'MAY',
    events: [
      {
        id: 'finals',
        date: '2026-05-23',
        title: '결선 → PlayX4',
        subtitle: '콘솔 + 아케이드 동시 진행',
        location: '킨텍스',
        mapQuery: '킨텍스',
        mode: 'finals',
        division: 'all',
        participants: [],
        qualified: [],
      },
    ],
  },
]

/* ════════════════════════════════════════════════════════════════════ */
/*  Utilities                                                          */
/* ════════════════════════════════════════════════════════════════════ */

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function fmtDate(d: string) {
  const date = new Date(d + 'T00:00:00')
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function fmtDayOfWeek(d: string) {
  return DAY_NAMES[new Date(d + 'T00:00:00').getDay()]
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Components                                                         */
/* ════════════════════════════════════════════════════════════════════ */

function ModeTag({ mode }: { mode: 'online' | 'offline' | 'finals' }) {
  const cfg = {
    online: { cls: 'bg-[#4a9eff]/[0.08] text-[#4a9eff]', label: 'ONLINE' },
    offline: { cls: 'bg-[#e74c3c]/[0.08] text-[#e74c3c]', label: 'OFFLINE' },
    finals: {
      cls: 'bg-gradient-to-r from-[#e74c3c]/[0.12] to-[#f5a623]/[0.12] text-[#f5a623]',
      label: 'FINALS',
    },
  }
  const { cls, label } = cfg[mode]

  return (
    <span
      className={cn(
        'shrink-0 rounded-[5px] px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide',
        cls
      )}
    >
      {label}
    </span>
  )
}

function MonthDivider({ label, labelEn }: { label: string; labelEn: string }) {
  const monthNum = label.replace('월', '')
  return (
    <div className='flex items-baseline gap-2 py-1'>
      <span className='text-[28px] leading-none font-black tracking-[-1px] text-white/[0.08]'>
        {monthNum}
      </span>
      <span className='text-[15px] font-bold text-white/50'>{labelEn}</span>
    </div>
  )
}

function VenueThumb({ src }: { src?: string }) {
  const [failed, setFailed] = useState(!src)
  if (!src || failed) return null
  return (
    <img
      src={src}
      alt=''
      className='size-7 shrink-0 rounded-md border border-white/10 object-cover'
      loading='lazy'
      draggable={false}
      onError={() => setFailed(true)}
    />
  )
}

/* ── Kakao Maps ── */

let kakaoPromise: Promise<void> | null = null

function loadKakaoSDK(): Promise<void> {
  if (kakaoPromise) return kakaoPromise
  const key = import.meta.env.VITE_KAKAO_MAP_KEY
  if (!key) {
    return Promise.reject(new Error('Missing VITE_KAKAO_MAP_KEY'))
  }

  kakaoPromise = new Promise<void>((resolve, reject) => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve())
      return
    }
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`
    script.onload = () => {
      window.kakao!.maps.load(() => resolve())
    }
    script.onerror = () => {
      kakaoPromise = null
      reject(new Error('Kakao Maps SDK load failed'))
    }
    document.head.appendChild(script)
  })
  return kakaoPromise
}

function VenueMap({ query }: { query: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false

    loadKakaoSDK()
      .then(() => {
        if (cancelled || !containerRef.current) return
        const k = window.kakao!.maps

        const map = new k.Map(containerRef.current, {
          center: new k.LatLng(37.5665, 126.978),
          level: 3,
        })

        const ps = new k.services.Places()
        ps.keywordSearch(query, (data, searchStatus) => {
          if (cancelled) return
          if (searchStatus === k.services.Status.OK && data[0]) {
            const pos = new k.LatLng(Number(data[0].y), Number(data[0].x))
            map.setCenter(pos)
            new k.Marker({ map, position: pos })
            setStatus('ready')
          } else {
            setStatus('error')
          }
        })
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [query])

  if (status === 'error') return null

  return (
    <div className='mt-2.5 overflow-hidden rounded-lg border border-[#1e1e1e]'>
      <div
        ref={containerRef}
        className={cn(
          'h-[160px] w-full bg-[#0d0d0d]',
          status === 'loading' && 'animate-pulse'
        )}
      />
      <a
        href={`https://map.kakao.com/link/search/${encodeURIComponent(query)}`}
        target='_blank'
        rel='noopener noreferrer'
        className='flex items-center justify-center gap-1.5 border-t border-[#1e1e1e] bg-[#0d0d0d] py-2 text-[11px] font-medium text-white/30 transition-colors hover:text-[#4a9eff]'
      >
        카카오맵에서 보기 →
      </a>
    </div>
  )
}

/* ── Event Row ── */

function EventRow({
  event,
  expanded,
  onToggle,
}: {
  event: ScheduleEvent
  expanded: boolean
  onToggle: () => void
}) {
  const isFinals = event.mode === 'finals'
  const hasDetail = !!(
    event.venueImage ||
    event.address ||
    event.mapUrl ||
    event.participants ||
    event.qualified
  )

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border transition-all',
        isFinals
          ? 'border-[#e74c3c]/20 bg-[#111]'
          : 'border-[#1e1e1e] bg-[#111] hover:border-[#2a2a2a]'
      )}
    >
      {isFinals && (
        <div className='h-[3px] bg-gradient-to-r from-[#e74c3c] to-[#f5a623]' />
      )}

      <button
        type='button'
        onClick={hasDetail ? onToggle : undefined}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors sm:gap-4 sm:px-5 sm:py-4',
          hasDetail && 'cursor-pointer hover:bg-white/[0.02]',
          !hasDetail && 'cursor-default'
        )}
      >
        {/* Date */}
        <div className='w-[52px] shrink-0 text-right sm:w-[56px]'>
          <span className='font-mono text-[14px] font-extrabold tracking-tight tabular-nums text-white/60'>
            {fmtDate(event.date)}
          </span>
          <span className='ml-0.5 font-mono text-[11px] font-medium text-white/25'>
            ({fmtDayOfWeek(event.date)})
          </span>
        </div>

        {/* Indicator: venue thumb or colored dot */}
        {event.venueImage ? (
          <VenueThumb src={event.venueImage} />
        ) : (
          <span
            className={cn(
              'size-2 shrink-0 rounded-full',
              isFinals
                ? 'bg-[#f5a623] shadow-[0_0_6px_rgba(245,166,35,0.35)]'
                : event.mode === 'online'
                  ? 'bg-[#4a9eff] shadow-[0_0_6px_rgba(74,158,255,0.3)]'
                  : 'bg-[#e74c3c]'
            )}
          />
        )}

        {/* Title + meta */}
        <div className='min-w-0 flex-1'>
          <div
            className={cn(
              'text-[14px] font-semibold break-keep sm:text-[15px]',
              isFinals
                ? 'bg-gradient-to-r from-[#e74c3c] to-[#f5a623] bg-clip-text text-transparent'
                : 'text-white/85'
            )}
          >
            {event.title}
          </div>
          {event.subtitle && (
            <div className='mt-0.5 text-[12px] text-white/35'>
              {event.subtitle}
            </div>
          )}
          {event.location && !expanded && (
            <div className='mt-0.5 text-[12px] text-white/35'>
              {event.location}
            </div>
          )}
        </div>

        {/* Mode tag */}
        <div className='hidden sm:block'>
          <ModeTag mode={event.mode} />
        </div>

        {/* Chevron */}
        {hasDetail && (
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-white/25 transition-transform duration-200',
              expanded && 'rotate-180'
            )}
          />
        )}
      </button>

      {/* Mobile mode tag */}
      {!expanded && (
        <div className='px-4 pb-3 sm:hidden'>
          <ModeTag mode={event.mode} />
        </div>
      )}

      {/* Expandable detail */}
      {expanded && hasDetail && (
        <div className='border-t border-[#1e1e1e] px-4 py-4 sm:px-5'>
          <div className='mb-3 sm:hidden'>
            <ModeTag mode={event.mode} />
          </div>
          <EventDetail event={event} />
        </div>
      )}
    </div>
  )
}

/* ── Event Detail (expanded) ── */

function EventDetail({ event }: { event: ScheduleEvent }) {
  return (
    <div className='space-y-4'>
      {/* Venue card */}
      {(event.venueImage || event.address || event.mapQuery) && (
        <div className='overflow-hidden rounded-lg border border-[#1e1e1e] bg-[#0d0d0d]'>
          <div className='flex items-start gap-3.5 p-3.5'>
            {event.venueImage && (
              <img
                src={event.venueImage}
                alt={event.location ?? ''}
                className='size-16 shrink-0 rounded-lg border border-white/10 object-cover'
                loading='lazy'
                draggable={false}
              />
            )}
            <div className='min-w-0 flex-1'>
              {event.location && (
                <div className='text-[14px] font-bold text-white/80'>
                  {event.location}
                </div>
              )}
              {event.address && (
                <div className='mt-0.5 text-[12px] text-white/35'>
                  {event.address}
                </div>
              )}
              {event.mapUrl && (
                <a
                  href={event.mapUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-[#4a9eff] hover:text-[#6ab0ff]'
                >
                  지도 보기 →
                </a>
              )}
            </div>
          </div>
          {event.mapQuery && <VenueMap query={event.mapQuery} />}
        </div>
      )}

      {/* Participants */}
      {event.participants && (
        <div>
          <div className='mb-2 text-[11px] font-semibold tracking-wide text-white/30 uppercase'>
            출전자
          </div>
          {event.participants.length > 0 ? (
            <div className='flex flex-wrap gap-1.5'>
              {event.participants.map((name) => (
                <span
                  key={name}
                  className='rounded-md border border-[#1e1e1e] bg-[#151515] px-2.5 py-1 text-[12px] font-medium text-white/60'
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <div className='rounded-lg border border-dashed border-[#1e1e1e] px-3 py-2.5 text-[12px] text-white/20'>
              추후 공개
            </div>
          )}
        </div>
      )}

      {/* Qualified */}
      {event.qualified && (
        <div>
          <div className='mb-2 text-[11px] font-semibold tracking-wide text-white/30 uppercase'>
            진출자
          </div>
          {event.qualified.length > 0 ? (
            <div className='flex flex-wrap gap-1.5'>
              {event.qualified.map((name) => (
                <span
                  key={name}
                  className='rounded-md border border-[#f5a623]/20 bg-[#f5a623]/[0.06] px-2.5 py-1 text-[12px] font-semibold text-[#f5a623]'
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <div className='rounded-lg border border-dashed border-[#1e1e1e] px-3 py-2.5 text-[12px] text-white/20'>
              추후 공개
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Page                                                               */
/* ════════════════════════════════════════════════════════════════════ */

function SchedulePage() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('schedule.title')}`
  }, [])

  return (
    <TkcSection className='space-y-8'>
      <PageHero
        badge='SCHEDULE'
        title='대회 일정'
        subtitle='콘솔과 아케이드 부문의 전체 일정을 확인하세요.'
      />

      <div className='space-y-8'>
        {SCHEDULE.map((group) => (
          <div key={group.month}>
            <FadeIn>
              <MonthDivider label={group.label} labelEn={group.labelEn} />
            </FadeIn>
            <div className='mt-3 space-y-2'>
              {group.events.map((event, i) => (
                <FadeIn key={event.id} delay={i * 60}>
                  <EventRow
                    event={event}
                    expanded={expanded.has(event.id)}
                    onToggle={() => toggle(event.id)}
                  />
                </FadeIn>
              ))}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className='flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#1e1e1e] pt-3.5'>
          <span className='inline-flex items-center gap-1.5 text-[11px] text-white/35'>
            <span className='size-1.5 rounded-full bg-[#4a9eff]' />
            온라인
          </span>
          <span className='inline-flex items-center gap-1.5 text-[11px] text-white/35'>
            <span className='size-1.5 rounded-full bg-[#e74c3c]' />
            오프라인
          </span>
          <span className='inline-flex items-center gap-1.5 text-[11px] text-white/35'>
            <span className='size-1.5 rounded-full bg-[#f5a623]' />
            결선
          </span>
        </div>
      </div>
    </TkcSection>
  )
}
