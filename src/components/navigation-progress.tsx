import { useEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'
import LoadingBar, { type LoadingBarRef } from 'react-top-loading-bar'

function isSameSectionNav(from: string, to: string): boolean {
  const a = from.replace(/\/$/, '')
  const b = to.replace(/\/$/, '')
  const isArcade = (p: string) => p === '/arcade' || p.startsWith('/arcade/')
  const isConsole = (p: string) => p === '/console' || p.startsWith('/console/')
  if (isArcade(a) && isArcade(b)) return true
  if (isConsole(a) && isConsole(b)) return true
  return false
}

export function NavigationProgress() {
  const ref = useRef<LoadingBarRef>(null)
  const { status, from, to } = useRouterState({
    select: (s) => ({
      status: s.status,
      from: s.resolvedLocation?.pathname ?? s.location.pathname,
      to: s.location.pathname,
    }),
  })
  const isPending = status === 'pending' && !isSameSectionNav(from, to)

  useEffect(() => {
    if (isPending) {
      ref.current?.continuousStart()
    } else {
      ref.current?.complete()
    }
  }, [isPending])

  return (
    <LoadingBar
      color='var(--muted-foreground)'
      ref={ref}
      shadow={true}
      height={2}
    />
  )
}
