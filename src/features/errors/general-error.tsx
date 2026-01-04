import { useEffect } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { t } from '@/text'

type GeneralErrorProps = React.HTMLAttributes<HTMLDivElement> & {
  minimal?: boolean
}

export function GeneralError({
  className,
  minimal = false,
}: GeneralErrorProps) {
  const navigate = useNavigate()
  const { history } = useRouter()

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('error.general.title')}`
  }, [])

  return (
    <div className={cn('h-svh w-full', className)}>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        {!minimal && (
          <h1 className='text-[7rem] leading-tight font-bold'>500</h1>
        )}
        <span className='font-medium'>{t('error.general.title')}</span>
        <p className='text-center text-muted-foreground'>
          {t('error.general.description')}
        </p>
        {!minimal && (
          <div className='mt-6 flex gap-4'>
            <Button variant='outline' onClick={() => history.go(-1)}>
              {t('error.action.goBack')}
            </Button>
            <Button onClick={() => navigate({ to: '/admin' })}>
              {t('error.action.backToHome')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

