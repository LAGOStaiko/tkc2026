import { cn } from '@/lib/utils'

export type ScheduleItem = {
  id?: string | number
  dateMain: string
  dateSub?: string
  title: string
  meta1?: string
  meta2?: string
  statusLabel?: string
  featured?: boolean
}

type ScheduleLaneProps = {
  iconSrc: string
  title: string
  desc?: string
  items: ScheduleItem[]
}

type ScheduleEventCardProps = {
  featured?: boolean
  dateMain: string
  dateSub?: string
  title: string
  meta1?: string
  meta2?: string
  statusLabel?: string
}

export function ScheduleLane({
  iconSrc,
  title,
  desc,
  items,
}: ScheduleLaneProps) {
  return (
    <section className='rounded-3xl bg-white/5 p-6 shadow-lg ring-1 ring-white/10'>
      <div className='flex flex-col items-center text-center'>
        <div className='grid h-12 w-12 place-items-center rounded-xl bg-[#ff2a2a]'>
          <img
            src={iconSrc}
            alt=''
            className='h-7 w-7'
            loading='lazy'
            draggable={false}
          />
        </div>
        <div className='mt-3 text-lg font-bold text-white'>{title}</div>
        {desc ? <p className='mt-1 text-sm text-white/70'>{desc}</p> : null}
      </div>

      <div className='mt-5 space-y-3'>
        {items.map((item, index) => (
          <ScheduleEventCard
            key={item.id ?? `${title}-${index}`}
            featured={item.featured}
            dateMain={item.dateMain}
            dateSub={item.dateSub}
            title={item.title}
            meta1={item.meta1}
            meta2={item.meta2}
            statusLabel={item.statusLabel}
          />
        ))}
      </div>
    </section>
  )
}

export function ScheduleEventCard({
  featured,
  dateMain,
  dateSub,
  title,
  meta1,
  meta2,
  statusLabel,
}: ScheduleEventCardProps) {
  const isFeatured = Boolean(featured)

  return (
    <div
      className={cn(
        'flex items-stretch overflow-hidden rounded-2xl shadow-[0_16px_28px_rgba(0,0,0,0.18)]',
        isFeatured ? 'bg-[#ff2a2a] text-white' : 'bg-white text-slate-950'
      )}
    >
      <div
        className={cn(
          'flex w-20 flex-col items-center justify-center border-r px-2 py-3 text-center',
          isFeatured ? 'border-white/20' : 'border-slate-200'
        )}
      >
        <div className='text-base font-extrabold tabular-nums'>{dateMain}</div>
        {dateSub ? (
          <div className='mt-1 text-xs opacity-80'>{dateSub}</div>
        ) : null}
      </div>
      <div className='flex min-w-0 flex-1 items-start justify-between gap-3 px-4 py-3'>
        <div className='min-w-0'>
          <div className='font-bold break-keep'>{title}</div>
          {meta1 ? (
            <div
              className={cn(
                'mt-1 text-xs opacity-80',
                isFeatured ? 'text-white/85' : 'text-slate-600'
              )}
            >
              {meta1}
            </div>
          ) : null}
          {meta2 ? (
            <div
              className={cn(
                'text-xs opacity-80',
                isFeatured ? 'text-white/85' : 'text-slate-600'
              )}
            >
              {meta2}
            </div>
          ) : null}
        </div>
        {statusLabel ? (
          <span
            className={cn(
              'h-fit shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
              isFeatured
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-700'
            )}
          >
            {statusLabel}
          </span>
        ) : null}
      </div>
    </div>
  )
}
