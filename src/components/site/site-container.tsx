import * as React from 'react'
import { cn } from '@/lib/utils'

export const SITE_CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 md:px-6'

export function SiteContainer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(SITE_CONTAINER, className)} {...props} />
}
