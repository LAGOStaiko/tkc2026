import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

export function GlassCard({
  className,
  ...props
}: ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/[0.05]',
        className
      )}
      {...props}
    />
  )
}
