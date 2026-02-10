import { useEffect } from 'react'
import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from '@tanstack/react-router'
import { t } from '@/text'
import { FadeIn } from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/console')({
  component: ConsoleLayout,
})

/* ════════════════════════════════════════════════════════════════════ */
/*  Sub-navigation                                                     */
/* ════════════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  {
    to: '/console',
    exact: true,
    phase: 'PHASE 1',
    label: '온라인 예선',
    desc: '스코어 어택',
    color: '#e86e3a',
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
      {/* Desktop */}
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
                style={{
                  background: item.color,
                  opacity: active ? 1 : 0.3,
                }}
              />
              <div
                className='mb-1 font-mono text-[11px] font-extrabold transition-opacity'
                style={{
                  color: item.color,
                  opacity: active ? 1 : 0.5,
                }}
              >
                {item.phase}
              </div>
              <div
                className={`text-[13px] font-bold transition-colors ${active ? 'text-white/90' : 'text-white/45'}`}
              >
                {item.label}
              </div>
              <div
                className={`text-[11px] transition-colors ${active ? 'text-white/35' : 'text-white/20'}`}
              >
                {item.desc}
              </div>
              {i < NAV_ITEMS.length - 1 && (
                <span className='absolute top-1/2 -right-[7px] z-10 -translate-y-1/2 bg-[#111] px-0.5 text-xs text-white/35'>
                  →
                </span>
              )}
            </Link>
          )
        })}
      </div>
      {/* Mobile */}
      <div className='space-y-2 p-2 sm:hidden'>
        <div
          className='grid gap-2'
          style={{
            gridTemplateColumns: `repeat(${NAV_ITEMS.length}, minmax(0, 1fr))`,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item)
            return (
              <Link
                key={item.to}
                to={item.to}
                preload='render'
                className={`relative rounded-lg border px-3 py-3 text-left transition-colors ${
                  active
                    ? 'border-white/20 bg-white/[0.05]'
                    : 'border-[#1e1e1e] bg-[#0f0f0f] hover:border-[#2a2a2a]'
                }`}
              >
                <div
                  className='absolute top-0 right-0 left-0 h-0.5 transition-opacity'
                  style={{
                    background: item.color,
                    opacity: active ? 1 : 0.3,
                  }}
                />
                <div
                  className='mb-0.5 font-mono text-[11px] font-extrabold transition-opacity'
                  style={{
                    color: item.color,
                    opacity: active ? 1 : 0.5,
                  }}
                >
                  {item.phase}
                </div>
                <div
                  className={`text-[12px] font-bold transition-colors ${active ? 'text-white/90' : 'text-white/55'}`}
                >
                  {item.label}
                </div>
                <div
                  className={`mt-0.5 text-[11px] transition-colors ${active ? 'text-white/35' : 'text-white/30'}`}
                >
                  {item.desc}
                </div>
              </Link>
            )
          })}
        </div>
        <div className='grid grid-cols-2 gap-2'>
          {prevItem ? (
            <Link
              to={prevItem.to}
              preload='render'
              className='rounded-lg border border-[#1e1e1e] bg-[#0f0f0f] px-3 py-2.5 text-left transition-colors hover:border-[#2a2a2a]'
            >
              <div className='text-[11px] font-mono font-semibold tracking-wide text-white/35'>
                PREV PHASE
              </div>
              <div className='truncate text-[12px] font-bold text-white/85'>
                {prevItem.phase}
              </div>
            </Link>
          ) : (
            <div className='rounded-lg border border-[#1e1e1e] bg-[#0f0f0f] px-3 py-2.5 opacity-40'>
              <div className='text-[11px] font-mono font-semibold tracking-wide text-white/35'>
                PREV PHASE
              </div>
              <div className='text-[12px] font-bold text-white/55'>-</div>
            </div>
          )}
          {nextItem ? (
            <Link
              to={nextItem.to}
              preload='render'
              className='rounded-lg border border-[#1e1e1e] bg-[#0f0f0f] px-3 py-2.5 text-right transition-colors hover:border-[#2a2a2a]'
            >
              <div className='text-[11px] font-mono font-semibold tracking-wide text-white/35'>
                NEXT PHASE
              </div>
              <div className='truncate text-[12px] font-bold text-white/85'>
                {nextItem.phase}
              </div>
            </Link>
          ) : (
            <div className='rounded-lg border border-[#1e1e1e] bg-[#0f0f0f] px-3 py-2.5 text-right opacity-40'>
              <div className='text-[11px] font-mono font-semibold tracking-wide text-white/35'>
                NEXT PHASE
              </div>
              <div className='text-[12px] font-bold text-white/55'>-</div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Layout                                                             */
/* ════════════════════════════════════════════════════════════════════ */

function ConsoleLayout() {
  const title = t('nav.console')

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${title}`
  }, [title])

  return (
    <div className='w-full'>
      {/* ── Hero ── */}
      <section className='relative overflow-hidden pt-12 pb-8 sm:pt-16 sm:pb-10 md:pt-24 md:pb-14'>
        <div className='pointer-events-none absolute -top-24 -right-48 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(232,110,58,0.15)_0%,transparent_70%)]' />
        <div className='relative'>
          <FadeIn>
            <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-[#e86e3a]/20 bg-[#e86e3a]/[0.08] px-3.5 py-1.5 text-[13px] font-medium tracking-wide text-[#e86e3a]'>
              <span className='tkc-motion-dot size-1.5 rounded-full bg-[#e86e3a]' />
              CONSOLE DIVISION
            </div>
          </FadeIn>
          <FadeIn delay={120}>
            <h1 className='text-[clamp(30px,8.5vw,56px)] leading-[1.1] font-extrabold tracking-tight'>
              <span className='bg-gradient-to-br from-[#e86e3a] to-[#f5a623] bg-clip-text text-transparent'>
                콘솔 예선
              </span>
              <br />
              참가 안내
            </h1>
          </FadeIn>
          <FadeIn delay={240}>
            <p className='mt-4 max-w-[520px] text-[15px] leading-[1.55] font-light break-keep text-white/55'>
              과제곡 2곡을 플레이하고 영상을 제출하세요. 합산 점수 상위 4명이
              결선에 진출합니다.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Sub-Navigation ── */}
      <FadeIn delay={300}>
        <SubNav />
      </FadeIn>

      {/* ── Page Content ── */}
      <Outlet />

      {/* ── Footer ── */}
      <footer className='mt-14 border-t border-[#1e1e1e] py-10 text-center'>
        <p className='text-xs leading-[1.55] text-white/35'>
          ※ 세부 사항은 운영진 판단에 따라 변경될 수 있습니다.
          <br />
          TKC 2026 — 태고 코리아 챔피언십 · 콘솔 부문 규정
        </p>
      </footer>
    </div>
  )
}
