import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'

const WORM_SPRITES = Array.from(
  { length: 6 },
  (_, i) => `/loading/worm_${i + 1}.png`
)

const WORM_FRAME_MS = 200
const WORM_CYCLE_MS = WORM_SPRITES.length * WORM_FRAME_MS
const MIN_VISIBLE_MS = Math.max(900, WORM_CYCLE_MS)
const FADE_OUT_MS = 350

type OverlayState = 'hidden' | 'visible' | 'exiting'

/**
 * Returns true when both from/to are within the same guide section
 * (arcade or console), meaning the overlay should be suppressed.
 */
function isSameSectionNav(from: string, to: string): boolean {
  const a = from.replace(/\/$/, '')
  const b = to.replace(/\/$/, '')
  if (a === b) return true
  const isArcade = (p: string) => p === '/arcade' || p.startsWith('/arcade/')
  const isConsole = (p: string) => p === '/console' || p.startsWith('/console/')
  if (isArcade(a) && isArcade(b)) return true
  if (isConsole(a) && isConsole(b)) return true
  return false
}

export function GlobalLoadingOverlay() {
  // Preload sprites so the first mobile navigation doesn't show a blank frame.
  useEffect(() => {
    if (typeof window === 'undefined') return
    WORM_SPRITES.forEach((src) => {
      const img = new Image()
      img.src = src
    })
    const logo = new Image()
    logo.src = '/branding/v2/logo.png'
  }, [])

  const { routerStatus, from, to } = useRouterState({
    select: (state) => ({
      routerStatus: state.status,
      from: state.resolvedLocation?.pathname ?? state.location.pathname,
      to: state.location.pathname,
    }),
  })
  const isMutating = useIsMutating()
  const isNavigating = routerStatus === 'pending' && !isSameSectionNav(from, to)
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

  const [spriteIdx, setSpriteIdx] = useState(0)

  useEffect(() => {
    if (overlayState === 'hidden') return
    const id = window.setInterval(() => {
      setSpriteIdx((prev) => (prev + 1) % WORM_SPRITES.length)
    }, WORM_FRAME_MS)
    return () => window.clearInterval(id)
  }, [overlayState])

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
      className={`fixed inset-0 z-[9999] flex transform-gpu items-center justify-center bg-black/55 px-4 transition-[opacity,backdrop-filter] will-change-[opacity,backdrop-filter] ${transitionClass} ${visibilityClass} ${blurClass} cursor-wait`}
    >
      <div className='flex flex-col items-center gap-5'>
        <img
          src='/branding/v2/logo.png'
          alt='TKC2026'
          className='h-14 w-auto object-contain opacity-90 md:h-[68px]'
          loading='eager'
          decoding='async'
        />
        <div className='flex flex-col items-center gap-3'>
          <img
            src={WORM_SPRITES[spriteIdx]}
            alt='loading'
            className='h-auto w-[80vw] max-w-[336px] object-contain select-none'
            loading='eager'
            decoding='async'
            draggable={false}
          />
          <span className='text-xs font-medium tracking-[0.5px] text-white/35'>
            Loading...
          </span>
        </div>
      </div>
    </div>
  )
}
