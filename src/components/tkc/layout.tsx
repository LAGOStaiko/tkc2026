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
          'bg-gradient-to-br from-[#e74c3c] to-[#f5a623] bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-5xl',
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
  accentColor = '#e74c3c',
  gradientTo = '#f5a623',
}: PageHeroProps) {
  return (
    <section className='-mt-20 overflow-hidden md:-mt-24'>
      <div className='relative h-[320px] sm:h-[380px] md:h-[520px] lg:h-[560px]'>
        <img
          src='/branding/hero.webp'
          alt=''
          className='absolute inset-0 h-full w-full object-cover object-[center_top] md:object-center'
          loading='eager'
          draggable={false}
        />
        <div className='absolute inset-0 bg-black/25' />
        <div className='absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent' />
        <div className='absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black via-black/70 to-transparent' />
        <div className='absolute inset-x-0 bottom-0 px-6 pb-8 sm:px-10 sm:pb-10 md:pb-14'>
          <FadeIn>
            <div
              className='mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-[7px] font-mono text-[11px] font-semibold tracking-[1.5px] backdrop-blur-md'
              style={{ color: accentColor }}
            >
              <span
                className='tkc-motion-dot size-1.5 rounded-full'
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 8px ${accentColor}`,
                }}
              />
              {badge}
            </div>
          </FadeIn>
          <FadeIn delay={120}>
            <h1 className='drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)] text-[clamp(30px,8.5vw,56px)] leading-[1.1] font-extrabold tracking-tight'>
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
              <p className='mt-4 max-w-[520px] text-[15px] leading-[1.55] font-light break-keep text-white/70 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]'>
                {subtitle}
              </p>
            </FadeIn>
          )}
        </div>
      </div>
    </section>
  )
}

