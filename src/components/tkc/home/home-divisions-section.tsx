import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/tkc/guide-shared'
import { useCanHover } from '@/components/tkc/home/use-can-hover'

const DIVISIONS = [
  {
    num: '01',
    title: '콘솔',
    description: '콤보 모드를 통해 진행되는 온라인 예선 대회입니다.',
    accent: '#e74c3c',
    periodLabel: '온라인 예선 접수 기간',
    periodStart: '03.02',
    periodEnd: '04.30',
    detailTo: '/console' as const,
    logoSrc: '/branding/taiko-console-logo.webp',
  },
  {
    num: '02',
    title: '아케이드',
    description: '태고의 달인 아케이드로 진행되는 오프라인 예선 대회입니다.',
    accent: '#f5a623',
    periodLabel: '온라인 예선 접수 기간',
    periodStart: '03.02',
    periodEnd: '04.11',
    detailTo: '/arcade' as const,
    logoSrc: '/branding/taiko-arcade-logo.webp',
  },
]

export function HomeDivisionsSection() {
  const canHover = useCanHover()

  return (
    <section className='border-t border-[#1e1e1e]'>
      <div className='grid grid-cols-1 md:grid-cols-2'>
        {DIVISIONS.map((d, i) => (
          <DivisionPanel key={d.title} {...d} hoverFx={canHover} index={i} />
        ))}
      </div>
    </section>
  )
}

function DivisionPanel({
  num,
  title,
  description,
  accent,
  periodLabel,
  periodStart,
  periodEnd,
  detailTo,
  logoSrc,
  hoverFx,
  index,
}: (typeof DIVISIONS)[number] & { hoverFx: boolean; index: number }) {
  return (
    <FadeIn delay={index * 100}>
      <div
        className={`group relative h-full overflow-hidden p-6 transition-colors hover:bg-white/[0.015] sm:p-10 md:p-12 ${
          index === 0
            ? 'border-b border-[#1e1e1e] md:border-r md:border-b-0'
            : ''
        }`}
      >
        <div
          className='absolute top-0 right-0 left-0 h-0.5 opacity-40 transition-opacity group-hover:opacity-100'
          style={{
            background: `linear-gradient(90deg, ${accent}, transparent 80%)`,
          }}
        />
        <div
          className='pointer-events-none absolute -top-[60px] -right-[60px] size-[200px] rounded-full opacity-0 transition-opacity group-hover:opacity-100'
          style={{
            background: `radial-gradient(circle, ${accent}0a, transparent 70%)`,
          }}
        />

        <div className='relative'>
          <div className='mb-5 flex flex-wrap items-start justify-between gap-3'>
            <div className='flex items-center gap-3.5'>
              <span className='text-4xl leading-none font-black tracking-[-2px] text-white/[0.08] sm:text-5xl'>
                {num}
              </span>
              <h3 className='text-[24px] font-extrabold tracking-[-0.5px] sm:text-[28px]'>
                {title}
              </h3>
            </div>
            <div className='inline-flex items-center gap-1.5 rounded-full border border-[#4a9eff]/20 bg-[#4a9eff]/[0.08] px-3 py-1.5 font-mono text-[12px] font-bold tracking-[0.5px] text-[#4a9eff] sm:gap-2 sm:px-3.5 sm:text-[13px]'>
              <span className='tkc-motion-dot size-2 rounded-full bg-[#4a9eff] shadow-[0_0_8px_#4a9eff]' />
              신청 중
            </div>
          </div>

          {logoSrc && (
            <img
              src={logoSrc}
              alt={title}
              className='mb-2 h-10 w-auto object-contain opacity-90 sm:h-12'
              loading='lazy'
              draggable={false}
            />
          )}

          <p className='mb-6 text-[14px] leading-[1.7] break-keep text-white/60 sm:mb-7 sm:text-[15px]'>
            {description}
          </p>

          <div className='mb-7 rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-4'>
            <div className='mb-1 text-[12px] font-medium text-white/50'>
              {periodLabel}
            </div>
            <div
              className='text-[22px] font-extrabold tracking-[-0.5px] sm:text-[28px]'
              style={{ color: accent }}
            >
              {periodStart}{' '}
              <span className='mx-1 text-lg opacity-40 sm:text-xl'>→</span>{' '}
              {periodEnd}
            </div>
          </div>

          <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2'>
            <Link
              to={detailTo}
              className='group/detail tkc-motion-surface relative inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1e1e1e] px-4 py-2.5 text-[13px] font-semibold text-white/60 hover:border-white/30 hover:text-white sm:px-6 sm:text-sm'
            >
              <span
                className={cn(
                  hoverFx &&
                    'transition-opacity duration-300 md:group-hover/detail:opacity-0'
                )}
              >
                자세히 보기
              </span>
              <img
                src='/characters/katsu-wink.png'
                alt=''
                className={cn(
                  'pointer-events-none invisible absolute inset-0 m-auto h-8 w-8 scale-75 object-contain opacity-0',
                  hoverFx &&
                    'transition-all duration-300 md:group-hover/detail:visible md:group-hover/detail:scale-100 md:group-hover/detail:opacity-100'
                )}
                draggable={false}
              />
            </Link>
            <Link
              to='/apply'
              className='group/cta tkc-motion-surface relative inline-flex min-h-[42px] items-center justify-center rounded-lg px-4 py-2.5 text-[13px] font-semibold sm:px-6 sm:text-sm'
              style={{
                background: accent,
                color: accent === '#f5a623' ? '#0a0a0a' : '#fff',
                boxShadow: `0 4px 20px ${accent}33`,
              }}
            >
              <span
                className={cn(
                  hoverFx &&
                    'transition-opacity duration-300 md:group-hover/cta:opacity-0'
                )}
              >
                대회 신청하기
              </span>
              <img
                src='/characters/don-wink.png'
                alt=''
                className={cn(
                  'pointer-events-none invisible absolute inset-0 m-auto h-8 w-8 scale-75 object-contain opacity-0',
                  hoverFx &&
                    'transition-all duration-300 md:group-hover/cta:visible md:group-hover/cta:scale-100 md:group-hover/cta:opacity-100'
                )}
                draggable={false}
              />
            </Link>
          </div>
        </div>
      </div>
    </FadeIn>
  )
}
