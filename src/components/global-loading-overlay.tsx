import { useEffect, useRef, useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'

const MIN_VISIBLE_MS = 900
const FADE_OUT_MS = 350

export function GlobalLoadingOverlay() {
  const routerStatus = useRouterState({ select: (state) => state.status })
  const routerHref = useRouterState({ select: (state) => state.location.href })
  const isMutating = useIsMutating()
  const isBusy = routerStatus === 'pending' || isMutating > 0

  const [isMounted, setIsMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const hideTimerRef = useRef<number | null>(null)
  const unmountTimerRef = useRef<number | null>(null)
  const pendingShowRef = useRef<number | null>(null)
  const previousHrefRef = useRef<string | null>(null)
  const startAtRef = useRef(0)

  const clearTimer = (ref: { current: number | null }) => {
    if (ref.current !== null) {
      window.clearTimeout(ref.current)
      ref.current = null
    }
  }

  const clearAnimationFrame = () => {
    if (pendingShowRef.current !== null) {
      window.cancelAnimationFrame(pendingShowRef.current)
      pendingShowRef.current = null
    }
  }

  const showOverlay = (forceReset = false) => {
    clearTimer(hideTimerRef)
    clearTimer(unmountTimerRef)
    clearAnimationFrame()

    if (forceReset || !isVisible) {
      startAtRef.current = Date.now()
    }

    if (!isMounted) {
      setIsMounted(true)
      pendingShowRef.current = window.requestAnimationFrame(() => {
        pendingShowRef.current = null
        setIsVisible(true)
      })
      return
    }

    if (!isVisible) {
      setIsVisible(true)
    }
  }

  useEffect(() => {
    return () => {
      clearTimer(hideTimerRef)
      clearTimer(unmountTimerRef)
      clearAnimationFrame()
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

    if (!isMounted || !isVisible) return

    if (hideTimerRef.current) return

    const elapsed = Date.now() - startAtRef.current
    const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0)

    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null
      setIsVisible(false)

      clearTimer(unmountTimerRef)
      unmountTimerRef.current = window.setTimeout(() => {
        unmountTimerRef.current = null
        setIsMounted(false)
      }, FADE_OUT_MS)
    }, remaining)
  }, [isBusy, isMounted, isVisible])

  if (!isMounted) return null

  const transitionClass = isVisible
    ? 'opacity-100 scale-100 duration-200 ease-out'
    : 'opacity-0 scale-[0.98] duration-[350ms] ease-in'

  return (
    <div
      aria-hidden={!isVisible}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-[opacity,transform] ${transitionClass} cursor-wait pointer-events-auto`}
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
