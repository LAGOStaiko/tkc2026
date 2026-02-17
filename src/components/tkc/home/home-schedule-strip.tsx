import { useState } from 'react'

type RangeEvent = {
  type: 'range'
  name: string
  fullDate: string
  detail: string
  badge?: 'ONLINE'
}
type SingleEvent = {
  type: 'single'
  name: string
  fullDate: string
  venueName: string
  venueImage?: string
}
type DeadlineEvent = {
  type: 'deadline'
  name: string
  detail: string
  fullDate: string
}
type FinalsEvent = {
  type: 'finals'
  name: string
  detail: string
  fullDate: string
  venueName: string
  footerLabel: string
  footerDate: string
  footerLogoSrc?: string
}
type ScheduleEvent = RangeEvent | SingleEvent | DeadlineEvent | FinalsEvent

const SCHEDULE_MONTHS: {
  month: string
  labelEn: string
  isFinals?: boolean
  events: ScheduleEvent[]
}[] = [
  {
    month: '3',
    labelEn: 'MARCH',
    events: [
      {
        type: 'range',
        name: '콘솔 · 아케이드 예선 시작',
        fullDate: '2026-03-02',
        detail: '온라인 접수 개시',
        badge: 'ONLINE',
      },
      {
        type: 'single',
        name: '오프라인 예선 → 서울',
        fullDate: '2026-03-21',
        venueName: 'TAIKO LABS',
        venueImage: '/branding/venue-seoul.webp',
      },
      {
        type: 'single',
        name: '오프라인 예선 → 대전',
        fullDate: '2026-03-28',
        venueName: '싸이뮤직 게임월드',
        venueImage: '/branding/venue-daejeon.webp',
      },
    ],
  },
  {
    month: '4',
    labelEn: 'APRIL',
    events: [
      {
        type: 'single',
        name: '오프라인 예선 → 광주',
        fullDate: '2026-04-04',
        venueName: '게임플라자',
        venueImage: '/branding/venue-gwangju.webp',
      },
      {
        type: 'single',
        name: '오프라인 예선 → 부산',
        fullDate: '2026-04-11',
        venueName: '게임D',
        venueImage: '/branding/venue-busan.webp',
      },
      {
        type: 'deadline',
        name: '콘솔 예선 마감',
        detail: '온라인 예선 제출 종료',
        fullDate: '2026-04-30',
      },
    ],
  },
  {
    month: '5',
    labelEn: 'MAY',
    isFinals: true,
    events: [
      {
        type: 'finals',
        name: '결선 → PlayX4',
        detail: '콘솔 + 아케이드 동시 진행',
        fullDate: '2026-05-23',
        venueName: '킨텍스',
        footerLabel: '플레이 엑스포 현장 결선',
        footerDate: '26. 5. 23 (토)',
        footerLogoSrc: '/branding/playx4-bi-white.png',
      },
    ],
  },
]

