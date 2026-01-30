import { Outlet } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { TkcContainer } from '@/components/tkc/layout'

export function SiteLayout() {
  return (
    <div className='dark min-h-svh bg-black text-foreground'>
      <div className='relative'>
        <SiteHeader />

        <main className='flex w-full flex-1 bg-black pb-16 pt-16 md:pb-20'>
          <TkcContainer className='w-full'>
            <Outlet />
          </TkcContainer>
        </main>
      </div>
    </div>
  )
}
