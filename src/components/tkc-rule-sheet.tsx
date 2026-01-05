import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type TkcRuleSheetProps = {
  title: string
  children: ReactNode
  id?: string
  className?: string
}

type TkcFieldProps = {
  label: string
  children: ReactNode
  note?: string
  badges?: string[]
}

export function TkcRuleSheet({
  title,
  children,
  id,
  className,
}: TkcRuleSheetProps) {
  return (
    <section
      id={id}
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-lg backdrop-blur-md md:p-8',
        className
      )}
    >
      <div className='flex items-center gap-3'>
        <span className='inline-block h-6 w-1 rounded-full bg-sky-400/80' />
        <h2 className='text-xl font-semibold text-white md:text-2xl'>{title}</h2>
      </div>
      <div className='mt-5'>{children}</div>
    </section>
  )
}

export function TkcField({ label, children, note, badges }: TkcFieldProps) {
  return (
    <div className='py-4 md:py-5'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-2'>
          <span className='whitespace-nowrap text-sm font-semibold text-sky-300 md:text-base'>
            {label}
          </span>
          {badges?.map((badge) => (
            <Badge
              key={badge}
              variant='outline'
              className='border-white/20 text-white/80'
            >
              {badge}
            </Badge>
          ))}
        </div>
        <span className='flex-1 border-t border-dashed border-white/15' />
      </div>
      <div className='mt-2 max-w-prose text-sm leading-relaxed text-white/90 break-keep md:text-base md:leading-7'>
        {children}
      </div>
      {note && (
        <p className='mt-2 text-xs leading-relaxed text-white/60 break-keep'>
          {note}
        </p>
      )}
    </div>
  )
}
