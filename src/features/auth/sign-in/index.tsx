import { Link } from '@tanstack/react-router'
import { AuthLayout } from '../auth-layout'

export function SignIn() {
  return (
    <AuthLayout>
      <div className='mx-auto w-full max-w-md rounded-lg border border-white/10 bg-black/30 p-6 text-center'>
        <h1 className='mb-2 text-xl font-bold text-white'>Sign In Disabled</h1>
        <p className='mb-5 text-sm text-white/60'>
          Authentication is not enabled in this deployment.
        </p>
        <Link
          to='/ops/arcade-control'
          className='inline-flex items-center justify-center rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10'
        >
          Go to Ops Console
        </Link>
      </div>
    </AuthLayout>
  )
}
