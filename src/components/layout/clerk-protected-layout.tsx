import { useEffect } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'
import { AuthenticatedLayout } from './authenticated-layout'

export function ClerkProtectedLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const navigate = useNavigate()
  const location = useRouterState({ select: (s) => s.location })

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({
        to: '/sign-in',
        search: { redirect: location.href },
        replace: true,
      })
    }
  }, [isLoaded, isSignedIn, navigate, location.href])

  if (!isLoaded) {
    return (
      <div className='flex h-svh items-center justify-center'>
        <Loader2 className='size-8 animate-spin text-white/40' />
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return <AuthenticatedLayout />
}
