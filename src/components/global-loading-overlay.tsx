import { useLayoutEffect, useRef, useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'

const MIN_VISIBLE_MS = 900
const FADE_OUT_MS = 350

type OverlayState = 'hidden' | 'visible' | 'exiting'

/**
 * Returns true when both from/to are within the same guide section
 * (arcade or console), meaning the overlay should be suppressed.
 */
function isSameSectionNav(from: string, to: string): boolean {
  const a = from.replace(/\/$/, '')
  const b = to.replace(/\/$/, '')
  const isArcade = (p: string) => p === '/arcade' || p.startsWith('/arcade/')
  const isConsole = (p: string) => p === '/console' || p.startsWith('/console/')
  if (isArcade(a) && isArcade(b)) return true
  if (isConsole(a) && isConsole(b)) return true
  return false
}

export function GlobalLoadingOverlay() {
  const { routerStatus, from, to } = useRouterState({
    select: (state) => ({
      routerStatus: state.status,
      from: state.resolvedLocation?.pathname ?? state.location.pathname,
      to: state.location.pathname,
    }),
  })
  const isMutating = useIsMutating()
  const isNavigating =
    routerStatus === 'pending' && !isSameSectionNav(from, to)
  const shouldShow = isNavigating || isMutating > 0

  const [overlayState, setOverlayState] = useState<OverlayState>('hidden')

  const hideTimerRef = useRef<number | null>(null)
  const exitTimerRef = useRef<number | null>(null)
  const showFrameRef = useRef<number | null>(null)
  const startAtRef = useRef(0)

  const clearTimer = (ref: { current: number | null }) => {
    if (ref.current !== null) {
      window.clearTimeout(ref.current)
      ref.current = null
    }
  }

  const clearFrame = (ref: { current: number | null }) => {
    if (ref.current !== null) {
      window.cancelAnimationFrame(ref.current)
      ref.current = null
    }
  }

  useLayoutEffect(() => {
    return () => {
      clearTimer(hideTimerRef)
      clearTimer(exitTimerRef)
      clearFrame(showFrameRef)
    }
  }, [])

  useLayoutEffect(() => {
    if (shouldShow) {
      clearTimer(hideTimerRef)
      clearTimer(exitTimerRef)
      clearFrame(showFrameRef)

      if (overlayState !== 'visible') {
        startAtRef.current = Date.now()
        showFrameRef.current = window.requestAnimationFrame(() => {
          showFrameRef.current = null
          setOverlayState('visible')
        })
      }
      return
    }

    clearFrame(showFrameRef)

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
  }, [overlayState, shouldShow])

  const isVisible = overlayState === 'visible'
  const transitionClass = isVisible
    ? 'opacity-100 duration-200 ease-out'
    : 'opacity-0 duration-[350ms] ease-in'
  const visibilityClass =
    overlayState === 'hidden'
      ? 'pointer-events-none invisible'
      : 'pointer-events-auto visible'
  const blurClass = 'backdrop-blur-sm'

  return (
    <div
      aria-hidden={overlayState === 'hidden'}
      className={`fixed inset-0 z-[9999] flex transform-gpu items-center justify-center bg-black/55 transition-[opacity,backdrop-filter] will-change-[opacity,backdrop-filter] ${transitionClass} ${visibilityClass} ${blurClass} cursor-wait`}
    >
      <div className='inline-flex flex-col items-center'>
        <img
          src='/branding/v2/logo.png'
          alt='TKC2026'
          className='h-16 w-auto object-contain motion-safe:animate-pulse md:h-20'
          loading='eager'
          decoding='async'
        />
        <div className='tkc-loading-bar mt-4 w-full' />
      </div>
    </div>
  )
}
