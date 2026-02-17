import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/components/tkc/home-page'

export const Route = createFileRoute('/(site)/')({
  component: HomePage,
})
