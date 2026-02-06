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
    <GlassCard id={id} className={cn('p-6 md:p-8', className)}>
      <div className='flex items-center gap-3'>
        <span className='inline-block h-6 w-1 rounded-full bg-[#ff2a00]' />
        <h2 className='text-xl font-bold text-white md:text-2xl'>
          {title}
        </h2>
      </div>
      <div className='mt-6'>{children}</div>
    </GlassCard>
  )
}

export function TkcField({ label, children, note, badges }: TkcFieldProps) {
  return (
    <div className='py-5 md:py-6'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-2.5'>
          <span className='text-sm font-bold whitespace-nowrap text-[#ff2a00] md:text-base'>
            {label}
          </span>
          {badges?.map((badge) => (
            <Badge
              key={badge}
              variant='outline'
              className='border-[#ff2a00]/30 bg-[#ff2a00]/5 text-[#ff8c66]'
            >
              {badge}
            </Badge>
          ))}
        </div>
        <span className='flex-1 border-t border-dashed border-white/20' />
      </div>
      <div className='mt-3 max-w-prose text-sm leading-relaxed break-keep text-white/90 md:text-base md:leading-7'>
        {children}
      </div>
      {note && (
        <p className='mt-2.5 text-xs leading-relaxed break-keep text-white/65'>
          {note}
        </p>
      )}
    </div>
  )
}
