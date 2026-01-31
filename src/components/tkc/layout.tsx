import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type TkcPageHeaderProps = {
  title: string
  subtitle?: string
  className?: string
  titleClassName?: string
  subtitleClassName?: string
}

export function TkcContainer({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mx-auto max-w-6xl px-4 md:px-6', className)}
      {...props}
    />
  )
}

export function TkcSection({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('space-y-10 md:space-y-14', className)} {...props} />
  )
}

export function TkcPageHeader({
  title,
  subtitle,
  className,
  titleClassName,
  subtitleClassName,
}: TkcPageHeaderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <h1
        className={cn(
          'text-3xl font-bold tracking-tight md:text-5xl',
          titleClassName
        )}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={cn(
            'text-sm text-white/60 md:text-base',
            subtitleClassName
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
