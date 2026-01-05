import { useEffect, useRef, useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'

const MIN_VISIBLE_MS = 900
const FADE_OUT_MS = 350

type OverlayState = 'hidden' | 'visible' | 'exiting'

export function GlobalLoadingOverlay() {
  const routerStatus = useRouterState({ select: (state) => state.status })
  const routerHref = useRouterState({ select: (state) => state.location.href })
  const isMutating = useIsMutating()
  const isBusy = routerStatus === 'pending' || isMutating > 0

  const [overlayState, setOverlayState] = useState<OverlayState>('hidden')

  const hideTimerRef = useRef<number | null>(null)
  const exitTimerRef = useRef<number | null>(null)
  const previousHrefRef = useRef<string | null>(null)
  const startAtRef = useRef(0)

  const clearTimer = (ref: { current: number | null }) => {
    if (ref.current !== null) {
      window.clearTimeout(ref.current)
      ref.current = null
    }
  }

  const showOverlay = (forceReset = false) => {
    clearTimer(hideTimerRef)
    clearTimer(exitTimerRef)

    if (forceReset || overlayState !== 'visible') {
      startAtRef.current = Date.now()
    }

    if (overlayState !== 'visible') {
      setOverlayState('visible')
    }
  }

  useEffect(() => {
    return () => {
      clearTimer(hideTimerRef)
      clearTimer(exitTimerRef)
    }
  }, [])

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
      showOverlay()
      return
    }

    if (overlayState !== 'visible') return

    if (hideTimerRef.current) return

    const elapsed = Date.now() - startAtRef.current
    const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0)

    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null
      setOverlayState('exiting')

      clearTimer(exitTimerRef)
      exitTimerRef.current = window.setTimeout(() => {
        exitTimerRef.current = null
        setOverlayState('hidden')
      }, FADE_OUT_MS)
    }, remaining)
  }, [isBusy, overlayState])

  const isVisible = overlayState === 'visible'
  const transitionClass = isVisible
    ? 'opacity-100 duration-200 ease-out'
    : 'opacity-0 duration-[350ms] ease-in'
  const visibilityClass =
    overlayState === 'hidden'
      ? 'pointer-events-none invisible'
      : 'pointer-events-auto visible'
  const blurClass = isVisible ? 'backdrop-blur-sm' : 'backdrop-blur-0'

  return (
    <div
      aria-hidden={!isVisible}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-[opacity,backdrop-filter] transform-gpu will-change-[opacity,backdrop-filter] ${transitionClass} ${visibilityClass} ${blurClass} cursor-wait`}
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
