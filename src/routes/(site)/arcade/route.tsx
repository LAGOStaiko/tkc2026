import { useEffect } from 'react'
import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from '@tanstack/react-router'
import { FadeIn } from '@/components/tkc/guide-shared'
import { PageHero } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/arcade')({
  component: ArcadeLayout,
})

const NAV_ITEMS = [
  {
    to: '/arcade',
    exact: true,
    phase: 'PHASE 1',
    label: '온라인 예선',
    desc: '2곡 합산 점수 선발',
    color: '#f5a623',
  },
  {
    to: '/arcade/swiss',
    exact: false,
    phase: 'PHASE 2',
    label: '오프라인 스위스',
    desc: '회차별 Top 16',
    color: '#f7d154',
  },
  {
    to: '/arcade/finals',
    exact: false,
    phase: 'FINALS',
    label: 'PlayX4 결선',
    desc: 'Top 8 토너먼트',
    color: '#e74c3c',
  },
] as const

function SubNav() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  function isActive(item: (typeof NAV_ITEMS)[number]) {
    if (item.exact) return pathname === item.to || pathname === `${item.to}/`
    return pathname.startsWith(item.to)
  }

  const activeIndex = NAV_ITEMS.findIndex((item) => isActive(item))
  const prevItem = activeIndex > 0 ? NAV_ITEMS[activeIndex - 1] : undefined
  const nextItem =
    activeIndex >= 0 && activeIndex < NAV_ITEMS.length - 1
      ? NAV_ITEMS[activeIndex + 1]
      : undefined

  return (
    <nav className='mb-8 overflow-hidden rounded-xl border border-[#1e1e1e] bg-[#111] sm:mb-10'>
      <div className='hidden sm:flex'>
        {NAV_ITEMS.map((item, i) => {
          const active = isActive(item)
          return (
            <Link
              key={item.to}
              to={item.to}
              preload='render'
              className={`relative flex-1 border-[#1e1e1e] px-3 py-[18px] text-center transition-colors ${
                i < NAV_ITEMS.length - 1 ? 'border-r' : ''
              } ${active ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`}
            >
              <div
                className='absolute top-0 right-0 left-0 h-0.5 transition-opacity'
                style={{ background: item.color, opacity: active ? 1 : 0.3 }}
              />
              <div
                className='mb-1 font-mono text-[11px] font-extrabold'
                style={{ color: item.color, opacity: active ? 1 : 0.65 }}
              >
                {item.phase}
              </div>
              <div className='text-[15px] font-bold text-white/90'>
                {item.label}
              </div>
              <div className='mt-0.5 text-[12px] text-white/35'>
                {item.desc}
              </div>
            </Link>
          )
        })}
      </div>

      <div className='sm:hidden'>
        <div className='flex items-center justify-between gap-2 border-b border-[#1e1e1e] px-3 py-2.5 text-[11px] font-medium text-white/35'>
          <span>{prevItem ? `← ${prevItem.label}` : '\u00A0'}</span>
          <span className='text-[10px] font-bold tracking-[0.8px] text-white/25'>
            탭 이동
          </span>
          <span>{nextItem ? `${nextItem.label} →` : '\u00A0'}</span>
        </div>
        <div className='flex'>
          {NAV_ITEMS.map((item, i) => {
            const active = isActive(item)
            return (
              <Link
                key={item.to}
                to={item.to}
                preload='render'
                className={`relative flex-1 border-[#1e1e1e] px-3 py-3 text-center transition-colors ${
                  i < NAV_ITEMS.length - 1 ? 'border-r' : ''
                } ${active ? 'bg-white/[0.03]' : 'hover:bg-white/[0.01]'}`}
              >
                <div
                  className='absolute top-0 right-0 left-0 h-0.5'
                  style={{ background: item.color, opacity: active ? 1 : 0.25 }}
                />
                <div className='text-[13px] font-bold text-white/90'>
                  {item.label}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

function ArcadeLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  useEffect(() => {
    let suffix = '예선 안내'
    if (pathname.includes('/swiss')) suffix = '스위스 안내'
    if (pathname.includes('/finals')) suffix = '결선 안내'
    document.title = `TKC 2026 | 아케이드 부문 ${suffix}`
  }, [pathname])

  return (
    <section className='space-y-5'>
      <PageHero
        badge='ARCADE'
        title='아케이드'
        subtitle='아케이드 부문 예선, 스위스, 결선 안내'
        accentColor='#f5a623'
        gradientTo='#e74c3c'
      />

      <FadeIn>
        <div className='space-y-2'>
          <h1 className='text-[26px] leading-tight font-extrabold tracking-tight text-white sm:text-[30px]'>
            아케이드 부문
          </h1>
          <p className='text-[13px] leading-relaxed break-keep text-white/55 sm:text-[14px]'>
            온라인 예선, 오프라인 스위스, PlayX4 결선까지 아케이드 부문 전체
            흐름을 단계별로 확인할 수 있습니다.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={80}>
        <SubNav />
      </FadeIn>

      <Outlet />
    </section>
  )
}
