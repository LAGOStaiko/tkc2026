import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

function DropdownToggleIcon({
  open,
  className = 'size-7 shrink-0',
}: {
  open: boolean
  className?: string
}) {
  return (
    <ChevronDown
      aria-hidden={true}
      className={`${className} opacity-90 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
    />
  )
}

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
    warning: 'bg-[#e74c3c]/[0.04] border-[#e74c3c]/[0.12]',
    danger: 'bg-[#e74c3c]/[0.04] border-[#e74c3c]/[0.12]',
  }
  return (
    <div
      className={`mt-3 flex items-center gap-3 rounded-xl border p-3.5 text-[12px] leading-relaxed text-white/55 sm:mt-3.5 sm:p-4 sm:text-[13px] ${cls[type]}`}
    >
      <span className='inline-flex shrink-0 items-center justify-center'>
        {icon}
      </span>
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
  const iconOverrides: Record<string, string> = {
    info: '/characters/callout-info.png',
    warning: '/characters/callout-warning.png',
  }
  const fallbackSrc = iconOverrides.info
  const overrideSrc = iconOverrides[name]
  const primarySrc = overrideSrc ?? `/branding/v2/emojis/webp/${name}.webp`
  const pngFallbackSrc = overrideSrc ?? `/branding/v2/emojis/png/${name}.png`

  return (
    <img
      src={primarySrc}
      alt=''
      className={`${className} object-contain`}
      draggable={false}
      loading='lazy'
      data-fallback-stage='primary'
      onError={(event) => {
        const image = event.currentTarget
        if (overrideSrc) {
          if (image.dataset.fallbackStage === 'final') return
          image.dataset.fallbackStage = 'final'
          image.src = fallbackSrc
          return
        }

        if (image.dataset.fallbackStage === 'primary') {
          image.dataset.fallbackStage = 'png'
          image.src = pngFallbackSrc
          return
        }

        if (image.dataset.fallbackStage === 'final') return
        image.dataset.fallbackStage = 'final'
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

  return (
    <div className='tkc-motion-surface rounded-2xl border border-[#1e1e1e] bg-[#111] hover:border-[#2a2a2a]'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className='flex w-full items-center justify-between px-4 py-3.5 text-left text-white/35 transition-colors hover:text-white/55 sm:px-6 sm:py-4'
      >
        <span className='text-[13px] font-bold text-white/90 sm:text-sm'>
          {title}
        </span>
        <DropdownToggleIcon
          open={open}
          className='size-8 shrink-0 object-contain'
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-400 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className='overflow-hidden'>
          <div className='border-t border-[#1e1e1e] px-4 py-4 sm:px-6 sm:py-5'>
            {children}
          </div>
        </div>
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

  return (
    <FadeIn>
      <div className='tkc-motion-surface rounded-2xl border border-[#1e1e1e] bg-[#111] hover:border-[#2a2a2a]'>
        {/* Main */}
        <div className='flex items-start gap-3.5 p-5 sm:gap-4 sm:p-6'>
          <div
            className='shrink-0 pt-0.5 text-[22px] leading-none font-extrabold opacity-25 sm:text-[32px]'
            style={{ color: accentColor }}
          >
            {num}
          </div>
          <div className='min-w-0 flex-1'>
            <div className='mb-1.5 text-[15px] font-bold tracking-tight text-white/90 sm:mb-1.5 sm:text-lg'>
              {heading}
            </div>
            <div className='text-[13px] leading-[1.75] break-keep text-white/55 sm:text-sm sm:leading-relaxed'>
              {summary}
            </div>
          </div>
        </div>

        {/* Toggle */}
        <button
          type='button'
          onClick={() => setOpen((v) => !v)}
          className='flex w-full items-center justify-center gap-1.5 border-t border-[#1e1e1e] py-3 text-[12px] text-white/35 transition-colors hover:text-white/55 sm:py-2.5'
        >
          {toggleLabel}
          <DropdownToggleIcon
            open={open}
            className='size-6 shrink-0 object-contain'
          />
        </button>

        {/* Detail */}
        <div
          className={`grid transition-[grid-template-rows] duration-400 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className='overflow-hidden'>
            <div className='border-t border-[#1e1e1e] px-4 py-4 sm:px-6 sm:py-5 [&>*+*]:mt-4 sm:[&>*+*]:mt-5'>
              {children}
            </div>
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
          className='shrink-0 rounded px-2.5 py-0.5 font-mono text-[12px] font-bold tracking-wider'
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