function fmtDate(d: string) {
  const date = new Date(d + 'T00:00:00')
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate()
  ).padStart(2, '0')}`
}

function VenueThumb({ src }: { src?: string }) {
  const [failed, setFailed] = useState(!src)

  if (!src || failed) {
    return (
      <span className='flex size-7 shrink-0 items-center justify-center rounded-md border border-[#e74c3c]/20 bg-[#e74c3c]/12 text-[12px] leading-none text-[#e74c3c]/80'>
        📍
      </span>
    )
  }

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

export function HomeScheduleStrip() {
  return (
    <div>
      <div className='grid grid-cols-1 gap-2.5 md:grid-cols-3 md:gap-3'>
        {SCHEDULE_MONTHS.map((group, idx) => {
          const finalsEvent = group.events.find(
            (event): event is FinalsEvent => event.type === 'finals'
          )
          const tag = group.isFinals
            ? {
                label: 'FINALS',
                cls: 'border-[#e74c3c]/20 bg-[#e74c3c]/10 text-[#e74c3c]',
              }
            : idx === 0
              ? {
                  label: '예선 시작',
                  cls: 'border-[#4a9eff]/15 bg-[#4a9eff]/8 text-[#4a9eff]',
                }
              : {
                  label: '예선 마감',
                  cls: 'border-[#4a9eff]/15 bg-[#4a9eff]/8 text-[#4a9eff]',
                }

          return (
            <div
              key={group.month}
              className={`overflow-hidden rounded-[14px] border bg-[#111] transition-all duration-300 md:hover:-translate-y-0.5 ${
                group.isFinals
                  ? 'border-[#e74c3c]/20 md:hover:border-[#e74c3c]/35'
                  : 'border-[#1e1e1e] md:hover:border-[#2a2a2a]'
              }`}
            >
              <div
                className={`h-[3px] ${
                  group.isFinals
                    ? 'bg-gradient-to-r from-[#e74c3c] to-[#f5a623]'
                    : 'bg-gradient-to-r from-[#1e1e1e] to-transparent'
                }`}
              />

              <div className='p-5'>
                <div className='mb-4 flex items-center justify-between gap-2'>
                  <div className='flex items-baseline gap-1.5'>
                    <span
                      className={`text-[28px] leading-none font-black tracking-[-1px] ${
                        group.isFinals
                          ? 'bg-gradient-to-br from-[#e74c3c] to-[#f5a623] bg-clip-text text-transparent opacity-60'
                          : 'text-white/[0.12]'
                      }`}
                    >
                      {group.month}
                    </span>
                    <span
                      className={`text-[15px] font-bold ${
                        group.isFinals ? 'text-white/80' : 'text-white/60'
                      }`}
                    >
                      {group.labelEn}
                    </span>
                  </div>
                  <span
                    className={`rounded-[4px] border px-2 py-[3px] font-mono text-[12px] font-bold tracking-[1.5px] ${tag.cls}`}
                  >
                    {tag.label}
                  </span>
                </div>

                <div className='space-y-2'>
                  {group.events.map((ev) => {
                    if (ev.type === 'range') {
                      return (
                        <div
                          key={`${ev.name}-${ev.fullDate}`}
                          className='flex items-start gap-2.5 rounded-lg border border-white/[0.03] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04]'
                        >
                          <span className='w-[44px] shrink-0 text-[14px] font-extrabold tracking-tight text-white/75 tabular-nums'>
                            {fmtDate(ev.fullDate)}
                          </span>
                          <span className='size-1.5 shrink-0 rounded-full bg-[#4a9eff] shadow-[0_0_6px_rgba(74,158,255,0.3)]' />
                          <div className='min-w-0 flex-1'>
                            <div className='text-[13px] leading-[1.35] font-semibold break-keep text-white/80'>
                              {ev.name}
                            </div>
                            <div className='text-[12px] leading-[1.4] break-keep text-white/35'>
                              {ev.detail}
                            </div>
                          </div>
                          {ev.badge && (
                            <span className='shrink-0 rounded-[4px] bg-[#4a9eff]/8 px-1.5 py-0.5 text-[12px] font-bold tracking-wide text-[#4a9eff]'>
                              {ev.badge}
                            </span>
                          )}
                        </div>
                      )
                    }

                    if (ev.type === 'single') {
                      return (
                        <div
                          key={`${ev.name}-${ev.fullDate}`}
                          className='flex items-start gap-2.5 rounded-lg border border-white/[0.03] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04]'
                        >
                          <span className='w-[44px] shrink-0 text-[14px] font-extrabold tracking-tight text-white/75 tabular-nums'>
                            {fmtDate(ev.fullDate)}
                          </span>
                          <VenueThumb src={ev.venueImage} />
                          <div className='min-w-0 flex-1'>
                            <div className='text-[13px] leading-[1.35] font-semibold break-keep text-white/80'>
                              {ev.name}
                            </div>
                            <div className='text-[12px] leading-[1.4] break-keep text-white/35'>
                              {ev.venueName}
                            </div>
                          </div>
                        </div>
                      )
                    }

                    if (ev.type === 'deadline') {
                      return (
                        <div
                          key={`${ev.name}-${ev.fullDate}`}
                          className='flex items-start gap-2.5 rounded-lg border border-white/[0.03] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04]'
                        >
                          <span className='w-[44px] shrink-0 text-[14px] font-extrabold tracking-tight text-white/55 tabular-nums'>
                            {fmtDate(ev.fullDate)}
                          </span>
                          <span className='size-1.5 shrink-0 rounded-full bg-white/25' />
                          <div className='min-w-0 flex-1'>
                            <div className='text-[13px] leading-[1.35] font-semibold break-keep text-white/55'>
                              {ev.name}
                            </div>
                            <div className='text-[12px] leading-[1.4] break-keep text-white/30'>
                              {ev.detail}
                            </div>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={`${ev.name}-${ev.fullDate}`}
                        className='rounded-lg border border-[#e74c3c]/12 bg-gradient-to-br from-[#e74c3c]/[0.04] to-[#f5a623]/[0.02] px-3 py-3.5'
                      >
                        <div className='flex items-start gap-2.5'>
                          <span className='w-[44px] shrink-0 bg-gradient-to-br from-[#e74c3c] to-[#f5a623] bg-clip-text text-[14px] font-extrabold tracking-tight text-transparent tabular-nums'>
                            {fmtDate(ev.fullDate)}
                          </span>
                          <span className='size-1.5 shrink-0 rounded-full bg-[#f5a623] shadow-[0_0_6px_rgba(245,166,35,0.35)]' />
                          <div className='min-w-0 flex-1'>
                            <div className='text-[14px] leading-[1.35] font-bold break-keep text-white/90'>
                              {ev.name}
                            </div>
                            <div className='text-[12px] leading-[1.4] break-keep text-white/40'>
                              {ev.venueName} · {ev.detail}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {group.isFinals && finalsEvent && (
                  <div className='mt-3.5 flex items-center gap-3 border-t border-[#e74c3c]/10 pt-3.5'>
                    {finalsEvent.footerLogoSrc && (
                      <img
                        src={finalsEvent.footerLogoSrc}
                        alt='PlayX4'
                        className='h-4 w-auto shrink-0 object-contain opacity-50'
                        loading='lazy'
                        draggable={false}
                      />
                    )}
                    <div className='flex flex-col gap-0.5'>
                      <span className='text-[12px] text-white/35'>
                        {finalsEvent.footerLabel}
                      </span>
                      <span className='bg-gradient-to-br from-[#e74c3c] to-[#f5a623] bg-clip-text text-[13px] font-extrabold tracking-[-0.3px] text-transparent'>
                        {finalsEvent.footerDate}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className='mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#1e1e1e] pt-3.5'>
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
  )
}
