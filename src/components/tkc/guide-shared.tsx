import { useEffect, useRef, useState, type ReactNode } from 'react'

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
/*  Shared utility components for guide pages (arcade / console)       */
/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */

export function Callout({
  type,
  icon,
  children,
}: {
  type: 'info' | 'warning' | 'danger'
  icon: ReactNode
  children: ReactNode
}) {
  const cls = {
    info: 'bg-[#f5a623]/[0.04] border-[#f5a623]/[0.12]',
    warning: 'bg-[#f5a623]/[0.04] border-[#f5a623]/[0.12]',
    danger: 'bg-[#e86e3a]/[0.04] border-[#e86e3a]/[0.12]',
  }
  return (
    <div
      className={`flex gap-3 rounded-xl border p-3.5 text-[12px] leading-relaxed text-white/55 sm:p-4 sm:text-[13px] ${cls[type]}`}
    >
      <span className='mt-0.5 shrink-0'>{icon}</span>
      <span className='break-keep'>{children}</span>
    </div>
  )
}

export function FadeIn({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`tkc-motion-reveal ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
      } ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

export function TkcIcon({
  name,
  className = 'size-4',
}: {
  name: string
  className?: string
}) {
  const resolveSrc = (iconName: string) => `/branding/v2/emojis/png/${iconName}.png`
  const fallbackSrc = resolveSrc('info')

  return (
    <img
      src={resolveSrc(name)}
      alt=''
      className={`${className} object-contain`}
      draggable={false}
      loading='lazy'
      onError={(event) => {
        const image = event.currentTarget
        if (image.dataset.fallbackApplied === 'true') return
        image.dataset.fallbackApplied = 'true'
        image.src = fallbackSrc
      }}
    />
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`tkc-motion-surface rounded-2xl border border-[#1e1e1e] bg-[#111] p-4 hover:border-[#2a2a2a] sm:p-7 ${className}`}
    >
      {children}
    </div>
  )
}

export function Accordion({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div className='tkc-motion-surface rounded-2xl border border-[#1e1e1e] bg-[#111] hover:border-[#2a2a2a]'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className='flex w-full items-center justify-between px-4 py-3.5 text-left sm:px-6 sm:py-4'
      >
        <span className='text-[13px] font-bold text-white/90 sm:text-sm'>{title}</span>
        <span
          className={`text-[11px] text-white/35 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        >
          ??        </span>
      </button>
      <div
        ref={contentRef}
        className='overflow-hidden transition-all duration-400'
        style={{
          maxHeight: open ? (contentRef.current?.scrollHeight ?? 2000) : 0,
        }}
      >
        <div className='border-t border-[#1e1e1e] px-4 py-4 sm:px-6 sm:py-5'>{children}</div>
      </div>
    </div>
  )
}

export function StepCard({
  num,
  heading,
  summary,
  toggleLabel,
  children,
  accentColor = '#f5a623',
}: {
  num: string
  heading: string
  summary: ReactNode
  toggleLabel: string
  children: ReactNode
  accentColor?: string
}) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <FadeIn>
      <div className='tkc-motion-surface rounded-2xl border border-[#1e1e1e] bg-[#111] hover:border-[#2a2a2a]'>
        {/* Main */}
        <div className='flex items-start gap-3 p-4 sm:gap-4 sm:p-6'>
          <div
            className='shrink-0 pt-0.5 text-[26px] leading-none font-extrabold opacity-25 sm:text-[32px]'
            style={{ color: accentColor }}
          >
            {num}
          </div>
          <div className='min-w-0 flex-1'>
            <div className='mb-1 text-base font-bold tracking-tight text-white/90 sm:mb-1.5 sm:text-lg'>
              {heading}
            </div>
            <div className='text-[13px] leading-relaxed break-keep text-white/55 sm:text-sm'>
              {summary}
            </div>
          </div>
        </div>

        {/* Toggle */}
        <button
          type='button'
          onClick={() => setOpen((v) => !v)}
          className='flex w-full items-center justify-center gap-1.5 border-t border-[#1e1e1e] py-3 text-[11px] text-white/35 transition-colors hover:text-white/55 sm:py-2.5 sm:text-xs'
        >
          {toggleLabel}
          <span
            className={`text-[11px] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          >
            ??          </span>
        </button>

        {/* Detail */}
        <div
          ref={contentRef}
          className='overflow-hidden transition-all duration-400'
          style={{
            maxHeight: open ? (contentRef.current?.scrollHeight ?? 2000) : 0,
          }}
        >
          <div className='border-t border-[#1e1e1e] px-4 py-4 [&>*+*]:mt-4 sm:px-6 sm:py-5 sm:[&>*+*]:mt-5'>
            {children}
          </div>
        </div>
      </div>
    </FadeIn>
  )
}

export function DetailSubtitle({ children }: { children: ReactNode }) {
  return (
    <div className='mb-2.5 text-[13px] font-bold text-white/90'>{children}</div>
  )
}

export function DetailRow({
  label,
  value,
  isBadge,
  accentColor = '#f5a623',
}: {
  label: string
  value: string
  isBadge?: boolean
  accentColor?: string
}) {
  return (
    <div className='flex items-center justify-between gap-3 border-b border-[#1e1e1e] py-2.5 text-[12px] last:border-b-0 sm:text-[13px]'>
      <span className='min-w-0 text-white/55'>{label}</span>
      {isBadge ? (
        <span
          className='shrink-0 rounded px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider'
          style={{
            backgroundColor: `color-mix(in srgb, ${accentColor} 8%, transparent)`,
            color: accentColor,
          }}
        >
          {value}
        </span>
      ) : (
        <span className='shrink-0 font-semibold text-white/90'>{value}</span>
      )}
    </div>
  )
}

