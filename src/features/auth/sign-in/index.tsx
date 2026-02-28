import { Link } from '@tanstack/react-router'
import { AuthLayout } from '../auth-layout'
import { Button } from '@/components/ui/button'

export function SignIn() {
  return (
    <AuthLayout>
      <div className='space-y-4 rounded-xl border border-border/60 bg-card/80 p-6 text-center'>
        <h2 className='text-lg font-semibold'>Sign-in Disabled</h2>
        <p className='text-sm text-muted-foreground'>
          This project no longer uses Clerk authentication.
        </p>
        <Button asChild className='w-full'>
          <Link to='/admin'>Go to Admin</Link>
        </Button>
      </div>
    </AuthLayout>
  )
}
