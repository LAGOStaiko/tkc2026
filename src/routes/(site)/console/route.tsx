import { useEffect } from 'react'
import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from '@tanstack/react-router'
import { FadeIn } from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/console')({
  component: ConsoleLayout,
})

const NAV_ITEMS = [
  {
    to: '/console',
    exact: true,
    phase: 'PHASE 1',
    label: '온라인 예선',
    desc: '2곡 합산 점수 선발',
    color: '#e74c3c',
  },
  {
    to: '/console/finals',
    exact: false,
    phase: 'FINALS',
    label: '결선',
    desc: 'Top 4 토너먼트',
    color: '#f5a623',
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

function ConsoleLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  useEffect(() => {
    const suffix = pathname.includes('/finals') ? '결선 안내' : '예선 안내'
    document.title = `TKC 2026 | 콘솔 부문 ${suffix}`
  }, [pathname])

  return (
    <section className='space-y-5'>
      <FadeIn>
        <div className='space-y-2'>
          <h1 className='text-[26px] leading-tight font-extrabold tracking-tight text-white sm:text-[30px]'>
            콘솔 부문
          </h1>
          <p className='text-[13px] leading-relaxed break-keep text-white/55 sm:text-[14px]'>
            온라인 예선부터 결선까지, 콘솔 부문 진행 방식과 규정을 한눈에 확인할
            수 있습니다.
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
