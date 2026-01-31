import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/tkc/glass-card'

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
    <GlassCard id={id} className={cn('p-5 md:p-7', className)}>
      <div className='flex items-center gap-3'>
        <span className='inline-block h-6 w-1 rounded-full bg-sky-400/80' />
        <h2 className='text-xl font-semibold text-white md:text-2xl'>
          {title}
        </h2>
      </div>
      <div className='mt-5'>{children}</div>
    </GlassCard>
  )
}

export function TkcField({ label, children, note, badges }: TkcFieldProps) {
  return (
    <div className='py-4 md:py-5'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-semibold whitespace-nowrap text-sky-300 md:text-base'>
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
      <div className='mt-2 max-w-prose text-sm leading-relaxed break-keep text-white/85 md:text-base md:leading-7'>
        {children}
      </div>
      {note && (
        <p className='mt-2 text-xs leading-relaxed break-keep text-white/60'>
          {note}
        </p>
      )}
    </div>
  )
}
