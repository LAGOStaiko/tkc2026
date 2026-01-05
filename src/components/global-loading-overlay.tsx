import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'

const MIN_VISIBLE_MS = 900
const FADE_OUT_MS = 350

type OverlayState = 'hidden' | 'visible' | 'exiting'

const showListeners = new Set<() => void>()

export const requestGlobalOverlayShow = () => {
  showListeners.forEach((listener) => listener())
}

const useOverlayShowListener = (listener: () => void) => {
  useLayoutEffect(() => {
    showListeners.add(listener)
    return () => {
      showListeners.delete(listener)
    }
  }, [listener])
}

export function GlobalLoadingOverlay() {
  const routerStatus = useRouterState({ select: (state) => state.status })
  const routerHref = useRouterState({ select: (state) => state.location.href })
  const isMutating = useIsMutating()
  const isBusy = routerStatus === 'pending' || isMutating > 0

  const [overlayState, setOverlayState] = useState<OverlayState>('hidden')
  const overlayStateRef = useRef<OverlayState>('hidden')
  const logoRef = useRef<HTMLImageElement | null>(null)
  const [logoWidth, setLogoWidth] = useState(260)

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

  const showOverlay = useCallback((forceReset = false) => {
    clearTimer(hideTimerRef)
    clearTimer(exitTimerRef)

    if (forceReset || overlayStateRef.current !== 'visible') {
      startAtRef.current = Date.now()
    }

    if (overlayStateRef.current !== 'visible') {
      setOverlayState('visible')
    }
  }, [])

  useOverlayShowListener(() => showOverlay(true))

  useLayoutEffect(() => {
    overlayStateRef.current = overlayState
  }, [overlayState])

  useLayoutEffect(() => {
    const el = logoRef.current
    if (!el) return

    const updateWidth = () => {
      setLogoWidth(el.clientWidth || 260)
    }

    updateWidth()

    if (typeof ResizeObserver === 'undefined') return

    const ro = new ResizeObserver(updateWidth)
    ro.observe(el)
    return () => {
      ro.disconnect()
    }
  }, [])

  useLayoutEffect(() => {
    return () => {
      clearTimer(hideTimerRef)
      clearTimer(exitTimerRef)
    }
  }, [])

  useLayoutEffect(() => {
    if (previousHrefRef.current === null) {
      previousHrefRef.current = routerHref
      return
    }

    if (previousHrefRef.current !== routerHref) {
      previousHrefRef.current = routerHref
      showOverlay(true)
    }
  }, [routerHref, showOverlay])

  useLayoutEffect(() => {
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
  }, [isBusy, overlayState, showOverlay])

  const isVisible = overlayState === 'visible'
  const transitionClass = isVisible
    ? 'opacity-100 duration-200 ease-out'
    : 'opacity-0 duration-[350ms] ease-in'
  const visibilityClass =
    overlayState === 'hidden'
      ? 'pointer-events-none invisible'
      : 'pointer-events-auto visible'
  const blurClass =
    overlayState === 'hidden' ? 'backdrop-blur-0' : 'backdrop-blur-sm'
  const handleLogoError = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      const target = event.currentTarget
      if (target.dataset.fallback === 'true') return
      target.dataset.fallback = 'true'
      target.src = '/branding/logo-tkc2026-playx4.webp'
    },
    []
  )

  return (
    <div
      aria-hidden={overlayState === 'hidden'}
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 transition-[opacity,backdrop-filter] transform-gpu will-change-[opacity,backdrop-filter] ${transitionClass} ${visibilityClass} ${blurClass} cursor-wait`}
    >
      <div className='flex flex-col items-center gap-4'>
        <img
          ref={logoRef}
          src='/branding/logo-tkc2026-playx4-256.webp'
          alt='TKC2026'
          className='h-16 w-auto animate-pulse object-contain motion-reduce:animate-none md:h-20'
          loading='eager'
          decoding='async'
          onError={handleLogoError}
        />
        <div
          style={{ width: logoWidth }}
          className='h-1.5 rounded-full bg-white/20 overflow-hidden'
        >
          <div className='h-full w-1/3 bg-white/85 animate-[tkcBar_1.2s_ease-in-out_infinite] transform-gpu will-change-transform motion-reduce:animate-none' />
        </div>
      </div>
    </div>
  )
}
