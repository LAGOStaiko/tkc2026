import { useEffect } from 'react'
import { t } from '@/text'
import { Button } from '@/components/ui/button'

export function MaintenanceError() {
  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('error.maintenance.title')}`
  }, [])

  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>503</h1>
        <span className='font-medium'>{t('error.maintenance.title')}</span>
        <p className='text-center text-muted-foreground'>
          {t('error.maintenance.description')}
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline'>{t('error.action.learnMore')}</Button>
        </div>
      </div>
    </div>
  )
}
