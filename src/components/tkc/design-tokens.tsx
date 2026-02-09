import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ── SectionHeader ── */

type SectionHeaderProps = {
  label?: string
  title: string
  subtitle?: string
  count?: string | number
  className?: string
  children?: ReactNode
}

export function SectionHeader({
  label,
  title,
  subtitle,
  count,
  className,
  children,
}: SectionHeaderProps) {
  return (
    <section
      className={cn(
        'mb-8 motion-safe:animate-[tkc-slide-up_0.5s_ease_both]',
        className
      )}
    >
      <div className='mb-4 flex items-baseline gap-2.5'>
        {label && (
          <span className='font-mono text-xs font-semibold tracking-wider text-white/55 uppercase'>
            {label}
          </span>
        )}
        <div className='min-w-0 flex-1'>
          <h2 className='text-lg font-bold text-white md:text-xl'>{title}</h2>
          {subtitle && (
            <span className='font-mono text-xs tracking-wider text-white/55'>
              {subtitle}
            </span>
          )}
        </div>
        {count != null && (
          <span className='ml-auto shrink-0 text-sm text-white/50'>
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

/* ── InfoCard ── */

type InfoCardProps = {
  icon?: ReactNode
  title?: string
  variant?: 'default' | 'accent' | 'muted'
  className?: string
  children: ReactNode
}

const VARIANT_CLASSES = {
  default: 'border-white/10 bg-white/[0.03]',
  accent: 'border-[#ff2a00]/30 bg-[#ff2a00]/[0.06]',
  muted: 'border-white/[0.06] bg-white/[0.015]',
} as const

export function InfoCard({
  icon,
  title,
  variant = 'default',
  className,
  children,
}: InfoCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {(icon || title) && (
        <div className='mb-2.5 flex items-center gap-2.5'>
          {icon && <span className='text-base'>{icon}</span>}
          {title && (
            <span className='text-sm font-bold text-white/70'>{title}</span>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

/* ── MetaRow ── */

type MetaRowProps = {
  label: string
  value: ReactNode
  className?: string
}

export function MetaRow({ label, value, className }: MetaRowProps) {
  return (
    <div className={cn('flex items-center justify-between py-1', className)}>
      <span className='text-xs text-white/55'>{label}</span>
      <span className='text-xs font-semibold text-white/70'>{value}</span>
    </div>
  )
}

/* ── StatusBadge ── */

type StatusBadgeProps = {
  label: string
  intent?: 'default' | 'warning' | 'success' | 'danger' | 'info'
  className?: string
}

const INTENT_CLASSES = {
  default: 'border-white/[0.06] bg-white/[0.04] text-white/55',
  warning: 'border-[#ff2a00]/20 bg-[#ff2a00]/10 text-[#ff2a00]',
  success: 'border-[#4CAF50]/20 bg-[#4CAF50]/10 text-[#4CAF50]',
  danger: 'border-[#F44336]/20 bg-[#F44336]/10 text-[#F44336]',
  info: 'border-[#3B8BE6]/20 bg-[#3B8BE6]/10 text-[#3B8BE6]',
} as const

export function StatusBadge({
  label,
  intent = 'default',
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs font-medium',
        INTENT_CLASSES[intent],
        className
      )}
    >
      {label}
    </span>
  )
}
