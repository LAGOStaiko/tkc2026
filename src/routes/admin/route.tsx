import { createFileRoute } from '@tanstack/react-router'
import { ClerkProtectedLayout } from '@/components/layout/clerk-protected-layout'

export const Route = createFileRoute('/admin')({
  component: ClerkProtectedLayout,
})
