import { Outlet } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteContainer } from '@/components/site/site-container'

export function SiteLayout() {
  return (
    <div className='site-scope dark min-h-svh overflow-x-hidden bg-black text-foreground'>
      <div className='relative'>
        <SiteHeader />

        <main className='flex w-full flex-1 bg-black pt-20 pb-16 md:pt-24 md:pb-20'>
          <SiteContainer className='w-full'>
            <Outlet />
          </SiteContainer>
        </main>
      </div>
    </div>
  )
}
