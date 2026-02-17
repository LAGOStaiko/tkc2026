import { useEffect, useRef, useState } from 'react'
import { t } from '@/text'
import { ChevronDown, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/tkc/guide-shared'
import { PageHero, TkcSection } from '@/components/tkc/layout'

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
  region?: string
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
        region: '서울',
        venueImage: '/branding/venue-seoul.webp',
        mapQuery: '타이코 랩스 서울',
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
        region: '대전',
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
        region: '광주',
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
        region: '부산',
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
        region: '고양',
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
        'shrink-0 rounded-[5px] px-2.5 py-1 font-mono text-[12px] font-semibold tracking-wide',
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

function VenueMap({ query, location }: { query: string; location?: string }) {
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

  const kakaoLink = `https://map.kakao.com/link/search/${encodeURIComponent(query)}`

  /* Error fallback */
  if (status === 'error') {
    return (
      <div className='venue-map-area border-t border-[#1a1a1a] sm:border-t-0 sm:border-l'>
        <div className='flex h-[180px] flex-col items-center justify-center gap-2 sm:h-full sm:min-h-[160px]'>
          <div className='flex size-7 items-center justify-center rounded-full bg-[#e74c3c]/[0.08]'>
            <MapPin className='size-3.5 text-[#e74c3c]' />
          </div>
          <a
            href={kakaoLink}
            target='_blank'
            rel='noopener noreferrer'
            onClick={(e) => e.stopPropagation()}
            className='rounded-[5px] border border-[#4a9eff]/[0.12] bg-[#4a9eff]/[0.04] px-2.5 py-1 text-[12px] font-semibold text-[#4a9eff] transition-colors hover:bg-[#4a9eff]/[0.08]'
          >
            카카오맵에서 보기 →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className='venue-map-area relative border-t border-[#1a1a1a] sm:border-t-0 sm:border-l'>
      {/* Floating badge */}
      {status === 'ready' && (
        <div className='pointer-events-none absolute top-2 left-2 z-[2] flex items-center gap-1 rounded-md border border-white/[0.06] bg-black/70 px-2 py-1 text-[12px] font-semibold text-white/55 backdrop-blur-[10px]'>
          <MapPin className='size-2.5 text-[#e74c3c]' />
          {location ?? query}
        </div>
      )}

      {/* Loading overlay */}
      {status === 'loading' && (
        <div className='absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2'>
          <div className='size-[18px] animate-spin rounded-full border-2 border-white/[0.06] border-t-[#e74c3c]' />
          <span className='text-[12px] text-white/30'>지도를 불러오는 중</span>
        </div>
      )}

      <div
        ref={containerRef}
        className='h-[180px] w-full bg-[#0d0d0d] sm:h-full sm:min-h-[160px]'
      />
    </div>
  )
}

/* ── Venue Row (inline) ── */

function VenueRow({ event }: { event: ScheduleEvent }) {
  const kakaoLink = event.mapQuery
    ? `https://map.kakao.com/link/search/${encodeURIComponent(event.mapQuery)}`
    : undefined
  const naverLink = event.mapQuery
    ? `https://map.naver.com/v5/search/${encodeURIComponent(event.mapQuery)}`
    : undefined

  return (
    <div className='flex items-center gap-2.5'>
      {event.venueImage && (
        <img
          src={event.venueImage}
          alt={event.location ?? ''}
          className='size-8 shrink-0 rounded-md border border-white/[0.06] object-cover'
          loading='lazy'
          draggable={false}
        />
      )}
      <div className='min-w-0 flex-1'>
        {event.location && (
          <div className='text-[13px] font-bold text-white/90'>
            {event.location}
          </div>
        )}
        {event.address && (
          <div className='mt-0.5 text-[12px] text-white/25'>
            {event.address}
          </div>
        )}
      </div>
      <div className='flex shrink-0 gap-1'>
        {kakaoLink && (
          <a
            href={kakaoLink}
            target='_blank'
            rel='noopener noreferrer'
            onClick={(e) => e.stopPropagation()}
            className='rounded-[4px] border border-white/[0.05] bg-white/[0.03] px-2 py-1 text-[12px] font-semibold text-white/25 transition-colors hover:border-[#4a9eff]/15 hover:text-[#4a9eff]'
          >
            카카오맵
          </a>
        )}
        {naverLink && (
          <a
            href={naverLink}
            target='_blank'
            rel='noopener noreferrer'
            onClick={(e) => e.stopPropagation()}
            className='rounded-[4px] border border-white/[0.05] bg-white/[0.03] px-2 py-1 text-[12px] font-semibold text-white/25 transition-colors hover:border-[#4a9eff]/15 hover:text-[#4a9eff]'
          >
            길찾기
          </a>
        )}
      </div>
    </div>
  )
}

/* ── Players Row (inline) ── */

function PlayersRow({
  label,
  count,
  names,
  variant = 'default',
}: {
  label: string
  count: number
  names: string[]
  variant?: 'default' | 'qualified'
}) {
  const isQ = variant === 'qualified'

  return (
    <div className='flex flex-wrap items-baseline gap-1.5 py-1.5'>
      <span
        className={cn(
          'flex shrink-0 items-center gap-1 text-[12px] font-bold',
          isQ ? 'text-[#f5a623]' : 'text-white/25'
        )}
      >
        {label}
        <span
          className={cn(
            'rounded-[3px] px-1 py-px font-mono text-[12px] font-bold',
            isQ
              ? 'bg-[#f5a623]/10 text-[#f5a623]'
              : 'bg-white/[0.04] text-white/25'
          )}
        >
          {count > 0 ? count : '—'}
        </span>
      </span>
      {names.length > 0 ? (
        <div className='flex flex-wrap gap-[3px]'>
          {names.map((name) => (
            <span
              key={name}
              className={cn(
                'rounded-[4px] border px-[7px] py-[2px] text-[12px] font-semibold',
                isQ
                  ? 'border-[#f5a623]/12 bg-[#f5a623]/[0.05] text-[#f5a623]'
                  : 'border-white/[0.05] bg-white/[0.04] text-white/90'
              )}
            >
              {name}
            </span>
          ))}
        </div>
      ) : (
        <span className='text-[12px] text-white/25 italic'>추후 공개</span>
      )}
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
    event.mapQuery ||
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
          <span className='font-mono text-[14px] font-extrabold tracking-tight text-white/60 tabular-nums'>
            {fmtDate(event.date)}
          </span>
          <span className='ml-0.5 font-mono text-[12px] font-medium text-white/25'>
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
            <div className='mt-0.5 text-[13px] text-white/35'>
              {event.subtitle}
            </div>
          )}
          {event.location && !expanded && (
            <div className='mt-0.5 text-[13px] text-white/35'>
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
  const hasVenue = !!(event.venueImage || event.address || event.mapQuery)
  const hasPlayers = !!(event.participants || event.qualified)
  const hasMap = !!event.mapQuery

  return (
    <div className='overflow-hidden rounded-xl border border-[#1a1a1a] bg-[#0d0d0d]'>
      <div
        className={cn(
          'flex flex-col',
          hasMap && 'sm:grid sm:grid-cols-[1fr_180px]'
        )}
      >
        {/* Left: venue + players */}
        <div className='space-y-0'>
          {hasVenue && (
            <div className='px-3.5 py-3'>
              <VenueRow event={event} />
            </div>
          )}

          {hasPlayers && (
            <div
              className={cn(
                'px-3.5 pb-2.5',
                hasVenue && 'border-t border-white/[0.04] pt-1'
              )}
            >
              {event.participants && (
                <PlayersRow
                  label='출전자'
                  count={event.participants.length}
                  names={event.participants}
                />
              )}
              {event.qualified && (
                <div className='border-t border-white/[0.04]'>
                  <PlayersRow
                    label='진출자'
                    count={event.qualified.length}
                    names={event.qualified}
                    variant='qualified'
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: map */}
        {hasMap && (
          <VenueMap query={event.mapQuery!} location={event.location} />
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Page                                                               */
/* ════════════════════════════════════════════════════════════════════ */

export function SchedulePage() {
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
          <span className='inline-flex items-center gap-1.5 text-[12px] text-white/35'>
            <span className='size-1.5 rounded-full bg-[#4a9eff]' />
            온라인
          </span>
          <span className='inline-flex items-center gap-1.5 text-[12px] text-white/35'>
            <span className='size-1.5 rounded-full bg-[#e74c3c]' />
            오프라인
          </span>
          <span className='inline-flex items-center gap-1.5 text-[12px] text-white/35'>
            <span className='size-1.5 rounded-full bg-[#f5a623]' />
            결선
          </span>
        </div>
      </div>
    </TkcSection>
  )
}
