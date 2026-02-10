import { useEffect, useRef, useState, type ReactNode } from 'react'

/* ════════════════════════════════════════════════════════════════════ */
/*  Shared utility components for guide pages (arcade / console)       */
/* ════════════════════════════════════════════════════════════════════ */

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
    info: 'bg-[#4a9eff]/[0.04] border-[#4a9eff]/[0.12]',
    warning: 'bg-[#f5a623]/[0.04] border-[#f5a623]/[0.12]',
    danger: 'bg-[#e84545]/[0.04] border-[#e84545]/[0.12]',
  }
  return (
    <div
      className={`flex gap-3 rounded-xl border p-4 text-[13px] leading-relaxed text-white/55 ${cls[type]}`}
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
      className={`transition-all duration-700 ease-out ${
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
  return (
    <img
      src={`/branding/v2/emojis/png/${name}.png`}
      alt=''
      className={className}
      draggable={false}
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
      className={`rounded-2xl border border-[#1e1e1e] bg-[#111] p-7 transition-colors hover:border-[#2a2a2a] ${className}`}
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
    <div className='rounded-2xl border border-[#1e1e1e] bg-[#111] transition-colors hover:border-[#2a2a2a]'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className='flex w-full items-center justify-between px-6 py-4 text-left'
      >
        <span className='text-sm font-bold text-white/90'>{title}</span>
        <span
          className={`text-[10px] text-white/35 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        >
          ▼
        </span>
      </button>
      <div
        ref={contentRef}
        className='overflow-hidden transition-all duration-400'
        style={{
          maxHeight: open ? (contentRef.current?.scrollHeight ?? 2000) : 0,
        }}
      >
        <div className='border-t border-[#1e1e1e] px-6 py-5'>{children}</div>
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
      <div className='rounded-2xl border border-[#1e1e1e] bg-[#111] transition-colors hover:border-[#2a2a2a]'>
        {/* Main */}
        <div className='flex items-start gap-4 p-6'>
          <div
            className='shrink-0 pt-0.5 text-[32px] leading-none font-extrabold opacity-25'
            style={{ color: accentColor }}
          >
            {num}
          </div>
          <div className='min-w-0 flex-1'>
            <div className='mb-1.5 text-lg font-bold tracking-tight text-white/90'>
              {heading}
            </div>
            <div className='text-sm leading-relaxed break-keep text-white/55'>
              {summary}
            </div>
          </div>
        </div>

        {/* Toggle */}
        <button
          type='button'
          onClick={() => setOpen((v) => !v)}
          className='flex w-full items-center justify-center gap-1.5 border-t border-[#1e1e1e] py-2.5 text-xs text-white/35 transition-colors hover:text-white/55'
        >
          {toggleLabel}
          <span
            className={`text-[10px] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          >
            ▼
          </span>
        </button>

        {/* Detail */}
        <div
          ref={contentRef}
          className='overflow-hidden transition-all duration-400'
          style={{
            maxHeight: open ? (contentRef.current?.scrollHeight ?? 2000) : 0,
          }}
        >
          <div className='border-t border-[#1e1e1e] px-6 py-5 [&>*+*]:mt-5'>
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
    <div className='flex items-center justify-between border-b border-[#1e1e1e] py-2.5 text-[13px] last:border-b-0'>
      <span className='text-white/55'>{label}</span>
      {isBadge ? (
        <span
          className='rounded px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider'
          style={{
            backgroundColor: `color-mix(in srgb, ${accentColor} 8%, transparent)`,
            color: accentColor,
          }}
        >
          {value}
        </span>
      ) : (
        <span className='font-semibold text-white/90'>{value}</span>
      )}
    </div>
  )
}
