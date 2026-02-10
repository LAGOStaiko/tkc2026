import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/tkc/guide-shared'

type TkcPageHeaderProps = {
  title: string
  subtitle?: string
  className?: string
  titleClassName?: string
  subtitleClassName?: string
}

type PageHeroProps = {
  badge: string
  title: string
  subtitle?: string
  accentColor?: string
  gradientTo?: string
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
          'bg-gradient-to-br from-[#e86e3a] to-[#f5a623] bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-5xl',
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

export function PageHero({
  badge,
  title,
  subtitle,
  accentColor = '#e86e3a',
  gradientTo = '#f5a623',
}: PageHeroProps) {
  return (
    <section className='relative overflow-hidden pt-12 pb-8 sm:pt-16 sm:pb-10 md:pt-20 md:pb-12'>
      <div
        className='pointer-events-none absolute -top-24 -right-48 h-[400px] w-[400px] rounded-full'
        style={{
          background: `radial-gradient(circle, ${accentColor}26 0%, transparent 70%)`,
        }}
      />
      <div className='relative'>
        <FadeIn>
          <div
            className='mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium tracking-wide'
            style={{
              borderColor: `${accentColor}33`,
              backgroundColor: `${accentColor}14`,
              color: accentColor,
            }}
          >
            <span
              className='tkc-motion-dot size-1.5 rounded-full'
              style={{ backgroundColor: accentColor }}
            />
            {badge}
          </div>
        </FadeIn>
        <FadeIn delay={120}>
          <h1 className='text-[clamp(30px,8.5vw,56px)] leading-[1.1] font-extrabold tracking-tight'>
            <span
              className='bg-clip-text text-transparent'
              style={{
                backgroundImage: `linear-gradient(to bottom right, ${accentColor}, ${gradientTo})`,
              }}
            >
              {title}
            </span>
          </h1>
        </FadeIn>
        {subtitle && (
          <FadeIn delay={240}>
            <p className='mt-4 max-w-[520px] text-[15px] font-light break-keep text-white/55'>
              {subtitle}
            </p>
          </FadeIn>
        )}
      </div>
    </section>
  )
}
