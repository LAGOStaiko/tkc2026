import { useEffect, useRef, useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'

const MIN_VISIBLE_MS = 350

export function GlobalLoadingOverlay() {
  const routerStatus = useRouterState({ select: (state) => state.status })
  const routerHref = useRouterState({ select: (state) => state.location.href })
  const isMutating = useIsMutating()
  const isBusy = routerStatus === 'pending' || isMutating > 0
  const [isVisible, setIsVisible] = useState(false)
  const [lastShownAt, setLastShownAt] = useState(0)
  const hideTimerRef = useRef<number | null>(null)
  const previousHrefRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current)
      }
    }
  }, [])

  const showOverlay = (forceReset = false) => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
    if (!isVisible || forceReset) {
      const now = Date.now()
      setLastShownAt(now)
    }
    if (!isVisible) {
      setIsVisible(true)
    }
  }

  useEffect(() => {
    if (previousHrefRef.current === null) {
      previousHrefRef.current = routerHref
      return
    }

    if (previousHrefRef.current !== routerHref) {
      previousHrefRef.current = routerHref
      showOverlay(true)
    }
  }, [routerHref])

  useEffect(() => {
    if (isBusy) {
      if (!isVisible) {
        showOverlay()
      }
      return
    }

    if (!isVisible) return

    const elapsed = Date.now() - lastShownAt
    const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0)

    if (!hideTimerRef.current) {
      hideTimerRef.current = window.setTimeout(() => {
        hideTimerRef.current = null
        setIsVisible(false)
      }, remaining)
    }
  }, [isBusy, isVisible, lastShownAt])

  const visibilityClass = isVisible
    ? 'opacity-100 pointer-events-auto'
    : 'opacity-0 pointer-events-none'

  return (
    <div
      aria-hidden={!isVisible}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${visibilityClass} cursor-wait`}
    >
      <img
        src='/branding/logo-tkc2026-playx4.webp'
        alt='TKC2026'
        className='w-[min(240px,60vw)] animate-pulse object-contain motion-reduce:animate-none'
        loading='eager'
        decoding='async'
      />
    </div>
  )
}
