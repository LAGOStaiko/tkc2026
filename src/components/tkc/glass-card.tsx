import type { ComponentProps } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function GlassCard({ className, ...props }: ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-lg transition-colors hover:border-white/20 hover:bg-white/[0.05]',
        className
      )}
      {...props}
    />
  )
}
