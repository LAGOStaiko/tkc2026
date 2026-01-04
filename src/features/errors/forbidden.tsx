import { useEffect } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { t } from '@/text'

export function ForbiddenError() {
  const navigate = useNavigate()
  const { history } = useRouter()

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('error.forbidden.title')}`
  }, [])

  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>403</h1>
        <span className='font-medium'>{t('error.forbidden.title')}</span>
        <p className='text-center text-muted-foreground'>
          {t('error.forbidden.description')}
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            {t('error.action.goBack')}
          </Button>
          <Button onClick={() => navigate({ to: '/admin' })}>
            {t('error.action.backToHome')}
          </Button>
        </div>
      </div>
    </div>
  )
}

