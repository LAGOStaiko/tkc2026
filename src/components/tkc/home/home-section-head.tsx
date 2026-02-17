import type { ReactNode } from 'react'

export function HomeSectionHead({
  label,
  title,
  children,
}: {
  label: string
  title: string
  children?: ReactNode
}) {
  return (
    <div className='mb-7 flex flex-wrap items-end justify-between gap-3 sm:mb-6'>
      <div>
        <div className='mb-1.5 font-mono text-xs font-semibold tracking-[1px] text-[#e74c3c] uppercase sm:text-sm'>
          {label}
        </div>
        <h2 className='text-[clamp(24px,4vw,32px)] font-extrabold tracking-tight break-keep text-white/95'>
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}
