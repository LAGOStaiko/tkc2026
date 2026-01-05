import { useEffect, useRef, useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'

const SHOW_DELAY_MS = 200
const HIDE_DELAY_MS = 150

export function GlobalLoadingOverlay() {
  const routerStatus = useRouterState({ select: (state) => state.status })
  const isMutating = useIsMutating()
  const isBusy = routerStatus === 'pending' || isMutating > 0
  const [isVisible, setIsVisible] = useState(false)
  const showTimerRef = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (showTimerRef.current) {
        window.clearTimeout(showTimerRef.current)
      }
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isBusy) {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
      if (!isVisible && !showTimerRef.current) {
        showTimerRef.current = window.setTimeout(() => {
          showTimerRef.current = null
          setIsVisible(true)
        }, SHOW_DELAY_MS)
      }
      return
    }

    if (showTimerRef.current) {
      window.clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }

    if (isVisible && !hideTimerRef.current) {
      hideTimerRef.current = window.setTimeout(() => {
        hideTimerRef.current = null
        setIsVisible(false)
      }, HIDE_DELAY_MS)
    }
  }, [isBusy, isVisible])

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
