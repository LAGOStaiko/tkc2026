import { createFileRoute } from '@tanstack/react-router'
import { RewardsPage } from '@/components/tkc/rewards-page'

export const Route = createFileRoute('/(site)/rewards')({
  component: RewardsPage,
})
