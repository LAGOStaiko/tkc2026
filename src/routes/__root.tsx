import { useLayoutEffect } from 'react'
import { type QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import {
  GlobalLoadingOverlay,
  requestGlobalOverlayShow,
} from '@/components/global-loading-overlay'
import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: () => {
    useLayoutEffect(() => {
      const handlePointerDownCapture = (event: PointerEvent) => {
        if (event.button !== 0) return
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return
        }

        if (!(event.target instanceof Element)) return

        const anchor = event.target.closest('a')
        if (!anchor) return

        const targetAttr = anchor.getAttribute('target')
        if (targetAttr && targetAttr.toLowerCase() !== '_self') return
        if (anchor.hasAttribute('download')) return

        const href = anchor.getAttribute('href')
        if (!href || href.startsWith('#')) return

        let url: URL
        try {
          url = new URL(anchor.href, window.location.href)
        } catch {
          return
        }

        if (url.origin !== window.location.origin) return

        requestGlobalOverlayShow()
      }

      document.addEventListener('pointerdown', handlePointerDownCapture, true)
      return () => {
        document.removeEventListener(
          'pointerdown',
          handlePointerDownCapture,
          true,
        )
      }
    }, [])

    return (
      <>
        <NavigationProgress />
        <GlobalLoadingOverlay />
        <Outlet />
        <Toaster duration={5000} />
        {import.meta.env.MODE === 'development' && (
          <>
            <ReactQueryDevtools buttonPosition='bottom-left' />
            <TanStackRouterDevtools position='bottom-right' />
          </>
        )}
      </>
    )
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
